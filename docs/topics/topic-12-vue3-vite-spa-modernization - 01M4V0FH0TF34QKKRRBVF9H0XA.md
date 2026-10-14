---
id: "01M4V0FH0TF34QKKRRBVF9H0XA"
aliases:
  - "topic-12-vue3-vite-spa-modernization"
  - "topic-12-vue3-vite-spa-modernization.md"
created_at: "2026-10-13T16:10:41.050023+00:00"
type: "documentation"
related_code:
  - 01M4V0HMM9D57KHSDBMMQEZD67
  - 01M4V0HMMAGER9D326B643B5RY
  - 01M4V0HMMC9CR0CWQBZ372WK6Q
  - 01M4V0HMMDYFYCBSHSRGXPKJWN
  - 01M4V0HMMFFGPHK4310775K1XK
  - 01M4V0HMMG8PD5BJN27YKGX4WP
  - 01M4V0HMMH14JRZKVYT1R8EGQX
  - 01M4V0HMMJTV6V77PFNGJ4V8K7
  - 01M4V0HMMK0CJ7THGHKEJ7C4W8
  - 01M4V0HMMMZMXQNRVDTK5G3DS0
  - 01M4V0HMMPX5WBQR893V0S0MVC
  - 01M4V0HMMQ4GCPB23PCFET1VN7
  - 01M4V0HMMRHY97GSJ5BP8N9DWG
  - 01M4V0HMMS4A7D3ZXQ6S7D6B6A
  - 01M4V0HMMVBBWHXC5609Q6682C
  - 01M4V0HMMW8W0PDCDGDYSZJBYQ
  - 01M4V0HMMX16CTKCDHJHWXZKTA
  - 01M4V0HMN0GKMBZKKM224EFBG7
  - 01M4V0HMN1N415JXZC6T3VRPFK
  - 01M4V0HMN32GRKFX1D0HVTVXFD
  - 01M4V0HMN5YJ7RWCSREJ4CSTM9
  - 01M4V0HMN6W2PBXHV9JWYJ86MW
  - 01M4V0HMN7FE4FE1E8F43DFEAA
  - 01M4V0HMN7RQJAYSHAG59PF1JQ
  - 01M4V0HMN8CRGK8ASNXFFBPNMN
  - 01M4V0HMNAYS9S56HXX3Y4Z264
  - 01M4V0HMNCXQ9YSTN0952D9K7Q
  - 01M4V0HMNDPX7HQ2MD3BTTFVNS
  - 01M4V0HMNFP54NSRTMHYDMZ9M4
  - 01M4V0HMNG67WYQGAJ650769V9
  - 01M4V0HMNJPJSF4E6XHZX7DC3Z
  - 01M4V0HMNMFBJWYTTBY5817MCT
  - 01M4V0HMNNDJW9HSABMQFV34GF
  - 01M4V0HMNP498R2TP9DW4E42CC
  - 01M4V0HMNR9DVYBS4PKA9P3ACP
  - 01M4V0HMNSQ56MXP848JV61FVB
  - 01M4V0HMNVM4S634MN7VYTNK44
  - 01M4V0HMNWVM2K7TD8J9CYHS8V
  - 01M4V0HMNXMKGV66HB630AFGQN
  - 01M4V0HMNZYFQF5C97DPYG8AR4
  - 01M4V0HMP0BNNZ0SW67AWG4GN2
  - 01M4V185C93JJXXTBKCA98G9KJ
  - 01M4V18JXRGFZS2AGBE3VJD8SP
---
# Topic 12: Chuyển Đổi Toàn Diện Frontend Sang Chuẩn Vue 3 Hiện Đại (Vite 5 + SFC .vue + TypeScript)

> **Mã Topic:** TOPIC-12  
> **Trạng thái:** ✅ Đã hoàn thành  
> **Ngày hoàn thành:** 10/10/2026  
> **Tài liệu liên quan:** `GEMINI.md`, `AGENTS.md`, `docs/logs/70_20261010_173600_implementation_plan.md`, `docs/logs/71_20261010_174800_walkthrough.md`  

