# Kế Hoạch Triển Khai: Bocao Radar (Quét Bù Vào Thuế) & Nâng Cấp CrawlerTab (Quét Lấp Lỗ Hổng Gap-Fill)

> **Mã số kế hoạch:** `PLAN-20260920-BOCAO-RADAR-GAPFILL`  
> **Mục tiêu:** 
> 1. Triển khai tính năng **`⚡ Quét Bù Vào Thuế`** trực tiếp từ danh sách MST đối soát chưa có trong thuế (Bocao Radar), kèm cơ chế lưu vết `sync_status` và tự động hẹn giờ thử lại (retry) khi GDT hoàn tất kỳ đồng bộ dữ liệu.
> 2. Nâng cấp `CrawlerTab` và `CrawlerEngine` bổ sung chế độ **`🧩 Quét Lấp Lỗ Hổng (Gap-Fill)`** và cơ chế **Đỉnh Động (Dynamic Seed = $\max(\text{tax}, \text{bocao})$)** giúp vượt bẫy kẹt đỉnh cục bộ.

---

## 1. Phân Tích Kỹ Thuật & Kiến Trúc

### 1.1. Hiện Trạng 60 MST Chưa Có Trong Thuế
- **14 MST vượt đỉnh cũ:** Nằm ngoài tầm quét của `CrawlerTab` do bị ngắt luồng bởi `gap = 20`.
- **46 MST nằm dưới đỉnh cũ:** Nằm trong các khoảng trống (gaps) mà chế độ `newest` không bao giờ quét lùi để kiểm tra.
- **Độ trễ đồng bộ (Replication Lag) từ GDT:** Các doanh nghiệp đăng ký mới trong ngày 19–20/09 khiến backend GDT trả về lỗi nội bộ (`The application has malfunctioned`) trước khi được đồng bộ sang cổng công khai.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   LUỒNG XỬ LÝ KẾT HỢP (RADAR + GAP-FILL)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
     ┌─────────────────────────────────┴─────────────────────────────────┐
     ▼                                                                   ▼
[PHƯƠNG ÁN 1: BOCAO RADAR]                             [PHƯƠNG ÁN 2: CRAWLERTAB GAP-FILL]
1. Lấy danh sách 60 MST chưa có trong DB.              1. Bổ sung chế độ "🧩 Quét Lấp Lỗ Hổng".
2. Bắn trực tiếp 60 request có điều tiết               2. Thuật toán phát hiện khoảng trống
   qua SessionManager.                                    dải số (SQL Lag/Lead hoặc Gap Range).
3. Nếu tìm thấy: Lưu ngay vào tax_records              3. Đỉnh động cho chế độ Newest:
   và cập nhật sync_status = 'synced'.                    seed_tin = max(tax_records, bocao_records)
4. Nếu GDT trả lỗi malfunctioned:                     4. Tự động lấp các số bị bỏ quên
   cập nhật sync_status = 'retry_later'.                  dưới đỉnh.
