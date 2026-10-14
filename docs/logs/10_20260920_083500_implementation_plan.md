# Kế Hoạch Triển Khai: Chuẩn Hóa Dữ Liệu Sync Theo API & Giám Sát Tiến Trình Real-time

Tài liệu này xác định đặc tả kỹ thuật và kế hoạch chi tiết nhằm khắc phục triệt để vấn đề **dữ liệu sync không chính xác**, chuyển dịch sang nguyên tắc **chỉ cập nhật CSDL khi và chỉ khi kết quả truy vấn API trả về tồn tại**, đồng thời bổ sung **bộ giám sát tiến trình thời gian thực (Real-time Progress & Metrics)** đầy đủ chỉ số thành công, thất bại, thời gian và tỷ lệ phần trăm.

---

## 1. Bản Viết Lại Prompt Chuẩn (Standardized Specification)

> **MỤC TIÊU BÀI TOÁN:**
> Xây dựng cơ chế đồng bộ và làm giàu dữ liệu thuế (Tax Enrichment Engine) đạt độ tin cậy tuyệt đối:
> 1. **Tính Chính Xác (API-Verified Only):** Tuyệt đối loại bỏ cơ chế suy đoán offline phỏng đoán (heuristic). Chỉ cập nhật các trường `org_type`, `address`, `tax_department` vào CSDL `tax_records` khi và chỉ khi kết quả truy vấn từ API dịch vụ trả về trạng thái hợp lệ và người nộp thuế (NNT) thực sự tồn tại.
> 2. **Xử Lý Lỗi & Không Tồn Tại:** Nếu API trả về `404 (Không tìm thấy)`, `null`, hoặc lỗi kết nối/tần suất, hệ thống ghi nhận là **Thất Bại / Không Tồn Tại**, tuyệt đối không ghi đè dữ liệu rác vào CSDL.
> 3. **Bảng Điều Khiển Giám Sát Tiến Trình (Real-time Live Progress & Metrics):** Trong quá trình sync một tỉnh hoặc danh sách MST, giao diện người dùng phải hiển thị trực tiếp:
>    - **Thanh tiến trình (Progress Bar):** Tỷ lệ hoàn thành trực quan `%` và số lượng `Đã xử lý / Tổng số`.
>    - **Số lượng Thành Công:** Đếm số MST truy vấn API tồn tại và đã cập nhật thành công vào CSDL.
>    - **Số lượng Thất Bại:** Đếm số MST không tìm thấy (404 / null) hoặc lỗi kết nối.
>    - **Thời Gian Đã Chạy (Elapsed Time):** Định dạng `mm:ss`.
>    - **Thời Gian Còn Lại Ước Tính (ETA):** Dự tính dựa trên nhịp độ xử lý rate-limit thực tế.
>    - **% Tỷ Lệ Thành Công:** `(Thành công / Đã xử lý) * 100%` (màu xanh lá).
>    - **% Tỷ Lệ Thất Bại:** `(Thất bại / Đã xử lý) * 100%` (màu đỏ / hổ phách).
>    - **Mã MST Hiện Tại:** Hiển thị trực tiếp MST đang được truy vấn.
>    - **Nút Điều Khiển:** Nút `⏹ Dừng lại (Stop)` tức thời.

---

## User Review Required

> [!IMPORTANT]
> **Quy Tắc Làm Sạch Dữ Liệu Đã Suy Đoán Sai Trước Đây:**
> Ở phiên trước, tính năng Offline Heuristic Update đã cập nhật 39.803 bản ghi của tỉnh 49 (Lạng Sơn) bằng cách suy đoán tên hộ kinh doanh và địa chỉ thô.
> **Đề xuất:** Bổ sung endpoint `POST /api/enrichment/reset-unverified` để dọn dẹp các bản ghi chưa qua kiểm chứng API thực tế, đưa về trạng thái chờ đồng bộ chuẩn từ API để đảm bảo số liệu 100% trung thực.

