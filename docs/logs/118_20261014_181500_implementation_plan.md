# Kế Hoạch Chuyển Đổi Toàn Bộ Từ Vue Sang Next.js (Full-Stack Unified App Router Với Thư Mục SRC & ULID)

> **Mã số kiểm toán:** `118_20261014_181500_implementation_plan`  
> **Thời gian tạo:** 2026-10-14 18:15:00 (ICT)  
> **Chiến lược:** Hợp nhất toàn diện (Unified Full-stack) tại thư mục gốc `src/` — One-shot Migration 43 Components & Chuẩn Định Danh ULID  
> **Trạng thái:** ✅ Đã phê duyệt & thực thi

---

## 1. Mô Tả Mục Tiêu (Goal Description)

Theo yêu cầu và thống nhất phương án kiến trúc với người dùng:
1. **Chuyển đổi toàn diện từ Vue 3 sang Next.js App Router:** Thay thế hoàn toàn ứng dụng Vue 3 (43 components, 7 composables, Vite SPA) bằng React 18/19 & Next.js 14/15 App Router với cấu trúc thư mục chuẩn `src/`.
2. **Hợp nhất Full-Stack tại thư mục gốc `src/`:**
   - Cung cấp bộ **Next.js App Router Route Handlers** (`src/app/api/**/route.ts`) đồng thời duy trì tính tương thích kép với Fastify Gateway (`src/app.ts` / `src/server.ts`) trên cổng `8123`.
   - Tái sử dụng nguyên vẹn tầng dịch vụ nghiệp vụ cốt lõi và kết nối CSDL PostgreSQL (`src/db/pool.ts`, `src/modules/*/*.service.ts`, `src/modules/htkk/`, `src/modules/bocao/`).
3. **Áp dụng nghiêm ngặt chuẩn định danh bất biến ULID:**
   - Mọi tệp mã nguồn mới (`.ts`, `.tsx`) trong `src/app/`, `src/components/`, `src/hooks/`, `src/api/`, `src/types/` bắt buộc có header 2 dòng đầu tiên:
     ```typescript
     // @id 01M4W... (26 ký tự Crockford Base32)
     // @related 01M4..., 01M4...
     ```
   - Không có bất kỳ xung đột ULID (0 collision) hay liên kết hỏng (0 broken links) khi kiểm toán bằng `scripts/audit_ulid.py` và `scripts/audit_code_graph.py`.
4. **Bảo toàn 100% năng lực hệ thống hiện hành:**
   - **Bảng ma trận dữ liệu TanStack Table v8 (React):** Kéo giãn kích thước cột (Column Resizing), tùy chọn Page Size [30 / 50 / 100], đồng bộ hai chiều URL Search Parameters (`?tab=...&pageSize=...&q=...`) và lưu bộ nhớ đệm `localStorage`.
   - **Luồng dữ liệu thời gian thực (Server-Sent Events - SSE):** `/api/stream` hoạt động liên tục không ngắt quãng.
   - **Xuất tệp báo cáo:** Xuất Excel XLSX (`exceljs`) và CSV UTF-8 BOM.
   - **Quy chuẩn mã nguồn (`GEMINI.md`):** Tuân thủ tuyệt đối giới hạn $\le 180$ dòng cho mỗi tệp tin, 100% Type-Safe (không dùng `any`).
