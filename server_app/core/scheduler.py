# @id 01M4V0HMPAXTQC0ACKNND9DMFE
# @related 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0HMP9AXBMNGFKX4NP343A, 01M4V0HMPBBMNYWQ237H5VNCDC, 01M4V0HMPSXCSFX3CC2P2JTJCN, 01M4V0FGZN8KJG6YHQM6560EK1
"""
server_app.core.scheduler
Quản lý lịch trình quét Newest (6h) và tự động quét fill lỗ hổng 500 MST (12h) trên server.
Hoạt động độc lập trên Windows Service 24/7, không phụ thuộc vào trình duyệt.
"""

import time
import threading
from datetime import datetime
from typing import Dict, Any

from server_app.core.database import PROVINCES_CACHE, get_max_tin_by_prefix, fetch_all_province_stats
from server_app.core.queue_manager import queue_coordinator
from server_app.core.state import state
from server_app.schemas.requests import StartRequest


class CrawlerScheduler:
    """Bộ lập lịch chạy ngầm đa tác vụ trên Windows Service / Backend Server."""

    def __init__(self):
        # Tác vụ 1: Quét đỉnh mới nhất (Newest Mode)
        self.newest_enabled = False
        self.newest_interval_hours = 6
        self.newest_last_run: str = ""
        self.newest_next_run_ts: float = 0.0

        # Tác vụ 2: Quét fill lỗ hổng 500 MST từ max_tin xuống (Gap-Fill 500 Mode)
        self.gap_fill_enabled = True
        self.gap_fill_interval_hours = 12
        self.gap_fill_last_run: str = ""
        self.gap_fill_next_run_ts: float = time.time() + 12 * 3600
        self.gap_fill_reset_on_existing: bool = True

        self.max_concurrent = 2
        self.gap = 20
        self.is_executing = False
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._lock = threading.Lock()

    def start(self):
        """Khởi động daemon thread giám sát cả 2 lịch trình."""
        if self._thread and self._thread.is_alive():
            return
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop_event.set()

    def toggle_newest(self, enable: bool | None = None) -> bool:
        with self._lock:
            self.newest_enabled = not self.newest_enabled if enable is None else bool(enable)
            self.newest_next_run_ts = (time.time() + self.newest_interval_hours * 3600) if self.newest_enabled else 0.0
            state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [SCHEDULER] Auto Newest: {'BẬT' if self.newest_enabled else 'TẮT'}")
            return self.newest_enabled

    def toggle_gap_fill(self, enable: bool | None = None) -> bool:
        with self._lock:
            self.gap_fill_enabled = not self.gap_fill_enabled if enable is None else bool(enable)
            self.gap_fill_next_run_ts = (time.time() + self.gap_fill_interval_hours * 3600) if self.gap_fill_enabled else 0.0
            state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [SCHEDULER] Auto Gap-Fill 500 (12h): {'BẬT' if self.gap_fill_enabled else 'TẮT'}")
            return self.gap_fill_enabled

    def set_gap_fill_mode(self, reset_on_existing: bool) -> bool:
        with self._lock:
            self.gap_fill_reset_on_existing = bool(reset_on_existing)
            lbl = "Reset khi gặp MST trong DB" if self.gap_fill_reset_on_existing else "Chỉ reset khi có MST mới nạp DB"
            state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] [SCHEDULER] Thiết lập chế độ Gap-Fill: {lbl}")
            return self.gap_fill_reset_on_existing

    def trigger_newest(self):
        threading.Thread(target=self._execute_newest_batch, args=(True,), daemon=True).start()

    def trigger_gap_fill(self):
        threading.Thread(target=self._execute_gap_fill_batch, args=(True,), daemon=True).start()

    def _execute_newest_batch(self, is_manual: bool = False):
        if self.is_executing: return
        with self._lock: self.is_executing = True
        t_str = datetime.now().strftime("%H:%M:%S")
        state.logs.append(f"[{t_str}] [SCHEDULER] Kích hoạt quét Newest {'thủ công' if is_manual else 'theo lịch 6h'}...")
        try:
            state.stop_all_requested = False
            stats_map = fetch_all_province_stats()
            reqs = []
            for name, cfg in PROVINCES_CACHE.items():
                p_stat = stats_map.get(name, {})
                max_tin = p_stat.get("tin_max") or get_max_tin_by_prefix(cfg["prefix"])
                seed = max_tin if max_tin else cfg["activation_tin"]
                reqs.append(StartRequest(province_key=name, scan_mode="newest", seed_tin=seed, gap=self.gap, num_workers=2))
            queue_coordinator.start_batch(reqs, max_concurrent=self.max_concurrent, mode="append")
            self.newest_last_run = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if self.newest_enabled: self.newest_next_run_ts = time.time() + self.newest_interval_hours * 3600
        except Exception as e:
            state.logs.append(f"[SCHEDULER ERROR] Newest scan lỗi: {e}")
        finally:
            with self._lock: self.is_executing = False

    def _execute_gap_fill_batch(self, is_manual: bool = False):
        if self.is_executing: return
        with self._lock: self.is_executing = True
        t_str = datetime.now().strftime("%H:%M:%S")
        state.logs.append(f"[{t_str}] [SCHEDULER] Kích hoạt quét Fill 500 Lỗ Hổng {'thủ công' if is_manual else 'theo lịch 12h'} (62 tỉnh)...")
        try:
            state.stop_all_requested = False
            reqs = [
                StartRequest(
                    province_key=name, scan_mode="gap_fill_500", seed_tin=cfg["activation_tin"],
                    gap=self.gap, num_workers=1, reset_on_existing=self.gap_fill_reset_on_existing
                )
                for name, cfg in PROVINCES_CACHE.items()
            ]
            queue_coordinator.start_batch(reqs, max_concurrent=2, mode="append")
            self.gap_fill_last_run = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            if self.gap_fill_enabled: self.gap_fill_next_run_ts = time.time() + self.gap_fill_interval_hours * 3600
        except Exception as e:
            state.logs.append(f"[SCHEDULER ERROR] Gap-Fill 500 scan lỗi: {e}")
        finally:
            with self._lock: self.is_executing = False

    def _loop(self):
        while not self._stop_event.is_set():
            now = time.time()
            if self.newest_enabled and not self.is_executing and self.newest_next_run_ts > 0 and now >= self.newest_next_run_ts:
                self._execute_newest_batch(is_manual=False)
            if self.gap_fill_enabled and not self.is_executing and self.gap_fill_next_run_ts > 0 and now >= self.gap_fill_next_run_ts:
                self._execute_gap_fill_batch(is_manual=False)
            self._stop_event.wait(timeout=2.0)

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            now = time.time()
            return {
                "is_executing": self.is_executing,
                "newest": {
                    "enabled": self.newest_enabled, "interval_hours": self.newest_interval_hours,
                    "last_run": self.newest_last_run,
                    "countdown_sec": max(0, int(self.newest_next_run_ts - now)) if (self.newest_enabled and self.newest_next_run_ts > 0) else 0
                },
                "gap_fill_500": {
                    "enabled": self.gap_fill_enabled, "interval_hours": self.gap_fill_interval_hours,
                    "last_run": self.gap_fill_last_run,
                    "countdown_sec": max(0, int(self.gap_fill_next_run_ts - now)) if (self.gap_fill_enabled and self.gap_fill_next_run_ts > 0) else 0,
                    "reset_on_existing": self.gap_fill_reset_on_existing
                }
            }


crawler_scheduler = CrawlerScheduler()
