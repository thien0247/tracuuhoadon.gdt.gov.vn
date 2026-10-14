# KẾ HOẠCH TRIỂN KHAI (IMPLEMENTATION PLAN)
## Chuyển Đổi Toàn Diện Frontend Sang Chuẩn Vue 3 Hiện Đại (Vite + SFC .vue + TypeScript)

- **Mã kế hoạch:** STT 70  
- **Thời gian lập:** 10/10/2026 17:36:00  
- **Tác giả:** Antigravity AI Pair Programmer  
- **Trạng thái:** 🚀 Đang triển khai  
- **Mục tiêu:** Chuyển đổi toàn bộ Web Dashboard từ mô hình CDN `<script>` rời rạc sang kiến trúc chuẩn Vue 3 với Vite, Single File Components (`.vue`), `<script setup lang="ts">`, đóng gói bundle tĩnh `dist/`, tối ưu hóa hiệu năng và tuân thủ tuyệt đối quy chuẩn `< 180 dòng / file`.

---

## 1. Hiện Trạng & Lý Do Chuyển Đổi

### 1.1. Hiện trạng
- Giao diện hiện tại dùng Vue 3 nạp qua CDN `vue.global.prod.min.js`.
- 24 components nằm trong `static/js/components/*.js` được khai báo bằng JavaScript object với template string và gắn vào `window.*`.
- `templates/index.html` phải nạp 26 thẻ `<script>` rời rạc và Tailwind CSS CDN runtime (`cdn.tailwindcss.com`).
- Thiếu TypeScript type checking cho giao diện, phụ thuộc kết nối Internet khi tải CDN.

### 1.2. Mục tiêu kiến trúc sau chuyển đổi
- Thư mục `frontend/` độc lập với cấu trúc chuẩn:
  - **Vite 5** làm build tool siêu tốc (HMR < 50ms, bundle tối ưu).
  - **Vue 3.4+** với Single File Components (`.vue`) và `<script setup lang="ts">`.
  - **TypeScript strict** (`lang="ts"`), zero `any`, an toàn kiểu dữ liệu.
  - **Tailwind CSS 3.4** và **PostCSS** biên dịch tĩnh, không nạp runtime script, tích hợp toàn bộ Design Tokens VDDS (VNPT Blue, Dark Mode adapter).
  - Xuất bản phẩm bundle đặt tại `frontend/dist/`.
  - Backend Fastify (`src/app.ts`) và FastAPI (`server_app/routers/views.py`) ưu tiên phục vụ trực tiếp `frontend/dist/` (fallback an toàn sang `templates/index.html`).
  - Toàn bộ file `.vue` tuân thủ nghiêm ngặt giới hạn $\le 180$ dòng code theo `GEMINI.md`.

---

## 2. Bản Đồ Phân Rã Thành Phần (Component Map & Boundaries)

```
frontend/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── src/
    ├── main.ts                     # Entry point khởi tạo Vue 3 app
    ├── App.vue                     # Root shell, bố cục Header + Sidebar + Main Tabs + Footer
    ├── api/
    │   └── client.ts               # Type-safe API Client cho Fastify / FastAPI
    ├── types/
    │   └── index.ts                # TypeScript interfaces (Province, CrawlerStatus, MasterMetrics, etc.)
    ├── composables/
    │   ├── useTheme.ts             # Quản lý Dark/Light mode VDDS
    │   ├── useSSE.ts               # Quản lý luồng Server-Sent Events (/api/stream)
    │   └── useCrawler.ts           # Nghiệp vụ điều khiển crawler & cấu hình rps
    ├── styles/
    │   └── main.css                # VDDS Design Tokens, font, dark mode class overrides
    └── components/
        ├── layout/
        │   ├── AppHeader.vue       # Header 50px cố định, logo, SSE status, theme/inspector toggle
        │   ├── AppSidebar.vue      # Sidebar thu gọn 240px <-> 64px, menu điều hướng, quick actions
        │   └── AppFooter.vue       # Footer 36px hiển thị phiên bản & DB status
        ├── metrics/
        │   └── MasterMetrics.vue   # 5 thẻ chỉ số toàn quốc (Tốc độ rps, Running, Queried, Found, DB)
        ├── crawler/
        │   ├── CrawlerTab.vue      # Tab điều khiển quét đa tỉnh
        │   ├── CrawlerGrid.vue     # Lưới thẻ trạng thái từng tỉnh
        │   ├── CrawlerList.vue     # Bảng danh sách trạng thái từng tỉnh
        │   ├── CrawlerSchedule.vue # Modal cấu hình lịch quét tự động
        │   ├── CrawlerBocao.vue    # Modal quét bù Bố cáo
        │   └── ConsoleLog.vue      # Bảng log SSE real-time có autoscroll
        ├── reports/
        │   ├── CrawledReport.vue   # Báo cáo sản lượng crawl theo ngày/tháng/năm
        │   └── HealthReport.vue    # Giám sát sức khỏe 62 tỉnh thành & TIN Max
        ├── bocao/
        │   ├── BocaoTab.vue        # Bố cáo ĐKKD mới nhất
        │   ├── BocaoReconcile.vue  # Đối soát Bố cáo và CSDL thuế GDT
        │   ├── BocaoScanPanel.vue  # Bảng điều khiển quét bù MST
        │   └── BocaoSolrModal.vue  # Modal tra cứu DKKD Solr
        ├── search/
        │   ├── SearchTab.vue       # Tra cứu doanh nghiệp theo tên/MST/tỉnh
        │   ├── FilterTab.vue       # Lọc theo địa bàn xã mới/cơ quan thuế & xuất CSV/XLSX
        │   ├── FilterTable.vue     # Bảng hiển thị kết quả lọc có số điện thoại tran_tel
        │   └── TaxDetailModal.vue  # Modal xem chi tiết người nộp thuế
        ├── enrichment/
        │   ├── EnrichmentTab.vue   # Tab làm giàu dữ liệu thuế
        │   └── EnrichmentProg.vue  # Thanh tiến độ đồng bộ 62 tỉnh
        ├── config/
        │   └── ConfigTab.vue       # Cấu hình tham số và activation TIN
        ├── graphify/
        │   └── GraphifyTab.vue     # Trực quan hóa đồ thị tri thức kiến trúc
        └── common/
            ├── SearchableSelect.vue # Combobox tìm kiếm chọn 1
            ├── MultiSelect.vue     # Combobox chọn nhiều mục
            ├── AiInspector.vue     # Modal/Badge tra cứu thành phần AI Inspector
            └── AiBadge.vue         # Wrapper bọc thành phần
```

