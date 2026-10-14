import time
from curl_cffi import requests as cf_requests

def test_waf():
    for impersonate in ["chrome124", "chrome120", "edge101", "safari15_5"]:
        print(f"\n--- Testing impersonate: {impersonate} ---")
        try:
            s = cf_requests.Session(impersonate=impersonate)
            r1 = s.get("https://tracuuhoadon.gdt.gov.vn/tbphtc.html", verify=False, timeout=10)
            print("Warm-up status:", r1.status_code)
            
            r2 = s.get("https://tracuuhoadon.gdt.gov.vn/Captcha.jpg", verify=False, timeout=10)
            if len(r2.content) > 2 and r2.content[:2] == b'\xff\xd8':
                print("CAPTCHA SUCCESS!")
            else:
                print("CAPTCHA FAILED:", r2.content[:50])
        except Exception as e:
            print("Error:", e)
        time.sleep(2)

test_waf()
