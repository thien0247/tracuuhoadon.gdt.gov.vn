# Kế Hoạch Triển Khai: Chuẩn Hóa Prompt & Nâng Cấp `<CrawlerTab />` (Crawl Theo Mã Số Doanh Nghiệp Bố Cáo ĐKKD)

> **Mã kế hoạch:** `47_20260922_124500_implementation_plan.md`  
> **Module:** Crawler Management  
> **Component:** `<CrawlerTab />` (`static/js/components/crawler-tab.js`) & `<CrawlerBocaoModal />` (`static/js/components/crawler-bocao-modal.js`)  
> **Quy chuẩn tuân thủ:** [GEMINI.md](file:///c:/tracuuhoadon.gdt.gov.vn/GEMINI.md) (Line limit < 180 dòng đối với Vue Component, < 200 dòng đối với TypeScript/Python, UI Template < 220 dòng)

---

## 1. Bản Prompt Chuẩn Hóa (Standard Prompt Specification)

```markdown
## Component: `<CrawlerTab />` & `<CrawlerBocaoModal />`
- **Files:**
  - `static/js/components/crawler-tab.js` (≤ 180 dòng)
  - `static/js/components/crawler-bocao-modal.js` (≤ 160 dòng, New)
  - `templates/index.html` (≤ 220 dòng)
  - `server_app/services/bocao_scan.py` (≤ 50 dòng)
  - `server_app/routers/records.py` (≤ 200 dòng)
- **Module:** Crawler Management — Bảng điều khiển quét MST đa tỉnh
- **Mô tả & Yêu cầu Kỹ thuật:**
  1. **Nghiệp vụ cốt lõi (Business Logic):**
     - Bổ sung chức năng quét bổ sung dữ liệu thuế GDT dựa trên danh sách Mã Số Thuế / Mã Số Doanh Nghiệp công bố tại Cổng Bố cáo điện tử ĐKKD (`bocao_records`, tương ứng với cột `tin` / Mã Số Doanh Nghiệp).
     - Phân loại 2 cơ chế quét:
       + **Cơ chế 1 (Radar Direct Sync):** Quét trực tiếp danh sách MST từ `bocao_records` chưa có trong `tax_records` (hoặc đang ở trạng thái `retry_later`), nạp tức thì vào CSDL Thuế qua API `/api/bocao/reconcile/sync-missing`.
       + **Cơ chế 2 (Gap-Fill Rolling Queue):** Nhóm các MST Bố Cáo theo prefix tỉnh và kích hoạt quét cuốn chiếu đa luồng qua `/api/bocao/reconcile/scan-missing`.
  2. **Giao diện Người Dùng `<CrawlerTab />`:**
     - Bổ sung nút bấm hành động nổi bật trên Toolbar của `<CrawlerTab />`:
       `[ 📰 Quét Theo Bố Cáo ĐKKD ]` kèm huy hiệu badge đếm số MST chưa đồng bộ (ví dụ: `73 MST`).
     - Khi bấm vào nút, hiển thị Modal tương tác điều khiển `<crawler-bocao-modal>`:
       + Thống kê nhanh: Tổng số MST Bố Cáo, số MST chưa có trong Thuế, số MST chờ GDT kích hoạt.
       + Tùy chọn cấu hình: Số lượng quét (batch size 10–200), số worker, số tỉnh song song.
       + Bảng điều khiển tiến trình: Nút `Bắt Đầu Quét`, `Dừng Quét`, thanh tiến độ (Progress bar) và nhật ký quét theo thời gian thực.
  3. **Kiến trúc Modular & Giới Hạn Dòng Code:**
     - Phân rã logic Modal thành sub-component độc lập `crawler-bocao-modal.js` (≤ 160 dòng) để bảo toàn giới hạn nghiêm ngặt của `crawler-tab.js` (≤ 180 dòng).
     - Khai báo component trong `templates/index.html`, giữ tổng dòng code của template ≤ 220 dòng.
  4. **Khắc phục lỗi Backend (Bug Fix):**
     - Sửa lỗi cú pháp list comprehension trong `server_app/services/bocao_scan.py` (lỗi `KeyError` do thứ tự filter `if prefix in prefix_map`).
     - Đảm bảo endpoint `/api/bocao/reconcile/sync-missing` và `/api/bocao/reconcile/stats` hoạt động nhất quán trên cả Python FastAPI và TypeScript Fastify.
  5. **Quy chuẩn chất lượng & Kiểm thử:**
     - Chạy kiểm thử tự động `python test_modular.py` xác thực 100% tệp đạt chuẩn độ dài dòng code và toàn bộ API đạt HTTP 200.
```

---

## 2. Chi Tiết Kế Hoạch Triển Khai

### 2.1. Backend Fix & Route Synchronization
#### [MODIFY] [`server_app/services/bocao_scan.py`](file:///c:/tracuuhoadon.gdt.gov.vn/server_app/services/bocao_scan.py)
- Sửa thứ tự `if prefix in prefix_map` trước `for name, cfg in [prefix_map[prefix]]`.

#### [MODIFY] [`server_app/routers/records.py`](file:///c:/tracuuhoadon.gdt.gov.vn/server_app/routers/records.py)
- Thêm route `POST /api/bocao/reconcile/sync-missing` gọi `sync_missing_bocao_records`.

### 2.2. Frontend Sub-Component: `<CrawlerBocaoModal />`
#### [NEW] [`static/js/components/crawler-bocao-modal.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/crawler-bocao-modal.js)
- Component Modal điều khiển quét MST Bố Cáo (≤ 160 dòng).

### 2.3. Cập Nhật `<CrawlerTab />`
#### [MODIFY] [`static/js/components/crawler-tab.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/crawler-tab.js)
- Thêm nút bấm trên Toolbar và tích hợp `<crawler-bocao-modal>`. Giữ file ≤ 180 dòng.

### 2.4. Khai Báo Trong Giao Diện Chính
#### [MODIFY] [`templates/index.html`](file:///c:/tracuuhoadon.gdt.gov.vn/templates/index.html)
- Bổ sung `<script src="/static/js/components/crawler-bocao-modal.js?v=3.5"></script>`. Giữ file ≤ 220 dòng.
