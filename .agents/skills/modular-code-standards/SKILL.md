---
name: modular-code-standards
description: >-
  Enforces project code standards, line limit rules (< 200 lines/file), module decomposition patterns,
  database connection pooling, and automated testing procedures for the GDT Crawler repository.
  Use when writing new code, refactoring large files, structuring FastAPI routers, or validating code quality.
---

# Chuẩn Mã Nguồn & Kiến Trúc Module Hóa

Skill này định hướng các quy chuẩn lập trình bắt buộc trong dự án Vét Cạn Mã Số Thuế nhằm đảm bảo tính ổn định, dễ bảo trì và hiệu năng cao.

---

## 1. Bộ Quy Tắc Phát Triển Bắt Buộc

### A. Giới Hạn Dòng Code Chuẩn
- **Mục tiêu lý tưởng:** 100 – 180 dòng / file.
- **Ngưỡng kiểm tra tự động:** Tối đa không vượt quá **200 dòng / file** (hard cap: 250 dòng).
- **Hàm / Phương thức:** 20 – 45 dòng, đảm bảo nguyên tắc Single Responsibility.
- Mọi module lớn phải được phân rã thành các sub-module độc lập (`core/`, `storage/`, `services/`, `routers/`, `components/`).

### B. Chuẩn Truy Cập Cơ Sở Dữ Liệu
- **Connection Pool:** Bắt buộc dùng `ThreadedConnectionPool` từ `psycopg2.pool`. Tuyệt đối không mở kết nối rời rạc (`psycopg2.connect(...)`) trong các vòng lặp hay API handler.
- **Batch Insert:** Sử dụng `execute_values` từ `psycopg2.extras` khi nạp dữ liệu hàng loạt.
- **Tối ưu Index:** Mọi trường tìm kiếm (`tin`, `prefix`, `issue_date`, `norm_name`) phải có chỉ mục tương ứng trong PostgreSQL.

### C. An Toàn Mạng & Vượt WAF
- Bắt buộc dùng `safe_request_guard` từ `server_app.core.limiter` khi gửi HTTP request ra ngoài.
- Tuân thủ `max_global_rps` để không vượt ngưỡng chịu tải của hạ tầng mạng và WAF.
- Tự động kích hoạt Circuit Breaker khi nhận mã lỗi từ F5 WAF.

### D. Kiến Trúc Giao Diện (Frontend)
- Sử dụng Vue 3 Composition API với các component độc lập đặt tại `static/js/components/*.js`.
- Mỗi component dưới 180 dòng.
- Giao tiếp dữ liệu thời gian thực qua Server-Sent Events (SSE) `/api/stream`.

---

## 2. Quy Trình Kiểm Thử & Nghiệm Thu Trước Khi Hoàn Tất

Trước khi hoàn tất bất kỳ tác vụ nào hoặc báo cáo cho người dùng, **bắt buộc phải chạy**:

```bash
python test_modular.py
```

Bộ test này tự động xác thực:
1. Đếm số dòng của tất cả 24+ tệp nguồn trong dự án (báo lỗi nếu bất kỳ file nào > 200 dòng).
2. Kiểm tra toàn bộ API endpoints chính (`/`, `/api/configs/provinces`, `/api/provinces`, `/api/search`, `/api/filter`, `/api/crawler/*`, `/api/config/system`).
3. Kiểm tra logic Hàng đợi cuốn chiếu (`Queue Coordinator`) và dừng luồng sau đúng 20 TIN không tồn tại.

Chi tiết kỹ thuật: xem [refactoring_checklist.md](./references/refactoring_checklist.md).
