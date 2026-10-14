# Kế Hoạch Triển Khai: Phân Tích API Xinvoice & Xây Dựng Module Bổ Sung Dữ Liệu Thuế (Enrichment Module)

## Giới Thiệu & Bối Cảnh
Trang tra cứu hoá đơn / thuế `https://xinvoice.vn/apis/tra-cuu-ma-so-thue/` (sản phẩm của Công ty TNHH Casso) cung cấp API công khai chuẩn hóa thông tin người nộp thuế:
- Endpoint: `GET https://api.xinvoice.vn/gdt-api/tax-payer/:taxCode`
- Dữ liệu trả về gồm: `orgType` (Loại tổ chức), `taxID` (Mã số thuế), `name` (Tên NNT), `address` (Địa chỉ chuẩn hóa), `taxDepartment` (Chi cục thuế quản lý), `status` (Trạng thái hoạt động), `updatedAt`.
- Thử nghiệm thực tế: Endpoint hoạt động trực tiếp không cần API key với cơ chế kiểm soát tốc độ (Rate Limit: 10 requests / 30 seconds). Cho phép cấu hình `client-id` và `api-key` để mở rộng hạn ngạch.

Mục tiêu của nhiệm vụ:
1. Viết báo cáo phân tích chi tiết vào `docs/topics/topic-03-xinvoice-api-data-enrichment.md` và cập nhật mục lục `docs/TOPICS.md`.
2. Nâng cấp cấu trúc CSDL `tax_records` trong PostgreSQL: Bổ sung 4 cột `org_type TEXT`, `address TEXT`, `tax_department TEXT`, `enriched_at TIMESTAMP`.
3. Xây dựng module TypeScript độc lập `src/modules/enrichment/` với REST API hỗ trợ:
   - Tra cứu và bổ sung tức thời cho từng MST (`/api/enrichment/:tin`).
   - Cập nhật bổ sung hàng loạt theo toàn bộ tỉnh thành (`/api/enrichment/province/:provinceKey/start`, `/status`, `/stop`).
   - Kết hợp giải thuật suy luận ngoại tuyến (Offline inference fallback) tự động nhận diện `orgType` từ độ dài TIN (10 số, 13 số, tiền tố hộ kinh doanh) và chuẩn hóa địa chỉ/cơ quan thuế khi chưa gọi API hoặc khi gặp Rate Limit.
4. Tích hợp hiển thị `orgType`, `address`, `taxDepartment` trên giao diện người dùng (`TaxDetailModal` & `CrawlerTab`).

---

## User Review Required

> [!IMPORTANT]
> **Về giới hạn tốc độ của Xinvoice API (Rate Limiting):**
> - Khi không có API Key, Xinvoice giới hạn **10 requests / 30 giây** (khoảng ~0.33 req/s).
> - Để cập nhật cho toàn tỉnh (hàng chục nghìn MST), module sẽ áp dụng **Chiến lược lai (Hybrid Strategy)**:
>   1. **Fast-path Offline Inference:** Tự động suy luận và điền tức thời `orgType` (Doanh nghiệp, Chi nhánh, Hộ kinh doanh), `address` (từ `tran_addr`), `taxDepartment` (từ `pay_taxo_name_blhd` / `pay_taxo_name`) cho 100% bản ghi trong tỉnh với tốc độ hàng chục nghìn bản ghi/giây bằng câu lệnh SQL batch tối ưu.
>   2. **Deep-sync Online Queue:** Hàng đợi chạy nền gọi API Xinvoice với cơ chế token bucket (0.3 req/s hoặc theo cấu hình API key) để cập nhật dữ liệu chuẩn hóa mới nhất mà không vi phạm HTTP 429.

---

## Proposed Changes

Grouped by component and strictly obeying line limits (< 200 lines per file):

### 1. Database Schema & Migration Layer

#### [MODIFY] [crawler_core/storage.py](file:///c:/tracuuhoadon.gdt.gov.vn/crawler_core/storage.py)
- Thêm câu lệnh `ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS org_type TEXT;`, `address TEXT`, `tax_department TEXT`, `enriched_at TIMESTAMP;` vào hàm `_init_db()`.
- Đảm bảo file không vượt quá 200 dòng (hiện tại 196 dòng -> tách/rút gọn hàm phụ để giữ ~180 dòng).

---

### 2. TypeScript Backend: Module Enrichment (`src/modules/enrichment/`)

#### [NEW] [enrichment.types.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/enrichment/enrichment.types.ts) (~70 dòng)
- Interfaces cho Xinvoice API Response (`XinvoiceTaxPayerResponse`, `XinvoiceErrorResponse`).
- DTOs cho request/response: `EnrichmentRequestDto`, `ProvinceEnrichmentStatusDto`.

