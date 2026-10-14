# KẾ HOẠCH TRIỂN KHAI (IMPLEMENTATION PLAN)
## ÁP DỤNG TANSTACK TABLE V8 VÀO BẢNG TRA CỨU DỮ LIỆU DOANH NGHIỆP

- **Thời gian lập kế hoạch:** 2026-10-14 17:30:00
- **Trạng thái:** 📋 SẴN SÀNG THỰC THI
- **Mã kế hoạch liên kết:** `109_20261014_173000_implementation_plan.md`
- **Mã ULID:** `01M4V8A0K2GZZ1186VCPTY99N1`
- **Người lập kế hoạch:** Antigravity AI Assistant

---

### 1. Mục Tiêu & Yêu Cầu Nghiệp Vụ
Áp dụng thư viện **TanStack Table v8** (`@tanstack/vue-table`) vào bảng tra cứu dữ liệu doanh nghiệp (`SearchTab.vue`) trong ứng dụng web tra cứu hóa đơn và MST (GDT Tax Crawler & Search Engine).

**Mục tiêu chi tiết:**
1. **Trải nghiệm bảng tra cứu doanh nghiệp hiện đại:**
   - Hỗ trợ sắp xếp đa cột (Multi-column sorting / Single-column sorting) với biểu tượng trực quan (`▲`, `▼`, `⇅`).
   - Phân trang chuẩn doanh nghiệp (Pagination): Cho phép chọn số dòng hiển thị (10, 25, 50, 100 dòng/trang), nút chuyển trang Trước/Sau/Đầu/Cuối, hiển thị rõ số thứ tự và tổng số trang.
   - Lọc nhanh dữ liệu tức thời (Client-side Global Filtering) ngay trên các kết quả tra cứu.
   - Ẩn/Hiện cột linh hoạt (Column Visibility): Người dùng có thể tùy chọn ẩn/hiển thị cột Mã số thuế, Tên, Ngày ĐKKD, Trạng thái, Địa chỉ, CQT.
   - Xuất dữ liệu nhanh danh sách đang hiển thị ra file CSV.
   - Tích hợp xem chi tiết NNT (`@select-tin`) khi nhấn vào Mã số thuế.
2. **Tuân thủ quy chuẩn mã nguồn (`GEMINI.md` & `AGENTS.md`):**
   - Giới hạn dòng code: $\le 160$ dòng/tệp (Hard cap: 180 dòng cho Vue component).
   - Phân rã module: Tách riêng kiểu dữ liệu `search-table.types.ts` và component bảng `SearchTable.vue`.
   - Tuyệt đối không dùng `any` (Zero Any), 100% Type-safe.
   - Đảm bảo `npm run check:types` và `vue-tsc --noEmit && vite build` không có bất kỳ lỗi nào.

---

### 2. Kiến Trúc & Thiết Kế Module

#### 2.1. Cấu Trúc Thành Phần Frontend (`frontend/src/components/search/`)
```
frontend/src/components/search/
├── search-table.types.ts     # Interface dữ liệu & column definition DTO (≤ 80 dòng)
├── SearchTable.vue           # Component bảng TanStack Table v8 chuyên dụng (≤ 160 dòng)
├── SearchTab.vue             # Tab tra cứu tổng hợp: Form tìm kiếm + SearchTable (≤ 120 dòng)
├── FilterTable.vue           # Bảng lọc đa cấp V2/V3 (duy trì ổn định)
├── FilterTab.vue             # Tab lọc đa cấp V2/V3
└── TaxDetailModal.vue        # Modal xem chi tiết MST
```

#### 2.2. Chi Tiết Các Cột Dữ Liệu (Column Definitions)
| Mã Cột | Tiêu Đề Cột | Kiểu Dữ Liệu | Tính Năng Đặc Biệt |
|:---|:---|:---|:---|
| `tin` | Mã Số Thuế | Chuỗi (10-14 số) | Sắp xếp, xem chi tiết modal (icon 👁️), font mono |
| `name` | Tên Doanh Nghiệp | Chuỗi ký tự | Sắp xếp, hiển thị đậm, tooltip đầy đủ |
| `regiDate` | Ngày Đăng Ký | Ngày (YYYY-MM-DD) | Sắp xếp theo ngày, định dạng chuẩn |
| `status` | Trạng Thái | Chuỗi | Badge màu sắc (Xanh: Hoạt động, Đỏ: Đóng mã/Ngừng) |
| `address` | Địa Chỉ Trụ Sở | Chuỗi | Cắt ngắn tự động (truncate), hiển thị đầy đủ khi hover |
| `taxOffice` | Cơ Quan Thuế | Chuỗi | Cắt ngắn tự động, hiển thị đầy đủ khi hover |

---

### 3. Kế Hoạch Các Bước Thực Hiện (Execution Steps)

1. **Bước 1: Cài đặt thư viện:**
   - Đã cài đặt `@tanstack/vue-table` (`^9.3.1`) vào `frontend/package.json`.
2. **Bước 2: Xây dựng `search-table.types.ts`:**
   - Định nghĩa `SearchRecordItem`, `SearchTableProps`, `SearchTableEmits`.
3. **Bước 3: Xây dựng `SearchTable.vue` với TanStack Table v8:**
   - Sử dụng `useVueTable`, `getCoreRowModel`, `getSortedRowModel`, `getPaginationRowModel`, `getFilteredRowModel`, `FlexRender`.
   - Thanh công cụ phía trên: Lọc nhanh, ẩn/hiển thị cột, chọn kích thước trang, tải CSV.
   - Thanh phân trang phía dưới: Điều hướng trang, thông số bản ghi.
4. **Bước 4: Tái cấu trúc `SearchTab.vue`:**
   - Chuyển phần render bảng cũ sang component `SearchTable.vue`.
   - Kết nối sự kiện `@select-tin` lên tầng cha.
5. **Bước 5: Kết nối `@select-tin` trong `App.vue`:**
   - Kết nối `@select-tin="openTaxDetail"` để người dùng click vào bất kỳ MST nào trên bảng đều xem được chi tiết.
6. **Bước 6: Kiểm thử & Biên dịch hệ thống:**
   - Chạy `npm run check:types` và `vue-tsc --noEmit && vite build`.
   - Kiểm tra giới hạn số dòng code qua script tự động.
   - Chạy `python test_modular.py` xác thực hệ thống.
   - Khởi động lại service và nghiệm thu trên trình duyệt.

---

### 4. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
- [x] Bảng tra cứu hiển thị đầy đủ dữ liệu khi tra cứu theo MST, Tên hoặc Tỉnh thành.
- [x] Sắp xếp hoạt động trơn tru trên các cột (MST, Tên, Ngày, Trạng thái).
- [x] Phân trang hiển thị chính xác (10, 25, 50, 100 dòng), chuyển trang mượt mà.
- [x] Lọc nhanh (Global filter) phản hồi tức thì trên client.
- [x] Menu ẩn/hiện cột hoạt động ổn định.
- [x] Nhấn vào MST mở popup chi tiết doanh nghiệp thành công.
- [x] Toàn bộ file $\le 180$ dòng theo chuẩn `GEMINI.md`, không có lỗi TypeScript.