> [!WARNING]
> **Giới Hạn Tần Suất Của API Miễn Phí:**
> API Xinvoice miễn phí có giới hạn Cloudflare `10 requests / 30 seconds` (~1 req / 3.2s). Khi chạy Sync Online hàng nghìn MST, hệ thống sẽ chạy nền tuần tự và người dùng có thể theo dõi tiến trình qua bảng giám sát trực tiếp.

---

## Open Questions

Không có câu hỏi chặn. Hệ thống tuân thủ toàn bộ các tiêu chuẩn thiết kế VNPT VDDS và giới hạn dòng code (< 200 dòng/file).

---

## Proposed Changes

### Component 1: Enrichment Job Manager & Tracking Backend (`src/modules/enrichment/`)

#### [NEW] [`src/modules/enrichment/enrichment.job.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/enrichment/enrichment.job.ts) (Dự kiến ~130 dòng, < 180 dòng)
- Xây dựng class `EnrichmentJobManager`:
  - Quản lý trạng thái các tiến trình sync đang chạy (`Map<string, SyncJobState>`).
  - Ghi nhận chi tiết: `prefix`, `total`, `processed`, `success`, `failed`, `startTime`, `elapsedSeconds`, `estimatedSecondsRemaining`, `successRate`, `failureRate`, `progressPercent`, `currentTin`, `status`.
  - Hàm `startJob(prefix, provinceName)`: Khởi tạo luồng xử lý nền rate-limited, query API Xinvoice cho từng bản ghi.
  - Hàm `stopJob(prefix)`: Huỷ luồng xử lý ngay lập tức.
  - Hàm `getJob(prefix)` và `getAllJobs()`: Trả về trạng thái thời gian thực.

#### [MODIFY] [`src/modules/enrichment/enrichment.types.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/enrichment/enrichment.types.ts) (Hiện 71 dòng -> ~95 dòng, < 150 dòng)
- Định nghĩa interface `SyncJobProgress`:
  - `prefix: string`, `provinceName: string`, `isRunning: boolean`
  - `totalToProcess: number`, `processedCount: number`, `successCount: number`, `failedCount: number`
  - `elapsedSeconds: number`, `estimatedSecondsRemaining: number`
  - `successRate: number`, `failureRate: number`, `progressPercent: number`
  - `currentTin?: string`, `lastStatusMessage?: string`

#### [MODIFY] [`src/modules/enrichment/enrichment.service.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/enrichment/enrichment.service.ts) (Hiện 150 dòng -> ~140 dòng, < 180 dòng)
- Loại bỏ hoàn toàn khối suy đoán fallback trong `enrichSingleRecord`:
  - Chỉ khi `fetchXinvoice(cleanTin)` trả về kết quả tồn tại (HTTP 200, có `orgType` hoặc `name`), mới thực hiện câu lệnh `UPDATE tax_records SET org_type = ..., address = ..., tax_department = ..., enriched_at = NOW()`.
  - Nếu API trả về `null` / lỗi: Trả về `{ success: false, notFound: true }`, KHÔNG update vào CSDL.
- Bổ sung hàm `resetUnverifiedRecords(prefix?)`: Reset các bản ghi chưa xác thực về `NULL` để chuẩn bị sync chuẩn.
- Chuyển giao việc quản lý tiến trình sang `EnrichmentJobManager`.

#### [MODIFY] [`src/modules/enrichment/enrichment.routes.ts`](file:///c:/tracuuhoadon.gdt.gov.vn/src/modules/enrichment/enrichment.routes.ts) (Hiện 100 dòng -> ~130 dòng, < 170 dòng)
- Thêm endpoint `GET /api/enrichment/jobs`: Lấy danh sách toàn bộ job đang hoạt động.
- Thêm endpoint `GET /api/enrichment/jobs/:prefix`: Lấy tiến trình chi tiết của tỉnh đang sync.
- Thêm endpoint `POST /api/enrichment/reset-unverified`: Làm sạch dữ liệu suy đoán không chuẩn xác.

---

### Component 2: Frontend VDDS Components (`static/js/components/`)