#### [NEW] [enrichment.service.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/enrichment/enrichment.service.ts) (~160 dòng)
- Hàm gọi API `fetchXinvoiceTaxPayer(tin: string)`.
- Hàm `enrichSingleRecord(tin: string)`: Gọi API, cập nhật bản ghi vào PostgreSQL.
- Hàm `enrichProvinceOffline(prefix: string)`: Chạy SQL batch suy luận siêu tốc cho toàn tỉnh.
- Worker Queue nền `startProvinceOnlineEnrichment(prefix: string)` quản lý tiến độ, dừng/hủy, và báo cáo trạng thái.

#### [NEW] [enrichment.routes.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/enrichment/enrichment.routes.ts) (~110 dòng)
- Endpoints Fastify:
  - `GET /api/enrichment/:tin`: Lấy thông tin bổ sung từ Xinvoice / DB cho 1 MST.
  - `POST /api/enrichment/offline/:provinceKey`: Kích hoạt suy luận bổ sung tức thì cho toàn tỉnh.
  - `POST /api/enrichment/province/:provinceKey/start`: Khởi động worker đồng bộ toàn tỉnh.
  - `GET /api/enrichment/province/:provinceKey/status`: Kiểm tra tiến độ đồng bộ của tỉnh.
  - `POST /api/enrichment/province/:provinceKey/stop`: Dừng đồng bộ.

#### [NEW] [index.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/enrichment/index.ts) (~15 dòng)
- Public barrel file export `enrichmentRoutes`, `enrichmentService`, và types.

#### [MODIFY] [src/app.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/app.ts) (~70 dòng)
- Đăng ký `enrichmentRoutes` vào Fastify app.

---

### 3. Frontend Integration

#### [MODIFY] [static/js/components/tax-detail-modal.js](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/tax-detail-modal.js) (~170 dòng)
- Hiển thị nhãn huy hiệu `orgType` (Doanh nghiệp, Chi nhánh, Hộ kinh doanh).
- Hiển thị trường `address` và `taxDepartment` đã chuẩn hóa.
- Thêm nút "⚡ Bổ sung thông tin" để cập nhật trực tiếp từ Xinvoice API ngay trong modal.

#### [MODIFY] [static/js/components/crawler-list.js](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/crawler-list.js) hoặc [crawler-tab.js](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/crawler-tab.js)
- Bổ sung nút thao tác "⚡ Bổ sung dữ liệu tỉnh" cho từng tỉnh để kích hoạt cập nhật cho toàn bộ tỉnh.

---

### 4. Topic Documentation & Audit Logs (Rules 5 & 6)

#### [NEW] [docs/topics/topic-03-xinvoice-api-data-enrichment.md](file:///c:/tracuuhoadon.gdt.gov.vn/docs/topics/topic-03-xinvoice-api-data-enrichment.md)
- Phân tích chi tiết kiến trúc và dữ liệu Xinvoice API.
- Chiến lược bổ sung 3 trường `orgType`, `address`, `taxDepartment`.
- Cơ chế suy luận kết hợp đồng bộ online theo toàn tỉnh.

#### [MODIFY] [docs/TOPICS.md](file:///c:/tracuuhoadon.gdt.gov.vn/docs/TOPICS.md)
- Cập nhật danh mục Topic 03.

#### [NEW] [docs/logs/06_20260920_075500_implementation_plan.md](file:///c:/tracuuhoadon.gdt.gov.vn/docs/logs/06_20260920_075500_implementation_plan.md) & [docs/logs/INDEX.md](file:///c:/tracuuhoadon.gdt.gov.vn/docs/logs/INDEX.md)
- Lưu bản sao kế hoạch và cập nhật bảng nhật ký.

---

## Verification Plan

### Automated Tests
1. `npx tsx tests/check_ts_line_limits.ts`: Đảm bảo 100% tệp TypeScript (bao gồm module `enrichment`) đều < 200 dòng.
2. `python test_modular.py`: Đảm bảo toàn bộ 27 tệp Python và components đều < 200 dòng, tất cả API cũ vẫn hoạt động 100%.
3. Viết test case tự động kiểm tra các API `/api/enrichment/:tin` và `/api/enrichment/offline/:provinceKey`.

### Manual & Visual Verification
1. Dùng curl hoặc test script gọi thử `GET /api/enrichment/4900127704` để xác thực dữ liệu trả về `orgType`, `address`, `taxDepartment`.
2. Chạy cập nhật thử nghiệm cho tỉnh Đắk Lắk (tiền tố `49`) hoặc một tiền tố khác để kiểm tra tốc độ và dữ liệu ghi vào PostgreSQL.
3. Dùng Playwright mở giao diện web `http://localhost:8123`, xem `TaxDetailModal` hiển thị thông tin bổ sung và chụp ảnh nghiệm thu.
