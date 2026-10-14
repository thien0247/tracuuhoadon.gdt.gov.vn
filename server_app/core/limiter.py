# @id 01M4V0HMP7JMDD0YG53KVWYT56
# @related 01M4V0HMP4K06YVK8GXXJP84SP, 01M4V0HMPBBMNYWQ237H5VNCDC, 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""
server_app.core.limiter
Hệ thống điều phối lưu lượng và bảo vệ chống F5 WAF Tổng cục Thuế toàn cục.
"""
import time
import logging
import threading
from contextlib import contextmanager
from server_app.core.config import (
    MAX_GLOBAL_RPS,
    MAX_CONCURRENT_REQUESTS,
    WAF_COOLDOWN_SECONDS,
)
logger = logging.getLogger(__name__)


def _log_adaptive(msg: str, warn: bool = False):
    (logger.warning if warn else logger.info)(msg)
    try:
        from server_app.core.state import state
        from datetime import datetime
        state.logs.append(f"[{datetime.now().strftime('%H:%M:%S')}] {'⚠️ ' if warn else '⚡ '}{msg}")
    except Exception:
        pass


class AdaptiveRateLimiter:
    """
    Bộ điều phối lưu lượng Token Bucket tích hợp AIMD (Congestion Control).
    Tự động tăng tải khi mạng ổn định và hạ tải an toàn khi phát hiện độ trễ tăng hoặc WAF chặn.
    """

    def __init__(self, rate: float = 8.0, capacity: float = 12.0, min_rate: float = 2.0, max_rate: float = 32.0):
        self.min_rate = float(min_rate)
        self.max_rate = max(self.min_rate, float(max_rate))
        self.rate = max(self.min_rate, min(self.max_rate, float(rate)))
        self.capacity = max(self.rate, float(capacity))
        self.tokens = self.capacity
        self.last_time = time.time()
        self.lock = threading.Lock()

        self.adaptive_enabled = True
        self.avg_latency = 0.35
        self.success_streak = 0
        self.last_adjust_time = time.time()

    def acquire(self):
        while True:
            with self.lock:
                now = time.time()
                elapsed = now - self.last_time
                self.last_time = now
                self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)

                if self.tokens >= 1.0:
                    self.tokens -= 1.0
                    return
                sleep_needed = (1.0 - self.tokens) / self.rate
            time.sleep(min(0.5, max(0.01, sleep_needed)))

    def set_rate(self, new_rate: float):
        """Thay đổi tốc độ RPS runtime thủ công."""
        with self.lock:
            val = max(self.min_rate, float(new_rate))
            self.rate = val
            self.max_rate = max(self.rate, self.max_rate)
            self.capacity = max(self.rate, self.rate * 1.5)
            self.tokens = min(self.tokens, self.capacity)
            logger.info(f"RateLimiter set: rate={self.rate:.1f} req/s")

    def get_rate(self) -> float:
        with self.lock:
            return round(self.rate, 2)

    def on_request_completed(self, latency: float, success: bool = True):
        """Cập nhật độ trễ phản hồi và tự động tinh chỉnh RPS theo AIMD."""
        if not self.adaptive_enabled:
            return
        with self.lock:
            self.avg_latency = 0.85 * self.avg_latency + 0.15 * max(0.05, latency)
            now = time.time()
            if not success or latency > 1.2:
                self.success_streak = 0
                if now - self.last_adjust_time >= 3.0 and self.rate > self.min_rate:
                    old = self.rate
                    self.rate = max(self.min_rate, round(self.rate * 0.85, 1))
                    self.capacity = max(self.rate, self.rate * 1.5)
                    self.last_adjust_time = now
                    _log_adaptive(f"[Adaptive] Latency {latency:.2f}s -> Hạ tải: {old} -> {self.rate} req/s", warn=True)
            elif latency < 0.6:
                self.success_streak += 1
                if self.success_streak >= 15 and now - self.last_adjust_time >= 3.0 and self.rate < self.max_rate:
                    old = self.rate
                    self.rate = min(self.max_rate, round(self.rate + 0.5, 1))
                    self.capacity = max(self.rate, self.rate * 1.5)
                    self.success_streak = 0
                    self.last_adjust_time = now
                    _log_adaptive(f"[Adaptive] Mạng thông suốt ({self.avg_latency:.2f}s) -> Tự tăng tải: {old} -> {self.rate} req/s")

    def on_waf_rejected(self):
        """Hạ tải khẩn cấp (Multiplicative Decrease) khi gặp WAF F5 reject."""
        with self.lock:
            self.success_streak = 0
            old = self.rate
            self.rate = max(self.min_rate, round(self.rate * 0.6, 1))
            self.capacity = max(self.rate, self.rate * 1.5)
            self.last_adjust_time = time.time()
            _log_adaptive(f"[Adaptive WAF] Hạ tải khẩn cấp: {old} -> {self.rate} req/s", warn=True)


GlobalRateLimiter = AdaptiveRateLimiter


class GlobalWafCircuitBreaker:
    """Cầu dao bảo vệ chống F5 WAF ban IP toàn cục."""

    def __init__(self, default_cooldown: float = 30.0):
        self.default_cooldown = default_cooldown
        self._cooldown_until = 0.0
        self._lock = threading.Lock()

    def trip(self, reason: str, cooldown: float = None):
        cd = cooldown if cooldown is not None else self.default_cooldown
        msg = f"[WAF CIRCUIT BREAKER] Kích hoạt tạm nghỉ {cd:.1f}s do: {reason}"
        logger.warning(msg)
        try:
            from server_app.core.state import state
            from datetime import datetime
            t_str = datetime.now().strftime("%H:%M:%S")
            state.logs.append(f"[{t_str}] ⚠️ {msg}")
        except Exception:
            pass

        with self._lock:
            self._cooldown_until = max(self._cooldown_until, time.time() + cd)

        if hasattr(rate_limiter, "on_waf_rejected"):
            rate_limiter.on_waf_rejected()

    def is_tripped(self) -> bool:
        return time.time() < self._cooldown_until

    def wait_if_tripped(self):
        while self.is_tripped():
            rem = self._cooldown_until - time.time()
            if rem > 0:
                time.sleep(min(1.0, rem))
            else:
                break


# Khởi tạo các singleton toàn cục
rate_limiter = AdaptiveRateLimiter(rate=MAX_GLOBAL_RPS, capacity=MAX_GLOBAL_RPS * 1.5, min_rate=2.0, max_rate=32.0)
concurrency_limiter = threading.BoundedSemaphore(value=max(1, MAX_CONCURRENT_REQUESTS))
waf_circuit_breaker = GlobalWafCircuitBreaker(default_cooldown=WAF_COOLDOWN_SECONDS)


@contextmanager
def safe_request_guard(label: str = ""):
    """
    Context manager bọc 3 lớp bảo vệ trước khi gửi HTTP request:
    1. Circuit Breaker -> 2. Rate Limiter -> 3. Concurrency Semaphore
    Tự động đo thời gian phản hồi (latency) gửi tới AdaptiveRateLimiter.
    """
    while True:
        waf_circuit_breaker.wait_if_tripped()
        rate_limiter.acquire()
        with concurrency_limiter:
            if waf_circuit_breaker.is_tripped():
                continue
            t0 = time.time()
            success = False
            try:
                yield
                success = True
            finally:
                latency = time.time() - t0
                rate_limiter.on_request_completed(latency, success=success)
            break
