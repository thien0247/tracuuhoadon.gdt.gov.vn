# @id 01M4V0HMQ44CEANCD4YKA3HZ5X
# @related 01M4V0HMQ5KCC5C04XQYAYH6NR, 01M4V0HMP7JMDD0YG53KVWYT56, 01M4V0FH0PZ0CY8JH8XJ6K5CNY, 01M4V0FGZN8KJG6YHQM6560EK1
"""
crawler_core.session
Quản lý session HTTP giả lập trình duyệt, vượt WAF và tự động làm mới CAPTCHA.
"""

import time
import random
import threading
import logging
import json as json_module
import requests
import urllib3
from curl_cffi import requests as cf_requests
from crawler_core.solver import CaptchaSolver

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logger = logging.getLogger(__name__)

IMPERSONATE = "chrome124"
CAPTCHA_URL = "https://tracuuhoadon.gdt.gov.vn/Captcha.jpg"
API_URL = "https://tracuuhoadon.gdt.gov.vn/gettin.html"
DEFAULT_ACTIVATION_TIN = "6001842955"
DELAY_MIN = 0.02
DELAY_MAX = 0.08
MAX_RETRY = 3
MAX_REFRESH_RETRIES = 12  # Giới hạn số lần thử lại refresh tránh vòng lặp vô tận

try:
    from server_app.core.limiter import safe_request_guard, waf_circuit_breaker
except Exception:
    from contextlib import contextmanager
    @contextmanager
    def safe_request_guard(label: str = ""):
        yield
    class _DummyBreaker:
        def trip(self, *args, **kwargs): pass
    waf_circuit_breaker = _DummyBreaker()


class SessionManager:
    """Quản lý requests.Session, giải CAPTCHA tự động và xử lý WAF."""

    def __init__(self, solver: CaptchaSolver, activation_tin: str = DEFAULT_ACTIVATION_TIN):
        self.solver = solver
        self.activation_tin = activation_tin
        self.session = None
        self.captcha_code = ""
        self.version = 0
        self.lock = threading.Lock()
        self._refresh_lock = threading.Lock()
        self.refresh()

    def _do_refresh(self):
        """Thực hiện lấy CAPTCHA + kích hoạt session — KHÔNG giữ self.lock."""
        s = cf_requests.Session(impersonate=IMPERSONATE)
        with safe_request_guard("warmup"):
            s.get("https://tracuuhoadon.gdt.gov.vn/tbphtc.html", verify=False, timeout=10)
        time.sleep(1.0)

        with safe_request_guard("captcha"):
            resp = s.get(CAPTCHA_URL, verify=False, timeout=10)
        if len(resp.content) < 100 or resp.content[:2] != b"\xff\xd8":
            raise ValueError(f"CAPTCHA response invalid (len={len(resp.content)})")

        captcha_code = self.solver.solve(resp.content)
        time.sleep(1.0)

        with safe_request_guard("activate"):
            act_resp = s.get(
                API_URL,
                params={"tin": self.activation_tin, "captchaCode": captcha_code},
                verify=False, timeout=10
            )
        if "Request Rejected" in act_resp.text:
            waf_circuit_breaker.trip("F5 WAF: Request Rejected in activation")
            raise ValueError("Activation query blocked by F5 WAF")
        if "html" in act_resp.headers.get("Content-Type", "") or act_resp.text.strip().startswith("<"):
            raise ValueError(f"Activation returned HTML (captcha={captcha_code})")
        act_data = act_resp.json()
        if not act_data.get("tinModel"):
            raise ValueError(f"Activation failed: {act_data.get('strMess', '')}")
        return s, captcha_code

    def refresh(self, current_version: int = None):
        """Vòng lặp retry lấy session mới — chỉ 1 worker giải CAPTCHA, các worker khác dùng chung."""
        with self._refresh_lock:
            if current_version is not None and self.version > current_version:
                return
            logger.info("Refreshing session / solving new CAPTCHA...")
            for attempt in range(1, MAX_REFRESH_RETRIES + 1):
                try:
                    s, captcha_code = self._do_refresh()
                    with self.lock:
                        self.session = s
                        self.captcha_code = captcha_code
                        self.version += 1
                    logger.info(f"Session activated (CAPTCHA=[{captcha_code}], v={self.version})")
                    return
                except Exception as e:
                    logger.warning(f"Session refresh attempt {attempt}/{MAX_REFRESH_RETRIES} failed: {e}")
                    if attempt >= MAX_REFRESH_RETRIES:
                        logger.error("Session refresh aborted after max retries.")
                        raise
                    time.sleep(min(60, 2 ** attempt))

    def query(self, tin: str) -> dict | None:
        """Tra cứu 1 MST. Trả về dict tinModel hoặc None."""
        for attempt in range(MAX_RETRY):
            try:
                time.sleep(random.uniform(DELAY_MIN, DELAY_MAX))
                with self.lock:
                    sess, cur_ver, code = self.session, self.version, self.captcha_code
                params = {"tin": tin, "captchaCode": code}
                with safe_request_guard(f"query_{tin}"):
                    resp = sess.get(API_URL, params=params, verify=False, timeout=10)
                resp.raise_for_status()

                if resp.text.strip().startswith("<"):
                    html = resp.text.strip()[:200].replace("\n", " ")
                    if "malfunctioned" in html:
                        return None
                    if "Request Rejected" in html:
                        waf_circuit_breaker.trip(f"F5 WAF: Rejected on {tin}")
                        time.sleep(5.0)
                        if attempt < 2:
                            continue
                    elif "Error" in html or "Exception" in html:
                        return None

                    if attempt >= 2:
                        return None
                    self.refresh(current_version=cur_ver)
                    continue

                data = resp.json()
                msg = (data.get("strMess") or "").lower()
                if "captcha" in msg or "phiên" in msg:
                    self.refresh(current_version=cur_ver)
                    continue

                return data.get("tinModel")
            except Exception as e:
                logger.warning(f"Error querying {tin} (attempt {attempt+1}): {e}")
                if attempt >= 2:
                    return None
                self.refresh(current_version=cur_ver)
        return None
