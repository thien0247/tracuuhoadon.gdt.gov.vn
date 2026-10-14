# Kế Hoạch Triển Khai: Trang Menu Đối Soát Mã Số Doanh Nghiệp Bố Cáo ĐKKD với CSDL Thuế GDT

## Mục Tiêu
Bổ sung một trang chức năng mới trên Menu điều hướng (`BocaoReconcileTab` / "Đối Soát Bố Cáo & Thuế") cho phép đối chiếu tự động toàn bộ Mã số doanh nghiệp (`tin`) từ bảng `bocao_records` với CSDL Thuế `tax_records` (hơn 1.1 triệu bản ghi), hiển thị thống kê tỷ lệ bao phủ, phân loại đã có / chưa có trong DB thuế, và các tác vụ xem chi tiết 1-click.

---

## User Review Required
> [!NOTE]
> - Truy vấn SQL sử dụng `LEFT JOIN` giữa `bocao_records` và `tax_records` dựa trên index `tin` để đạt tốc độ truy vấn miligiây, tránh full table scan trên bảng 1.1M+ records.
> - Tách dịch vụ nghiệp vụ đối soát thành `src/modules/bocao/bocao-reconcile.service.ts` để đảm bảo tệp `bocao.service.ts` không vượt quá giới hạn 200 dòng theo quy chuẩn `GEMINI.md`.

---

## Proposed Changes

### 1. Backend Fastify TypeScript Module (`src/modules/bocao/`)

#### [MODIFY] [bocao.types.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/bocao/bocao.types.ts)
- Bổ sung interface `BocaoReconcileRecord`: chứa thông tin bố cáo kèm cờ `in_tax_records`, tên thuế, địa chỉ thuế, trạng thái thuế.
- Bổ sung interface `BocaoReconcileQuery`: `page`, `limit`, `status` (`all` | `matched` | `unmatched`), `keyword`, `province`.
- Bổ sung interface `BocaoReconcileStats`: `total_bocao`, `matched_count`, `unmatched_count`, `match_rate`.

#### [NEW] [bocao-reconcile.service.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/bocao/bocao-reconcile.service.ts)
- Lớp `BocaoReconcileService` phụ trách:
  - `getReconcileRecords(query)`: Truy vấn danh sách đối soát kèm phân trang và lọc theo trạng thái (`matched`, `unmatched`, `all`).
  - `getReconcileStats()`: Thống kê tổng số, số lượng khớp, số lượng chưa có trong DB thuế và tỷ lệ bao phủ %.

#### [MODIFY] [bocao.routes.ts](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/bocao/bocao.routes.ts)
- Bổ sung endpoint `GET /api/bocao/reconcile`: Danh sách đối soát.
- Bổ sung endpoint `GET /api/bocao/reconcile/stats`: Thống kê tổng quan tỷ lệ đối soát.

---

### 2. Frontend Client & UI Components

#### [MODIFY] [static/js/api.js](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/api.js)
- Thêm `getBocaoReconcile(params)` và `getBocaoReconcileStats()`.

#### [NEW] [static/js/components/bocao-reconcile-tab.js](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/bocao-reconcile-tab.js)
- Component Vue 3 Composition API (`< 180 dòng`):
  - **Metrics Dashboard:** 4 thẻ đo lường (Tổng số bố cáo, Đã có trong Thuế, Chưa có trong Thuế, Tỷ lệ bao phủ %).
  - **Bộ Lọc Nhanh:** Tabs lọc `Tất Cả`, `Chưa Có Trong Thuế` (màu cam nổi bật), `Đã Có Trong Thuế` (màu xanh ngọc), ô tìm kiếm và lọc tỉnh.
  - **Bảng Đối Soát Chi Tiết:**
    - Cột MST & Badge trạng thái (`✅ Trong Thuế` / `⚠️ Chưa Có`).
    - Cột Bố Cáo: Tên doanh nghiệp, Loại bố cáo, Ngày công bố, Tỉnh thành.
    - Cột CSDL Thuế: Tên doanh nghiệp trong DB, Trạng thái hoạt động, Cơ quan thuế.
    - Cột Tác vụ: `👁️ GDT` (mở TaxDetailModal), `🔍 DKKD` (mở BocaoSolrModal).
  - Tích hợp `<ai-component-badge name="BocaoReconcileTab">` có icon `?`.

#### [MODIFY] [static/js/app.js](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/app.js)
- Đăng ký component `'bocao-reconcile-tab': window.BocaoReconcileTab`.

#### [MODIFY] [templates/index.html](file:///c:/tracuuhoadon.gdt.gov.vn/templates/index.html)
- Bổ sung mục Menu bên Sidebar: `⚖️ Đối Soát Bố Cáo & Thuế`.
- Thêm container render tab `<bocao-reconcile-tab v-show="activeTab === 'bocao_reconcile'"></bocao-reconcile-tab>` bọc trong `<ai-component-badge>`.
- Khai báo script tag `static/js/components/bocao-reconcile-tab.js`.

---

## Verification Plan

### Automated Tests
1. **Kiểm tra dòng code (Line Limits):** Chạy kiểm tra tất cả các tệp sửa đổi và mới (`<= 180` dòng cho Vue, `<= 200` dòng cho TS/Python, `<= 220` dòng cho HTML).
2. **TypeScript Compilation:** Chạy `npx tsc --noEmit` đảm bảo 0 lỗi.
3. **API HTTP Check:** Gửi request kiểm tra `GET /api/bocao/reconcile` và `GET /api/bocao/reconcile/stats`.

### Manual & Visual Verification
1. Dùng Playwright điều hướng đến `http://localhost:8123`.
2. Bấm vào mục menu mới `⚖️ Đối Soát Bố Cáo & Thuế`.
3. Kiểm tra các thẻ metrics hiển thị đúng tỷ lệ % khớp.
4. Lọc tab `Chưa Có Trong Thuế` và kiểm tra bảng dữ liệu.
5. Chụp ảnh màn hình làm minh chứng nghiệm thu (`walkthrough.md`).
