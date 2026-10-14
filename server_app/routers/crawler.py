# @id 01M4V0HMPEDS6HEB2VDMRY4WZ8
# @related 01M4V0HMP4K06YVK8GXXJP84SP, 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0HMPBBMNYWQ237H5VNCDC, 01M4V0HMPSXCSFX3CC2P2JTJCN, 01M4V0HMP9AXBMNGFKX4NP343A
"""
server_app.routers.crawler
APIs điều khiển tiến trình crawler (khởi động, tạm dừng, dừng toàn bộ).
"""

import time
import asyncio
from datetime import datetime
from typing import List

from fastapi import APIRouter, HTTPException
from crawler_dak_lak import CrawlerEngine
from server_app.core.config import STAGGER_DELAY_SECONDS

from server_app.core.database import PROVINCES_CACHE, get_max_tin_by_prefix, fetch_all_province_stats
from server_app.core.state import state, make_log_callback, make_progress_callback, make_found_callback
from server_app.schemas.requests import StartRequest, StartAllNewestRequest, ProvinceControlRequest
from server_app.core.queue_manager import queue_coordinator

router = APIRouter(tags=["crawler"])


def start_crawler_internal(req: StartRequest):
    """Logic cốt lõi khởi động crawler cho 1 tỉnh."""
    if req.province_key not in PROVINCES_CACHE:
        raise HTTPException(status_code=400, detail="Tỉnh thành không hợp lệ")

    prov_key = req.province_key
    prov_cfg = PROVINCES_CACHE[prov_key]
    engine = state.engines.get(prov_key)

    if engine and engine._running:
        if engine._paused:
            engine.resume()
            # Reset speed calc để tránh dt bao gồm thời gian pause → speed sai
            state.last_calc_times[prov_key] = time.time()
            state.last_queried_counts[prov_key] = engine.total_queried
            state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [{prov_key}] Tiếp tục quét (Resume)...")
            return {"status": "resumed", "province_key": prov_key}
        return {"status": "already_running", "province_key": prov_key}

    seed, gap, workers = req.seed_tin, req.gap, req.num_workers
    if req.scan_mode == "newest":
        max_tin = get_max_tin_by_prefix(prov_cfg["prefix"])
        if max_tin: seed = max_tin
        if not gap or gap > 200: gap = 20
        if not workers or workers > 2: workers = 1
    elif req.scan_mode == "gap_fill":
        if not gap or gap > 200: gap = 50
        if not workers or workers > 2: workers = 1
    if not seed: seed = prov_cfg["activation_tin"]

    state.start_times[prov_key] = datetime.now()
    state.last_calc_times[prov_key] = time.time()
    state.last_queried_counts[prov_key], state.speeds[prov_key] = 0, 0.0

    msg = f"Khởi động crawler cho {prov_key} | Mode: {req.scan_mode} | Luồng: {workers} | Gap: {gap}"
    state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [{prov_key}] {msg}")

    new_engine = CrawlerEngine(
        seed_tin=seed, gap=gap, prefix=prov_cfg["prefix"],
        activation_tin=prov_cfg["activation_tin"], num_workers=workers,
        scan_mode=req.scan_mode,
        on_progress=make_progress_callback(prov_key),
        on_found=make_found_callback(prov_key),
        on_log=make_log_callback(prov_key),
        on_finished=lambda p: queue_coordinator.notify_finished(p),
        reset_on_existing=getattr(req, "reset_on_existing", True)
    )
    state.engines[prov_key] = new_engine
    new_engine.start()
    return {"status": "started", "province_key": prov_key}


@router.post("/api/crawler/start")
async def start_crawler(req: StartRequest):
    """Khởi động hoặc tiếp tục tiến trình quét cho một tỉnh."""
    return start_crawler_internal(req)


@router.post("/api/crawler/pause")
async def pause_crawler(req: ProvinceControlRequest):
    """Tạm dừng hoặc tiếp tục chạy tiến trình quét của một tỉnh."""
    prov_key = req.province_key
    engine = state.engines.get(prov_key)
    if not engine or not engine._running:
        return {"status": "not_running", "province_key": prov_key}

    if engine._paused:
        engine.resume()
        # Reset để tránh speed ≈ 0 do dt bao gồm thời gian đã pause
        state.last_calc_times[prov_key] = time.time()
        state.last_queried_counts[prov_key] = engine.total_queried
        state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [{prov_key}] Tiếp tục quét (Resume)...")
        return {"status": "resumed", "province_key": prov_key}

    engine.pause()
    state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [{prov_key}] Tạm dừng quét (Pause)...")
    return {"status": "paused", "province_key": prov_key}


@router.post("/api/crawler/stop")
async def stop_crawler(req: ProvinceControlRequest):
    """Dừng hoàn toàn tiến trình crawler của một tỉnh."""
    prov_key = req.province_key
    engine = state.engines.get(prov_key)
    if engine:
        engine.stop()
        state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [{prov_key}] Crawler đã dừng.")
    return {"status": "stopped", "province_key": prov_key}


@router.post("/api/crawler/start_all")
async def start_all(requests: List[StartRequest]):
    """Khởi động an toàn tất cả các tỉnh được chỉ định qua Hàng Đợi Cuốn Chiếu."""
    state.stop_all_requested = False
    if requests:
        queue_coordinator.start_batch(requests, max_concurrent=3)
    return {"status": "started_all_scheduled", "total": len(requests)}


@router.post("/api/crawler/start_all_newest")
async def start_all_newest(req: StartAllNewestRequest = None):
    """Khởi động quét MST mới từ TIN Max cho tất cả các tỉnh bằng Hàng Đợi Cuốn Chiếu."""
    if req is None:
        req = StartAllNewestRequest()
    state.stop_all_requested = False

    # Chạy query nặng (~12s) trong thread pool để không block event loop
    loop = asyncio.get_event_loop()
    stats_map = await loop.run_in_executor(None, fetch_all_province_stats)

    requests: List[StartRequest] = []
    for prov_name, prov_cfg in PROVINCES_CACHE.items():
        prov_stat = stats_map.get(prov_name, {})
        max_tin = prov_stat.get("tin_max") or get_max_tin_by_prefix(prov_cfg["prefix"])
        seed = max_tin if max_tin else prov_cfg["activation_tin"]
        requests.append(StartRequest(
            province_key=prov_name,
            scan_mode="newest",
            seed_tin=seed,
            gap=req.gap,
            num_workers=req.num_workers
        ))

    queue_coordinator.start_batch(requests, max_concurrent=req.max_concurrent_provinces)
    return {
        "status": "started_all_newest_scheduled",
        "total": len(requests),
        "max_concurrent": req.max_concurrent_provinces,
        "gap": req.gap
    }


@router.get("/api/crawler/queue_status")
def get_queue_status():
    """Lấy trạng thái vận hành của hàng đợi cuốn chiếu."""
    return queue_coordinator.get_status()


@router.post("/api/crawler/stop_all")
async def stop_all():
    """Dừng tất cả các tiến trình crawler đang chạy và hủy hàng đợi."""
    state.stop_all_requested = True
    queue_coordinator.stop()
    stopped = []
    for prov_key, engine in list(state.engines.items()):
        if engine and engine._running:
            engine.stop()
            stopped.append(prov_key)
            state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [{prov_key}] Crawler đã dừng.")
    return {"status": "stopped_all", "provinces": stopped}

