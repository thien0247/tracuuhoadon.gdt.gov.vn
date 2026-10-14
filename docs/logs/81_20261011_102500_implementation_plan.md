# Kế Hoạch Triển Khai: Bổ Sung Tham Số Parameter Để Gọi & Kích Hoạt Dịch Vụ

> **Mã số tài liệu:** `81_20261011_102500_implementation_plan.md`  
> **Topic liên quan:** [Topic 15: Tích Hợp Tab Quản Trị & Điều Khiển Toàn Bộ Các Dịch Vụ Liên Quan](file:///c:/tracuuhoadon.gdt.gov.vn/docs/topics/topic-15-services-control-tab.md)  
> **Thời gian tạo:** 11/10/2026 — 10:25:00  
> **Trạng thái:** 🟡 ĐANG TRIỂN KHAI

---

## 1. Mục Tiêu Kỹ Thuật (Objective)
Bổ sung cơ chế truyền và xử lý **tham số (parameters)** linh hoạt khi người dùng kích hoạt, gọi hoặc điều khiển các dịch vụ thành phần trên hệ thống:
1. **Tiến trình Quét Tự Động (`crawler_scheduler`):**
   - Tham số: `mode` (`both`, `newest`, `gap_fill_500`), `max_concurrent_provinces` (1–5), `gap` (bước nhảy), `num_workers` (số luồng), `reset_on_existing` (vét sâu).
2. **Bộ Giải AI CAPTCHA & Scraper (`python_worker`):**
   - Tham số: `max_rps` (tốc độ trần F5 WAF), `timeout_sec` (thời gian chờ phản hồi).
3. **Cơ Sở Dữ Liệu PostgreSQL (`postgresql_db`):**
   - Tham số: `query_type` (`ping`, `count_records`, `active_connections`).
4. **Windows Service `GDTTaxCrawler`:**
   - Tham số: `action_type` (`standard`, `force_cleanup`).

---

## 2. Quy Chuẩn Bắt Buộc ([`GEMINI.md`](file:///c:/tracuuhoadon.gdt.gov.vn/GEMINI.md))
- Giới hạn dòng code: Mọi tệp TypeScript và Vue $\le 180$ dòng (hard cap 200 dòng).
- Kiến trúc phân rã: Tách Modal cấu hình tham số thành sub-component độc lập [`ServiceParamModal.vue`](file:///c:/tracuuhoadon.gdt.gov.vn/frontend/src/components/services/ServiceParamModal.vue) để giữ `ServicesTab.vue` tinh gọn (< 160 dòng).
- Type Safety: Nghiêm cấm `any`, kiểm soát chặt chẽ schema tham số.

---

## 3. Kiến Trúc & Các Tệp Mã Nguồn Cần Thay Đổi

### 3.1. Backend Fastify
- `src/modules/services/services.types.ts`: Định nghĩa `ServiceParameterDef`, mở rộng `ServiceDetail` có `parameters?: ServiceParameterDef[]` (< 80 dòng).
- `src/modules/services/services.service.ts`: Cấu hình danh mục tham số và xử lý điều hướng `dto.params` vào các module lõi tương ứng (< 180 dòng).

### 3.2. Frontend Vue 3
- `frontend/src/components/services/ServiceParamModal.vue`: Modal nhập tham số động dạng popup, render form theo kiểu dữ liệu (`select`, `number`, `boolean`, `string`) với giá trị mặc định (< 130 dòng).
- `frontend/src/components/services/ServicesTab.vue`: Bổ sung nút `⚙️ Tham Số` trên các card dịch vụ có tham số cấu hình (< 150 dòng).

---

## 4. Kế Hoạch Xác Thực (4C Verification Model)
- **C1 — Code Standards:** `npm run check:lines` bảo đảm 100% tệp $< 180$ dòng.
- **C2 — Build Check:** `npm run build` xác nhận Vite và `vue-tsc` biên dịch sạch.
- **C3 — Server Regression:** Chạy `npm run test:server` kiểm tra API với payload có `params`.
- **C4 — Live Verification:** Kiểm tra thực thi lệnh kích hoạt dịch vụ có tham số.