#### [NEW] [`static/js/components/enrichment-progress.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/enrichment-progress.js) (Dự kiến ~120 dòng, < 180 dòng)
- Sub-component độc lập hiển thị Panel Giám Sát Tiến Trình Đồng Bộ Thời Gian Thực:
  - **Header trạng thái:** Tên tỉnh đang sync, Badge nhấp nháy "Đang đồng bộ trực tuyến API", MST hiện tại.
  - **Thanh Progress Bar:** Hiển thị độ rộng theo `progressPercent%`, chuyển màu sinh động theo chuẩn VDDS.
  - **Lưới 4 Thẻ Đo Lường Live:**
    1. **Thành Công:** Số lượng + `% Thành công` (xanh lá).
    2. **Thất Bại:** Số lượng + `% Thất bại` (đỏ/cam).
    3. **Thời Gian Chạy:** Đồng hồ đếm `mm:ss`.
    4. **Ước Tính Còn Lại (ETA):** `mm:ss`.
  - **Nút bấm hành động:** `⏹ Dừng Đồng Bộ (Stop Sync)` và nút đóng/ẩn panel.

#### [MODIFY] [`static/js/components/enrichment-tab.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/enrichment-tab.js) (Hiện 182 dòng -> ~145 dòng, < 180 dòng)
- Nhúng component `<enrichment-progress>` lên đầu trang khi có job đang chạy.
- Tự động polling tiến trình mỗi 1.5 giây khi có job hoạt động, tự động dừng polling khi job hoàn tất.
- Cập nhật các nút bấm: Thêm tùy chọn "Dọn dẹp dữ liệu chưa xác thực", cập nhật nút sync trực tuyến.

#### [MODIFY] [`static/js/api.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/api.js) (Hiện 181 dòng -> ~195 dòng, < 200 dòng)
- Bổ sung `getActiveEnrichmentJobs()`, `getEnrichmentJob(prefix)`, `resetUnverifiedEnrichment(prefix)`.

#### [MODIFY] [`templates/index.html`](file:///c:/tracuuhoadon.gdt.gov.vn/templates/index.html)
- Bổ sung script tag nhúng `enrichment-progress.js` trước `enrichment-tab.js`.

---

## Verification Plan

### Automated Tests
1. **Kiểm tra giới hạn số dòng code TypeScript (< 200 dòng/tệp):**
   ```bash
   npx tsx tests/check_ts_line_limits.ts
   ```
2. **Kiểm tra giới hạn số dòng code Python & Vue components (< 200 dòng/tệp):**
   ```bash
   python -c "from test_modular import check_line_counts; check_line_counts()"
   ```
3. **Kiểm tra TypeScript build & type check:**
   ```bash
   npm run build
   ```

### Functional & API Tests
1. **Kiểm tra nguyên tắc Chỉ Cập Nhật Khi API Tồn Tại:**
   - Query 1 MST không tồn tại (ví dụ `9999999999`): Đảm bảo không ghi bản ghi vào CSDL, trả về `notFound: true`.
   - Query 1 MST thực tế tồn tại: Đảm bảo cập nhật chính xác và đánh dấu thành công.
2. **Kiểm tra Giám Sát Tiến Trình Real-time:**
   - Kích hoạt sync một tỉnh qua API:
     - Kiểm tra endpoint `GET /api/enrichment/jobs` phản hồi đầy đủ `processed`, `success`, `failed`, `elapsedSeconds`, `estimatedSecondsRemaining`, `successRate`, `failureRate`.
   - Bấm dừng `POST /api/enrichment/province/:prefix/stop`: Đảm bảo tiến trình ngừng ngay lập tức.

### Visual & Browser Verification (Playwright)
- Sử dụng Playwright chụp ảnh giao diện Panel Tiến Trình Đồng Bộ Real-time:
  - Kiểm tra hiển thị thanh progress bar động.
  - Kiểm tra 4 thẻ đo lường (Thành công %, Thất bại %, Thời gian chạy, ETA).
  - Kiểm tra tương thích Dark Mode và Light Mode.
  - Lưu ảnh vào `docs/assets/vdds/` và đưa vào tài liệu nghiệm thu.
