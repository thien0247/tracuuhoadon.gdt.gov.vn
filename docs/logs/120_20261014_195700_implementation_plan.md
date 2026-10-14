# Kế Hoạch Triển Khai: Loại Bỏ Hoàn Toàn Fastify — Thuần 100% Next.js 14 App Router (Native Web Fetch & ULID Graph)

## 1. Mục Tiêu & Lý Do Kiến Trúc

Loại bỏ 100% sự phụ thuộc vào Fastify (`fastify`, `@fastify/cors`, `@fastify/static`), chuyển toàn bộ 8 module routes (`provinces`, `records`, `crawler`, `stream`, `enrichment`, `htkk`, `bocao`, `services`) và `src/app.ts` sang **Pure Next.js 14 App Router Native Handlers (`NextRequest` / `NextResponse` + Web `ReadableStream` SSE)**, đồng thời nâng cấp `src/server.ts` khởi chạy trực tiếp Next.js HTTP Server trên cổng `8123` cho Windows Service `GDTTaxCrawler`.

## 2. Danh Sách Thay Đổi Chính

1. **8 Module Routes (`src/modules/*/*.routes.ts`):** Chuyển từ `FastifyPluginAsync` sang `handle*Routes(req: NextRequest, pathname: string, method: string): Promise<NextResponse | null>`, giữ nguyên 100% mã định danh ULID (`// @id` và `// @related`).
2. **Real-time SSE (`src/modules/stream/stream.routes.ts`):** Dùng chuẩn Web `ReadableStream` trực tiếp trong Next.js.
3. **Dispatcher & Server (`src/app.ts` & `src/server.ts`):**
   - `src/app.ts`: Hàm điều phối `dispatchApiRequest(req: NextRequest): Promise<NextResponse>` thuần Next.js.
   - `src/server.ts`: Khởi chạy `next({ dev: false, hostname: env.host, port: env.port })` cùng `loadProvinces()` và `startDbStatsWorker()`.
4. **Route Handlers mới (`src/app/health/route.ts`, `src/app/graphify-out/[file]/route.ts`):** Phục vụ `/health` và `/graphify-out/:file` trực tiếp từ Next.js App Router.
5. **Dependencies & Kiểm thử (`package.json`, `tests/test_ts_server.ts`):** Gỡ bỏ `fastify`, `@fastify/cors`, `@fastify/static`; cập nhật `tests/test_ts_server.ts` test trực tiếp qua `NextRequest`/`NextResponse`.
