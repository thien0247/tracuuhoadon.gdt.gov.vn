# WAF F5 Bỏ Qua & Quản Trị Lưu Lượng An Toàn

## 1. Cơ Chế Bảo Vệ WAF F5 Của Tổng Cục Thuế

Hệ thống tra cứu hóa đơn GDT (`tracuuhoadon.gdt.gov.vn`) được bảo vệ bởi giải pháp F5 BIG-IP ASM WAF. Khi phát hiện hành vi quét bất thường hoặc lưu lượng vượt ngưỡng, WAF sẽ trả về trang HTML chứa thông báo:
```html
The requested URL was rejected. Please consult with your administrator.
Your support ID is: xxxxxxxxxxxxxxxxxxx
```

## 2. Các Lớp Phòng Thủ Trong Source Code

### A. Tái sử dụng Session & Giả lập Trình duyệt (`crawler_core/session.py`)
- Dùng `curl_cffi.requests.Session(impersonate="chrome124")` để vượt qua kiểm tra TLS fingerprint của F5.
- Thực hiện chu trình "warmup" bằng cách tải `tbphtc.html` trước khi tải CAPTCHA.
- Tự động giải CAPTCHA bằng mô hình CNN/ONNX qua `CaptchaSolver`.
- Kích hoạt session qua `gettin.html` với `activation_tin`.
- **Tái sử dụng session** liên tục cho hàng trăm truy vấn tiếp theo, chỉ làm mới (refresh) khi phiên hết hạn hoặc gặp CAPTCHA lỗi.

### B. Global Rate Limiter & Token Bucket (`server_app/core/limiter.py`)
- Mọi truy vấn mạng ra bên ngoài (`tbphtc.html`, `Captcha.jpg`, `gettin.html`) **bắt buộc** phải bọc trong context manager:
  ```python
  with safe_request_guard(label="query_tin"):
      resp = session.get(...)
  ```
- Tuân thủ nghiêm ngặt `MAX_GLOBAL_RPS` (mặc định 32.0 req/s, cấu hình qua `config.json` hoặc giao diện web).

### C. WAF Circuit Breaker (`waf_circuit_breaker`)
- Khi phát hiện phản hồi `"Request Rejected"`:
  1. Kích hoạt ngắt mạch khẩn cấp: `waf_circuit_breaker.trip()`.
  2. Toàn bộ các luồng tạm dừng trong khoảng thời gian hạ nhiệt `WAF_COOLDOWN_SECONDS` (mặc định 30 giây).
  3. Sau khi hết thời gian hạ nhiệt, circuit breaker chuyển sang trạng thái half-open để thử nghiệm 1 truy vấn trước khi mở lại hoàn toàn.
