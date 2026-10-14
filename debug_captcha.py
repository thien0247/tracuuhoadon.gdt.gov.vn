"""Test curl-cffi to bypass F5 WAF TLS fingerprinting"""
from curl_cffi import requests as cf_requests

s = cf_requests.Session(impersonate="chrome124")

# Warm-up
r1 = s.get('https://tracuuhoadon.gdt.gov.vn/tbphtc.html', verify=False, timeout=10)
print("Warm-up: status=%d, CT=%s" % (r1.status_code, r1.headers.get("Content-Type", "")))
print("Cookies:", dict(s.cookies))

# CAPTCHA
r2 = s.get('https://tracuuhoadon.gdt.gov.vn/Captcha.jpg', verify=False, timeout=10)
print("Captcha: status=%d, CT=%s, len=%d bytes" % (r2.status_code, r2.headers.get("Content-Type", ""), len(r2.content)))

with open('test_captcha_curl.jpg', 'wb') as f:
    f.write(r2.content)

if len(r2.content) > 4 and r2.content[:2] == b'\xff\xd8':
    print("SUCCESS: Valid JPEG!")
else:
    print("FAIL:", r2.content[:200])
