# Kế Hoạch: Bổ Sung Ô Tìm Kiếm Trong Combobox & Bộ Lọc Header Cho `<FilterTab />`

## 1. Mục Tiêu Triển Khai
Đáp ứng yêu cầu nâng cấp component `<FilterTab />`:
1. **Bổ sung ô tìm kiếm trong các combobox:**
   - 3 combobox gồm: (1) Tỉnh / Thành phố, (2) Xã mới (HTKK V2), (3) Cơ quan thuế / Thuế cơ sở.
   - Cho phép gõ tìm kiếm nhanh trực tiếp (type-to-filter / fuzzy search), chọn nhanh tùy chọn "Tất cả" hoặc giá trị cụ thể, hỗ trợ bàn phím và đóng dropdown khi click ra ngoài.
   - Để tuân thủ nghiêm ngặt quy chuẩn giới hạn dòng code (< 180 dòng / Vue component) theo `GEMINI.md`, chúng tôi sẽ tách thành component tái sử dụng độc lập `<SearchableCombobox />` tại `static/js/components/searchable-combobox.js` (khoảng 90-110 dòng).
2. **Bổ sung bộ lọc ngay trên Header các cột của bảng kết quả:**
   - Bảng kết quả lọc (tối đa 500 dòng) sẽ có hàng ô nhập lọc ngay dưới tiêu đề các cột:
     - **Mã số thuế:** Lọc theo ký tự số MST.
     - **Tên Doanh Nghiệp:** Lọc theo tên công ty.
     - **Mô Hình 3 Cấp (V3):** Lọc theo Huyện / Tỉnh V3.
     - **Mô Hình 2 Cấp (V2):** Lọc theo Xã mới / Thuế cơ sở V2.
     - **Ngày Cấp:** Lọc theo chuỗi ngày cấp.
     - **Trạng Thái:** Lọc theo trạng thái hoạt động / ngừng hoạt động.
     - **Địa Chỉ:** Lọc theo địa chỉ trụ sở.
   - Lọc thời gian thực (client-side computed reactive) siêu tốc, có hiển thị số lượng bản ghi sau lọc trên bảng (VD: "Hiển thị 12 / 500 dòng").

---

## 2. Thiết Kế Chi Tiết & Phân Rã Module

### 2.1. Component Mới: `<SearchableCombobox />` (`static/js/components/searchable-combobox.js`)
- **Props:**
  - `modelValue`: Giá trị đang chọn (`string`).
  - `options`: Mảng các đối tượng `{ code, name }` hoặc danh sách string.
  - `placeholder`: Chuỗi gợi ý.
  - `allLabel`: Nhãn cho tùy chọn tất cả (VD: `-- Tất cả Tỉnh / Thành phố --`).
  - `disabled`: Trạng thái disable khi đang tải.
  - `loading`: Trạng thái đang tải dữ liệu.
- **Tính năng:**
  - Hiển thị giá trị đang chọn; click vào mở dropdown tìm kiếm.
  - Ô input tìm kiếm tự động focus với debounce / lọc tức thì theo tên không phân biệt hoa thường và không dấu.
  - Click ngoài (`clickoutside`) tự động đóng dropdown.
  - Kích thước code dự kiến: ~100 dòng (đáp ứng trọn vẹn < 180 dòng).

### 2.2. Đăng ký trong `templates/index.html`
- Thêm `<script src="/static/js/components/searchable-combobox.js?v=3.5"></script>` trước `filter-tab.js`.

### 2.3. Tái cấu trúc & Nâng cấp `<FilterTab />` (`static/js/components/filter-tab.js`)
- Tích hợp 3 thẻ `<searchable-combobox>` thay thế cho các thẻ `<select>` nguyên thủy:
  1. Combobox Tỉnh/Thành phố.
  2. Combobox Xã mới HTKK V2.
  3. Combobox Cơ quan thuế / Thuế cơ sở.
- Thêm đối tượng reactive `headerFilters`:
  ```javascript
  const headerFilters = ref({
      tin: '', name: '', v3: '', v2: '', regiDate: '', status: '', addr: ''
  });
  ```
- Thêm computed `filteredDisplayRows` thực hiện lọc tức thì trên mảng `filterRows.value`.
- Render hàng input filter trên `thead` của bảng kết quả.
- Giữ vững độ dài file `filter-tab.js` dưới **180 dòng** (dự kiến ~160-170 dòng).

---

## 3. Kế Hoạch Kiểm Thử & Nghiệm Thu

1. **Kiểm tra giới hạn dòng code (GEMINI.md Hard Cap):**
   - Chạy script kiểm tra dòng code:
     - `searchable-combobox.js` <= 180 dòng.
     - `filter-tab.js` <= 180 dòng.
     - `tests/check_ts_line_limits.ts` đạt 32/32 PASS (< 200 dòng).
2. **Kiểm tra chức năng giao diện:**
   - Thử gõ tìm kiếm trong Combobox Tỉnh (VD: gõ "Hà", "Hồ Chí Minh").
   - Thử gõ tìm kiếm trong Combobox Xã Mới (VD: gõ "Dịch Vọng", "Bến Nghé").
   - Thử gõ tìm kiếm trong Combobox Cơ quan thuế.
   - Thử nhập từ khóa vào ô lọc Header bảng (VD: lọc MST, lọc Tên DN) và kiểm tra danh sách phản hồi tức thì.
   - Kiểm tra nút "Xuất CSV" và "Đặt lại" vẫn hoạt động mượt mà.
3. **Tuân thủ Rule 6 (Audit Logs):**
   - Lưu trữ bản sao kế hoạch vào `docs/logs/20_20260920_120500_implementation_plan.md`.
   - Cập nhật `docs/logs/INDEX.md`.
