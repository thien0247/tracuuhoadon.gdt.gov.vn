# Implementation Plan — Bổ Sung Mã Số Thuế Mới Theo Ngày & Kiểm Tra Số Hiển Thị Trên Biểu Đồ

> **Mục tiêu:** Thêm các mã số thuế mới vào CSDL `tax_records` theo từng mốc ngày cụ thể (ngày hôm nay 30/09/2026 và mốc ngày kiểm thử 01/10/2026), sau đó kiểm chứng số liệu cập nhật tự động thời gian thực qua trigger `trg_tax_records_stats` lên bảng `crawl_stats_daily`, API endpoint và các phần tử hiển thị trên biểu đồ / bảng thống kê giao diện web.

---

## 1. Hiện Trạng Số Liệu Trước Khi Bổ Sung (Baseline)

Dựa trên truy vấn thực tế tại thời điểm `2026-09-30 14:35`:
- **Tổng số MST toàn quốc:** `6,973,888` MST.
- **Sản lượng ngày hôm nay (30/09/2026):** `58,509` MST.
- **Sản lượng Đắk Lắk (tiền tố 60) hôm nay:** `4,858` MST (hoặc theo prefix 60).
- **Mốc ngày 01/10/2026:** Chưa có (0 MST).

---

## 2. Kịch Bản Bổ Sung Mã Số Thuế Mới Theo Ngày

### Kịch bản A: Bổ sung 5 MST mới cho ngày hôm nay (30/09/2026)
- **Tỉnh:** Đắk Lắk (Prefix `60`).
- **Danh sách MST kiểm thử:**
  1. `6001850001`
  2. `6001850002`
  3. `6001850003`
  4. `6001850004`
  5. `6001850005`
- **Thời gian quét (`scraped_at`):** `2026-09-30 14:40:00`.
- **Kỳ vọng:**
  - Sản lượng ngày 30/09/2026 trên biểu đồ tăng từ **58.509** lên **58.514** (+5 MST).
  - Thẻ KPI "Hôm Nay (Quét Mới)" hiển thị **58.514 MST**.
  - Bảng số liệu chi tiết hiển thị đúng dòng `30/09/2026 -> 58.514 MST`.
  - Bộ lọc Đắk Lắk (`province_key=60`) phản ánh đúng +5 MST.

### Kịch bản B: Bổ sung 3 MST mới cho mốc ngày mới (01/10/2026)
- **Tỉnh:** TP. Hồ Chí Minh (Prefix `03`) & Hà Nội (Prefix `01`).
- **Danh sách MST kiểm thử:**
  1. `0309990001` (TP. Hồ Chí Minh, ngày 01/10/2026)
  2. `0309990002` (TP. Hồ Chí Minh, ngày 01/10/2026)
  3. `0109990001` (Hà Nội, ngày 01/10/2026)
- **Thời gian quét (`scraped_at`):** `2026-10-01 08:30:00`.
- **Kỳ vọng:**
  - Trên biểu đồ xuất hiện thêm 1 cột mới có nhãn `01/10` với độ cao tương ứng `3 MST`.
  - Bảng số liệu chi tiết tự động có dòng mới trên cùng: `📅 01/10/2026 -> 3 MST`.
  - Tooltip khi rê chuột vào cột mới hiển thị: `📅 Ngày: 01/10/2026` và `⚡ Sản lượng: 3 MST`.

---

## 3. Các Bước Thực Hiện & Kiểm Tra

1. **Bước 1 — Viết script bổ sung dữ liệu có kiểm soát:**
   - Dùng script an toàn `scratch/add_tax_records_test.py` với cấu trúc `ON CONFLICT (tin) DO UPDATE` để có thể lặp lại mà không lỗi trùng khóa.
2. **Bước 2 — Kiểm tra Trigger `trg_tax_records_stats`:**
   - Query trực tiếp bảng `crawl_stats_daily` để xác nhận số dòng và số lượng `total_crawled` được cộng dồn tức thì.
3. **Bước 3 — Kiểm tra phản hồi từ API Server (Port 8123):**
   - Gọi `GET /api/reports/crawl-stats?period=day` kiểm tra `timeline`, `summary`, `top_provinces`.
   - Gọi `GET /api/reports/crawl-stats?period=day&province_key=60`.
4. **Bước 4 — Kiểm tra giao diện Dashboard (Biểu đồ SVG & Bảng số liệu):**
   - Đọc kết quả render, kiểm tra mốc ngày và độ cao các cột SVG.
5. **Bước 5 — Dọn dẹp bản ghi kiểm thử (Rollback / Cleanup) nếu cần, hoặc lưu giữ làm minh chứng:**
   - Ghi nhận đầy đủ trong biên bản nghiệm thu Walkthrough.

---

## 4. Kế Hoạch Xác Minh (Verification Plan)

- **Đo lường thời gian đáp ứng API:** Đảm bảo vẫn duy trì $\le 20\text{ms}$ sau khi bổ sung dữ liệu.
- **Tính toán tọa độ biểu đồ:** Kiểm tra logic tính toán `points` trong SVG đảm bảo hiển thị chuẩn xác không bị tràn layout.
