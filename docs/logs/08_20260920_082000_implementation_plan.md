# Kế Hoạch Triển Khai: Menu Thống Kê & Đồng Bộ Dữ Liệu Thuế Bổ Sung (Enrichment Tab)

---

## 📝 Bản Viết Lại Yêu Cầu (Rewritten Prompt)

> **Mục tiêu:** Xây dựng phân hệ giao diện và các dịch vụ backend chuyên trách về **Thống Kê Dữ Liệu Bổ Sung (Enrichment Analytics)** và **Đồng Bộ Dữ Liệu (Sync Enrichment)** cho toàn bộ 62 tỉnh thành, tích hợp vào menu chính của hệ thống GDT Tax Crawler.
>
> **Yêu cầu chi tiết:**
> 1. **Mở rộng Menu Điều Hướng (Sidebar Navigation):**
>    - Thêm mục menu mới: **"✨ Thống Kê & Sync Enrichment"** (icon: `✨` hoặc `🔄`, tab ID: `'enrichment'`).
>    - Tích hợp chuẩn nhận diện VDDS (tương thích cả chế độ mở rộng 240px lẫn thu gọn 64px, đồng bộ Dark/Light Mode).
> 2. **Chức năng Thống Kê Enrichment (Enrichment Metrics & Table):**
>    - **4 thẻ chỉ số tổng quan toàn quốc:**
>      - Tổng số bản ghi trong CSDL (`total_db_records`).
>      - Tổng số bản ghi đã làm giàu `orgType`, `address`, `taxDepartment` (`enriched_count`).
>      - Tổng số bản ghi còn thiếu (`pending_count`).
>      - Tỷ lệ hoàn thành toàn quốc (`completion_rate %`).
>    - **Bảng dữ liệu 62 tỉnh thành:**
>      - Cột: Tên Tỉnh Thành, Tiền Tố, Tổng Số Bản Ghi, Đã Làm Giàu, Còn Thiếu, Tỷ Lệ Hoàn Thành (Thanh Progress Bar), Trạng Thái Sync, Nút Thao Tác.
>      - Bộ lọc: Tìm kiếm tỉnh, lọc theo mức độ hoàn thành (Đã hoàn thành 100%, Chưa hoàn thành < 100%).
> 3. **Chức năng Đồng Bộ Dữ Liệu (Sync Enrichment Controls):**
>    - **Đồng bộ siêu tốc Offline (Fast-Path Batch):** Nút *"⚡ Sync Offline Toàn Bộ 62 Tỉnh"* và nút *"⚡ Sync Tỉnh"* từng dòng (tốc độ > 50.000 bản ghi/giây).
>    - **Đồng bộ trực tuyến Online (Deep-Sync Queue Xinvoice):** Nút *"🔄 Bắt đầu Sync Online"* và *"⏹ Dừng"* điều tiết nhịp độ tránh vi phạm Rate Limit của API Xinvoice.
> 4. **Tuân thủ quy chuẩn mã nguồn:**
>    - Tạo component độc lập: `static/js/components/enrichment-tab.js` (≤ 180 dòng).
>    - Nâng cấp `enrichment.service.ts` & `enrichment.routes.ts` (≤ 180 dòng).
>    - Giữ vững 100% các bài test: `check_ts_line_limits.ts` và `test_modular.py`.

---

## User Review Required

> [!IMPORTANT]
> **Về việc truy vấn thống kê 62 tỉnh thành trên CSDL 1.2M+ bản ghi:**
> Để đảm bảo thời gian phản hồi của trang Thống kê dưới **100ms** (không làm đơ UI):
> - Sử dụng câu lệnh `GROUP BY SUBSTRING(tin FROM 1 FOR 2)` kết hợp hàm tổng hợp có điều kiện `COUNT(*) FILTER (WHERE org_type IS NOT NULL)` trong PostgreSQL.
> - Có cơ chế In-Memory Cache 30 giây trong `EnrichmentService` để tải nhanh và tự động làm mới khi có lệnh sync.

