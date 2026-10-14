# @id 01M4V0HMPBBMNYWQ237H5VNCDC
# @related 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""
server_app.core.state
Quản lý trạng thái toàn cục (AppState) và các callback theo dõi tiến trình crawler.
"""

import os
import threading
from collections import deque
from datetime import datetime
from typing import Dict, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from crawler_dak_lak import CrawlerEngine

LOGS_DIR = "logs"
os.makedirs(LOGS_DIR, exist_ok=True)


def _persist_log_entry(msg: str):
    """Lưu trữ dòng log vào tệp nhật ký hàng ngày logs/crawl_YYYYMMDD.log."""
    try:
        today = datetime.now().strftime("%Y%m%d")
        log_file = os.path.join(LOGS_DIR, f"crawl_{today}.log")
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
    except Exception:
        pass


class PersistedDeque(deque):
    """Hàng đợi vòng lưu RAM giới hạn 500 phần tử kiêm lưu trữ bền vững trên đĩa."""

    def append(self, x):
        super().append(x)
        _persist_log_entry(str(x))


class AppState:
    """Quản lý trạng thái toàn cục của các tiến trình crawler đa tỉnh song song."""

    def __init__(self):
        self.engines: Dict[str, Any] = {}
        self.start_times: Dict[str, datetime] = {}
        self.last_tins: Dict[str, str] = {}
        self.last_calc_times: Dict[str, float] = {}
        self.last_queried_counts: Dict[str, int] = {}
        self.speeds: Dict[str, float] = {}
        self.db_stats: Dict[str, Dict[str, Any]] = {}
        self.last_db_stats_time: float = 0.0
        self.logs: deque = PersistedDeque(maxlen=500)
        self.lock = threading.Lock()  # threading.Lock — thread-safe cho crawler workers


# Singleton state instance
state = AppState()


def make_log_callback(prov_key: str):
    """Tạo hàm callback ghi nhận log từ engine crawler vào state.logs."""
    def cb(msg: str):
        timestamp = datetime.now().strftime("%H:%M:%S")
        formatted_msg = f"[{timestamp}] [{prov_key}] {msg}"
        state.logs.append(formatted_msg)
    return cb


def make_progress_callback(prov_key: str):
    """Tạo hàm callback cập nhật MST vừa quét vào state.last_tins."""
    def cb(data: dict):
        state.last_tins[prov_key] = data.get("last_tin", "")
    return cb


def make_found_callback(prov_key: str):
    """Tạo hàm callback thông báo khi tìm thấy MST hợp lệ mới."""
    def cb(tin: str, name: str, *args, **kwargs):
        timestamp = datetime.now().strftime("%H:%M:%S")
        state.logs.append(f"[{timestamp}] [{prov_key}] ✨ FOUND {tin} → {name}")
    return cb
