# KẾ HOẠCH TRIỂN KHAI (IMPLEMENTATION PLAN)
## TỐI ƯU KHOẢNG GAP, TÍNH NĂNG RESIZE CỘT & LƯU CACHE TRÌNH DUYỆT (GOOGLE SHEETS MATRIX TABLES)

- **Thời gian lập kế hoạch:** 2026-10-14 17:48:00
- **Trạng thái:** 📋 SẴN SÀNG THỰC THI
- **Mã kế hoạch liên kết:** `112_20261014_174800_implementation_plan.md`
- **Mã ULID:** `01M4V8B5K3HZZ1286VCPTY99P1`
- **Người lập kế hoạch:** Antigravity AI Assistant

---

### 1. Yêu Cầu Người Dùng & Mục Tiêu Triển Khai
Người dùng yêu cầu: *"tối ưu thêm khoản gap, các table có thể resize và lưu vào cache trình duyệt được không"*.

**Mục tiêu chi tiết:**
1. **Tối ưu hóa khoảng cách (Gap & Spacing Optimization):**
   - Thu hẹp các khoảng cách thừa (`space-y`, padding thẻ card, padding ô `td/th`) để đạt độ đặc ma trận cao (high-density matrix layout), mang lại cảm giác liền mạch, tinh gọn chuẩn Google Sheets.
2. **Kéo giãn kích thước cột (Column Resizing):**
   - Cho phép người dùng rê chuột vào đường biên giữa 2 cột tiêu đề (`col-resize` cursor) và kéo rê chuột để thay đổi chiều rộng cột linh hoạt.
   - Hiển thị thanh dẫn hướng resize (`resize handle`) màu xanh/tím nổi bật khi đang kéo.
   - Thiết lập chiều rộng tối thiểu (`minSize`) và tối đa (`maxSize`) để tránh vỡ bố cục bảng.
3. **Lưu trữ vào bộ nhớ cục bộ trình duyệt (LocalStorage Caching):**
   - Tự động ghi nhớ kích thước từng cột của người dùng vào `localStorage` theo từng bảng riêng biệt (`gdt_search_table_col_widths`, `gdt_filter_table_col_widths`).
   - Khi tải lại trang hoặc mở lại trình duyệt, bảng tự động phục hồi đúng kích thước các cột mà người dùng đã tùy chỉnh.
   - Cung cấp nút khôi phục kích thước mặc định (Reset Col Widths).
4. **Tuân thủ quy chuẩn mã nguồn (`GEMINI.md`):**
   - Tách logic resize & cache thành Composable tái sử dụng `useTableResize.ts` ($\le 60$ dòng).
   - Mỗi file Vue Component không vượt quá 180 dòng (mục tiêu 120-160 dòng).
   - Đảm bảo 100% Type-Safe (không `any`), vượt qua `vue-tsc` và `test_modular.py`.

---

### 2. Kiến Trúc Thiết Kế & Module

#### 2.1. Composable Quản Lý Resize & Cache (`frontend/src/composables/useTableResize.ts`)
- Quản lý `columnSizing` dạng reactive object `{ [colId: string]: number }`.
- Đọc dữ liệu từ `localStorage` khi khởi tạo.
- Tự động đồng bộ vào `localStorage` mỗi khi người dùng kéo thả cột.
- Hàm `resetSizing()` để khôi phục về kích thước mặc định.

#### 2.2. Nâng Cấp Bảng Tra Cứu (`SearchTable.vue`)
- Tích hợp tính năng native column resizing của TanStack Table v8:
  * `enableColumnResizing: true`
  * `columnResizeMode: 'onChange'`
  * Kết nối `columnSizing` với `useTableResize('gdt_search_col_widths', defaultSearchColSizes)`
- Header render thẻ `<div class="resize-handle" @mousedown="header.getResizeHandler()($event)" />`.
- Đặt `table-layout: fixed` và gán width động cho từng cột theo `header.getSize()`.

#### 2.3. Nâng Cấp Bảng Lọc Đa Cấp (`FilterTable.vue`)
- Tích hợp tính năng column resizing tương tự chuẩn ma trận Google Sheets kết nối với `useTableResize('gdt_filter_col_widths', defaultFilterColSizes)`.
- Gán width động và handle kéo rê mượt mà trên header.

#### 2.4. Tinh Gọn Khoảng Trống (Gap & Padding)
- Giảm padding của container chính từ `space-y-5` xuống `space-y-3`.
- Giảm padding form tìm kiếm từ `p-5` xuống `p-3.5`.
- Padding ô dữ liệu `td` đạt chuẩn Google Sheets Compact: `px-2 py-1` (chiều cao hàng chuẩn 28px).

---

### 3. Kế Hoạch Các Bước Thực Hiện (Execution Steps)

1. **Bước 1: Tạo `frontend/src/composables/useTableResize.ts`:**
   - Xây dựng composable quản lý state `columnSizing`, lưu và khôi phục từ `localStorage`.
2. **Bước 2: Cập nhật `SearchTable.vue`:**
   - Kích hoạt `enableColumnResizing: true` và `columnResizeMode: 'onChange'`.
   - Thêm resize handle vào từng ô header.
   - Thêm nút reset kích thước cột trên toolbar.
   - Tối ưu padding và gap.
3. **Bước 3: Cập nhật `FilterTable.vue`:**
   - Tích hợp resize cho các cột của bảng lọc đa cấp.
   - Thêm resize handle và kết nối `useTableResize`.
   - Tối ưu padding và gap.
4. **Bước 4: Tối ưu gap tổng thể trong `SearchTab.vue` và `FilterTab.vue`:**
   - Tinh gọn form lọc và khoảng cách giữa các khối.
5. **Bước 5: Kiểm tra TypeScript & Biên dịch:**
   - Chạy `vue-tsc --noEmit` và `vite build`.
   - Chạy `python test_modular.py` kiểm tra giới hạn dòng code và API.
   - Khởi động lại service và nghiệm thu.

---

### 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] Người dùng có thể rê chuột vào mép cột tiêu đề và kéo giãn chiều rộng cột mượt mà.
- [x] Kích thước cột sau khi kéo được lưu tự động vào `localStorage`.
- [x] F5 tải lại trang, kích thước các cột vừa chỉnh vẫn được giữ nguyên vẹn.
- [x] Khoảng cách gap và padding được tối ưu tinh gọn, không còn khoảng trống thừa.
- [x] Toàn bộ code $\le 180$ dòng, 0 lỗi TypeScript, 0 lỗi `test_modular.py`.
