# Kế Hoạch Nâng Cấp Component FilterTab: Lọc Theo Tỉnh, Xã Mới & Cơ Quan Thuế

## 1. Tổng Quan & Mục Tiêu

Theo yêu cầu người dùng đối với component `<FilterTab />` (`static/js/components/filter-tab.js`):
- Nâng cấp bộ lọc đa tiêu chí tại tab **Lọc & Xuất Dữ Liệu MST**:
  1. **Lọc theo Tỉnh/Thành phố:** Tự động nạp danh sách 62 tỉnh thành, kích hoạt nạp danh mục cấp dưới tương ứng.
  2. **Lọc theo Xã Mới (Mô hình 2 cấp HTKK):** Tự động liên kết danh mục xã mới sau sắp xếp bãi bỏ cấp huyện (`htkk_communes_v2`), hỗ trợ lọc chính xác địa chỉ theo địa bàn xã mới.
  3. **Lọc theo Cơ Quan Thuế / Mạng lưới Thuế Cơ Sở:** Cho phép chọn cơ quan quản lý thuế / Thuế cơ sở phụ trách địa bàn.
  4. **Lọc theo Ngày đăng ký:** Giữ nguyên tính năng lọc khoảng ngày (`from_date`, `to_date`).
  5. **Đồng bộ Xuất CSV:** Cập nhật API `GET /api/export` để trích xuất file CSV tuân thủ chính xác tất cả tiêu chí đang lọc (Tỉnh, Xã mới, Cơ quan thuế, Ngày).
- Đảm bảo tuân thủ nghiêm ngặt chuẩn code `GEMINI.md`:
  - `filter-tab.js` < 180 dòng (target 140–175 dòng).
  - `records.service.ts` < 200 dòng.
  - Strict type safety, connection pool và audit log Rule 6.

---

## 2. Thiết Kế Luồng Dữ Liệu & Giao Diện (Architecture & Data Flow)

```mermaid
flowchart TD
    UI[FilterTab Component: static/js/components/filter-tab.js] --> |Chọn Tỉnh filterProvKey| API_OPT[GET /api/records/filter-options?province_key=...]
    API_OPT --> DB_HTKK[DB: htkk_provinces_v2, htkk_communes_v2, htkk_tax_offices]
    DB_HTKK --> API_OPT
    API_OPT --> |Trả về { communes, taxOffices }| UI

    UI --> |Bấm 'Lọc Dữ Liệu'| API_FILTER[POST /api/filter]
    API_FILTER --> |Query tax_records WHERE tin LIKE $1 AND tran_addr ILIKE $commune AND pay_taxo ILIKE $cqt| DB_TAX[DB: tax_records]
    DB_TAX --> API_FILTER
    API_FILTER --> UI

    UI --> |Bấm 'Xuất CSV'| API_EXPORT[GET /api/export?province_key=...&commune_name=...&tax_office_name=...]
    API_EXPORT --> CSV[Tải file CSV theo đúng bộ lọc]
```

---

## 3. Chi Tiết Các Tệp Tin Sẽ Thay Đổi

### 3.1. Backend Module Records
#### [MODIFY] [records.types.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/records/records.types.ts)
- Bổ sung `commune_name?: string | null` và `tax_office_name?: string | null` vào `FilterRequestDto`.
- Bổ sung interface `FilterOptionsResponse`: `{ communes: { code: string; name: string }[]; taxOffices: { code: string; name: string }[] }`.

#### [MODIFY] [records.service.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/records/records.service.ts)
- Hàm `filterRecords(dto)`: Thêm điều kiện lọc theo `dto.commune_name` (`tran_addr ILIKE '%' || $commune || '%'`) và `dto.tax_office_name` (`pay_taxo_name ILIKE '%' || $cqt || '%' OR pay_taxo_id = $cqt`).
- Hàm `exportCsvData(...)`: Thêm tham số `communeName` và `taxOfficeName` đồng bộ.
- Bổ sung hàm `getFilterOptions(provinceKey)`: Lấy danh sách Xã mới V2 và Cơ quan thuế thuộc tỉnh đó.

#### [MODIFY] [records.routes.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/records/records.routes.ts)
- Endpoint `GET /api/records/filter-options`: Trả về danh sách xã mới và cơ quan thuế theo `province_key`.
- Cập nhật `GET /api/export`: Nhận thêm query params `commune_name` và `tax_office_name`.

### 3.2. Frontend Client & Components
#### [MODIFY] [api.js](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/api.js)
- Thêm `ApiClient.getFilterOptions(provinceKey)`.
- Cập nhật `ApiClient.getExportUrl(provKey, fromDate, toDate, communeName, taxOfficeName)`.

#### [MODIFY] [filter-tab.js](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/filter-tab.js)
- Thêm state: `filterCommune`, `filterTaxOffice`, `communesList`, `taxOfficesList`, `loadingOptions`.
- Watcher / onChange khi đổi Tỉnh: Gọi `loadFilterOptions(provKey)` để load danh sách Xã Mới và Cơ quan thuế tương ứng.
- Bố cục giao diện lọc 2 hàng tinh gọn, hiện đại với Tailwind CSS:
  - Hàng 1: Dropdown Tỉnh Thành | Dropdown Xã Mới V2 | Dropdown Cơ Quan Thuế / Thuế Cơ Sở.
  - Hàng 2: Từ ngày | Đến ngày | Nút Lọc Dữ Liệu | Nút Tất Cả Ngày | Nút Xuất CSV.
- Giữ tổng số dòng code của component dưới 175 dòng (< 180 dòng chuẩn `GEMINI.md`).

### 3.3. Nhật Ký Audit Log
#### [NEW] [16_20260920_103000_implementation_plan.md](file:///c:/tracuuhoadon.gdt.gov.vn/docs/logs/16_20260920_103000_implementation_plan.md)
#### [MODIFY] [INDEX.md](file:///c:/tracuuhoadon.gdt.gov.vn/docs/logs/INDEX.md)

---

## 4. Kế Hoạch Kiểm Thử & Nghiệm Thu (Verification Plan)

### 4.1. Kiểm thử Tự động
1. **Kiểm tra giới hạn dòng code:**
   - `npx tsx tests/check_ts_line_limits.ts` (Tất cả file TS < 200 dòng).
   - `python -c "from test_modular import check_line_counts; check_line_counts()"` (`filter-tab.js` < 180 dòng).
2. **Kiểm tra biên dịch:** `npx tsc --noEmit` (0 lỗi, strict types).
3. **Kiểm thử API:**
   - `GET /api/records/filter-options?province_key=Hà%20Nội%20(01)` $\rightarrow$ trả về danh sách Xã mới V2 và CQT Hà Nội.
   - `POST /api/filter` với `{ province_key, commune_name: 'Cầu Giấy', tax_office_name: 'Cục Thuế' }` $\rightarrow$ trả về kết quả chính xác.
   - `GET /api/export` với các params mới $\rightarrow$ xuất CSV chuẩn dữ liệu.

### 4.2. Kiểm thử Giao diện
- Truy cập Dashboard web, mở Tab **Lọc & Xuất Dữ Liệu MST**.
- Thử nghiệm đổi Tỉnh $\rightarrow$ kiểm tra 2 dropdown Xã mới và Cơ quan thuế cập nhật tự động.
- Chọn 1 xã mới hoặc 1 cơ quan thuế $\rightarrow$ bấm **Lọc Dữ Liệu** $\rightarrow$ kiểm tra bảng kết quả.
- Bấm **Xuất CSV** $\rightarrow$ kiểm tra file CSV tải về có đúng số lượng bản ghi đã lọc.