---

## 1. Bối Cảnh & Mục Tiêu Kỹ Thuật

Trước đây, giao diện Web Dashboard của hệ thống GDT Tax Crawler được phát triển dựa trên cơ chế tải script rời rạc từ CDN runtime (`vue.global.prod.min.js`, `cdn.tailwindcss.com`) kết hợp với các component khai báo dạng đối tượng JavaScript toàn cục (`window.CrawlerTab`, v.v.) trong thư mục `static/js/components/`.

Mô hình cũ bộc lộ một số hạn chế:
1. Phụ thuộc kết nối mạng bên ngoài để tải CDN khi trình duyệt render lần đầu.
2. Không có cơ chế kiểm tra kiểu dữ liệu tại thời điểm biên dịch (type checking), tiềm ẩn lỗi runtime khi API trả về cấu trúc khác.
3. Không thể tận dụng tính năng Tree-shaking, minification và CSS purge của Vite/Tailwind hiện đại.

Mục tiêu của Topic 12:
- Tách biệt module Frontend độc lập trong thư mục `frontend/` sử dụng **Vite 5**, **Vue 3.4 Composition API** (`<script setup lang="ts">`), **TypeScript Strict Mode** (`verbatimModuleSyntax: true`), và **Tailwind CSS v3**.
- Đảm bảo 100% tệp SFC `.vue` $\le 180$ dòng theo quy định nghiêm ngặt tại `GEMINI.md`.
- Backend Fastify (`src/app.ts`) và FastAPI (`server_app/routers/views.py`) ưu tiên phục vụ production bundle tại `frontend/dist/`, đồng thời duy trì route `/legacy` phục vụ template cũ làm phương án dự phòng 100%.

---

## 2. Kiến Trúc & Phân Rã Component

Hệ thống frontend mới được tổ chức chặt chẽ theo mô hình modular:

```
frontend/src/
├── main.ts                   # Bootstrap createApp(App).mount('#app')
├── App.vue                   # Dashboard layout shell và router tab
├── api/client.ts             # Type-safe API client giao tiếp với Fastify Gateway
├── types/index.ts            # Type definitions (MasterMetrics, Province, Bocao, HTKK)
├── composables/              # useTheme, useSSE, useInspector, useCrawlerControl
├── styles/main.css           # VDDS tokens và style utilities
└── components/
    ├── common/               # AiBadge, AiInspector, SearchableSelect, MultiSelect
    ├── layout/               # AppHeader, AppSidebar, AppFooter, MasterMetrics
    ├── crawler/              # CrawlerTab, ConsoleLog, CrawlerGrid, CrawlerList, CrawlerSchedule, CrawlerBocao
    ├── reports/              # HealthReport, CrawledReport
    ├── search/               # SearchTab, FilterTab, FilterTable, TaxDetailModal
    ├── bocao/                # BocaoTab, BocaoReconcile, BocaoScanPanel, BocaoAutoCrawl, BocaoSolrModal
    ├── enrichment/           # EnrichmentTab, EnrichmentProg
    ├── config/               # ConfigTab
    └── graphify/             # GraphifyTab
```

---

## 3. Nghiệm Thu & Kiểm Thử Tự Động

1. **Kiểm tra giới hạn dòng code:** Toàn bộ 24 component `.vue` đều $\le 180$ dòng code (dao động từ 8 đến 180 dòng).
2. **Type Safety:** Lệnh `vue-tsc --noEmit` và `tsc --noEmit` hoàn tất với 0 lỗi. Toàn bộ codebase không sử dụng kiểu `any`.
3. **Build Bundle:** `npm run build:ui` tạo ra bundle gọn nhẹ: `dist/index.html` (0.83 KB), JS (261 KB, gzip 75 KB), CSS (57 KB, gzip 9.7 KB).
4. **Kiểm tra tích hợp máy chủ:** Cả 2 backend Fastify (`npm run test:server`) và FastAPI (`python test_modular.py`) đều vượt qua 100% các ca kiểm thử hồi quy.
