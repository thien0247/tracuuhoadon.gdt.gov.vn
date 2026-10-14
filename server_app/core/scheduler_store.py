"""
server_app.core.scheduler_store
Lưu trữ bền vững trạng thái Scheduler (Newest, Gap-Fill 500, Bố Cáo ĐKKD + Reconcile)
vào logs/scheduler_state.json và cung cấp các hàm xây dựng batch request.
"""

import os
import json
import time
from datetime import datetime
from typing import Dict, Any, List
from server_app.core.database import PROVINCES_CACHE, get_max_tin_by_prefix, fetch_all_province_stats
from server_app.schemas.requests import StartRequest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STATE_FILE = os.path.join(BASE_DIR, "logs", "scheduler_state.json")


def get_default_state() -> Dict[str, Any]:
    now = time.time()
    return {
        "newest": {"enabled": True, "interval_hours": 6.0, "last_run": "", "next_run_ts": now + 6 * 3600},
        "gap_fill_500": {
            "enabled": True, "interval_hours": 12.0, "last_run": "",
            "next_run_ts": now + 12 * 3600, "reset_on_existing": True,
        },
        "bocao": {
            "enabled": True, "interval_hours": 2.0, "max_pages": 5,
            "auto_reconcile": True, "last_run": "", "next_run_ts": now + 2 * 3600, "logs": [],
        },
    }


def _normalize_timer(section: Dict[str, Any], default_hours: float, stagger_sec: int) -> None:
    now = time.time()
    enabled = bool(section.get("enabled", True))
    interval = float(section.get("interval_hours") or default_hours)
    section["interval_hours"] = interval
    if not enabled:
        section["next_run_ts"] = 0.0
        return
    saved_ts = float(section.get("next_run_ts") or 0.0)
    if saved_ts > now:
        section["next_run_ts"] = saved_ts
    elif saved_ts > 0 and saved_ts <= now:
        section["next_run_ts"] = now + stagger_sec
    else:
        section["next_run_ts"] = now + interval * 3600


def load_scheduler_state() -> Dict[str, Any]:
    state_data = get_default_state()
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                raw = json.load(f)
            for key in ("newest", "gap_fill_500", "bocao"):
                if isinstance(raw.get(key), dict):
                    state_data[key].update(raw[key])
        except Exception:
            pass
    _normalize_timer(state_data["newest"], 6.0, stagger_sec=90)
    _normalize_timer(state_data["gap_fill_500"], 12.0, stagger_sec=180)
    _normalize_timer(state_data["bocao"], 2.0, stagger_sec=45)
    save_scheduler_state(state_data)
    return state_data


def save_scheduler_state(data: Dict[str, Any]) -> None:
    try:
        os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
        tmp_file = f"{STATE_FILE}.tmp"
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_file, STATE_FILE)
    except Exception:
        pass


def append_bocao_log(logs: List[Dict[str, str]], msg: str, log_type: str = "info") -> List[Dict[str, str]]:
    t_str = datetime.now().strftime("%H:%M:%S")
    return ([{"time": t_str, "msg": msg, "type": log_type}] + list(logs or []))[:50]


def build_newest_requests(gap: int = 20) -> List[StartRequest]:
    stats_map = fetch_all_province_stats()
    return [
        StartRequest(
            province_key=name, scan_mode="newest",
            seed_tin=stats_map.get(name, {}).get("tin_max") or get_max_tin_by_prefix(cfg["prefix"]) or cfg["activation_tin"],
            gap=gap, num_workers=2
        )
        for name, cfg in PROVINCES_CACHE.items()
    ]


def build_gap_fill_requests(gap: int = 20, reset_on_existing: bool = True) -> List[StartRequest]:
    return [
        StartRequest(
            province_key=name, scan_mode="gap_fill_500", seed_tin=cfg["activation_tin"],
            gap=gap, num_workers=1, reset_on_existing=reset_on_existing
        )
        for name, cfg in PROVINCES_CACHE.items()
    ]


def run_bocao_pipeline_sync(max_pages: int = 5, auto_reconcile: bool = True) -> Dict[str, Any]:
    from server_app.services.bocao_crawler import crawl_all_bocao_pages
    from server_app.services.bocao_reconcile_sync import sync_missing_bocao_records

    crawl_res = crawl_all_bocao_pages(max_pages=max_pages)
    if not crawl_res.get("success"):
        return {"success": False, "error": crawl_res.get("error", "Lỗi cào Bố Cáo"), "crawl": crawl_res}

    reconcile_res = {}
    if auto_reconcile:
        try:
            reconcile_res = sync_missing_bocao_records(batch_size=60)
        except Exception as e:
            reconcile_res = {"success": False, "error": str(e)}

    return {
        "success": True,
        "pages_crawled": crawl_res.get("pages_crawled", 0),
        "total_found": crawl_res.get("total_found", 0),
        "new_inserted": crawl_res.get("new_inserted", 0),
        "synced_to_tax": reconcile_res.get("synced_now", 0),
        "crawl": crawl_res,
        "reconcile": reconcile_res,
    }
