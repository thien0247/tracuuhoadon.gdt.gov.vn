# QUY CHUẨN TỐI ƯU HÓA CODE & KIẾN TRÚC MODULAR HỆ THỐNG

Tài liệu này quy định các tiêu chuẩn bắt buộc khi phát triển, bảo trì và tái cấu trúc mã nguồn trong dự án. Mọi file mã nguồn mới hoặc chỉnh sửa đều phải tuân thủ nghiêm ngặt các quy tắc này.

---

## 1. Tiêu chuẩn Số Lượng Dòng Code (File Line Count Standards)

Nhằm đảm bảo tính đọc hiểu cao, dễ bảo trì, dễ viết unit test và tránh phát sinh lỗi tiềm ẩn do các file nguyên khối (monolithic):

| Loại thành phần | Khuyến nghị (Target) | Giới hạn Cảnh báo | Giới hạn Tối đa (Hard Cap) |
| :--- | :--- | :--- | :--- |
| **File mã nguồn (.py, .js)** | **100 – 180 dòng** | **200 dòng** | **Tối đa 250 dòng** |
| **Thẻ Template / HTML UI** | **120 – 180 dòng** | **200 dòng** | **Tối đa 250 dòng** |
| **Hàm / Phương thức (Function/Method)** | **15 – 35 dòng** | **45 dòng** | **Tối đa 60 dòng** |
| **Độ dài dòng ký tự (Line Length)** | **80 – 100 ký tự** | **120 ký tự** | **Tối đa 120 ký tự** |

### Quy tắc Phân rã khi Vượt Ngưỡng:
- **Nếu một file vượt quá 200 dòng:** Bắt buộc phải tách nhỏ theo nguyên tắc Single Responsibility (Đơn nhiệm):
  - Tách Data Access / CSDL vào layer `database.py` hoặc `storage.py`.
  - Tách Data Models / Validations vào `schemas/` hoặc `validator.py`.
  - Tách Business Logic / Thuật toán vào `engine.py` hoặc `services/`.
  - Tách Routing / Controller vào `routers/`.
  - Tách Helper / Config / Limiter vào `core/` hoặc `utils/`.
- Tuyệt đối không viết file gộp đa nhiệm (God File).

---

## 2. Tiêu chuẩn Tối Ưu Code (Code Optimization Standards)

### A. Quản lý Kết nối & Tài nguyên:
1. **Connection Pooling:** Tuyệt đối không mở/đóng kết nối PostgreSQL riêng lẻ lặp đi lặp lại trong vòng lặp. Bắt buộc dùng `ThreadedConnectionPool` hoặc connection context manager.
2. **Batch Operations:** Khi insert/update số lượng lớn bản ghi, bắt buộc gom nhóm (batching) và sử dụng `execute_values` thay vì chạy từng câu lệnh `INSERT` đơn lẻ.
3. **Giải phóng tài nguyên:** Mọi thao tác I/O, file, network request phải được bọc trong context manager (`with ... as ...`).

### B. Cơ chế Chống Nghẽn Mạng & Bypass WAF:
1. **Rate Limiting Toàn Cục:** Mọi luồng query ra ngoài cổng thuế quốc gia phải đi qua `safe_request_guard` của `rate_limiter` để đảm bảo tổng số request không vượt quá ngưỡng trần (Max Global RPS).
2. **Circuit Breaker:** Khi phát hiện WAF chặn (ví dụ mã lỗi F5 WAF `Request Rejected`), kích hoạt ngay Circuit Breaker tạm dừng các luồng để hệ thống hồi phục, tránh bị khóa dải IP.
3. **Session Reuse:** Tái sử dụng `requests.Session` sau khi giải CAPTCHA thành công, chỉ giải CAPTCHA mới khi session thực sự hết hạn.

### C. Chuẩn Hóa Cấu Trúc Backend (FastAPI / Python):
1. **PEP 8 Compliance:** Đặt tên hàm/biến `snake_case`, class `PascalCase`, hằng số `UPPER_CASE`.
2. **Type Hints & Docstrings:** Mọi hàm công khai phải có type annotation (`typing.Optional`, `List`, `Dict`) và docstring ngắn gọn mô tả mục đích.
3. **Structured Logging:** Sử dụng thư viện `logging` chuẩn, gắn timestamp và nhãn prefix/tỉnh thành để dễ dàng debug trên môi trường production. Không dùng `print()` tùy tiện trong luồng chạy chính.

### D. Chuẩn Hóa Frontend (Vue 3 & Vanilla CSS/JS):
1. **Component Hóa:** Mỗi giao diện/tab là 1 component độc lập đặt tại `static/js/components/*.js`.
2. **Giới hạn Component:** Mỗi component Vue không vượt quá 150 – 180 dòng. Tách biệt rõ phần `setup()`, state, methods và template HTML.
3. **Hiển thị Real-time:** Sử dụng Server-Sent Events (SSE) để truyền nhận trạng thái theo chu kỳ tối ưu, không tạo vòng lặp HTTP polling liên tục làm quá tải server.

---

## 3. Quy trình Tự Động Kiểm Tra (Automated Audit)

Mỗi lần commit hoặc nghiệm thu tính năng mới:
1. Chạy `python test_modular.py` để kiểm tra độ dài tất cả các file mã nguồn.
2. Nếu có file vượt quá 200 dòng, build sẽ bị chặn và yêu cầu refactor trước khi phát hành.
