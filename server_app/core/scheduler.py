# @id 01M4V0HMPAXTQC0ACKNND9DMFE
# @related 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0HMP9AXBMNGFKX4NP343A, 01M4V0HMPBBMNYWQ237H5VNCDC, 01M4V0HMPSXCSFX3CC2P2JTJCN, 01M4V0FGZN8KJG6YHQM6560EK1
"""
server_app.core.scheduler
Quản lý lịch trình tự động 24/7 trên Windows Service (có lưu trữ bền vững):
1. Quét đỉnh mới nhất (Newest Mode - 6h)
2. Quét fill lỗ hổng 500 MST (Gap-Fill 500 Mode - 12h)
3. Tự động cào Bố Cáo ĐKKD + Đồng bộ bù sang CSDL Thuế (Bocao Pipeline - 2h)
"""

import time
import threading
from datetime import datetime
from typing import Dict, Any, List

from server_app.core.queue_manager import queue_coordinator
from server_app.core.state import state
from server_app.core.scheduler_store import (
    load_scheduler_state, save_scheduler_state, append_bocao_log,
    build_newest_requests, build_gap_fill_requests, run_bocao_pipeline_sync
)


class CrawlerScheduler:
    """Bộ lập lịch chạy ngầm đa tác vụ 24/7 trên Windows Service với Persistent State."""

    def __init__(self):
        cfg = load_scheduler_state()
        nw, gf, bc = cfg["newest"], cfg["gap_fill_500"], cfg["bocao"]
        self.newest_enabled = bool(nw.get("enabled", True))
        self.newest_interval_hours = float(nw.get("interval_hours", 6.0))
        self.newest_last_run = str(nw.get("last_run", ""))
        self.newest_next_run_ts = float(nw.get("next_run_ts", 0.0))

        self.gap_fill_enabled = bool(gf.get("enabled", True))
        self.gap_fill_interval_hours = float(gf.get("interval_hours", 12.0))
        self.gap_fill_last_run = str(gf.get("last_run", ""))
        self.gap_fill_next_run_ts = float(gf.get("next_run_ts", 0.0))
        self.gap_fill_reset_on_existing = bool(gf.get("reset_on_existing", True))

        self.bocao_enabled = bool(bc.get("enabled", True))
        self.bocao_interval_hours = float(bc.get("interval_hours", 2.0))
        self.bocao_max_pages = int(bc.get("max_pages", 5))
        self.bocao_auto_reconcile = bool(bc.get("auto_reconcile", True))
        self.bocao_last_run = str(bc.get("last_run", ""))
        self.bocao_next_run_ts = float(bc.get("next_run_ts", 0.0))
        self.bocao_logs: List[Dict[str, str]] = list(bc.get("logs", []))
        self.bocao_running = False

        self.max_concurrent, self.gap, self.is_executing = 2, 20, False
        self._thread: threading.Thread | None = None
        self._stop_event, self._lock = threading.Event(), threading.Lock()

    def _persist(self) -> None:
        save_scheduler_state({
            "newest": {"enabled": self.newest_enabled, "interval_hours": self.newest_interval_hours, "last_run": self.newest_last_run, "next_run_ts": self.newest_next_run_ts},
            "gap_fill_500": {"enabled": self.gap_fill_enabled, "interval_hours": self.gap_fill_interval_hours, "last_run": self.gap_fill_last_run, "next_run_ts": self.gap_fill_next_run_ts, "reset_on_existing": self.gap_fill_reset_on_existing},
            "bocao": {"enabled": self.bocao_enabled, "interval_hours": self.bocao_interval_hours, "max_pages": self.bocao_max_pages, "auto_reconcile": self.bocao_auto_reconcile, "last_run": self.bocao_last_run, "next_run_ts": self.bocao_next_run_ts, "logs": self.bocao_logs},
        })

    def start(self):
        if self._thread and self._thread.is_alive(): return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop_event.set(); self._persist()

    def toggle_newest(self, enable: bool | None = None) -> bool:
        with self._lock:
            self.newest_enabled = not self.newest_enabled if enable is None else bool(enable)
            self.newest_next_run_ts = (time.time() + self.newest_interval_hours * 3600) if self.newest_enabled else 0.0
            self._persist()
            state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [SCHEDULER] Auto Newest (6h): {'BẬT' if self.newest_enabled else 'TẮT'}")
            return self.newest_enabled

    def toggle_gap_fill(self, enable: bool | None = None) -> bool:
        with self._lock:
            self.gap_fill_enabled = not self.gap_fill_enabled if enable is None else bool(enable)
            self.gap_fill_next_run_ts = (time.time() + self.gap_fill_interval_hours * 3600) if self.gap_fill_enabled else 0.0
            self._persist()
            state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [SCHEDULER] Auto Gap-Fill 500 (12h): {'BẬT' if self.gap_fill_enabled else 'TẮT'}")
            return self.gap_fill_enabled

    def set_gap_fill_mode(self, reset_on_existing: bool) -> bool:
        with self._lock:
            self.gap_fill_reset_on_existing = bool(reset_on_existing)
            self._persist()
            lbl = "Reset khi gặp MST trong DB" if self.gap_fill_reset_on_existing else "Chỉ reset khi có MST mới nạp DB"
            state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [SCHEDULER] Thiết lập chế độ Gap-Fill: {lbl}")
            return self.gap_fill_reset_on_existing

    def configure_bocao(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        with self._lock:
            if "enabled" in payload and payload["enabled"] is not None: self.bocao_enabled = bool(payload["enabled"])
            if payload.get("interval_hours"): self.bocao_interval_hours = max(0.25, float(payload["interval_hours"]))
            if payload.get("max_pages"): self.bocao_max_pages = max(1, min(50, int(payload["max_pages"])))
            if "auto_reconcile" in payload and payload["auto_reconcile"] is not None: self.bocao_auto_reconcile = bool(payload["auto_reconcile"])
            if payload.get("clear_logs"): self.bocao_logs = []
            self.bocao_next_run_ts = (time.time() + self.bocao_interval_hours * 3600) if self.bocao_enabled else 0.0
            self._persist()
        return self.get_status()["bocao"]

    def trigger_newest(self): threading.Thread(target=self._execute_newest_batch, args=(True,), daemon=True).start()
    def trigger_gap_fill(self): threading.Thread(target=self._execute_gap_fill_batch, args=(True,), daemon=True).start()
    def trigger_bocao(self): threading.Thread(target=self._execute_bocao_batch, args=(True,), daemon=True).start()

    def _execute_newest_batch(self, is_manual: bool = False):
        if self.is_executing: return
        with self._lock: self.is_executing = True
        state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [SCHEDULER] Kích hoạt quét Newest {'thủ công' if is_manual else 'theo lịch 6h'}...")
        try:
            state.stop_all_requested = False
            queue_coordinator.start_batch(build_newest_requests(self.gap), max_concurrent=self.max_concurrent, mode="append")
            with self._lock:
                self.newest_last_run = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                if self.newest_enabled: self.newest_next_run_ts = time.time() + self.newest_interval_hours * 3600
                self._persist()
        except Exception as e: state.logs.append(f"[SCHEDULER ERROR] Newest scan lỗi: {e}")
        finally:
            with self._lock: self.is_executing = False

    def _execute_gap_fill_batch(self, is_manual: bool = False):
        if self.is_executing: return
        with self._lock: self.is_executing = True
        state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [SCHEDULER] Kích hoạt quét Fill 500 Lỗ Hổng {'thủ công' if is_manual else 'theo lịch 12h'}...")
        try:
            state.stop_all_requested = False
            queue_coordinator.start_batch(build_gap_fill_requests(self.gap, self.gap_fill_reset_on_existing), max_concurrent=2, mode="append")
            with self._lock:
                self.gap_fill_last_run = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                if self.gap_fill_enabled: self.gap_fill_next_run_ts = time.time() + self.gap_fill_interval_hours * 3600
                self._persist()
        except Exception as e: state.logs.append(f"[SCHEDULER ERROR] Gap-Fill 500 scan lỗi: {e}")
        finally:
            with self._lock: self.is_executing = False

    def _execute_bocao_batch(self, is_manual: bool = False):
        if self.bocao_running: return
        with self._lock:
            self.bocao_running = True
            self.bocao_logs = append_bocao_log(self.bocao_logs, f"Bắt đầu {'cào thủ công' if is_manual else 'Auto Crawl'} {self.bocao_max_pages} trang Bố Cáo...", "info")
        try:
            res = run_bocao_pipeline_sync(self.bocao_max_pages, self.bocao_auto_reconcile)
            with self._lock:
                if res.get("success"):
                    msg = f"Thành công: {res['pages_crawled']} trang, {res['total_found']} tin (Mới: {res['new_inserted']}, Nạp Thuế: {res['synced_to_tax']})."
                    self.bocao_logs = append_bocao_log(self.bocao_logs, msg, "success")
                    state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [BOCAO AUTO] {msg}")
                else:
                    self.bocao_logs = append_bocao_log(self.bocao_logs, f"Thất bại: {res.get('error')}", "error")
                self.bocao_last_run = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                if self.bocao_enabled: self.bocao_next_run_ts = time.time() + self.bocao_interval_hours * 3600
                self._persist()
        finally:
            with self._lock: self.bocao_running = False

    def _loop(self):
        while not self._stop_event.is_set():
            now = time.time()
            if self.newest_enabled and not (self.is_executing or queue_coordinator.is_running) and 0 < self.newest_next_run_ts <= now:
                self._execute_newest_batch(is_manual=False)
            if self.gap_fill_enabled and not (self.is_executing or queue_coordinator.is_running) and 0 < self.gap_fill_next_run_ts <= now:
                self._execute_gap_fill_batch(is_manual=False)
            if self.bocao_enabled and not self.bocao_running and 0 < self.bocao_next_run_ts <= now:
                threading.Thread(target=self._execute_bocao_batch, args=(False,), daemon=True).start()
            self._stop_event.wait(timeout=2.0)

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            now = time.time()
            return {
                "is_executing": bool(self.is_executing or queue_coordinator.is_running),
                "newest": {"enabled": self.newest_enabled, "interval_hours": self.newest_interval_hours, "last_run": self.newest_last_run, "countdown_sec": max(0, int(self.newest_next_run_ts - now)) if (self.newest_enabled and self.newest_next_run_ts > 0) else 0},
                "gap_fill_500": {"enabled": self.gap_fill_enabled, "interval_hours": self.gap_fill_interval_hours, "last_run": self.gap_fill_last_run, "countdown_sec": max(0, int(self.gap_fill_next_run_ts - now)) if (self.gap_fill_enabled and self.gap_fill_next_run_ts > 0) else 0, "reset_on_existing": self.gap_fill_reset_on_existing},
                "bocao": {"enabled": self.bocao_enabled, "running": self.bocao_running, "interval_hours": self.bocao_interval_hours, "max_pages": self.bocao_max_pages, "auto_reconcile": self.bocao_auto_reconcile, "last_run": self.bocao_last_run, "countdown_sec": max(0, int(self.bocao_next_run_ts - now)) if (self.bocao_enabled and self.bocao_next_run_ts > 0) else 0, "logs": self.bocao_logs[:30]},
            }


crawler_scheduler = CrawlerScheduler()
