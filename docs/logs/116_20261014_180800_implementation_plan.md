# Kế Hoạch Triển Khai: Tự Động Reload Dữ Liệu Khi Chọn Số Dòng, Lưu Trữ Cache & Hiển Thị URL Query Parameters

> **Mã số kiểm toán:** `116_20261014_180800_implementation_plan`  
> **Thời gian tạo:** 2026-10-14 18:08:00 (ICT)  
> **Mục tiêu:** Kích hoạt reload bảng dữ liệu khi thay đổi số dòng xem trước, lưu trữ cấu hình LocalStorage và đồng bộ hai chiều query parameters (`tab`, `pageSize`, `q`, v.v.) lên thanh địa chỉ URL của trình duyệt.

---

## 1. Vấn Đề Gặp Phải & Phân Tích Nguyên Nhân

- **Hiện tượng 1 ("table ko load lại"):** Khi chọn dropdown số dòng trên bảng (30, 50, 100), trước đây chỉ cắt lát dữ liệu ở phía client mà không gửi request API tới backend với tham số `limit`, khiến bảng không nạp lại dữ liệu tương ứng từ CSDL.
- **Hiện tượng 2 ("không lưu trữ & thêm hiển thị parameter trên url"):** Khi thay đổi số dòng hoặc chuyển tab, URL trình duyệt không hiển thị các tham số truy vấn (`?tab=...&pageSize=...`). Khi F5 hoặc copy link sang cửa sổ khác, cấu hình không được nạp lại từ URL.

---

## 2. Giải Pháp Kiến Trúc & Thiết Kế Module

### 2.1. Backend Fastify: Hỗ Trợ Dynamic `limit`
- **Tệp nguồn:** [`src/modules/records/records.filter.ts`](../../src/modules/records/records.filter.ts) & [`src/modules/records/records.service.ts`](../../src/modules/records/records.service.ts):
  - Tiếp nhận `dto.limit` hoặc `dto.page_size` từ client.
  - Áp dụng vào câu truy vấn SQL: `LIMIT ${rowLimit}` với khoảng an toàn $[1, 1000]$.

### 2.2. Composable `useTablePageSize.ts`: Đồng Bộ Hai Chiều Với URL & LocalStorage
- **Tệp nguồn:** [`frontend/src/composables/useTablePageSize.ts`](../../frontend/src/composables/useTablePageSize.ts):
  - Khi khởi tạo: Đọc từ `window.location.search` (`pageSize` hoặc `limit`), nếu không có đọc tiếp `localStorage`, cuối cùng fallback về `50`.
  - Khi `setPageSize(newSize)`: Cập nhật `localStorage` và cập nhật `url.searchParams.set('pageSize', String(newSize))` qua `window.history.replaceState`.

### 2.3. Bảng Lọc Đa Cấp: Kích Hoạt Reload Dữ Liệu Khi Đổi Số Dòng
- **Tệp nguồn:** [`frontend/src/components/search/FilterTab.vue`](../../frontend/src/components/search/FilterTab.vue) & [`FilterTable.vue`](../../frontend/src/components/search/FilterTable.vue):
  - `FilterTable` emit sự kiện `@change-page-size="onPageSizeChange"`.
  - `FilterTab` lập tức gọi `onFilter()` với `limit: pageSize.value`.
  - Bảng hiển thị loading spinner và nạp lại chính xác số bản ghi tương ứng từ server.

### 2.4. Bảng Tra Cứu: Kích Hoạt Reload & Đồng Bộ Query URL
- **Tệp nguồn:** [`frontend/src/components/search/SearchTab.vue`](../../frontend/src/components/search/SearchTab.vue) & [`SearchTable.vue`](../../frontend/src/components/search/SearchTable.vue):
  - Đồng bộ `pageSize`, từ khóa `q` và `prov` lên URL.
  - Khi đổi số dòng: tự động kích hoạt `onSearch()` với `limit: pageSize.value`.
  - Tự động nạp lại kết quả khi mở URL có chứa tham số `?q=...&pageSize=...`.

### 2.5. Main App: Đồng Bộ Tab Trên URL
- **Tệp nguồn:** [`frontend/src/App.vue`](../../frontend/src/App.vue):
  - Theo dõi `activeTab` và đồng bộ `?tab=...` lên URL.
  - Khôi phục tab tương ứng khi người dùng truy cập trực tiếp qua URL.

---

## 3. Kế Hoạch Kiểm Thử
1. **Kiểm tra biên dịch:** `cd frontend; npm run build; cd ..; npm run check:types; npm run build`.
2. **Kiểm tra giới hạn dòng code:** Đảm bảo tất cả các file đều $\le 180$ dòng theo `GEMINI.md`.
3. **Khởi động lại Windows Service:** `Restart-Service GDTTaxCrawler`.
4. **Kiểm tra tự động toàn diện:** `python test_modular.py`.
5. **Ghi chép kiểm toán:** Lưu STT 116 và STT 117 vào `docs/logs/INDEX.md`.
