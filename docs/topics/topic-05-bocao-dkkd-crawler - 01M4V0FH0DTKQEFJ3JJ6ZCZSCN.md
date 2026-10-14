---
id: "01M4V0FH0DTKQEFJ3JJ6ZCZSCN"
aliases:
  - "topic-05-bocao-dkkd-crawler"
  - "topic-05-bocao-dkkd-crawler.md"
created_at: "2026-10-13T16:10:41.038396+00:00"
type: "documentation"
related_code:
  - 01M4V0HMJVKYTH2AG210MC4JCE
  - 01M4V0HMJWCK2J48D609JNWFV9
  - 01M4V0HMJYNV5AZ6R4AR5N80HF
  - 01M4V0HMJZ8255KHE2XMM2PWVT
  - 01M4V0HMK01N0MMM2946F1XHCG
  - 01M4V0HMQ3A7DWZWDSH8ENR1NN
---
# Topic 05 — Phân Tích & Tích Hợp Module Bố Cáo Điện Tử (bocaodientu.dkkd.gov.vn)

> **Ngày tạo:** 20/09/2026  
> **Trạng thái:** ✅ Đã hoàn thành  
> **Tác giả:** Đội ngũ Kỹ thuật GDT Tax Crawler & Search Engine  
> **Cổng thông tin nguồn:** [https://bocaodientu.dkkd.gov.vn/egazette/Forms/Egazette/DefaultAnnouncements.aspx](https://bocaodientu.dkkd.gov.vn/egazette/Forms/Egazette/DefaultAnnouncements.aspx)

---

## 1. Bối Cảnh & Mục Tiêu Kỹ Thuật

### 1.1. Giá trị chiến lược của nguồn dữ liệu Bố Cáo Điện Tử
Hệ thống hiện tại thực hiện vét cạn dữ liệu thuế từ Tổng cục Thuế (`tracuuhoadon.gdt.gov.vn`) theo dải mã số thuế (TIN prefix). Tuy nhiên, để phát hiện các **doanh nghiệp mới thành lập ngay trong ngày theo thời gian thực (real-time)**, nguồn dữ liệu từ Cổng Bố Cáo Điện Tử thuộc Cục Quản lý đăng ký kinh doanh (Bộ KH&ĐT) là nguồn chính thống, tức thì và nhanh nhất cả nước:
1. **Cập nhật từng giây:** Mọi doanh nghiệp vừa được cấp Giấy chứng nhận ĐKDN hoặc đăng ký thay đổi, giải thể đều được tự động công bố trên Cổng Bố Cáo Điện Tử theo thời gian thực (timestamp có giờ, phút, giây).
2. **Loại bỏ việc quét mò dải số:** Bằng cách cào tự động các bố cáo mới nhất, hệ thống thu thập ngay lập tức các Mã số doanh nghiệp (MST) mới tinh vừa ra đời để ưu tiên nạp thẳng vào hàng đợi crawler hoặc lưu trữ độc lập.
3. **Đa dạng biến động doanh nghiệp:** Bố cáo cung cấp phân loại rõ ràng:
   - `Đăng ký mới`
   - `Đăng ký thay đổi`
   - `Thông báo thay đổi`
   - `Giải thể`
   - `Vi phạm / Thu hồi`
   - `HTX, LHHTX, ĐVTT`

---

## 2. Phân Tích Kỹ Thuật Trang Web Bố Cáo Điện Tử

### 2.1. Cấu trúc nền tảng Web & Giao thức
- **Nền tảng:** Microsoft ASP.NET WebForms (`.aspx`) kết hợp ASP.NET AJAX `ScriptManager`.
- **URL chính:** `https://bocaodientu.dkkd.gov.vn/egazette/Forms/Egazette/DefaultAnnouncements.aspx`
- **Bảng dữ liệu:** Thẻ `<table id="ctl00_C_CtlList">` hiển thị danh sách 22 bố cáo trên mỗi trang.
- **Trường dữ liệu trích xuất từ mỗi dòng (`<tr>`):**
  - **Cột 1 (Thời gian):** `pub_time` — Định dạng `dd/MM/yyyy hh:mm:ss SA/CH` (VD: `20/09/2026 12:11:03 SA`).
  - **Cột 2 (Tên & MST):** Chứa Tên pháp lý công ty và `MÃ SỐ DN: <MST>` (VD: `CÔNG TY TNHH HÀNG TIÊU DÙNG NHÀ VIỆT`, MST: `2500785751`).
  - **Cột 3 (Địa điểm):** Tỉnh / Thành phố nơi đặt trụ sở chính (VD: `Tỉnh Phú Thọ`, `Thành phố Hồ Chí Minh`).
  - **Cột 4 (Loại thông báo):** Phân loại bố cáo (`Đăng ký mới`, `Đăng ký thay đổi`, v.v.).
  - **Cột 5 (Thao tác):** Liên kết xem chi tiết (`javascript:__doPostBack('ctl00$C$CtlList$ctl02$CmdView','')`).

### 2.2. Cơ chế Phân trang & Bảo vệ Mạng (WAF / TLS)
1. **Phân trang:**
   - Dùng cơ chế ASP.NET `__doPostBack('ctl00$C$CtlList', 'Page$2')`.
   - Cần mang theo các input ẩn bắt buộc: `__VIEWSTATE`, `__EVENTVALIDATION`, `__VIEWSTATEGENERATOR`.
2. **Bảo vệ mạng & TLS Fingerprint:**
   - Cổng thông tin của Bộ KH&ĐT sử dụng cơ chế kiểm soát TLS khắt khe. Các HTTP client thông thường (như Node.js `fetch` chuẩn hoặc Python `requests` mặc định) dễ bị timeout hoặc drop kết nối do fingerprinting.
   - Thư viện `curl_cffi` với `impersonate="chrome124"` vượt qua kiểm tra TLS handshake chỉ trong **1.2 giây**, phản hồi HTTP 200 ổn định tuyệt đối.

---

## 3. Kiến Trúc Giải Pháp & Thiết Kế Module

### 3.1. Thiết kế Bảng CSDL PostgreSQL: `bocao_records`
Lưu trữ toàn bộ thông tin bố cáo độc lập với bảng `tax_records`, có ràng buộc chống trùng lặp:

```sql
CREATE TABLE IF NOT EXISTS bocao_records (
    id BIGSERIAL PRIMARY KEY,
    tin VARCHAR(20) NOT NULL,
    company_name TEXT NOT NULL,
    province_name VARCHAR(100),
    announcement_type VARCHAR(100) NOT NULL,
    pub_time TIMESTAMPTZ NOT NULL,
    crawled_at TIMESTAMPTZ DEFAULT NOW(),
    raw_data JSONB,
    CONSTRAINT uq_bocao_tin_pub_type UNIQUE (tin, pub_time, announcement_type)
);

CREATE INDEX IF NOT EXISTS idx_bocao_tin ON bocao_records(tin);
CREATE INDEX IF NOT EXISTS idx_bocao_pub_time ON bocao_records(pub_time DESC);
CREATE INDEX IF NOT EXISTS idx_bocao_province ON bocao_records(province_name);
CREATE INDEX IF NOT EXISTS idx_bocao_type ON bocao_records(announcement_type);
```

### 3.2. Thiết kế Module Backend (`src/modules/bocao/`)
Tuân thủ nghiêm ngặt quy chuẩn kiến trúc module trong [GEMINI.md](../../GEMINI.md) (< 200 dòng/file):
1. `bocao.types.ts` (≤ 80 dòng): Interface cho bản ghi bố cáo, filter DTO, crawl payload, stats response.
2. `bocao.service.ts` (≤ 160 dòng):
   - Truy vấn danh sách bố cáo từ bảng `bocao_records` theo bộ lọc (Tỉnh, Loại thông báo, Ngày công bố, Tìm kiếm MST/Tên).
   - Thống kê tổng số bố cáo theo loại và tỉnh thành.
   - Trigger worker cào trang hiện tại từ Python Worker IPC bridge.
3. `bocao.routes.ts` (≤ 100 dòng):
   - `GET /api/bocao/records`: Lấy danh sách bố cáo (phân trang, lọc đa chiều).
   - `GET /api/bocao/stats`: Báo cáo thống kê bố cáo.
   - `POST /api/bocao/crawl`: Kích hoạt cào trang hiện tại từ Cổng DKKD.
4. `index.ts` (≤ 20 dòng): Public API xuất khẩu module.

### 3.3. Dịch vụ Thu thập Dữ liệu (Python Worker Service)
- Tệp `server_app/services/bocao_crawler.py`:
  - Khởi tạo session `curl_cffi` với `impersonate='chrome124'`.
  - Thực hiện GET trang `DefaultAnnouncements.aspx`.
  - Phân tích HTML bằng `BeautifulSoup`, trích xuất 22 bố cáo.
  - Chuẩn hóa thời gian `dd/MM/yyyy hh:mm:ss SA/CH` sang ISO 8601 UTC.
  - Thực hiện batch upsert vào bảng `bocao_records` qua `ON CONFLICT (tin, pub_time, announcement_type) DO NOTHING`.
  - Tích hợp endpoint `/worker/bocao/crawl` vào `worker_bridge.py`.
  - **Cào toàn bộ các trang (Multi-page Crawl):** Hàm `crawl_all_bocao_pages(max_pages)` tự động thực hiện ASP.NET AJAX postback (`ctl00$C$CtlList`, `Page$N`) kèm `__VIEWSTATE` và `__EVENTVALIDATION` để cào tuần tự nhiều trang.
  - **Tra cứu Doanh Nghiệp Trực Tuyến (DKKD Solr Search):** Hàm `query_dkkd_solr(search_field)` tự động lấy token session `ctl00_hdParameter` từ trang bố cáo và gửi POST truy vấn Solr endpoint `Srv.aspx/GetSearch`, trả về đầy đủ Tên công ty, Tên tiếng Anh (`Name_F`), Tên viết tắt, MST, Mã ĐKKD, Người đại diện và Địa chỉ trụ sở chính.

### 3.4. Dịch vụ Đối Soát Mã Số Doanh Nghiệp (`BocaoReconcileService`)
- Tệp `src/modules/bocao/bocao-reconcile.service.ts` (≤ 120 dòng):
  - Thực hiện câu truy vấn liên kết bảng `bocao_records LEFT JOIN tax_records ON b.tin = t.tin`.
  - Phân loại trạng thái đối soát: `matched` (đã có trong CSDL Thuế), `unmatched` (doanh nghiệp mới chưa có trong CSDL Thuế).
  - Trích xuất thông tin đối chiếu song song:
    - Bố Cáo ĐKKD: Tên doanh nghiệp, ngày công bố, loại bố cáo, tỉnh/thành phố.
    - CSDL Thuế: `t.norm_name`, `t.status_name`, `COALESCE(t.address, t.tran_addr)`, `COALESCE(t.tax_department, t.pay_taxo_name)`.
  - Hỗ trợ phân trang, lọc theo trạng thái (`all`, `matched`, `unmatched`), tìm kiếm theo từ khóa (MST / tên) và lọc theo tỉnh thành.
  - Cung cấp hàm `getReconcileStats()` tính toán tỷ lệ bao phủ dữ liệu thuế (`match_rate` %).

---

## 4. Giao Diện Người Dùng & Tích Hợp Frontend
1. **Component `<BocaoTab />` (`static/js/components/bocao-tab.js`):**
   - Nút `⚡ Cào Tất Cả` với tùy chọn số trang (3, 5, 10 trang).
   - Nút `⚡ Trang 1` cào nhanh trang đầu tiên.
   - Nút `🔍 Tra Cứu Solr DKKD` mở modal tra cứu doanh nghiệp trực tuyến.
   - Nút `DKKD` nhanh cạnh từng MST trong bảng dữ liệu để tra cứu Solr 1-click.
2. **Component `<BocaoSolrModal />` (`static/js/components/bocao-solr-modal.js`):**
   - Modal hiển thị thông tin doanh nghiệp realtime từ DKKD Solr.
   - Tích hợp sao chép MST và liên kết nhanh `👁️ Xem Chi Tiết GDT` mở `TaxDetailModal`.
3. **Component `<BocaoReconcileTab />` (`static/js/components/bocao-reconcile-tab.js`):**
   - 4 thẻ thống kê trực quan: Tổng Bố Cáo, Đã có trong Thuế, Chưa có trong Thuế, Tỷ lệ bao phủ (%).
   - 3 tab phân loại: Tất Cả, ⚠️ Chưa Có Trong Thuế, ✅ Đã Có Trong Thuế.
   - Bảng đối chiếu song song: Nguồn Bố Cáo ĐKKD vs CSDL Thuế GDT (`tax_records`).
   - Nút thao tác nhanh `🔍 DKKD` (mở `BocaoSolrModal`) và `👁️ GDT` (mở `TaxDetailModal`).
   - Tích hợp đầy đủ AI Inspector `?` badge.

---

## 6. Nâng Cấp Giải Thuật: Bocao Radar & Quét Lấp Lỗ Hổng (Gap-Fill)

### 6.1. Phân tích Bản chất Lệch MST giữa DKKD và Thuế GDT
1. **Lệch Vượt Đỉnh (14/60 MST):** MST mới cấp tại DKKD lớn hơn MST lớn nhất hiện có trong CSDL Thuế địa phương (`tin > MAX(tax_records)`).
2. **Lệch Lỗ Hổng / Nằm Dưới Đỉnh (46/60 MST):** MST nằm rải rác bên trong dải số đã quét qua (`tin < MAX(tax_records)`).
3. **Hiện tượng Trễ ETL (Replication Lag) của Cổng Thuế:**
   - Hệ thống công khai `tracuuhoadon.gdt.gov.vn` thường cập nhật chậm hơn hệ thống ĐKKD từ 12h đến 36h.
   - Khi truy vấn các MST vừa công bố trong ngày, GDT có thể trả về lỗi tạm thời `The application has malfunctioned.` mà chưa trả về `tinModel`.
   - Do đó, cần cơ chế `retry_later` ghi nhận số lần thử và thời gian lần cuối, tránh rơi vào vòng lặp vô hạn.

### 6.2. Phương Án 1 — Bocao Radar: Quét Bù Trực Tiếp & Thử Lại Định Kỳ
- Nút bấm `⚡ Quét Bù Vào Thuế` trên giao diện Đối Soát cho phép người dùng kích hoạt quét bù ngay lập tức cho các MST chưa có trong Thuế.
- Dịch vụ `server_app/services/bocao_reconcile_sync.py` gửi truy vấn an toàn qua `safe_request_guard` và giải CAPTCHA tự động bằng OCR Solver.
- Nếu tìm thấy bản ghi thuế hợp lệ, tự động lưu vào `tax_records` và cập nhật `sync_status = 'synced'`. Nếu cổng GDT báo lỗi/chưa có, đánh dấu `sync_status = 'retry_later'` kèm `sync_attempts += 1`.
- Giao diện hiển thị badge `⏳ Chờ GDT sync (Lần N)` sinh động.

### 6.3. Phương Án 2 — Nâng Cấp CrawlerTab: Đỉnh Động & Chế Độ Quét Lấp Lỗ Hổng
- **Đỉnh Động (Dynamic Peak):** Cập nhật hàm `get_max_tin_by_prefix` để lấy `GREATEST(MAX(tax_records), MAX(bocao_records))`. Đảm bảo chế độ `newest` không bao giờ bị tụt hậu so với các MST mới nhất đã công bố trên Bố Cáo.
- **Chế Độ Quét Lấp Lỗ Hổng (`gap_fill`):** Tự động phát hiện các hạt giống (seeds) từ các MST `unmatched` trong `bocao_records` theo từng tỉnh thành, từ đó kích hoạt quét song song 2 chiều (Lên/Xuống) xung quanh mỗi hạt giống với ngưỡng gap hẹp (50 MST) để lấp đầy toàn bộ các lỗ hổng dải số còn thiếu sót.

---

## 7. Phân Hệ Tự Động Cào Bố Cáo Định Kỳ (Bocao Auto Crawl)

Nhằm đảm bảo dữ liệu Bố Cáo được liên tục cập nhật theo chu kỳ mà không cần người dùng thao tác thủ công, phân hệ `<bocao-auto-crawl>` đã được xây dựng:
1. **Kiến trúc mô-đun:** Tách riêng thành `static/js/components/bocao-auto-crawl.js` (176 dòng) để giữ `bocao-tab.js` (178 dòng) tuân thủ giới hạn < 180 dòng của `GEMINI.md`.
2. **Khả năng cấu hình:**
   - Chu kỳ cào linh hoạt: 30 phút, 1 giờ, **2 giờ (chuẩn)**, 4 giờ, 6 giờ, 12 giờ.
   - Số trang cào mỗi đợt: 3 trang (~60 tin), **5 trang (~100 tin)**, 10 trang, 20 trang.
3. **Giám sát & Nhật ký:**
   - Trạng thái đếm ngược trực quan `hh:mm:ss` đến lần cào tiếp theo.
   - Lưu trữ cấu hình và 50 sự kiện nhật ký gần nhất vào `localStorage` giúp duy trì trạng thái liên tục qua các lần tải lại trang.
   - Cơ chế phát sự kiện `@crawled` giúp đồng bộ dữ liệu với bảng hiển thị tức thời.


