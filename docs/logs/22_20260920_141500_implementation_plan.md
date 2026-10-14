# Kế Hoạch: Module Thu Thập Dữ Liệu Bố Cáo Điện Tử (bocaodientu.dkkd.gov.vn)

## 1. Mục Tiêu & Bối Cảnh Nghiên Cứu

Theo yêu cầu: **"Phân tích trang https://bocaodientu.dkkd.gov.vn/egazette/Forms/Egazette/DefaultAnnouncements.aspx tạo thêm module để crawl từ trang hiện tại, dữ liệu lưu vào table mới"**.

### 1.1. Kết Quả Phân Tích Kỹ Thuật
- **Bản chất trang nguồn:** Cổng thông tin Bố cáo điện tử thuộc Cục Quản lý đăng ký kinh doanh (Bộ KH&ĐT) là kênh pháp lý công bố biến động doanh nghiệp trên toàn quốc theo thời gian thực (real-time).
- **Đặc tính dữ liệu:** Mỗi trang `DefaultAnnouncements.aspx` chứa 22 bố cáo mới nhất (gồm: Thời gian công bố chính xác tới từng giây, Tên pháp lý doanh nghiệp, Mã số doanh nghiệp / Mã số thuế, Tỉnh / Thành phố trụ sở, Loại thông báo: Đăng ký mới, Đăng ký thay đổi, Giải thể, v.v.).
- **Giá trị chiến lược:** Giúp hệ thống nắm bắt ngay lập tức các Mã số thuế (MST) vừa cấp mới tinh trong ngày mà không cần quét mò dải số (brute-force).
- **Thách thức mạng & Bảo mật:** Trang sử dụng ASP.NET WebForms (.aspx) và kiểm duyệt TLS/WAF nghiêm ngặt. Kiểm thử thực tế cho thấy thư viện `curl_cffi` (impersonate Chrome 124) phản hồi ổn định trong 1.2s, trong khi HTTP clients thông thường dễ bị timeout/drop kết nối.
- **Tài liệu Topic:** Đã biên soạn đầy đủ báo cáo phân tích tại [docs/topics/topic-05-bocao-dkkd-crawler.md](file:///c:/tracuuhoadon.gdt.gov.vn/docs/topics/topic-05-bocao-dkkd-crawler.md) và cập nhật mục lục [docs/TOPICS.md](file:///c:/tracuuhoadon.gdt.gov.vn/docs/TOPICS.md).

---

## 2. Thiết Kế Chi Tiết & Các Thay Đổi Đề Xuất

### 2.1. Cơ Sở Dữ Liệu PostgreSQL: Bảng Mới `bocao_records`
Tạo tệp migration [src/db/migrations/005_create_bocao_records.sql](file:///c:/tracuuhoadon.gdt.gov.vn/src/db/migrations/005_create_bocao_records.sql):
- **Cấu trúc bảng:**
  - `id BIGSERIAL PRIMARY KEY`
  - `tin VARCHAR(20) NOT NULL` (Mã số doanh nghiệp / MST)
  - `company_name TEXT NOT NULL` (Tên pháp lý công ty)
  - `province_name VARCHAR(100)` (Tỉnh / Thành phố)
  - `announcement_type VARCHAR(100) NOT NULL` (Đăng ký mới, Đăng ký thay đổi, ...)
  - `pub_time TIMESTAMPTZ NOT NULL` (Thời điểm công bố)
  - `crawled_at TIMESTAMPTZ DEFAULT NOW()`
  - `raw_data JSONB` (Lưu thông tin bổ sung và liên kết chi tiết)
  - `CONSTRAINT uq_bocao_tin_pub_type UNIQUE (tin, pub_time, announcement_type)` (Chống trùng lặp tuyệt đối khi cào lặp lại)
- **Chỉ mục:** `idx_bocao_tin`, `idx_bocao_pub_time`, `idx_bocao_province`, `idx_bocao_type`.

### 2.2. Dịch Vụ Cào Dữ Liệu Python Worker (`server_app/services/bocao_crawler.py`)
- Sử dụng `curl_cffi.requests.Session(impersonate='chrome124')` kết hợp `BeautifulSoup`.
- Hàm `crawl_current_page()`:
  - Cào dữ liệu trang hiện tại `DefaultAnnouncements.aspx`.
  - Phân tích regex bóc tách MST `MÃ SỐ DN: (\d+)` và tên doanh nghiệp.
  - Chuẩn hóa thời gian tiếng Việt (VD: `20/09/2026 12:11:03 SA` -> timestamp UTC).
  - Ghi nhận lô vào `bocao_records` bằng `execute_values` với `ON CONFLICT DO NOTHING`.
  - Trả về số lượng bản ghi mới và tổng số bản ghi cào được.
- Đăng ký endpoint IPC trong `worker_bridge.py`: `POST /worker/bocao/crawl`.

### 2.3. Module Fastify TypeScript Mới (`src/modules/bocao/`)
Tuân thủ nghiêm ngặt quy chuẩn kiến trúc module trong [GEMINI.md](../../GEMINI.md) (< 200 dòng/file):
- [NEW] `src/modules/bocao/bocao.types.ts` (≤ 70 dòng): DTOs cho query, record, stats, crawl result.
- [NEW] `src/modules/bocao/bocao.service.ts` (≤ 150 dòng):
  - `getBocaoRecords()`: Truy vấn danh sách bố cáo với phân trang, lọc theo tỉnh, loại thông báo, tìm kiếm MST/Tên.
  - `getBocaoStats()`: Thống kê số lượng theo loại bố cáo, phân bố tỉnh thành và số lượng MST mới trong ngày.
  - `triggerBocaoCrawl()`: Gọi worker bridge để cào trang hiện tại.
- [NEW] `src/modules/bocao/bocao.routes.ts` (≤ 90 dòng):
  - `GET /api/bocao/records`
  - `GET /api/bocao/stats`
  - `POST /api/bocao/crawl`
- [NEW] `src/modules/bocao/index.ts` (≤ 15 dòng): Export module public API.
- [MODIFY] `src/app.ts`: Đăng ký router `registerBocaoRoutes(app)`.

### 2.4. Giao Diện Người Dùng (Frontend Tab Mới)
- [NEW] `static/js/components/bocao-tab.js` (≤ 160 dòng):
  - Hiển thị bảng bố cáo thời gian thực với các nhãn màu trạng thái (Đăng ký mới: Xanh lá, Đăng ký thay đổi: Vàng cam, Giải thể: Đỏ).
  - Tích hợp nút **"⚡ Cào Bố Cáo Mới Nhất"** và thanh thống kê số lượng.
  - Cho phép click vào Mã số thuế để mở ngay popup Chi tiết Người Nộp Thuế (`openTaxDetail(tin)`).
- [MODIFY] `static/js/api.js`: Thêm API calls `ApiClient.getBocaoRecords`, `ApiClient.getBocaoStats`, `ApiClient.crawlBocao`.
- [MODIFY] `templates/index.html`: Thêm tab "Bố Cáo Điện Tử" và nạp script component.
- [MODIFY] `static/js/app.js`: Đăng ký component `bocao-tab`.

---

## 3. Kế Hoạch Kiểm Thử & Nghiệm Thu

1. **Kiểm tra CSDL:**
   - Chạy migration tạo bảng `bocao_records`, kiểm tra cấu trúc cột và index.
2. **Kiểm thử Python Crawler:**
   - Chạy cào trang hiện tại, kiểm tra trích xuất 22 bản ghi và ghi nhận vào bảng `bocao_records`.
   - Chạy lại lần 2 để kiểm tra cơ chế chống trùng lặp `ON CONFLICT DO NOTHING`.
3. **Kiểm thử API Fastify:**
   - `POST /api/bocao/crawl`: Phản hồi kết quả cào thành công.
   - `GET /api/bocao/records`: Phản hồi danh sách bản ghi đầy đủ các trường.
   - `GET /api/bocao/stats`: Phản hồi thống kê theo loại thông báo và tỉnh thành.
4. **Kiểm tra Quy Chuẩn Code (Line Limits & Type Safety):**
   - Chạy `tests/check_ts_line_limits.ts` đảm bảo 100% tệp TypeScript đạt < 200 dòng.
   - Chạy `npx tsc --noEmit` đảm bảo 0 lỗi TypeScript.
   - Kiểm tra các tệp Vue/JS đạt < 180 dòng.
5. **Tuân thủ Rule 6 (Audit Logs):**
   - Lưu bản sao Kế hoạch vào `docs/logs/22_20260920_141500_implementation_plan.md`.
   - Cập nhật `docs/logs/INDEX.md`.