---

## 3. Kế Hoạch Thực Hiện Theo Các Pha

### Pha 1: Khởi Tạo Dự Án Vite & Cấu Hình Môi Trường
1. Tạo `frontend/package.json` với các dependencies cần thiết (`vue`, `vite`, `@vitejs/plugin-vue`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`).
2. Cài đặt các gói phụ thuộc qua `npm --prefix frontend install`.
3. Cấu hình `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`.
4. Thiết lập `frontend/index.html` và `frontend/src/styles/main.css` kế thừa trọn vẹn Design System VDDS.

### Pha 2: Xây Dựng Core Layer (API Client, Types, Composables)
1. Tạo `frontend/src/types/index.ts` định nghĩa toàn bộ interface dữ liệu.
2. Tạo `frontend/src/api/client.ts` chuẩn TypeScript, type-safe, không dùng `any`.
3. Tạo composables: `useTheme.ts`, `useSSE.ts`, `useCrawler.ts`.

### Pha 3: Triển Khai Toàn Bộ Single File Components (`.vue`)
1. Triển khai các component Layout: `AppHeader.vue`, `AppSidebar.vue`, `AppFooter.vue`, `MasterMetrics.vue`.
2. Triển khai nhóm Crawler: `CrawlerTab.vue`, `CrawlerGrid.vue`, `CrawlerList.vue`, `CrawlerSchedule.vue`, `CrawlerBocao.vue`, `ConsoleLog.vue`.
3. Triển khai nhóm Báo Cáo: `CrawledReport.vue`, `HealthReport.vue`.
4. Triển khai nhóm Bố Cáo: `BocaoTab.vue`, `BocaoReconcile.vue`, `BocaoScanPanel.vue`, `BocaoSolrModal.vue`.
5. Triển khai nhóm Tra Cứu & Lọc: `SearchTab.vue`, `FilterTab.vue` (kèm cột `tran_tel`), `FilterTable.vue`, `TaxDetailModal.vue`.
6. Triển khai nhóm Làm Giàu & Cấu Hình: `EnrichmentTab.vue`, `EnrichmentProg.vue`, `ConfigTab.vue`.
7. Triển khai nhóm Đồ Thị & Common: `GraphifyTab.vue`, `SearchableSelect.vue`, `MultiSelect.vue`, `AiInspector.vue`, `AiBadge.vue`.
8. Kiểm tra số dòng code: **Toàn bộ file $\le 180$ dòng**.

### Pha 4: Tích Hợp Build & Backend Serving
1. Thêm scripts vào root `package.json`: `"build:ui"` và `"dev:ui"`.
2. Cập nhật `src/app.ts` để phục vụ `frontend/dist` khi có sẵn (fallback `templates/index.html`).
3. Cập nhật `server_app/routers/views.py` để phục vụ `frontend/dist` nếu tồn tại.
4. Chạy lệnh build: `npm run build:ui`.

### Pha 5: Kiểm Thử & Nghiệm Thu
1. Chạy `npm run check:types` kiểm tra TypeScript cả backend và frontend.
2. Chạy `npm run test:server` kiểm tra toàn bộ API backend.
3. Chạy `python test_modular.py` kiểm tra hồi quy hệ thống.
4. Khởi động lại service và kiểm tra Web Dashboard trên trình duyệt.
5. Lập biên bản nghiệm thu walkthrough (STT 71) và cập nhật `docs/logs/INDEX.md`.