---

## Proposed Changes

### 1. Backend: Module `src/modules/enrichment/`

#### [MODIFY] [enrichment.types.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/enrichment/enrichment.types.ts) (~75 dòng)
- Thêm `ProvinceEnrichmentSummaryDto`:
  - `provinceName`: string, `prefix`: string, `total`: number, `enriched`: number, `pending`: number, `rate`: number, `isRunning`: boolean.
- Thêm `NationalEnrichmentSummaryResponse`:
  - `summary`: { total: number, enriched: number, pending: number, rate: number }, `provinces`: ProvinceEnrichmentSummaryDto[].

#### [MODIFY] [enrichment.service.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/enrichment/enrichment.service.ts) (~170 dòng)
- Thêm `getNationalSummary(): Promise<NationalEnrichmentSummaryResponse>`: Truy vấn thống kê toàn quốc và 62 tỉnh gộp trong 1 query PostgreSQL tối ưu.
- Thêm `enrichAllProvincesOffline(): Promise<{ totalUpdated: number, elapsedMs: number }>`: Chạy cập nhật offline cho tất cả các tỉnh chưa làm giàu.

#### [MODIFY] [enrichment.routes.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/enrichment/enrichment.routes.ts) (~120 dòng)
- Thêm endpoint `GET /api/enrichment/summary`: Trả về báo cáo thống kê toàn quốc và chi tiết 62 tỉnh.
- Thêm endpoint `POST /api/enrichment/sync-all-offline`: Kích hoạt sync offline cho toàn bộ 62 tỉnh.

---

### 2. Frontend Components & UI

#### [NEW] [static/js/components/enrichment-tab.js](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/enrichment-tab.js) (~175 dòng)
- Component Vue 3 độc lập chứa:
  - 4 Thẻ KPI Metrics (Tổng DB, Đã làm giàu, Còn thiếu, Tỷ lệ %).
  - Thanh công cụ hành động: *"⚡ Sync Offline Toàn Bộ"*, *"🔄 Làm mới"*, ô tìm kiếm tỉnh, lọc trạng thái.
  - Bảng số liệu chuẩn VDDS hiển thị 62 tỉnh, thanh progress bar tỷ lệ hoàn thiện, và nút sync từng tỉnh.

#### [MODIFY] [templates/index.html](file:///c:/tracuuhoadon.gdt.gov.vn/templates/index.html) (~195 dòng)
- Thêm mục menu Sidebar: `{ id: 'enrichment', icon: '✨', name: 'Thống Kê & Sync Dữ Liệu' }`.
- Khai báo component `<enrichment-tab>` bọc trong `<ai-component-badge>`.
- Nạp script `/static/js/components/enrichment-tab.js`.

#### [MODIFY] [static/js/app.js](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/app.js) (~185 dòng)
- Đăng ký component `'enrichment-tab': window.EnrichmentTab`.

#### [MODIFY] [static/js/api.js](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/api.js) (~175 dòng)
- Thêm `getEnrichmentSummary()` và `syncAllProvincesOffline()`.

---

## Verification Plan

### Automated Tests
1. `npx tsx tests/check_ts_line_limits.ts`: 100% tệp TypeScript < 200 dòng.
2. `python -c "from test_modular import check_line_counts; check_line_counts()"`: 100% tệp Python & Frontend < 200 dòng.
3. Test API:
   - `GET /api/enrichment/summary` -> Status 200, trả về đủ 62 tỉnh và tổng quan.
   - `POST /api/enrichment/sync-all-offline` -> Status 200, phản hồi số bản ghi đã cập nhật.

### Visual Verification (Playwright)
1. Dùng Playwright mở tab mới `✨ Thống Kê & Sync Dữ Liệu`.
2. Kiểm tra hiển thị 4 thẻ KPI, thanh tiến độ % của từng tỉnh, kiểm tra nút bấm Sync Offline.
3. Chụp ảnh màn hình nghiệm thu ở cả giao diện Sáng và Tối (Light & Dark Mode).
