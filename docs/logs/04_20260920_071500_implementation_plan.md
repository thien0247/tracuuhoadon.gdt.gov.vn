# Kế Hoạch Áp Dụng Template VDDS Vào Dự Án GDT Tax Crawler

Dự án hiện đang vận hành hệ thống Hybrid (Backend TypeScript Fastify trên cổng `8123` + Python Worker trên cổng `8124` + Giao diện Web Vue 3 Dashboard). Tài liệu [vdds_template_report.md](file:///c:/tracuuhoadon.gdt.gov.vn/templates/vdds_template_report.md) cung cấp bộ chuẩn thiết kế doanh nghiệp cao cấp từ hệ thống VDDS (VNPT Đắk Lắk). 

Kế hoạch này đề xuất lộ trình áp dụng toàn diện các quy chuẩn thiết kế, layout, component dùng chung và trải nghiệm người dùng của VDDS vào dự án.

---

## 1. Phân Tích So Sánh Hiện Trạng & Chuẩn VDDS

| Thành phần | Hiện trạng GDT Tax Crawler | Chuẩn Template VDDS (`vdds_template_report.md`) | Đề xuất nâng cấp |
|:---|:---|:---|:---|
| **Typography** | Font Inter + JetBrains Mono | Plus Jakarta Sans + Quicksand | Nhúng font Plus Jakarta Sans & Quicksand từ Google Fonts |
| **Design Tokens** | Màu Tailwind mặc định, style rải rác | Biến CSS Custom Properties (`--vnpt-blue`, `--bg-card-glass`, badges, shadows) | Tích hợp trọn bộ tokens vào [`static/css/style.css`](file:///c:/tracuuhoadon.gdt.gov.vn/static/css/style.css) |
| **Header** | Không có Header riêng, thông tin dồn vào sidebar | Header 50px sticky top, nền gradient, logo, dark/light toggle, user card | Thêm Sticky Header 50px chuẩn VDDS trên đỉnh màn hình |
| **Sidebar** | Cố định 260px, không thu gọn | 240px (mở) / 50px (thu gọn), transition 0.25s mượt mà | Thêm cơ chế Collapsible 240px $\leftrightarrow$ 50px |
| **Dark / Light Mode** | Chỉ có Light Mode | Dark/Light mode chuyển đổi tức thì (`data-theme="dark"`), lưu localStorage | Bổ sung tính năng Dark/Light Mode toàn diện |
| **Bảng dữ liệu** | Bảng border xám phẳng thông thường | Gradient Header (`--vnpt-blue-gradient`), số căn phải `tabular-nums`, dòng tổng kết | Áp dụng chuẩn Table Pattern VDDS cho toàn bộ các tab |
| **Modal Chi tiết** | Modal trắng cơ bản | Glassmorphism, header gradient xanh, nút đóng tinh tế | Nâng cấp [`tax-detail-modal.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/tax-detail-modal.js) theo VDDS Modal Pattern |
| **Footer** | Chưa có | Footer cố định đáy, hiển thị bản quyền và phiên bản hệ thống | Thêm Footer thanh lịch ở cuối trang |

---

## 2. Các Đề Xuất Thực Hiện

### Giai Đoạn 1 (Khuyến Nghị Thực Hiện Trước): Tích Hợp VDDS Design System Vào Dashboard Hiện Tại
> **Ưu điểm:** Giữ nguyên 100% tính năng SSE real-time, 6 tab nghiệp vụ đang chạy ổn định, không làm gián đoạn hệ thống, nhưng thay đổi hoàn toàn diện mạo dashboard thành giao diện điều hành chuyên nghiệp chuẩn VDDS.

1. **Nâng cấp Design Tokens & Styles ([`static/css/style.css`](file:///c:/tracuuhoadon.gdt.gov.vn/static/css/style.css))**:
   - Bổ sung bộ biến CSS `--vnpt-blue`, `--vnpt-blue-gradient`, `--accent-cyan`.
   - Bổ sung biến nền Surface cho cả Light Mode (`#f8fafc`) và Dark Mode (`#0b1329`, `#0f172a`, `#1e293b`).
   - Bổ sung Badge System (`--badge-green-*`, `--badge-blue-*`, `--badge-amber-*`, `--badge-red-*`).
   - Bổ sung Glassmorphism `.card-glass` (`backdrop-filter: blur(12px)`), custom scrollbar 8px.
   - Thêm bộ style chuẩn cho bảng dữ liệu `.table-wrapper`, `thead th` (gradient header), `tr.total-row`.

2. **Cấu trúc lại Layout chuẩn 3 vùng ([`templates/index.html`](file:///c:/tracuuhoadon.gdt.gov.vn/templates/index.html))**:
   - **Sticky Header (50px)**:
     - Logo GDT Tax Crawler + Tên hệ thống (font Quicksand 800).
     - Nút toggle thu gọn Sidebar (☰).
     - Nút Dark/Light Mode toggle (Moon/Sun icon) với hiệu ứng chuyển động.
     - User Card: avatar gradient + tên quản trị viên + nút đăng xuất/reset.
   - **Collapsible Sidebar (240px $\leftrightarrow$ 50px)**:
     - Khi mở: 240px đầy đủ icon + chữ + trạng thái SSE + nút AI Inspector.
     - Khi thu gọn: 50px chỉ hiện icon với tooltip hover trực quan.
     - Phân nhóm menu rõ ràng: Nhóm "Quét MST" (Lưới, Báo cáo sức khỏe) và Nhóm "Dữ liệu" (Lọc xuất, Cấu hình, Tra cứu).
   - **Footer chuẩn VDDS**:
     - Bản quyền © 2026 GDT Tax Crawler. Hệ thống Vét Cạn MST v3.1.

3. **Cập nhật Logic Dark Mode & Theme ([`static/js/app.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/app.js))**:
   - Thêm trạng thái `theme` ('light' | 'dark') và `isSidebarCollapsed` (boolean).
   - Tự động lưu và đọc từ `localStorage.getItem('gdt_theme')`.
   - Gán thuộc tính `data-theme` vào thẻ `<html>` khi chuyển đổi.

4. **Nâng cấp Bảng & Modal theo chuẩn VDDS**:
   - Bảng [`crawler-list.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/crawler-list.js) & [`search-tab.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/search-tab.js): Sử dụng header gradient xanh, số căn phải `font-mono tabular-nums`.
   - Modal [`tax-detail-modal.js`](file:///c:/tracuuhoadon.gdt.gov.vn/static/js/components/tax-detail-modal.js): Header gradient xanh, nền glassmorphism.

---

### Giai Đoạn 2 (Tùy Chọn Mở Rộng): Khởi Tạo Frontend SPA React 18 + Vite (`web-app/`)
> Nếu bạn muốn xây dựng thêm một bản Frontend React 18 độc lập hoàn toàn theo đúng kiến trúc Vite trong Section 2 & 12 của `vdds_template_report.md`:

- Khởi tạo thư mục `web-app/` với Vite + React 18 + TypeScript + Lucide React.
- Cấu hình proxy `vite.config.ts` trỏ về Fastify API cổng `8123`.
- Port chạy frontend dev: `5174`.

---

## 3. Kế Hoạch Xác Thực (Verification Plan)

### Automated Tests
- Kiểm tra số dòng code của các file sau khi sửa đổi đảm bảo tuân thủ `< 200 dòng/tệp`:
  ```bash
  python test_modular.py
  npx tsx tests/check_ts_line_limits.ts
  ```
- Kiểm tra toàn bộ 14 API endpoints và Fastify Server:
  ```bash
  npx tsx tests/test_ts_server.ts
  ```

### Manual & Visual Verification (Playwright MCP)
1. Mở trang [http://localhost:8123](http://localhost:8123) bằng Playwright.
2. Kiểm tra giao diện Light Mode: Header xanh VNPT/GDT 50px, font Plus Jakarta Sans.
3. Bấm nút Dark Mode toggle: Kiểm tra chuyển đổi sang nền tối `#0b1329`, card tối `#1e293b`.
4. Bấm nút thu gọn Sidebar: Kiểm tra sidebar co từ 240px về 50px mượt mà.
5. Kiểm tra AI Inspector Mode và xem modal chi tiết MST.
6. Chụp ảnh màn hình (screenshot) cả 2 chế độ Light và Dark Mode để nghiệm thu.
