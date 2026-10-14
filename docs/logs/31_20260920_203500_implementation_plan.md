# Kế Hoạch Triển Khai: Chuẩn Hóa Prompt & Nâng Cấp `<CrawlerTab />` (Lịch Sử Scan Gần Nhất & Mặc Định List View)

> **Mã kế hoạch:** `31_20260920_203500_implementation_plan.md`  
> **Module:** Crawler Management  
> **Component:** `<CrawlerTab />` (`static/js/components/crawler-tab.js`) & `<CrawlerList />` (`static/js/components/crawler-list.js`)  
> **Quy chuẩn tuân thủ:** [GEMINI.md](file:///c:/tracuuhoadon.gdt.gov.vn/GEMINI.md) (Line limit < 180 dòng đối với Vue Component, < 200 dòng đối với TypeScript/Python)

---

## 1. Viết Lại Prompt Chuẩn Hóa (Standard Prompt Specification)

Dưới đây là bản Prompt chuẩn hóa theo quy chuẩn phát triển của dự án, mô tả đầy đủ từ yêu cầu nghiệp vụ, kiến trúc dữ liệu đến giao diện người dùng để người dùng xem xét và phê duyệt:

```markdown
## Component: `<CrawlerTab />` & `<CrawlerList />`
- **Files:**
  - `static/js/components/crawler-tab.js` (≤ 180 dòng)
  - `static/js/components/crawler-list.js` (≤ 180 dòng)
  - `src/modules/stream/stream.service.ts` (≤ 180 dòng)
  - `worker_bridge.py` (≤ 200 dòng)
- **Module:** Crawler Management — Bảng điều khiển giám sát & điều phối quét MST đa tỉnh
- **Mô tả & Yêu cầu Kỹ thuật:**
  1. **Chế độ xem mặc định (Default View Mode):**
     - Đổi chế độ hiển thị mặc định từ Lưới (`grid`) sang Danh Sách Bảng (`list` view) ngay khi tải trang (`viewMode = ref('list')`).
     - Duy trì nút chuyển đổi Segmented Switcher giữa Grid và List mượt mà.
  2. **Bổ sung cột Lịch Sử Scan Gần Nhất trên Bảng Danh Sách (`<CrawlerList />`):**
     - Thêm cột `Lịch Sử Scan` vào bảng dữ liệu (đặt vị trí trực quan giữa `Tiến Độ Quét` và `TIN Min / Max`).
     - Nội dung hiển thị tại mỗi dòng tỉnh thành:
       + **MST quét gần nhất (`last_tin`):** Hiển thị dạng thẻ font-mono sắc nét, nổi bật. Nếu chưa từng quét thì hiển thị `—`.
       + **Thời gian quét gần nhất (`last_scanned_at`):** Định dạng thời gian thân thiện `HH:mm:ss DD/MM/YYYY` (hoặc relative time sinh động).
       + **Trạng thái thực thi:** Phân biệt rõ MST vừa quét realtime (khi đang chạy) và MST đã lưu từ phiên quét trước (lấy từ bảng CSDL `scan_progress`).
  3. **Đồng bộ Dữ liệu Thời Gian Thực (Backend SSE & CSDL):**
     - Tại `src/modules/stream/stream.service.ts`: Truy vấn kết hợp bảng `scan_progress` trong PostgreSQL để nạp `last_tin` và `updated_at` vào cache `dbStatsCache`.
     - Khi Crawler đang chạy: Ưu tiên phát `last_tin` trực tiếp từ tiến trình Python worker qua SSE stream `/api/stream`.
     - Khi Crawler đang dừng: Hiển thị nguyên vẹn lịch sử MST và mốc thời gian lần quét cuối cùng từ CSDL, không bị biến mất thành khoảng trắng.
  4. **Tùy chọn sắp xếp theo Lịch sử scan:**
     - Bổ sung tùy chọn sắp xếp `scan_recent` ("🕒 Quét gần đây nhất") trong thanh công cụ toolbar của `<CrawlerTab />`.
  5. **Quy chuẩn chất lượng:**
     - 100% tuân thủ TypeScript strict mode, không dùng `any`.
     - Toàn bộ các file tuân thủ giới hạn dòng code (< 180 dòng cho Vue component, < 200 dòng cho Python/TS).
     - Chạy kiểm thử tự động `python test_modular.py` và xác thực trực quan bằng Playwright trước khi bàn giao.
```

---

## 2. Chi Tiết Các Thay Đổi Dự Kiến

### 2.1. Backend Data & SSE Stream Layer
#### [MODIFY] [`src/modules/stream/stream.service.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/stream/stream.service.ts)
- Nâng cấp `refreshDbStats()` để đọc thêm thông tin từ bảng `scan_progress`:
  ```sql
  SELECT prefix, last_tin, updated_at FROM scan_progress
  ```
- Bổ sung vào interface `DbProvinceStat`:
  ```typescript
  export interface DbProvinceStat {
    db_count: number;
    tin_min: string;
    tin_max: string;
    last_tin?: string;
    last_scanned_at?: string;
  }
  ```
- Trong `buildStreamPayload()`:
  - Gán `last_tin: (isRunning && eng?.last_tin) ? eng.last_tin : (dbStat.last_tin || '')`
  - Gán `last_scanned_at: dbStat.last_scanned_at || ''`
- Đảm bảo file giữ nguyên độ dài ≤ 150 dòng (ngưỡng an toàn < 180 dòng).

#### [MODIFY] [`worker_bridge.py`](file:///c:/tracuuhoadon.gdt.gov.vn/worker_bridge.py)
- Trong `/worker/status`:
  - Trả về `last_tin: state.last_tins.get(prov_key, "")` cho từng tỉnh đang hoạt động.
- Đảm bảo file giữ nguyên độ dài ≤ 175 dòng (ngưỡng an toàn < 200 dòng).

---

### 2.2. Frontend Component Layer
#### [MODIFY] [`static/js/components/crawler-tab.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/crawler-tab.js)
- Đổi dòng 18:
  ```javascript
  const viewMode = ref('list'); // Mặc định hiển thị List View
  ```
- Cập nhật hàm `getProvStatus`:
  ```javascript
  last_tin: p?.last_tin || '',
  last_scanned_at: p?.last_scanned_at || ''
  ```
- Thêm option sắp xếp vào toolbar:
  ```html
  <option value="scan_recent">🕒 Quét gần đây nhất</option>
  ```
  Kèm logic `list.sort` theo `last_scanned_at`.
- Đảm bảo file giữ nguyên độ dài ≤ 178 dòng (ngưỡng an toàn < 180 dòng).

#### [MODIFY] [`static/js/components/crawler-list.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/crawler-list.js)
- Thêm cột header `Lịch Sử Scan`:
  ```html
  <th class="p-3.5">Tỉnh Thành</th>
  <th class="p-3.5">Trạng Thái</th>
  <th class="p-3.5">Chế Độ & Seed TIN</th>
  <th class="p-3.5">Lịch Sử Scan</th>
  <th class="p-3.5">Luồng / Gap</th>
  <th class="p-3.5">Tiến Độ Quét</th>
  <th class="p-3.5">TIN Min / Max</th>
  <th class="p-3.5 text-right">Thao Tác</th>
  ```
- Thêm cell hiển thị lịch sử scan cho mỗi tỉnh:
  - Hiển thị `last_tin` với kiểu chữ mono, badge màu xanh/tím thanh lịch.
  - Hiển thị `last_scanned_at` định dạng ngày giờ dễ nhìn (ví dụ `13:55 20/09/2026`).
  - Nếu đang quét trực tiếp: hiển thị nhấp nháy `🟢 Đang quét: <last_tin>`.
- Đảm bảo file giữ nguyên độ dài ≤ 178 dòng (ngưỡng an toàn < 180 dòng).

---

## 3. Kế Hoạch Kiểm Thử & Nghiệm Thu (Verification Plan)

### 3.1. Kiểm thử Tự Động (Automated Tests)
1. **Biên dịch TypeScript:** Chạy `npx tsc` đảm bảo không phát sinh bất kỳ lỗi kiểu dữ liệu nào.
2. **Kiểm tra độ dài dòng code:** Chạy `python test_modular.py` xác thực toàn bộ các file sửa đổi đều nằm trong giới hạn cho phép (< 180 dòng đối với component Vue, < 200 dòng đối với Python/TS).
3. **Kiểm tra luồng dữ liệu SSE:** Gọi `curl http://localhost:8123/api/stream` hoặc test payload stream để kiểm tra trường `last_tin` và `last_scanned_at` có đầy đủ giá trị từ CSDL.

### 3.2. Kiểm thử Giao Diện Trực Quan (Visual Verification via Playwright)
1. Mở trang chủ `http://localhost:8123`.
2. Kiểm tra giao diện tự động tải ngay ở chế độ **Danh Sách (List Table)** thay vì Grid.
3. Kiểm tra cột mới **Lịch Sử Scan** hiển thị đầy đủ MST và thời gian quét gần nhất của các tỉnh đã quét (như Hà Nội `01`, TP.HCM `03`, Vĩnh Phúc `25`, Bình Định `31`, v.v.).
4. Chụp ảnh màn hình và lưu vào thư mục artifacts làm bằng chứng nghiệm thu.
