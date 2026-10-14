# @id 01M4V0HMP9AXBMNGFKX4NP343A
# @related 01M4V0HMPBBMNYWQ237H5VNCDC, 01M4V0HMPSXCSFX3CC2P2JTJCN, 01M4V0HMPEDS6HEB2VDMRY4WZ8, 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""
server_app.core.queue_manager
Điều phối hàng đợi cuốn chiếu (Queue Pool) giới hạn số tỉnh quét đồng thời.
Tránh bão request và vượt qua hàng rào F5 WAF an toàn tuyệt đối.
"""

import time
import threading
from datetime import datetime
from typing import List, Set, Dict, Any
from server_app.core.state import state
from server_app.schemas.requests import StartRequest


class ProvinceQueueCoordinator:
    """Quản lý hàng đợi và điều tiết số lượng tỉnh chạy song song."""

    def __init__(self):
        self.queue: List[StartRequest] = []
        self.active_provinces: Set[str] = set()
        self.completed_count = 0
        self.total_queued = 0
        self.max_concurrent = 2
        self.is_running = False
        self._thread: threading.Thread | None = None
        self._stop_event = threading.Event()
        self._wake_event = threading.Event()
        self._lock = threading.Lock()

    def notify_finished(self, prov_key: str = ""):
        """Đánh thức luồng điều phối ngay lập tức khi một tỉnh hoàn tất (event-driven)."""
        self._wake_event.set()

    def start_batch(self, requests: List[StartRequest], max_concurrent: int = 2, mode: str = "replace"):
        """Nạp danh sách tỉnh vào hàng đợi. Hỗ trợ mode 'replace' hoặc 'append' không gián đoạn."""
        state.stop_all_requested = False
        t_str = datetime.now().strftime("%H:%M:%S")
        with self._lock:
            if mode == "append" and self.is_running:
                existing = self.active_provinces.union({r.province_key for r in self.queue})
                new_reqs = [r for r in requests if r.province_key not in existing]
                self.queue.extend(new_reqs)
                self.total_queued = self.completed_count + len(self.active_provinces) + len(self.queue)
                state.logs.append(f"[{t_str}] [QUEUE] Bổ sung {len(new_reqs)} tỉnh vào hàng đợi đang chạy.")
                self._wake_event.set()
                return

        self.stop()
        with self._lock:
            self.queue = list(requests)
            self.total_queued = len(requests)
            self.completed_count = 0
            self.active_provinces.clear()
            self.max_concurrent = max(1, min(4, max_concurrent))
            self.is_running = True
            self._stop_event.clear()
            self._wake_event.clear()

        state.logs.append(
            f"[{t_str}] [QUEUE] Khởi động hàng đợi {self.total_queued} tỉnh "
            f"(Chạy song song tối đa: {self.max_concurrent} tỉnh)..."
        )
        self._thread = threading.Thread(target=self._process_queue, daemon=True)
        self._thread.start()

    def stop(self):
        """Dừng hàng đợi và xóa toàn bộ các tỉnh đang chờ."""
        self.is_running = False
        self._stop_event.set()
        self._wake_event.set()
        with self._lock:
            self.queue.clear()
            self.active_provinces.clear()

    def _process_queue(self):
        from server_app.routers.crawler import start_crawler_internal

        while not self._stop_event.is_set():
            if getattr(state, "stop_all_requested", False):
                self.stop()
                break

            to_start = []
            with self._lock:
                finished = [p for p in self.active_provinces if not state.engines.get(p) or not state.engines[p]._running]
                for prov in finished:
                    self.active_provinces.remove(prov)
                    self.completed_count += 1
                    t_str = datetime.now().strftime("%H:%M:%S")
                    state.logs.append(f"[{t_str}] [QUEUE] Hoàn thành: {prov} ({self.completed_count}/{self.total_queued})")

                slots = max(0, self.max_concurrent - len(self.active_provinces))
                for _ in range(slots):
                    if self.queue and not self._stop_event.is_set():
                        to_start.append(self.queue.pop(0))

            for req in to_start:
                if self._stop_event.is_set():
                    break
                self._dispatch_province(req, start_crawler_internal)
                time.sleep(0.5)

            with self._lock:
                if not self.queue and not self.active_provinces:
                    t_str = datetime.now().strftime("%H:%M:%S")
                    state.logs.append(f"[{t_str}] [QUEUE] HOÀN TẤT HÀNG ĐỢI ({self.completed_count} tỉnh)!")
                    self.is_running = False
                    break

            self._wake_event.wait(timeout=1.0)
            self._wake_event.clear()

    def _dispatch_province(self, req: StartRequest, starter_func):
        """Khởi động 1 tỉnh ngoài lock, cập nhật trạng thái an toàn."""
        t_str = datetime.now().strftime("%H:%M:%S")
        try:
            result = starter_func(req)
            status = result.get("status", "") if isinstance(result, dict) else ""
            with self._lock:
                if status in ("started", "resumed"):
                    self.active_provinces.add(req.province_key)
                    state.logs.append(f"[{t_str}] [QUEUE] Nạp tỉnh: {req.province_key} ({len(self.active_provinces)}/{self.max_concurrent})")
                else:
                    self.completed_count += 1
                    state.logs.append(f"[{t_str}] [QUEUE] Skip {req.province_key}: {status}")
        except Exception as e:
            with self._lock:
                self.completed_count += 1
                state.logs.append(f"[QUEUE ERROR] Không thể chạy {req.province_key}: {e}")

    def get_status(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "is_running": self.is_running,
                "max_concurrent": self.max_concurrent,
                "active_count": len(self.active_provinces),
                "pending_count": len(self.queue),
                "completed_count": self.completed_count,
                "total_queued": self.total_queued,
                "active_provinces": list(self.active_provinces),
            }


queue_coordinator = ProvinceQueueCoordinator()
