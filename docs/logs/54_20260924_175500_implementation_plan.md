# KẾ HOẠCH TRIỂN KHAI: TÍCH HỢP GRAPHIFY WEB VISUALIZER VÀO LOCAL WEB DASHBOARD
**Mã tài liệu:** `54_20260924_175500_implementation_plan`  
**Ngày lập:** 24/09/2026  
**Trạng thái:** ✅ Đã phê duyệt (Thực thi ngay)

---

## 1. MỤC TIÊU & BỐI CẢNH
Tích hợp bộ sản phẩm đồ thị tri thức `graphify-out/` (`graph.html`, `GRAPH_TREE.html`, `GRAPH_REPORT.md`) thành một Tab chức năng độc lập trên Web Dashboard local (`http://localhost:8123` / `http://localhost:8000`), cho phép quản trị viên xem trực tiếp đồ thị mạng lưới, cây phân cấp kiến trúc và báo cáo kiểm định mã nguồn ngay trên giao diện web.

---

## 2. KẾ HOẠCH TRIỂN KHAI CHI TIẾT

### 2.1. Backend FastAPI (`server_app/`)
- Cập nhật `server_app/main.py`: Mount thư mục tĩnh `graphify-out/` tại `GET /graphify-out/*`.
- Cập nhật `server_app/routers/views.py`: Thêm API endpoints:
  - `GET /api/graphify/stats`: Trả về JSON thống kê nodes, edges, communities.
  - `GET /api/graphify/report`: Trả về nội dung `GRAPH_REPORT.md`.
  - `POST /api/graphify/refresh`: Thực thi quét AST trong thread ngầm để cập nhật đồ thị mà không làm nghẽn Event Loop.

### 2.2. Backend Fastify TypeScript (`src/`)
- Cập nhật `src/app.ts`: Đăng ký `fastifyStatic` cho thư mục `graphify-out/` với prefix `/graphify-out/` và `decorateReply: false`.

### 2.3. Frontend Web Dashboard
- Tạo component `static/js/components/graphify-tab.js` (< 180 dòng, chuẩn VDDS Design System):
  - Bộ chọn chế độ xem: Mạng lưới (`graph`), Cây phân cấp (`tree`), Báo cáo (`report`).
  - Khung `<iframe>` toàn màn hình linh hoạt theo chiều cao trình duyệt.
  - Nút hành động: "Mở tab mới", "Tải lại iframe", "Quét lại AST (Refresh)".
  - Thanh trạng thái thống kê nhanh: Nodes, Edges, Communities, Độ chính xác AST (97%).
- Cập nhật `templates/index.html`:
  - Thêm nhóm menu "Kiến Trúc & Đồ Thị" vào Sidebar.
  - Mount `<graphify-tab>` vào `<main>`.
  - Chèn script `<script src="/static/js/components/graphify-tab.js">`.
  - Đảm bảo giữ số dòng `templates/index.html` <= 218 dòng (dưới ngưỡng 220 dòng).

---

## 3. KIỂM THỬ & NGHIỆM THU
- Chạy `python test_modular.py` kiểm tra toàn bộ 31 files đạt chuẩn `< 200 dòng/file` và tất cả API tests pass.
- Lưu trữ Walkthrough Audit Log `docs/logs/55_20260924_180500_walkthrough.md` và cập nhật `docs/logs/INDEX.md`.
