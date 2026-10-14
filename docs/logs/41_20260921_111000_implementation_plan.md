# Kế Hoạch Sửa Lỗi Lọc Doanh Nghiệp Theo Tỉnh Đắk Lắk & Xã Mới (HTKK V2)

Phân tích nguyên nhân và giải pháp triệt để cho vấn đề khi người dùng chọn:
- **1. Tỉnh / Thành phố:** `Đắk Lắk` (hoặc `Đắk Lắk (60)`)
- **2. Xã Mới (HTKK V2):** `Xã Krông Năng`, `Xã Tam Giang`, `Xã Phú Xuân`, `Xã Dliê Ya`
nhưng hệ thống trả về 0 kết quả (`không cho ra kết quả`).

---

## 1. Phân Tích Nguyên Nhân Gốc Rễ (Root Cause Analysis)

Qua truy vấn trực tiếp CSDL PostgreSQL (`taxdb` cổng 5433) và rà soát luồng dữ liệu frontend / backend:

### 1.1. Nguyên nhân 1: Ngày lọc mặc định là "Hôm nay" (`today`)
- Trong `static/js/components/filter-tab.js` (dòng 14–15):
  ```javascript
  const today = new Date().toISOString().split('T')[0];
  const filterFromDate = ref(today), filterToDate = ref(today);
  ```
- Khi người dùng vừa chọn Tỉnh và Xã mới, sự kiện `@change="onFilter"` lập tức gửi request:
  `{ province_key: ['Đắk Lắk (60)'], commune_name: [...], from_date: '2026-09-21', to_date: '2026-09-21' }`.
- Trong CSDL, dữ liệu Đắk Lắk (đầu mã `60`) mới nhất là ngày `2026-09-19` (ngày 20, 21 không có DN mới được cấp hoặc là ngày nghỉ).
- Do đó, việc lọc giới hạn trong "hôm nay" khiến kết quả trả về luôn bằng **0**.

### 1.2. Nguyên nhân 2: Khớp tên xã kèm/không kèm tiền tố `"Xã"`
- Trường `v2_commune_name` đối với mã tỉnh 60 hiện chưa được phân tách hoàn toàn (NULL trong CSDL), do đó hệ thống tự động fallback sang tìm kiếm địa chỉ: `t.tran_addr ILIKE ANY(...)`.
- Tên xã hiển thị từ danh mục HTKK V2 là `Xã Krông Năng`, `Xã Tam Giang`, `Xã Phú Xuân`, `Xã Dliê Ya`.
- Nhiều doanh nghiệp trong thực tế khai báo địa chỉ là: `"TDP 2, Thị trấn Krông Năng"`, `"Thôn 3, Tam Giang"`, `"Phú Xuân, Krông Năng"`.
- Nếu chỉ tìm `%Xã Krông Năng%`, chỉ khớp được **3.611** bản ghi.
- Nếu bóc tách bỏ tiền tố `"Xã "`, `"Thị trấn "`, `"Phường "` để tìm đồng thời cả `%Xã Krông Năng%` và `%Krông Năng%`, số lượng bản ghi tìm thấy tăng lên **4.239** bản ghi (+628 DN được tìm thấy chính xác).

### 1.3. Nguyên nhân 3: File `records.export.ts` thiếu fallback `tran_addr`
- Trong `records.export.ts`, câu lệnh `buildExportWhere` chỉ kiểm tra `t.v2_commune_name ILIKE ANY(...)` mà không kiểm tra `t.tran_addr ILIKE ANY(...)`.
- Điều này khiến khi người dùng xuất Excel/CSV theo xã mới ở các tỉnh chưa điền `v2_commune_name` (như Đắk Lắk), kết quả file xuất ra sẽ bị trắng (0 dòng).

### 1.4. Lưu ý về component `<BocaoTab />` vs `<FilterTab />`
- Người dùng đặt tiêu đề là `<BocaoTab />` (có thể do copy mẫu từ câu hỏi trước), nhưng mô tả chi tiết:
  `1. Tỉnh / Thành phố: Đắk Lắk và cùng lúc chọn 2. Xã Mới (HTKK V2): Xã Krông Năng, Xã Tam Giang...`
  đây chính xác là các ô lọc đa chọn trong `<FilterTab />` (`filter-tab.js`).
- Bản thân bảng `bocao_records` của Bố Cáo chỉ chứa cấp `province_name`, không có địa chỉ chi tiết theo xã. Chúng tôi sẽ giải quyết triệt để tại `<FilterTab />` và backend service tương ứng, đồng thời bổ sung thông báo rõ ràng cho người dùng.

---

## 2. Đề Xuất Thay Đổi (Proposed Changes)

### 2.1. Frontend: [`static/js/components/filter-tab.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/filter-tab.js)
- Đổi mặc định `filterFromDate` và `filterToDate` thành chuỗi rỗng `ref('')` thay vì `ref(today)`.
- Khi người dùng chọn Tỉnh/Thành phố hoặc Xã mới, hệ thống sẽ lập tức quét toàn bộ lịch sử dữ liệu và trả về kết quả ngay (>4.000 DN cho Đắk Lắk + 4 xã cụm Krông Năng).
- Giữ nguyên giới hạn file < 180 dòng.

### 2.2. Backend Logic: [`src/modules/records/records.service.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/records/records.service.ts)
- Cập nhật hàm `buildFilterWhere`: Bổ sung bóc tách tiền tố hành chính (`Xã`, `Thị trấn`, `Phường`) để tìm kiếm mảng linh hoạt `['%Xã Krông Năng%', '%Krông Năng%']`.
- Giữ nguyên giới hạn file < 200 dòng.

### 2.3. Backend Export: [`src/modules/records/records.export.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/records/records.export.ts)
- Cập nhật `buildExportWhere`: Thêm fallback tìm `t.tran_addr ILIKE ANY(...)` tương đồng với `records.service.ts` và bổ sung bóc tách tiền tố xã.
- Đảm bảo việc xuất Excel/CSV trả về đúng 4.239 bản ghi khi lọc các xã này.
- Giữ nguyên giới hạn file < 200 dòng.

---

## 3. Kế Hoạch Xác Minh (Verification Plan)

### 3.1. Kiểm thử Backend API
- Gửi request `POST /api/filter` với tỉnh Đắk Lắk và 4 xã: kiểm tra số lượng bản ghi trả về >= 3.600 (đạt 4.239 bản ghi).
- Kiểm tra route xuất file `GET /api/export/xlsx` với tham số xã tương tự.

### 3.2. Kiểm thử Quy chuẩn Mã nguồn (Line Limits & Type Check)
- Chạy `npx tsc --noEmit` để đảm bảo TypeScript không có lỗi kiểu.
- Chạy `python test_modular.py` hoặc script kiểm tra số dòng code: mọi file TS < 200 dòng, file Vue < 180 dòng.

### 3.3. Nhật ký & Tài liệu
- Lưu kế hoạch vào `docs/logs/41_20260921_111000_implementation_plan.md`.
- Lưu walkthrough vào `docs/logs/42_20260921_112000_walkthrough.md`.
- Cập nhật `docs/logs/INDEX.md`.
