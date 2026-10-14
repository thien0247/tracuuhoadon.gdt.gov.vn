"""
worker_bridge.py
Lightweight internal HTTP IPC Bridge cho Python Crawler Worker (Port 8124).
Nhận lệnh từ TypeScript Fastify Backend và điều khiển CrawlerEngine đa tỉnh.
"""

import uvicorn
from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from fastapi import FastAPI
from pydantic import BaseModel

from server_app.core.database import PROVINCES_CACHE, load_provinces
from server_app.core.state import state
from server_app.routers.crawler import start_crawler_internal
from server_app.schemas.requests import StartRequest, StartAllNewestRequest
from server_app.core.queue_manager import queue_coordinator
from server_app.core.scheduler import crawler_scheduler

worker_app = FastAPI(title="GDT Python Crawler Worker Bridge", version="1.1.0")


class ControlPayload(BaseModel):
    province_key: str

class CrawlAllPayload(BaseModel):
    max_pages: Optional[int] = 5

class DkkdSearchPayload(BaseModel):
    search_field: str

class SyncMissingPayload(BaseModel):
    batch_size: Optional[int] = 60


@worker_app.on_event("startup")
def startup():
    load_provinces()
    crawler_scheduler.start()
    print("[Worker Bridge] Python Crawler Worker initialized on port 8124 with Persistent Scheduler.")


@worker_app.on_event("shutdown")
def shutdown():
    crawler_scheduler.stop()


@worker_app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now().isoformat()}


@worker_app.get("/worker/status")
def get_status():
    engines_data = {}
    for prov_key, eng in state.engines.items():
        uptime_str = str(datetime.now() - state.start_times[prov_key]).split(".")[0] if prov_key in state.start_times else "00:00:00"
        engines_data[prov_key] = {
            "is_running": bool(eng._running), "is_paused": bool(eng._paused),
            "total_queried": int(eng.total_queried), "total_found": int(eng.total_found),
            "last_tin": state.last_tins.get(prov_key, ""),
            "speed": state.speeds.get(prov_key, 0.0), "uptime": uptime_str
        }
    return {"engines": engines_data, "logs": list(state.logs)[-50:]}


@worker_app.get("/worker/queue_status")
def get_queue_status():
    return queue_coordinator.get_status()


@worker_app.post("/worker/start")
def start_worker(req: StartRequest):
    return start_crawler_internal(req)


@worker_app.post("/worker/start_all")
def start_all_worker(payload: Union[List[StartRequest], StartAllNewestRequest, Dict[str, Any]]):
    state.stop_all_requested = False
    if isinstance(payload, list):
        queue_coordinator.start_batch(payload, max_concurrent=3)
        return {"status": "started_batch", "total_queued": len(payload), "max_concurrent": 3}

    req = payload if isinstance(payload, StartAllNewestRequest) else StartAllNewestRequest(**(payload or {}))
    provinces = req.selected_provinces or list(PROVINCES_CACHE.keys())
    gap, workers, max_c = req.gap or 20, req.num_workers or 1, req.max_concurrent_provinces or 3
    requests = [
        StartRequest(
            province_key=prov_name, scan_mode="newest",
            seed_tin=PROVINCES_CACHE.get(prov_name, {}).get("activation_tin", ""),
            gap=gap, num_workers=workers
        )
        for prov_name in provinces
    ]
    queue_coordinator.start_batch(requests, max_concurrent=max_c)
    return {"status": "started_batch", "total_queued": len(requests), "max_concurrent": max_c}


@worker_app.post("/worker/pause")
def pause_worker(payload: ControlPayload):
    eng = state.engines.get(payload.province_key)
    if not eng or not eng._running: return {"status": "not_running", "province_key": payload.province_key}
    eng.pause()
    return {"status": "paused", "province_key": payload.province_key}


@worker_app.post("/worker/resume")
def resume_worker(payload: ControlPayload):
    eng = state.engines.get(payload.province_key)
    if not eng or not eng._running: return {"status": "not_running", "province_key": payload.province_key}
    eng.resume()
    return {"status": "resumed", "province_key": payload.province_key}


@worker_app.post("/worker/stop")
def stop_worker(payload: ControlPayload):
    eng = state.engines.get(payload.province_key)
    if not eng or not eng._running: return {"status": "not_running", "province_key": payload.province_key}
    eng.stop()
    return {"status": "stopped", "province_key": payload.province_key}


@worker_app.post("/worker/stop_all")
def stop_all_worker():
    state.stop_all_requested = True
    queue_coordinator.stop()
    stopped = [k for k, eng in list(state.engines.items()) if eng._running and not eng.stop()]
    return {"status": "all_stopped", "stopped_count": len(stopped)}


@worker_app.post("/worker/bocao/crawl")
def crawl_bocao_endpoint():
    from server_app.services.bocao_crawler import crawl_and_save_bocao
    return crawl_and_save_bocao()


@worker_app.post("/worker/bocao/crawl_all")
def crawl_all_bocao_endpoint(p: CrawlAllPayload):
    from server_app.services.bocao_crawler import crawl_all_bocao_pages
    return crawl_all_bocao_pages(max_pages=p.max_pages or 5)


@worker_app.post("/worker/bocao/get_search")
def get_search_bocao_endpoint(p: DkkdSearchPayload):
    from server_app.services.bocao_crawler import query_dkkd_solr
    return query_dkkd_solr(p.search_field)


@worker_app.post("/worker/bocao/sync_missing")
def sync_missing_bocao_endpoint(p: SyncMissingPayload):
    from server_app.services.bocao_reconcile_sync import sync_missing_bocao_records
    return sync_missing_bocao_records(batch_size=p.batch_size or 60)


@worker_app.get("/worker/schedule/status")
def get_sched_status():
    return crawler_scheduler.get_status()


@worker_app.post("/worker/schedule/toggle_newest")
def toggle_sched_newest(p: Dict[str, Any] = None):
    return {"enabled": crawler_scheduler.toggle_newest((p or {}).get("enable"))}


@worker_app.post("/worker/schedule/toggle_gap_fill")
def toggle_sched_gap_fill(p: Dict[str, Any] = None):
    return {"enabled": crawler_scheduler.toggle_gap_fill((p or {}).get("enable"))}


@worker_app.post("/worker/schedule/trigger_newest")
def trigger_sched_newest():
    crawler_scheduler.trigger_newest()
    return {"status": "triggered_newest"}


@worker_app.post("/worker/schedule/trigger_gap_fill")
def trigger_sched_gap_fill():
    crawler_scheduler.trigger_gap_fill()
    return {"status": "triggered_gap_fill_500"}


@worker_app.post("/worker/schedule/gap_fill_mode")
def set_sched_gap_fill_mode(p: Dict[str, Any] = None):
    return {"reset_on_existing": crawler_scheduler.set_gap_fill_mode((p or {}).get("reset_on_existing", True))}


@worker_app.post("/worker/schedule/configure_bocao")
def configure_sched_bocao(p: Dict[str, Any] = None):
    return crawler_scheduler.configure_bocao(p or {})


@worker_app.post("/worker/schedule/trigger_bocao")
def trigger_sched_bocao():
    crawler_scheduler.trigger_bocao()
    return {"status": "triggered_bocao"}


if __name__ == "__main__":
    uvicorn.run(worker_app, host="127.0.0.1", port=8124, log_level="warning")
