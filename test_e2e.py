"""Quick end-to-end test: warm-up → CAPTCHA download → AI solve → API query"""
import sys
sys.path.insert(0, '.')

from crawler_dak_lak import CaptchaSolver, SessionManager, IMPERSONATE
from curl_cffi import requests as cf_requests

print("1. Loading AI model...")
solver = CaptchaSolver()

print("2. Creating session and solving CAPTCHA...")
mgr = SessionManager(solver)

print("3. Session activated! Testing query with known MST 6001842955...")
result = mgr.query("6001842955")
if result:
    print("SUCCESS! tinModel found:")
    print("  norm_name:", result.get("norm_name"))
    print("  status:   ", result.get("statusName"))
    print("  address:  ", result.get("tran_addr"))
else:
    print("FAIL: No tinModel returned")
