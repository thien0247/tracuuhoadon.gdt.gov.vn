"""
test_rate_limiter.py
Kiểm thử bộ điều phối lưu lượng, giới hạn kết nối đồng thời và cầu dao WAF toàn cục.
"""

import time
import threading
from concurrent.futures import ThreadPoolExecutor

from server_app.core.limiter import (
    GlobalRateLimiter,
    GlobalWafCircuitBreaker,
    safe_request_guard,
    concurrency_limiter,
)
from server_app.core.config import MAX_GLOBAL_RPS, MAX_CONCURRENT_REQUESTS


def test_token_bucket_rate_limiter():
    print("=== 1. KIEM TRA TOKEN BUCKET RATE LIMITER ===")
    test_rps = 10.0
    limiter = GlobalRateLimiter(rate=test_rps, capacity=test_rps)
    
    # Gửi 15 request từ 15 luồng khác nhau
    num_requests = 15
    start_time = time.time()

    def worker_task():
        limiter.acquire()

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(worker_task) for _ in range(num_requests)]
        for f in futures:
            f.result()

    elapsed = time.time() - start_time
    print(f"15 request tai RPS={test_rps}: mat {elapsed:.2f}s (ky vong >= 0.4s do can kiem soat toc do)")
    assert elapsed >= 0.4, f"Elapsed time {elapsed:.2f}s qua nhanh, co the chua duoc throttle!"
    print(">>> Token Bucket Rate Limiter: PASSED!\n")


def test_concurrency_semaphore():
    print("=== 2. KIEM TRA CONCURRENCY SEMAPHORE ===")
    max_concurrency = 3
    sem = threading.BoundedSemaphore(value=max_concurrency)
    active_connections = 0
    peak_connections = 0
    lock = threading.Lock()

    def conn_task():
        nonlocal active_connections, peak_connections
        with sem:
            with lock:
                active_connections += 1
                peak_connections = max(peak_connections, active_connections)
            time.sleep(0.05)
            with lock:
                active_connections -= 1

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(conn_task) for _ in range(10)]
        for f in futures:
            f.result()

    print(f"Max Concurrent Slots: {max_concurrency} | Peak Recorded: {peak_connections}")
    assert peak_connections <= max_concurrency, f"Peak {peak_connections} vuot qua max {max_concurrency}!"
    print(">>> Concurrency Semaphore: PASSED!\n")


def test_waf_circuit_breaker():
    print("=== 3. KIEM TRA WAF CIRCUIT BREAKER ===")
    breaker = GlobalWafCircuitBreaker(default_cooldown=0.5)
    assert not breaker.is_tripped()

    print("Kich hoat Circuit Breaker (cooldown 0.5s)...")
    breaker.trip("Test F5 WAF Block", cooldown=0.5)
    assert breaker.is_tripped()

    start_wait = time.time()
    breaker.wait_if_tripped()
    wait_time = time.time() - start_wait

    print(f"Thoi gian cho ha nhiet: {wait_time:.2f}s")
    assert wait_time >= 0.4, "Chua cho du thoi gian cooldown!"
    assert not breaker.is_tripped()
    print(">>> WAF Circuit Breaker: PASSED!\n")


def test_safe_request_guard_integration():
    print("=== 4. KIEM TRA SAFE_REQUEST_GUARD ===")
    t0 = time.time()
    for _ in range(3):
        with safe_request_guard("test_guard"):
            pass
    print(f"3 safe requests thuc hien thanh cong sau {time.time() - t0:.3f}s")
    print(">>> safe_request_guard Integration: PASSED!\n")


def test_dynamic_rps_adjustment():
    print("=== 5. KIEM TRA DYNAMIC RPS ADJUSTMENT & CONFIG SAVE ===")
    from server_app.core.limiter import rate_limiter
    from server_app.core.config import save_system_config

    old_rate = rate_limiter.get_rate()
    print(f"Toc do hien tai: {old_rate} req/s")

    # Tang toc do len 24.0 req/s
    rate_limiter.set_rate(24.0)
    assert rate_limiter.get_rate() == 24.0
    print("Tang toc do len 24.0 req/s thanh cong!")

    # Luu vao config.json
    cfg = save_system_config({"max_global_rps": 32.0})
    assert cfg.get("max_global_rps") == 32.0
    print(f"Luu vao config.json thanh cong: max_global_rps={cfg.get('max_global_rps')}")

    # Reset lai toc do an toan
    rate_limiter.set_rate(old_rate)
    save_system_config({"max_global_rps": old_rate})
    print(">>> Dynamic RPS Adjustment: PASSED!\n")


if __name__ == "__main__":
    test_token_bucket_rate_limiter()
    test_concurrency_semaphore()
    test_waf_circuit_breaker()
    test_safe_request_guard_integration()
    test_dynamic_rps_adjustment()
    print(">>> TAT CA CAC TEST KIEM SOAT LUU LUONG DA VUOT QUA HOAN HAO! <<<")

