# Kế Hoạch Triển Khai: Tích Hợp Tab Quản Trị & Điều Khiển Dịch Vụ Liên Quan (Services Control Center)

> **Mã số tài liệu:** `79_20261011_095000_implementation_plan.md`  
> **Topic liên quan:** [Topic 15: Tích Hợp Tab Quản Trị & Điều Khiển Các Dịch Vụ Liên Quan](file:///c:/tracuuhoadon.gdt.gov.vn/docs/topics/topic-15-services-control-tab.md)  
> **Thời gian tạo:** 11/10/2026 — 09:50:00  
> **Trạng thái:** 🟡 ĐANG TRIỂN KHAI

---

## 1. Mục Tiêu Kỹ Thuật (Objective)
- Xây dựng một **Tab chuyên biệt ("Điều Khiển Dịch Vụ")** trên giao diện Web Dashboard Vue 3 và Sidebar.
- Cho phép người quản trị trực tiếp giám sát trạng thái sức khỏe và thực hiện các thao tác: **Start (Bật)**, **Stop (Tắt)**, **Reset / Restart (Khởi động lại)** đối với tất cả các dịch vụ thành phần trong hệ sinh thái:
  1. **Windows Service `GDTTaxCrawler`**: Dịch vụ nền chính (Service Controller NSSM).
  2. **Fastify Web Server & REST API**: Cổng 8123 (Web GUI & API Gateway).
  3. **Python AI Worker**: Cổng 8124 (Bộ giải AI CAPTCHA & Scraper Bridge).
  4. **PostgreSQL Database Server**: Cổng 5432 (Connection Pool, Ping test, Active Clients).
  5. **Crawler Auto Schedulers**: Lập lịch tự động Quét đỉnh 6h & Fill lỗ hổng 12h.
  6. **Data Enrichment Worker**: Bộ làm giàu dữ liệu thuộc tính NNT từ Xinvoice.

---

## 2. Quy Chuẩn Bắt Buộc ([`GEMINI.md`](file:///c:/tracuuhoadon.gdt.gov.vn/GEMINI.md))
- Giới hạn dòng code: Mỗi tệp mới hoặc sửa đổi phải $\le 180$ dòng (hard cap 200 dòng).
- TypeScript: `strict: true`, không dùng `any`, sử dụng `import type`.
- Frontend: Vue 3 `<script setup lang="ts">`, phong cách thiết kế VNPT VDDS.

---

## 3. Kiến Trúc & Các Tệp Mã Nguồn Cần Triển Khai

### 3.1. Backend Fastify Module (`src/modules/services/`)
- `src/modules/services/services.types.ts`: Khai báo enum, interface cho ServiceInfo, ServiceStatusResponse, ServiceActionRequest (< 100 dòng).
- `src/modules/services/services.service.ts`: Xử lý kiểm tra socket port (net.Socket), kiểm tra Windows Service qua `sc query`, kiểm tra DB pool, và thực thi các lệnh `start`, `stop`, `restart` (< 170 dòng).
- `src/modules/services/services.routes.ts`: Đăng ký REST API endpoints:
  - `GET /api/services/status`: Trả về danh sách chi tiết 6 dịch vụ.
  - `POST /api/services/control`: Điều khiển từng dịch vụ (`service_id`, `action`).
  - `POST /api/services/restart_all`: Khởi động lại toàn bộ an toàn.
  - Alias `/api/system/reset`, `/api/system/restart` cho tương thích ngược (< 140 dòng).
- `src/modules/services/index.ts`: Public exports (< 15 dòng).
- Đăng ký `servicesRoutes` trong `src/app.ts`.

### 3.2. Frontend Vue 3 Component (`frontend/src/`)
- `frontend/src/components/services/ServicesTab.vue`:
  - Thẻ tóm tắt chỉ số: Tổng số service, Số service online, Số service offline, Độ trễ DB.
  - Grid card cho từng service với Icon, Tên, Badge trạng thái, Đèn LED, Thông số kỹ thuật (PID, Port, Uptime), và Bộ 3 nút `▶ Start`, `⏹ Stop`, `🔄 Restart`.
  - Hộp thoại xác nhận an toàn trước khi Restart/Stop các dịch vụ trọng yếu.
  - Tự động nạp lại định kỳ 3 giây (< 180 dòng).
- Cập nhật `frontend/src/components/layout/AppSidebar.vue`: Thêm mục menu "Điều Khiển Dịch Vụ" (icon 🛠️).
- Cập nhật `frontend/src/App.vue`: Nhập và hiển thị `ServicesTab`.
- Cập nhật `frontend/src/api/client.ts`: Thêm các hàm `getServicesStatus()`, `controlService()`, `restartAllServices()`.

---

## 4. Kế Hoạch Xác Thực (4C Verification Model)
- **C1 — Code Standards:** Chạy `npm run check:lines` bảo đảm 100% tệp $< 180$ dòng.
- **C2 — Build Check:** Chạy `npm run build` để đóng gói Vue 3 Vite SFC và kiểm tra TypeScript `vue-tsc`.
- **C3 — Server Regression:** Chạy `npm run test:server` bảo đảm 12/12 kiểm thử đạt chuẩn.
- **C4 — Live Verification:** Kiểm tra API `/api/services/status` và xác thực giao diện thực tế.
