# Implementation Plan — Bổ Sung Số Hiển Thị Trên Đầu Biểu Đồ & Chi Tiết Theo Ngày Thành Lập Đăng Ký

> **Mục tiêu:**
> 1. Xóa bỏ rào cản ẩn nhãn (`v-if <= 16`), hiển thị số lượng và ngày trên đầu/dưới mỗi cột của biểu đồ SVG bằng định dạng rút gọn thông minh (`compactNum`).
> 2. Bổ sung hỗ trợ đầy đủ cho tiêu chí **Ngày thành lập đăng ký (`regi_date`)** song song với **Ngày quét crawler (`scraped_at`)**, kết nối bảng chuyên biệt `regi_stats_daily` và trigger tự động `trg_tax_records_regi_stats` để đạt độ trễ $< 20\text{ms}$.
> 3. Cập nhật giao diện Vue 3 `crawled-report-tab.js` tuân thủ nghiêm ngặt giới hạn $\le 180$ dòng code.

---

## 1. Phân Tích Hiện Trạng & Nguyên Nhân

1. **Vấn đề số hiển thị trên đầu cột biểu đồ:**
   - Trong `crawled-report-tab.js`, thẻ hiển thị số trên đầu cột có điều kiện: `v-if="chartData.points.length <= 16"`.
   - Khi xem theo chu kỳ 30 ngày hoặc 90 ngày (thực tế có 25–38 điểm), điều kiện này trả về `false`, khiến **toàn bộ số liệu trên đầu cột bị ẩn hoàn toàn**.
   - **Giải pháp:** Bỏ điều kiện `<= 16`, sử dụng hàm định dạng rút gọn `compactNum(n)` (`58.5k`, `703`, `1.4M`) với cỡ chữ `7.5px font-mono font-bold` định vị tại `Math.max(p.y - 4, 10)` để luôn hiển thị rõ ràng trên mọi cột mà không bị đè lên nhau.

2. **Vấn đề phân tích theo Ngày thành lập đăng ký (`regi_date`):**
   - Trước đó, hệ thống chỉ tổng hợp bảng `crawl_stats_daily` theo `scraped_at`. Khi người dùng muốn xem theo ngày thành lập của doanh nghiệp (ngày cấp MST / ĐKKD), hệ thống chưa có giao diện lựa chọn và chưa có bảng tiền xử lý.
   - **Giải pháp:**
     - Đã tạo bảng `regi_stats_daily` và trigger `trg_tax_records_regi_stats`, nạp toàn bộ 344.581 mốc ĐKKD từ 6.973.888 bản ghi (tốc độ query 19ms).
     - Cập nhật backend `records.report.ts` và `reports.py` để khi `time_field === 'regi_date'` sẽ truy vấn bảng `regi_stats_daily`.
     - Bổ sung bộ chuyển đổi trên giao diện: `🕒 Ngày Quét (Crawler)` và `🏢 Ngày ĐKKD (Thành Lập)`.

---

## 2. Các Bước Triển Khai Chi Tiết

### Bước 1: Cập Nhật Backend Fastify & FastAPI
- File `src/modules/records/records.report.ts`:
  - Kiểm tra `dto.time_field === 'regi_date'`: Chọn bảng `regi_stats_daily` (cột `total_records`) hoặc `crawl_stats_daily` (cột `total_crawled`).
  - Đảm bảo file giữ nguyên $\le 135$ dòng code.
- File `server_app/routers/reports.py`:
  - Đồng bộ logic chọn bảng `regi_stats_daily` vs `crawl_stats_daily`.
  - Đảm bảo file $\le 125$ dòng code.

### Bước 2: Nâng Cấp Component Giao Diện `crawled-report-tab.js`
- Thêm ref `timeField = ref('scraped_at')` ('scraped_at' hoặc 'regi_date').
- Thêm nút chuyển đổi chế độ xem thời gian: `🕒 Ngày Quét` | `🏢 Ngày ĐKKD`.
- Thêm hàm `compactNum(n)` để hiển thị số trên đầu cột.
- Bỏ điều kiện `v-if="chartData.points.length <= 16"`, luôn render `<text>` trên đầu cột:
  `<text :x="p.x" :y="Math.max(p.y - 4, 10)" text-anchor="middle" class="text-[7.5px] fill-blue-600 dark:fill-blue-400 font-mono font-bold">{{ compactNum(p.count) }}</text>`
- Cập nhật tiêu đề biểu đồ và thẻ KPI thích ứng theo `timeField`.
- Tối ưu hóa template để toàn bộ file không vượt quá **180 dòng**.

### Bước 3: Kiểm Thử Toàn Diện & Nghiệm Thu
- Chạy `npm run check:types` và `npm run check:lines`.
- Chạy `npm run test:server` và `python test_modular.py`.
- Khởi động lại dịch vụ `GDTTaxCrawler` và kiểm tra phản hồi API thực tế trên port 8123.
- Tạo biên bản nghiệm thu `walkthrough.md` tại `docs/logs/67_20260930_160000_walkthrough.md` và cập nhật `docs/logs/INDEX.md`.
