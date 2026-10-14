# Kế Hoạch Triển Khai: Giới Hạn Bảng Xem Trước Mặc Định 50 Dòng, Tùy Chọn Page Size 30/50/100 & Lưu Cache Mặc Định

> **Mã số kiểm toán:** `114_20261014_175800_implementation_plan`  
> **Thời gian tạo:** 2026-10-14 17:58:00 (ICT)  
> **Mục tiêu:** Bổ sung giới hạn dòng hiển thị mặc định 50 dòng, bộ chọn page size [30, 50, 100], thanh điều hướng phân trang và tự động lưu/khôi phục từ LocalStorage cho Bảng Xem Trước (Bảng Tra Cứu & Bảng Lọc Đa Cấp).

---

## 1. Hiện Trạng & Yêu Cầu Kỹ Thuật

- **Bảng Lọc Đa Cấp (`FilterTable.vue`):** Hiện tại đang hiển thị toàn bộ bản ghi nhận được (lên tới 500 dòng) cùng lúc trong DOM mà chưa có phân trang, chưa có tùy chọn số dòng trên trang.
- **Bảng Tra Cứu (`SearchTable.vue`):** Đã có TanStack Pagination nhưng đang dùng các mốc `10, 25, 50, 100`, mặc định là `25`, và chưa lưu cấu hình page size của người dùng vào cache trình duyệt.
- **Yêu cầu người dùng:**
  1. Giới hạn hiển thị mặc định: **50 dòng**.
  2. Bổ sung tùy chọn Page Size: **30 / 50 / 100 dòng**.
  3. Lưu vào Cache trình duyệt (`localStorage`): Khi người dùng chọn kích thước trang nào, hệ thống tự động ghi nhớ và sử dụng làm mặc định cho các phiên làm việc tiếp theo.

---

## 2. Giải Pháp Kiến Trúc & Thiết Kế Module

### 2.1. Composable `useTablePageSize.ts`
- Xây dựng composable [`frontend/src/composables/useTablePageSize.ts`](../../frontend/src/composables/useTablePageSize.ts):
  - Khai báo danh sách cho phép: `ALLOWED_PAGE_SIZES = [30, 50, 100] as const`.
  - Tự động đọc từ `localStorage` dựa theo `storageKey`, kiểm tra tính hợp lệ và fallback về `50`.
  - Hàm `setPageSize(newSize)` cập nhật reactive ref đồng thời ghi vào `localStorage`.

### 2.2. Nâng Cấp Bảng Lọc Đa Cấp (`FilterTable.vue`)
- Tích hợp `useTablePageSize('gdt_filter_table_page_size', 50)`.
- Bổ sung bộ chọn Page Size `[30, 50, 100 dòng]` trên toolbar ma trận.
- Cắt lát dữ liệu hiển thị `paginatedRows = computed(() => filteredDisplayRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize))`.
- Đánh số thứ tự cột `#` theo công thức `(pageIndex * pageSize) + idx + 1`.
- Thêm thanh phân trang ở chân bảng chuẩn Google Sheets: `Hiển thị dòng X - Y / Z dòng` cùng bộ nút `⏮ ◀ Trang X / Y ▶ ⏭`.
- Reset `pageIndex = 0` khi người dùng thay đổi bộ lọc cột hoặc đổi page size.
- Đảm bảo tệp nguồn $\le 175$ dòng (chuẩn $\le 180$ dòng).

### 2.3. Nâng Cấp Bảng Tra Cứu (`SearchTable.vue`)
- Tích hợp `useTablePageSize('gdt_search_table_page_size', 50)`.
- Cập nhật danh sách option trong dropdown thành `[30 dòng, 50 dòng, 100 dòng]`.
- Khởi tạo TanStack Table với `pageSize: pageSize.value` (mặc định 50 hoặc giá trị đã lưu trong cache).
- Khi người dùng đổi page size: gọi đồng thời `table.setPageSize(newSize)` và `setPageSize(newSize)`.
- Giữ vững quy chuẩn $\le 160$ dòng.

---

## 3. Kế Hoạch Xác Minh & Kiểm Thử
1. **Kiểm tra biên dịch:** `cd frontend; npm run build; cd ..; npm run check:types; npm run build`.
2. **Kiểm tra giới hạn dòng code:** Đảm bảo tất cả các file đều $\le 180$ dòng theo `GEMINI.md`.
3. **Khởi động lại Windows Service:** `Restart-Service GDTTaxCrawler`.
4. **Kiểm tra tự động toàn diện:** `python test_modular.py`.
5. **Ghi chép kiểm toán:** Lưu `114_20261014_175800_implementation_plan.md`, `115_20261014_180200_walkthrough.md` và cập nhật `docs/logs/INDEX.md`.
