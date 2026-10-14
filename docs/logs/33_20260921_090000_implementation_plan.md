# Kế Hoạch Triển Khai: Nâng Cấp FilterTab (Multi-Select Filter & Xuất Excel XLSX)

> **Mục tiêu:** Nâng cấp component `FilterTab` tại `static/js/components/filter-tab.js` để hỗ trợ chọn nhiều giá trị (multi-select) cho 3 bộ lọc: Tỉnh/Thành phố, Xã Mới (HTKK V2), Cơ quan thuế / Thuế cơ sở, và thêm tính năng xuất dữ liệu ra file Excel (.xlsx) bên cạnh định dạng CSV hiện tại.

---

## 1. Bối Cảnh & Bài Toán Kỹ Thuật

1. **Hạn chế cũ:**
   - Bộ lọc `FilterTab` chỉ sử dụng `SearchableCombobox` đơn tuyển (single-select), mỗi lần lọc người dùng chỉ chọn được 1 tỉnh, 1 xã hoặc 1 cơ quan thuế.
   - Khi cần phân tích dữ liệu cho nhiều địa bàn lân cận, người dùng phải lọc và xuất thủ công từng tỉnh/xã nhiều lần.
   - Chỉ có tùy chọn xuất CSV, thiếu định dạng bảng tính Excel (.xlsx) với định dạng cột chuẩn.

2. **Giải pháp kỹ thuật:**
   - Xây dựng component mới `MultiSelectCombobox` (`static/js/components/multi-select-combobox.js`) hỗ trợ checkbox đa tuyển, tag badges, tìm kiếm nhanh và chọn/bỏ tất cả.
   - Backend Fastify: mở rộng `buildFilterWhere` hỗ trợ mảng giá trị qua toán tử PostgreSQL `ANY($N::text[])`.
   - Tách riêng module `records.export.ts` phụ trách xuất CSV và XLSX (dùng `exceljs` đã có sẵn), giữ `records.service.ts` dưới ngưỡng 200 dòng theo `GEMINI.md`.
   - Thêm REST API endpoint `GET /api/export-xlsx`.

---

## 2. Danh Sách Tệp Thay Đổi

### Frontend
- **[MỚI]** `static/js/components/multi-select-combobox.js`: Component checkbox multi-select với search, tags, select/deselect all (< 180 dòng).
- **[SỬA]** `static/js/components/filter-tab.js`: Chuyển sang dùng `multi-select-combobox`, bổ sung menu dropdown Xuất CSV / Xuất XLSX.
- **[SỬA]** `static/js/api.js`: Nâng cấp hàm serialize tham số mảng, bổ sung `getExportXlsxUrl()`.
- **[SỬA]** `templates/index.html`: Khai báo thẻ `<script>` nạp `multi-select-combobox.js` trước `filter-tab.js`.

### Backend TypeScript
- **[MỚI]** `src/modules/records/records.export.ts`: Xử lý tạo CSV với UTF-8 BOM và workbook XLSX (ExcelJS) định dạng tiêu đề, tự động co giãn độ rộng cột.
- **[SỬA]** `src/modules/records/records.types.ts`: Cập nhật `FilterRequestDto` chấp nhận `string | string[]`, bổ sung `ExportXlsxResponse`.
- **[SỬA]** `src/modules/records/records.service.ts`: Nâng cấp `buildFilterWhere` hỗ trợ `LIKE ANY()`, loại bỏ hàm exportCsvData chuyển giao cho `records.export.ts`.
- **[SỬA]** `src/modules/records/records.routes.ts`: Bổ sung endpoint `GET /api/export-xlsx`, xử lý query params dạng mảng.
- **[SỬA]** `src/modules/records/index.ts`: Export các hàm từ `records.export.ts`.

---

## 3. Kế Hoạch Kiểm Thử & Nghiệm Thu
1. `npx tsc --noEmit`: Kiểm tra 0 lỗi biên dịch TypeScript.
2. Kiểm tra số dòng code: Toàn bộ file frontend/backend phải <= 200 dòng (hard cap).
3. Kiểm thử lọc đa tỉnh, đa xã, đa cơ quan thuế trên UI.
4. Kiểm thử tải về và mở file Excel (.xlsx) hợp lệ.
