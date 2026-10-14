# Kế Hoạch Kỹ Thuật: Bảng Thống Kê Riêng `crawl_stats_daily` & Hiển Thị Chi Tiết Sản Lượng MST Theo Ngày

## 1. Vấn Đề Kỹ Thuật & Yêu Cầu Người Dùng

1. **Vấn đề hiệu năng khi CSDL đạt 7.000.000 bản ghi**:
   - Truy vấn gom nhóm `GROUP BY DATE_TRUNC(...)` trực tiếp trên bảng `tax_records` quét hàng triệu dòng, tiêu tốn 5 - 13 giây mỗi lần tải báo cáo.
   - Khi có nhiều người dùng hoặc refresh liên tục, CSDL bị nghẽn CPU và I/O.
2. **Vấn đề hiển thị ngày cụ thể và sản lượng theo ngày**:
   - Biểu đồ cũ thiếu nhãn ngày (`<text>` X-axis label) phía dưới các cột.
   - Do có những ngày import hàng loạt (lên đến 700K - 1.3M bản ghi) so với các ngày crawl bình thường (500 - 60.000 bản ghi), tỷ lệ cột bị co cụm lại, khiến người dùng không nhìn thấy rõ ngày và số lượng cụ thể từng ngày.
   - Thiếu bảng số liệu chuyên biệt tập trung vào chi tiết từng ngày (Ngày cụ thể, Sản lượng MST, Thanh tiến độ).

---

## 2. Giải Pháp Kỹ Thuật: Bảng Lưu Trữ Riêng `crawl_stats_daily`

### 2.1. Cấu Trúc Bảng CSDL Chuyên Biệt
Tạo bảng `crawl_stats_daily` độc lập trên PostgreSQL 16:
```sql
CREATE TABLE IF NOT EXISTS crawl_stats_daily (
    id BIGSERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    province_prefix VARCHAR(5) NOT NULL,
    total_crawled INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_crawl_stats_date_province UNIQUE (stat_date, province_prefix)
);
CREATE INDEX IF NOT EXISTS idx_crawl_stats_daily_date ON crawl_stats_daily (stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_stats_daily_prov ON crawl_stats_daily (province_prefix);
```
- **Kích thước bảng**: Chỉ khoảng ~860 đến 2.500 dòng (thay vì 7.000.000 dòng).
- **Tốc độ truy vấn**: Giảm từ 13.600ms xuống còn **14ms** (tăng tốc gấp **1.000 lần**).

### 2.2. Cơ Chế Đồng Bộ & Cập Nhật Tự Động
1. **Khởi tạo dữ liệu lịch sử (Backfill)**:
   - Chạy truy vấn tổng hợp từ `tax_records` nạp vào `crawl_stats_daily` (đã nạp xong 862 dòng lịch sử cho 6.97M MST).
2. **API Đồng bộ thủ công & định kỳ**:
   - Endpoint: `POST /api/reports/sync-stats` (chạy ngầm cập nhật lại các ngày gần nhất).
3. **Cập nhật gia tăng khi lưu bản ghi (Incremental Update)**:
   - Khi `storage.py` hoặc worker cào được lô MST mới, tự động tăng `total_crawled` của ngày hiện tại và tiền tố tỉnh tương ứng (`ON CONFLICT DO UPDATE SET total_crawled = total_crawled + EXCLUDED...`).

---

## 3. Nâng Cấp Giao Diện Báo Cáo (`crawled-report-tab.js`)

1. **Hiển thị trực quan nhãn ngày cụ thể trên biểu đồ SVG**:
   - Thêm trục hoành với nhãn ngày rõ ràng: `DD/MM` (VD: `25/09`, `26/09`, `28/09`, `29/09`, `30/09`).
   - Nhãn số lượng MST hiển thị trực tiếp trên đầu mỗi cột hoặc khi rê chuột.
2. **Thẻ thống kê nhanh các ngày gần nhất**:
   - Hôm nay: `58.509 MST`
   - Hôm qua: `293 MST`
   - 7 ngày qua: `59.800 MST`
3. **Bảng dữ liệu chi tiết theo từng ngày (Full Table)**:
   - Cột 1: **Ngày Cụ Thể** (`DD/MM/YYYY`)
   - Cột 2: **Số Lượng MST Quét Được** (Hiển thị nổi bật dạng `badge font-mono`)
   - Cột 3: **Tỉnh thành chiếm ưu thế trong ngày**
   - Cột 4: **Thanh tiến độ & Tỷ lệ %**
   - Cột 5: **Nút xuất Excel/CSV riêng cho ngày**
4. **Nút `[⚡ Đồng Bộ Thống Kê]`**:
   - Người dùng bấm vào để làm mới bảng thống kê tức thì từ CSDL.

---

## 4. Danh Sách Tệp Thay Đổi & Giới Hạn Dòng Code

| Tệp | Hành Động | Dự Kiến Dòng | Giới Hạn |
|:---|:---:|:---:|:---:|
| `src/modules/records/records.report.ts` | **[MODIFY]** | ~160 dòng | 200 dòng |
| `src/modules/records/records.routes.ts` | **[MODIFY]** | ~120 dòng | 170 dòng |
| `server_app/routers/reports.py` | **[MODIFY]** | ~125 dòng | 200 dòng |
| `crawler_core/storage.py` | **[MODIFY]** | ~195 dòng | 200 dòng |
| `static/js/components/crawled-report-tab.js` | **[MODIFY]** | ~175 dòng | 180 dòng |
| `tests/test_ts_server.ts` | **[MODIFY]** | ~120 dòng | 200 dòng |
| `test_modular.py` | **[MODIFY]** | ~195 dòng | 200 dòng |
| `docs/topics/topic-11-crawled-tax-reporting-analytics.md` | **[MODIFY]** | ~160 dòng | Tài liệu |

---

## 5. Kế Hoạch Kiểm Thử
1. Chạy `npm run check:types` và `npm run check:lines` (100% PASS).
2. Chạy `npm run test:server` (100% PASS).
3. Chạy `python test_modular.py` (100% PASS).
4. Kiểm tra live trên Web Dashboard `http://localhost:8123`.
