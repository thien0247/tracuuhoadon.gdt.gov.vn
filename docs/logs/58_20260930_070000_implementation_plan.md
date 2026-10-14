# Kế Hoạch Triển Khai: Khắc Phục Toàn Diện 7 Vấn Đề Module Quét Đa Tỉnh (Topic 10)

## 1. Mục Tiêu & Phạm Vi
Xử lý dứt điểm toàn bộ 7 vấn đề kỹ thuật và điểm nghẽn kiến trúc đã được chỉ ra qua phân tích Graphify đối với Module Quét Đa Tỉnh của hệ thống `tracuuhoadon.gdt.gov.vn`:
1. Ngăn chặn hủy ngang hàng đợi khi có lệnh mới (Single-Batch Queue Overwrite).
2. Xóa bỏ rò rỉ luồng nền `_bg_flush_loop` (Thread Leak).
3. Máy chủ hóa bộ lập lịch quét tự động 6h (Server-Side Scheduler thay vì Client Timer).
4. Loại bỏ hiện tượng nghẽn API do `time.sleep(1.0)` bên trong `_lock` của `queue_manager.py`.
5. Đồng bộ `start_all` vào Rolling Queue Pool, loại bỏ nguy cơ bão request 62 tỉnh.
6. Tối ưu hóa Session & Captcha: chia sẻ phiên làm việc giữa các workers trong cùng 1 tỉnh.
7. Ngăn chặn kẹt Semaphore trong `safe_request_guard` khi Circuit Breaker kích hoạt.

---

## 2. Kế Hoạch Thực Hiện Chi Tiết

### Bước 1: Khắc phục Rò rỉ Luồng Nền trong `crawler_core/storage.py` & `engine.py`
- Bổ sung `_stop_event` vào class `Database`.
- Sửa `_bg_flush_loop`: dùng `self._stop_event.wait(timeout=5.0)` để thoát vòng lặp sạch sẽ khi nhận tín hiệu dừng.
- Thêm hàm `Database.close()` và gọi trong `CrawlerEngine.stop()` cũng như khối `finally` của `_run()`.

### Bước 2: Nâng Cấp `ProvinceQueueCoordinator` trong `server_app/core/queue_manager.py`
- Thêm tham số `mode="replace" | "append"` cho `start_batch()`. Khi thêm tỉnh mới hoặc quét bù bố cáo, chỉ chèn thêm các tỉnh chưa có vào queue mà không hủy tiến trình đang quét.
- Tách `start_crawler_internal(req)` và `time.sleep(1.0)` ra ngoài khối `with self._lock:` để không làm nghẽn API `/api/crawler/queue_status`.

### Bước 3: Chuẩn Hóa `start_all` trong `server_app/routers/crawler.py`
- Thay thế `_staggered_start_all` bằng việc đẩy danh sách vào `queue_coordinator.start_batch(requests, max_concurrent=3)`.
- Bảo đảm 100% lệnh quét đa tỉnh đều chạy qua Rolling Queue Pool an toàn trước WAF.

### Bước 4: Chống Kẹt Semaphore trong `server_app/core/limiter.py`
- Tách bạch việc chờ Circuit Breaker ra ngoài `concurrency_limiter`.
- Đảm bảo khi WAF trả về "Request Rejected", semaphore được trả lại ngay lập tức trước khi luồng bước vào trạng thái chờ cooldown.

### Bước 5: Tối Ưu Hóa Session Caching giữa các Workers trong `crawler_core/engine.py`
- Khởi tạo 1 instance `SessionManager` dùng chung cho các workers của tỉnh đó thay vì mỗi worker tạo 1 session độc lập.
- Giảm số lần gọi Warmup và giải AI CAPTCHA từ 6-12 lần xuống còn 1 lần duy nhất cho mỗi đợt quét tỉnh.

### Bước 6: Xây Dựng Server-Side Scheduler & Tích Hợp Frontend
- Tạo `server_app/core/scheduler.py` (< 120 dòng): Daemon thread chạy ngầm trên Windows Service, tự động kích hoạt quét Newest Mode mỗi 6h.
- Bổ sung API điều khiển scheduler trong `server_app/routers/crawler.py`.
- Cập nhật `static/js/components/crawler-auto-schedule.js` để đọc và đồng bộ trạng thái trực tiếp từ server.
- Đăng ký scheduler vào `lifespan` trong `server_app/main.py`.

### Bước 7: Kiểm Thử Tự Động, Cập Nhật Topic & Đồ Thị Tri Thức
- Chạy `python test_modular.py` xác thực số dòng (< 200 dòng/file) và hồi quy API.
- Tạo `docs/topics/topic-10-multi-province-crawler-hardening.md` và cập nhật `docs/TOPICS.md`.
- Lưu audit logs vào `docs/logs/`.
- Cập nhật đồ thị tri thức với `graphify update .`.

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. Tất cả các file can thiệp đều tuân thủ nghiêm ngặt `< 200 dòng/file`.
2. Hàng đợi cuốn chiếu không bị xóa khi gọi thêm batch mới (`mode="append"`).
3. Đóng crawler không để lại thread ma (`Database.close()` giải phóng luồng nền).
4. Tắt trình duyệt thì lịch quét 6h trên Windows Service vẫn tự động kích hoạt đúng giờ.
5. Bộ test `python test_modular.py` vượt qua 100%.
