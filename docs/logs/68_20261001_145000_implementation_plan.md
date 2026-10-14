# Implementation Plan — Bổ Sung Cột Số Điện Thoại (`tran_tel`) Vào FilterTab & Xuất Dữ Liệu CSV/XLSX

> **Mục tiêu:**
> 1. Chỉnh sửa component `<FilterTab />` tại `static/js/components/filter-tab.js` và `<FilterTable />` tại `static/js/components/filter-table.js` để hiển thị và hỗ trợ xuất dữ liệu MST kèm cột số điện thoại (`tran_tel`).
> 2. Nâng cấp backend Fastify (`src/modules/records/records.export.ts`, `src/modules/records/records.service.ts`) và FastAPI (`server_app/routers/records.py`) để bổ sung cột `tran_tel` vào kết quả lọc và cả hai định dạng xuất file CSV & Excel XLSX.
> 3. Đảm bảo toàn bộ các tệp tuân thủ nghiêm ngặt quy chuẩn dòng code (`filter-tab.js` $\le 180$ dòng, TS/Python $\le 200$ dòng).

---

## 1. Phân Tích Hiện Trạng

- Trong bảng `tax_records`, trường `tran_tel` (Số điện thoại đăng ký thuế) có hơn **3.200.000 bản ghi** có dữ liệu số điện thoại thực tế (ví dụ: `0914448681`, `0986389999`, `0945017107`).
- Trước đây:
  - `records.export.ts`: `SELECT_SQL`, `HEADERS` và `ROW_KEYS` chỉ lấy 11 trường, bỏ sót trường `tran_tel`. Do đó cả tệp CSV và Excel XLSX tải về đều không có số điện thoại.
  - `records.service.ts` (`filterRecords`): Không truy vấn `tran_tel`, bảng kết quả `FilterTable` không hiển thị số điện thoại.
  - `filter-tab.js`: Menu xuất dữ liệu chỉ có tùy chọn gọi URL máy chủ, chưa có tùy chọn xuất nhanh client-side cho danh sách đang xem.

---

## 2. Kế Hoạch Triển Khai Chi Tiết

### Bước 1: Nâng Cấp Backend Fastify & FastAPI
1. **`src/modules/records/records.export.ts`:**
   - Thêm `'Số Điện Thoại'` vào mảng `HEADERS` (ngay sau Tên Doanh Nghiệp).
   - Thêm `'tran_tel'` vào mảng `ROW_KEYS`.
   - Bổ sung `COALESCE(t.tran_tel, '') AS tran_tel` vào `SELECT_SQL`.
   - Giữ độ dài file $\le 145$ dòng.
2. **`src/modules/records/records.service.ts`:**
   - Trong `filterRecords()`: Bổ sung `COALESCE(t.tran_tel, '') AS tran_tel` vào câu lệnh truy vấn và mảng `rows`.
   - Giữ độ dài file $\le 165$ dòng.
3. **`server_app/routers/records.py`:**
   - Trong `filter_records()`: Bổ sung `tran_tel` vào danh sách cột trả về.
   - Giữ độ dài file $\le 190$ dòng.

### Bước 2: Nâng Cấp Frontend FilterTab & FilterTable
1. **`static/js/components/filter-table.js`:**
   - Hiển thị số điện thoại `tran_tel` (`row[11]`) kèm biểu tượng `📞` nổi bật ngay dưới Tên Doanh Nghiệp, giúp giao diện gọn gàng và dễ nhìn.
   - Hỗ trợ bộ lọc tức thời nếu người dùng muốn tìm theo số điện thoại.
   - Giữ file $\le 115$ dòng.
2. **`static/js/components/filter-tab.js`:**
   - Menu xuất dữ liệu bổ sung rõ ràng:
     - `📄 Xuất CSV Toàn Bộ (kèm SĐT)`
     - `📊 Xuất Excel XLSX Toàn Bộ (kèm SĐT)`
     - `⚡ Xuất Nhanh Dòng Đang Xem (CSV kèm SĐT)`
   - Cung cấp hàm `exportCurrentCsv()` xuất trực tiếp danh sách `filterRows` trong bộ nhớ kèm cột số điện thoại `tran_tel`.
   - Giữ file $\le 170$ dòng (Hard Cap 180 dòng).

### Bước 3: Kiểm Thử & Nghiệm Thu
1. **Kiểm tra kiểu dữ liệu & giới hạn dòng:**
   - `npm run check:types`
   - `npm run check:lines`
2. **Kiểm thử tích hợp hệ thống:**
   - `npm run test:server`
   - `python test_modular.py`
3. **Kiểm tra xuất file thực tế:**
   - Gọi API `/api/export` và `/api/export-xlsx` để xác thực cột `Số Điện Thoại` (`tran_tel`) có mặt trong file và chứa số điện thoại thật.
4. **Lập biên bản nghiệm thu:**
   - Tạo `walkthrough.md`, lưu tại `docs/logs/69_20261001_150000_walkthrough.md` và cập nhật `docs/logs/INDEX.md`.
