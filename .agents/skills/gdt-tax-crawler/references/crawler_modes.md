# GDT Tax Crawler - Các Chế Độ Quét & Hàng Đợi Cuốn Chiếu

## 1. Các Chế Độ Quét (Scan Modes)

Hệ thống hỗ trợ 3 chế độ quét mã số thuế:

### A. Quét MST Mới Từ TIN Max (`scan_mode = "newest"`)
- **Mục tiêu:** Quét các mã số thuế mới phát hành gần đây nhất cho từng tỉnh.
- **Điểm bắt đầu:** `seed_tin = tin_max` (lấy từ CSDL PostgreSQL qua `get_max_tin(prefix)`). Nếu chưa có bản ghi, dùng `activation_tin`.
- **Chiều quét:** Chỉ quét tăng dần (`direction = 1`, UP).
- **Điều kiện dừng tự động:** `gap = 20`. 
  - Hệ thống sinh số theo thuật toán modulo 11 của Tổng cục Thuế.
  - Khi gặp **20 MST hợp lệ liên tiếp không tồn tại** (`consecutive_empty >= 20`), luồng sẽ kích hoạt `direction_stop.set()`, tự động hoàn tất và giải phóng tài nguyên.
- **Số luồng worker đề xuất:** `num_workers = 1`.

### B. Quét Mở Rộng 2 Biên (`scan_mode = "edges"`)
- **Mục tiêu:** Quét mở rộng cả 2 phía ngoài cùng từ `tin_max` (chiều tăng) và `tin_min` (chiều giảm).
- **Luồng hoạt động:** Khởi chạy 2 thread độc lập (`UP` và `DOWN`), mỗi luồng có cờ dừng riêng.

### C. Quét 2 Chiều Từ Mốc Cơ Sở (`scan_mode = "bidirectional"`)
- **Mục tiêu:** Vét cạn toàn bộ không gian MST của tỉnh xuất phát từ mốc `seed_tin`.
- **Luồng hoạt động:** Quét đồng thời cả chiều tăng và giảm từ mốc seed.

---

## 2. Hàng Đợi Cuốn Chiếu (Rolling Queue Pool)

Để tránh tình trạng kích hoạt đồng loạt 62 tỉnh khiến WAF F5 chặn toàn bộ IP (`Request Rejected`), hệ thống sử dụng bộ điều phối `QueueCoordinator` (`server_app/core/queue_manager.py`):

1. **Khởi chạy hàng loạt:** 
   Gọi `POST /api/crawler/start_all_newest` với payload:
   ```json
   {
     "gap": 20,
     "num_workers": 1,
     "max_concurrent_provinces": 3
   }
   ```
2. **Cơ chế xoay vòng:**
   - Hàng đợi giữ tối đa `max_concurrent_provinces` (mặc định 3 tỉnh) hoạt động cùng lúc.
   - Khi một tỉnh quét xong (đạt 20 MST trống liên tiếp), callback `on_engine_finished` được kích hoạt và tự động lấy tỉnh tiếp theo trong hàng đợi chờ để chạy.
3. **Kiểm tra trạng thái hàng đợi:**
   `GET /api/crawler/queue_status` trả về:
   - `is_running`: boolean
   - `active_provinces`: danh sách các tỉnh đang chạy
   - `pending_count`: số lượng tỉnh đang xếp hàng
   - `completed_count`: số lượng tỉnh đã hoàn tất
