# @id 01M4V0HMQ2XD03NEEV125TBK52
# @related 01M4V0HMQ84SWGPZADDW1P3GNA, 01M4V0HMQ5KCC5C04XQYAYH6NR, 01M4V0HMQ44CEANCD4YKA3HZ5X, 01M4V0HMQ6QTMSNCHCXD7TCP1F, 01M4V0HMP67E26K49WVAQF0ERW
"""
crawler_core.engine
Điều phối tiến trình vét cạn MST đa luồng, hỗ trợ đa chế độ quét (Newest, Edges, Bidirectional).
"""
import time
import queue
import threading
import logging
from crawler_core.validator import generate_direction, get_probe_tin
from crawler_core.solver import CaptchaSolver
from crawler_core.session import SessionManager
from crawler_core.storage import Database
logger = logging.getLogger(__name__)

class CrawlerEngine:
    """Động cơ vét cạn MST: điều phối luồng, quản lý session và xử lý Adaptive Dynamic Probe."""

    def __init__(
        self, seed_tin: str, gap: int, prefix: str, activation_tin: str,
        num_workers: int = 5, on_progress=None, on_found=None, on_log=None,
        scan_mode: str = "bidirectional", on_finished=None, reset_on_existing: bool = True
    ):
        self.seed_tin, self.gap, self.prefix, self.activation_tin = seed_tin, gap, prefix, activation_tin
        self.num_workers, self.scan_mode = num_workers, scan_mode
        self.reset_on_existing = reset_on_existing
        self.on_progress, self.on_found = on_progress or (lambda p: None), on_found or (lambda t, n: None)
        self.on_log, self.on_finished = on_log or (lambda m: None), on_finished or (lambda p: None)

        self.db, self.solver = Database(self.prefix), CaptchaSolver()
        self._running, self._paused = False, False
        self._stop_evt, self._pause_evt = threading.Event(), threading.Event()
        self._pause_evt.set()

        prog = self.db.load_progress()
        self.initial_queried, self.initial_found = prog.get("total_queried", 0), prog.get("total_found", 0)
        self.total_queried, self.total_found = 0, 0
        if self.scan_mode not in ("newest", "gap_fill", "gap_fill_500"): self.db.init_tin_cache()
        self._counter_lock, self._thread = threading.RLock(), None


    def _save_progress(self, tin: str):
        self.db.update_progress(tin, self.initial_queried + self.total_queried, self.initial_found + self.total_found)

    def start(self):
        if not self._running:
            self._running, _ = True, self._stop_evt.clear()
            self._pause_evt.set()
            self._thread = threading.Thread(target=self._run, daemon=True)
            self._thread.start()

    def pause(self):
        self._paused, _ = True, self._pause_evt.clear(); self.db.flush(); self._log("Crawler paused.")

    def resume(self):
        self._paused, _ = False, self._pause_evt.set(); self._log("Crawler resumed.")

    def stop(self):
        self._stop_evt.set(); self._pause_evt.set(); self._running = False; self.db.close(); self._log("Crawler stopped.")

    def _log(self, msg: str):
        logger.info(msg); self.on_log(msg)

    def _query_one(self, tin: str, session_mgr: SessionManager, label: str = "") -> bool:
        self._pause_evt.wait()
        if self._stop_evt.is_set(): return False
        if self.scan_mode not in ("newest", "gap_fill", "gap_fill_500") and self.db.has_tin(tin):
            self._log(f"[{label}] SKIP {tin} → Đã có trong DB"); self._save_progress(tin); return True

        model = session_mgr.query(tin)
        with self._counter_lock:
            self.total_queried += 1
            if model: self.total_found += 1
            queried, found = self.total_queried, self.total_found

        if model:
            self.db.save_record(model); self.on_found(tin, model.get("norm_name", ""))
        elif queried % 10 == 0:
            self._log(f"[{label}] Queried={queried:,} Found={found:,} | Last={tin}")

        self.on_progress({"queried": queried, "found": found, "last_tin": tin, "label": label})
        if queried % 50 == 0:
            self.db.flush(); self._save_progress(tin)
        return bool(model)

    def _probe_jump(self, current_tin: str, session_mgr: SessionManager, label: str) -> bool:
        """Adaptive Dynamic Probe: Thăm dò +50, +100 để phòng tránh False Stop khi cấp số nhảy cóc."""
        for offset in (50, 100):
            p_tin = get_probe_tin(current_tin, offset, self.prefix)
            if p_tin and self._query_one(p_tin, session_mgr, label=f"{label}-PROBE"):
                self._log(f"[{label}] Phát hiện MST nhảy cóc tại {p_tin}! Tiếp tục hành trình quét.")
                return True
        return False

    def _scan_direction(self, start_tin: str, direction: int, label: str):
        gen = generate_direction(start_tin, direction, self.prefix)
        self._log(f"[{label}] Bắt đầu quét từ {start_tin} ({'UP' if direction > 0 else 'DOWN'}) - {self.num_workers} luồng")
        consecutive_empty, effective_gap = 0, self.gap * max(1, self.num_workers)
        direction_stop = threading.Event()
        q = queue.Queue(maxsize=self.num_workers * 3)
        session_mgr = SessionManager(self.solver, self.activation_tin)

        def worker():
            nonlocal consecutive_empty
            while not self._stop_evt.is_set() and not direction_stop.is_set():
                try: tin = q.get(timeout=0.5)
                except queue.Empty: continue
                if tin is None:
                    q.task_done(); break
                found = self._query_one(tin, session_mgr, label=label)
                trigger_probe = False
                with self._counter_lock:
                    if found:
                        consecutive_empty = 0
                    else:
                        consecutive_empty += 1
                        if consecutive_empty >= effective_gap:
                            trigger_probe = (direction > 0)
                            if not trigger_probe:
                                self._log(f"[{label}] DỪNG {self.prefix}: {self.gap} MST liên tiếp không tồn tại.")
                                direction_stop.set()
                if trigger_probe:
                    if self._probe_jump(tin, session_mgr, label):
                        with self._counter_lock: consecutive_empty = 0
                    else:
                        with self._counter_lock:
                            self._log(f"[{label}] DỪNG {self.prefix}: {self.gap} MST liên tiếp không tồn tại.")
                            direction_stop.set()
                q.task_done()

        workers = [threading.Thread(target=worker, daemon=True) for _ in range(self.num_workers)]
        for t in workers:
            if self._stop_evt.is_set(): break
            t.start(); time.sleep(0.1)

        for tin in gen:
            if self._stop_evt.is_set() or direction_stop.is_set(): break
            while not self._stop_evt.is_set() and not direction_stop.is_set():
                try: q.put(tin, timeout=0.2); break
                except queue.Full: continue

        for _ in range(self.num_workers):
            try: q.put_nowait(None)
            except Exception: pass
        for w in workers: w.join(timeout=3.0)
        self._log(f"[{label}] Direction finished.")

    def _run(self):
        try:
            if self.scan_mode == "newest":
                try:
                    from server_app.core.database import get_max_tin_by_prefix
                    max_tin = get_max_tin_by_prefix(self.prefix)
                except Exception: max_tin = None
                self.seed_tin = max_tin or self.db.get_max_tin(self.prefix) or self.seed_tin
                self.gap = 20 if (not self.gap or self.gap <= 0 or self.gap > 200) else self.gap
                self._log(f"Newest Scan (Đỉnh Động) | Max TIN: {self.seed_tin} | Gap: {self.gap}")
                up = threading.Thread(target=self._scan_direction, args=(self.seed_tin, 1, "UP  "), daemon=True)
                up.start(); up.join()
            elif self.scan_mode == "gap_fill":
                from crawler_core.gap_filler import execute_gap_fill
                execute_gap_fill(self)
            elif self.scan_mode == "gap_fill_500":
                from crawler_core.gap_filler import execute_gap_fill_500
                execute_gap_fill_500(self, threshold=500, reset_on_existing=self.reset_on_existing)
            else:
                is_edges = (self.scan_mode == "edges")
                t_up = (self.db.get_max_tin(self.prefix) or self.seed_tin) if is_edges else self.seed_tin
                t_down = (self.db.get_min_tin(self.prefix) or self.seed_tin) if is_edges else self.seed_tin
                self._log(f"{'Edges' if is_edges else 'Bidir'} Scan | UP={t_up} DOWN={t_down} | Gap={self.gap}")
                threads = [threading.Thread(target=self._scan_direction, args=(t_up, 1, "UP  "), daemon=True),
                           threading.Thread(target=self._scan_direction, args=(t_down, -1, "DOWN"), daemon=True)]
                for t in threads: t.start(); time.sleep(2.0)
                for t in threads: t.join()
        finally:
            self.db.close(); self._save_progress(self.seed_tin); self._running = False
            try: self.on_finished(self.prefix)
            except Exception: pass
            self._log(f"Crawler finished! Queried={self.total_queried}, Found={self.total_found}")