```

---

## 2. Kế Hoạch Chi Tiết Từng Module

### 2.1. CSDL PostgreSQL (`taxdb`)
1. Bổ sung các cột theo dõi đồng bộ vào bảng `bocao_records`:
   - `sync_status VARCHAR(20) DEFAULT 'pending'` (`pending`, `synced`, `retry_later`)
   - `sync_attempts INT DEFAULT 0`
   - `last_synced_at TIMESTAMP WITH TIME ZONE`
   - Tạo index `idx_bocao_sync_status ON bocao_records(sync_status)`.

---

### 2.2. Phương Án 1: Bocao Radar (`⚡ Quét Bù Vào Thuế`)
1. **Python Worker Service (`server_app/services/bocao_reconcile_sync.py`):**
   - Hàm `sync_missing_bocao_records(batch_size=60)`:
     - Lấy danh sách các MST từ `bocao_records` chưa có trong `tax_records` hoặc có `sync_status != 'synced'`.
     - Sử dụng `SessionManager` (tái sử dụng 1 CAPTCHA) để tra cứu từng số.
     - Nếu có `tinModel`: batch insert vào `tax_records` và cập nhật `sync_status = 'synced'`.
     - Nếu `malfunctioned`: cập nhật `sync_status = 'retry_later'`, tăng `sync_attempts`.
     - Trả về thống kê: `{ processed, synced_now, waiting_gdt, errors }`.
2. **Endpoint Bridge trong `worker_bridge.py`:**
   - `POST /worker/bocao/sync_missing`
3. **Fastify Backend (`src/modules/bocao/`):**
   - `bocao-reconcile.service.ts`: Thêm hàm `triggerSyncMissingRecords()` chuyển tiếp tới Python Worker.
   - `bocao.routes.ts`: Thêm route `POST /api/bocao/reconcile/sync-missing`.
4. **Frontend UI (`static/js/components/bocao-reconcile-tab.js` & `api.js`):**
   - Bổ sung nút **`⚡ Quét Bù Vào Thuế (60)`** trên Toolbar.
   - Hiển thị badge trạng thái trên từng dòng:
     - `✅ Đã có trong Thuế`
     - `⏳ Chờ GDT đồng bộ (Thử lại lần N)`
     - `⚠️ Chưa có trong Thuế`
   - Modal tiến trình quét bù real-time.

---

### 2.3. Phương Án 2: Nâng Cấp `CrawlerTab` (Chế độ `Gap-Fill` & Đỉnh Động)
1. **Thuật toán Đỉnh Động (Dynamic Seed):**
   - Trong `server_app/routers/crawler.py` (và `server_app/core/database.py`):
     - Cập nhật hàm `get_effective_max_tin(prefix)`:
       $$\text{seed} = \max(\text{tax\_max}, \text{bocao\_max})$$
     - Đảm bảo chế độ `newest` luôn lấy đỉnh cao nhất thực tế trên cả 2 nguồn, phá bỏ bẫy kẹt đỉnh cũ!
2. **Chế độ quét mới: `gap_fill` (Quét Lấp Lỗ Hổng):**
   - Trong `crawler_core/engine.py`:
     - Bổ sung xử lý `self.scan_mode == "gap_fill"`.
     - Thuật toán tìm các đoạn dải số còn thiếu (Missing Gaps) trong khoảng `[min_tin, max_tin]` của tỉnh, đặc biệt ưu tiên các MST trong `bocao_records` chưa có trong CSDL.
     - Tự động sinh hàng đợi seed cho các worker lấp đầy các lỗ hổng.
3. **Frontend UI (`static/js/components/crawler-grid.js` & `crawler-list.js`):**
   - Bổ sung option **`🧩 Quét Lấp Lỗ Hổng (Gap-Fill)`** vào danh sách thả xuống *Chế độ quét*.
   - Hiển thị thông tin đỉnh động `TIN Max (GDT + ĐKKD)` trên từng thẻ tỉnh.

---

## 3. Kiểm Soát Giới Hạn Dòng Code (Line Limits - [GEMINI.md](file:///c:/tracuuhoadon.gdt.gov.vn/GEMINI.md))

| Tệp tin | Dự kiến số dòng | Ngưỡng tối đa | Biện pháp tuân thủ |
|:---|:---:|:---:|:---|
| `server_app/services/bocao_reconcile_sync.py` | 110 – 140 dòng | 200 dòng | Tách module riêng, không nhồi vào `bocao_crawler.py` |
| `src/modules/bocao/bocao-reconcile.service.ts` | 140 – 160 dòng | 180 dòng | Giữ truy vấn gọn, tái sử dụng helper |
| `src/modules/bocao/bocao.routes.ts` | 120 – 135 dòng | 170 dòng | Đăng ký route rõ ràng, ủy quyền logic |
| `static/js/components/bocao-reconcile-tab.js` | 165 – 175 dòng | 180 dòng | Tách method xử lý sync ra gọn gàng |
| `crawler_core/engine.py` | 180 – 195 dòng | 200 dòng | Refactor hàm gap fill ngắn gọn, tách generator nếu cần |
| `static/js/components/crawler-grid.js` | 140 – 155 dòng | 180 dòng | Thêm option dropdown & dynamic max badge |

---

## 4. Kế Hoạch Xác Thực & Nghiệm Thu

1. **Kiểm tra CSDL:**
   - Thêm cột thành công vào bảng `bocao_records`.
2. **Kiểm tra TypeScript & Line Limit:**
   - `npx tsc --noEmit` đạt 0 lỗi biên dịch.
   - Kiểm tra số dòng code toàn bộ các tệp đảm bảo < 180-200 dòng.
3. **Kiểm tra API & Worker:**
   - Gọi `POST /api/bocao/reconcile/sync-missing` -> worker chạy quét thử nghiệm trên danh sách 60 MST.
   - Kiểm tra cập nhật `sync_status` và ghi nhận kết quả.
4. **Kiểm tra Giao diện (Playwright MCP):**
   - Mở giao diện `http://localhost:8123`, truy cập `⚖️ Đối Soát Bố Cáo & Thuế`.
   - Bấm nút `⚡ Quét Bù Vào Thuế` và kiểm tra phản hồi giao diện.
   - Chuyển sang `📊 Quản Lý Quét Đa Tỉnh` (`CrawlerTab`), kiểm tra dropdown chế độ `🧩 Quét Lấp Lỗ Hổng (Gap-Fill)` và nút bắt đầu.
   - Chụp ảnh màn hình bằng chứng nghiệm thu và ghi nhật ký vào `docs/logs/`.
