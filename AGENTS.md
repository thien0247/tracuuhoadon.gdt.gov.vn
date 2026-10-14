# DỰ ÁN VÉT CẠN MÃ SỐ THUẾ (GDT TAX CRAWLER & SEARCH ENGINE)

## BỘ QUY TẮC PHÁT TRIỂN & CHUẨN MÃ NGUỒN (PROJECT STANDARDS)

### 1. Giới Hạn Dòng Code Chuẩn Cho Mỗi File
- **Mục tiêu lý tưởng:** 100 – 180 dòng / file.
- **Ngưỡng kiểm tra tự động:** Tối đa không vượt quá **200 dòng / file** (hard cap: 250 dòng).
- **Hàm / Phương thức:** 20 – 45 dòng, đảm bảo nguyên tắc Single Responsibility.
- Mọi module lớn phải được phân rã thành các sub-module độc lập (`core/`, `storage/`, `services/`, `routers/`, `components/`).

### 2. Chuẩn Tối Ưu Code & Kiến Trúc Hệ Thống
- **Database Access:** Dùng Connection Pool (`ThreadedConnectionPool`) và Batch Insert (`execute_values`). Không mở kết nối rời rạc.
- **Network & WAF Safety:** Toàn bộ truy vấn ngoài mạng bắt buộc dùng `safe_request_guard` từ `rate_limiter` để tuân thủ `max_global_rps`. Kích hoạt Circuit Breaker khi bị WAF phản hồi `Request Rejected`.
- **Session Caching:** Tái sử dụng `curl_cffi` session qua nhiều query, tránh giải CAPTCHA lặp lại không cần thiết.
- **Frontend Modular:** Vue 3 Composition API với các component độc lập (`static/js/components/*.js`), mỗi component dưới 180 dòng. Giao tiếp real-time qua SSE (`/api/stream`).
- **Kiểm thử tự động:** Trước khi hoàn tất, luôn chạy `python test_modular.py` để xác thực số dòng code và các API.
