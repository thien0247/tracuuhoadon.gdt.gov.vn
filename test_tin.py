import time
from curl_cffi import requests as cf_requests

s = cf_requests.Session(impersonate='chrome124')
s.get('https://tracuuhoadon.gdt.gov.vn/tbphtc.html', verify=False, timeout=10)
time.sleep(1)
s.get('https://tracuuhoadon.gdt.gov.vn/Captcha.jpg', verify=False, timeout=10)
time.sleep(1)

# Just query the TIN without solving CAPTCHA first, it should return JSON (Sai mã xác nhận) or HTML if the TIN is broken
r = s.get('https://tracuuhoadon.gdt.gov.vn/gettin.html', params={'tin': '6001843934', 'captchaCode': 'wrong'}, verify=False, timeout=10)
print("Content-Type:", r.headers.get("Content-Type"))
print("Body snippet:", r.text[:200])
