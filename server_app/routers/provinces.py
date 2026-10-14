# @id 01M4V0HMPG69WC6HQYVZNJYVRT
# @related 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0HMP4K06YVK8GXXJP84SP, 01M4V0HMP7JMDD0YG53KVWYT56, 01M4V0HMPBBMNYWQ237H5VNCDC, 01M4V0HMP9AXBMNGFKX4NP343A
"""
server_app.routers.provinces
APIs quản lý danh mục cấu hình tỉnh thành và lấy trạng thái số lượng bản ghi.
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from server_app.core.database import (
    PROVINCES_CACHE,
    load_provinces,
    get_db_connection
)
from server_app.core.config import (
    MAX_GLOBAL_RPS,
    MAX_CONCURRENT_REQUESTS,
    STAGGER_DELAY_SECONDS,
    WAF_COOLDOWN_SECONDS,
    save_system_config
)
from server_app.core.limiter import rate_limiter
from server_app.core.state import state
from server_app.core.queue_manager import queue_coordinator
from server_app.schemas.requests import ProvinceCreate, SystemConfigUpdate, UpdateMaxTinRequest
from server_app.services.provinces_service import (
    detect_province_max_tin,
    update_province_max_tin,
    sync_all_provinces_max_tin
)

router = APIRouter(tags=["provinces"])

@router.get("/api/configs/provinces")
def get_configs_provinces():
    """Lấy danh sách cấu hình tỉnh thành từ CSDL."""
    load_provinces()
    return {"provinces": PROVINCES_CACHE}

@router.post("/api/configs/provinces")
def add_province(prov: ProvinceCreate):
    """Thêm một tỉnh thành mới vào hệ thống."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO provinces (name, prefix, activation_tin) VALUES (%s, %s, %s)",
                    (prov.name, prov.prefix, prov.activation_tin)
                )
        load_provinces()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/api/configs/provinces/{pid}")
def delete_province(pid: int):
    """Xóa một tỉnh thành khỏi hệ thống theo ID."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM provinces WHERE id = %s", (pid,))
        load_provinces()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/api/provinces/{prov_key}/max-tin-detect")
def get_province_max_tin_detect(prov_key: str):
    """Đối soát 4 nguồn dữ liệu để gợi ý đỉnh MST lớn nhất của tỉnh."""
    try:
        return detect_province_max_tin(prov_key)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/api/provinces/{prov_key}/max-tin")
def post_province_max_tin(prov_key: str, req: UpdateMaxTinRequest):
    """Cập nhật Max TIN thủ công cho một tỉnh."""
    try:
        return update_province_max_tin(
            prov_key,
            req.max_tin,
            update_scan_progress=req.update_scan_progress,
            update_activation=req.update_activation_tin
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/api/provinces/sync-all-max-tin")
def post_sync_all_max_tin():
    """Đồng bộ tự động Max TIN cho 62 tỉnh từ CSDL."""
    return sync_all_provinces_max_tin()

@router.get("/api/provinces")
async def get_provinces():
    """Lấy trạng thái vận hành và số lượng MST đã lưu của từng tỉnh."""
    res = {}
    for k, v in PROVINCES_CACHE.items():
        stats = state.db_stats.get(k) or {}
        rec_count = stats.get("db_count", 0)

        engine = state.engines.get(k)
        res[k] = {
            "prefix": v["prefix"],
            "activation_tin": v["activation_tin"],
            "count": rec_count,
            "running": engine._running if engine else False,
            "paused": engine._paused if engine else False
        }
    return JSONResponse(content={"provinces": res})

@router.get("/api/config/system")
def get_system_config():
    """Lấy thông số kiểm soát lưu lượng và an toàn mạng hiện tại."""
    return {
        "max_global_rps": rate_limiter.get_rate(),
        "max_concurrent_requests": MAX_CONCURRENT_REQUESTS,
        "stagger_delay_seconds": STAGGER_DELAY_SECONDS,
        "waf_cooldown_seconds": WAF_COOLDOWN_SECONDS
    }

@router.post("/api/config/system")
def update_system_config(req: SystemConfigUpdate):
    """Cập nhật các thông số hệ thống và áp dụng ngay trong runtime."""
    updates = req.model_dump(exclude_none=True)
    cfg = save_system_config(updates)
    if "max_global_rps" in updates and updates["max_global_rps"] is not None:
        rate_limiter.set_rate(cfg["max_global_rps"])
        t_str = datetime.now().strftime("%H:%M:%S")
        state.logs.append(f"[{t_str}] [CONFIG] Cập nhật tốc độ tối đa: {cfg['max_global_rps']:.1f} req/s")
    return {
        "success": True,
        "config": {
            "max_global_rps": rate_limiter.get_rate(),
            "max_concurrent_requests": cfg.get("max_concurrent_requests", MAX_CONCURRENT_REQUESTS),
            "stagger_delay_seconds": cfg.get("stagger_delay_seconds", STAGGER_DELAY_SECONDS),
            "waf_cooldown_seconds": cfg.get("waf_cooldown_seconds", WAF_COOLDOWN_SECONDS)
        }
    }

def _stop_active_crawlers():
    queue_coordinator.stop()
    for prov_key, engine in list(state.engines.items()):
        if engine and getattr(engine, "_running", False):
            engine.stop()

@router.post("/api/system/reset")
def reset_system():
    """Làm mới bộ nhớ, dừng toàn bộ crawler và nạp lại danh mục tỉnh từ DB."""
    try:
        _stop_active_crawlers()
        state.logs.clear()
        load_provinces()
        t_str = datetime.now().strftime("%H:%M:%S")
        state.logs.append(f"[{t_str}] [SYSTEM] Đã reset bộ nhớ và dừng toàn bộ tiến trình.")
        return {"success": True, "message": "Đã reset bộ nhớ và dừng toàn bộ tiến trình thành công."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/system/restart")
def restart_server():
    """Khởi động lại toàn bộ tiến trình server Uvicorn."""
    import sys, subprocess, threading, time, os
    try:
        _stop_active_crawlers()
        def _do_restart():
            time.sleep(0.8)
            flags = subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
            subprocess.Popen([sys.executable, "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"],
                             creationflags=flags)
            os._exit(0)
        threading.Thread(target=_do_restart, daemon=True).start()
        return {"success": True, "message": "Server đang khởi động lại, vui lòng chờ trong giây lát..."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

