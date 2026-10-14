---
id: "01M4V0FH09ZYMQSQX56X4G0SWZ"
aliases:
  - "topic-02-vdds-design-system-integration"
  - "topic-02-vdds-design-system-integration.md"
created_at: "2026-10-13T16:10:41.033201+00:00"
type: "documentation"
related_code:
  - 01M4V0HMM9D57KHSDBMMQEZD67
  - 01M4V0HMMAGER9D326B643B5RY
  - 01M4V0HMMC9CR0CWQBZ372WK6Q
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
# Topic 02: Áp Dụng Toàn Diện VNPT VDDS Design System Vào Dự Án GDT Tax Crawler

**Ngày hoàn thành:** 20/09/2026  
**Trạng thái:** ✅ Đã hoàn thành & Nghiệm thu  
**Mục tiêu:** Áp dụng chuẩn thiết kế VDDS (VNPT Đắk Lắk Design System) từ `templates/vdds_template_report.md` vào toàn bộ giao diện Web Dashboard của hệ thống GDT Tax Crawler.

---

## 1. Bối Cảnh & Mục Tiêu Kỹ Thuật

Giao diện trước đây sử dụng bố cục dashboard cơ bản với Tailwind CSS, thiếu tính nhất quán về nhận diện thương hiệu, chưa có chế độ giao diện tối (Dark Mode), thanh điều hướng chưa thể thu gọn (collapsible), và chưa áp dụng hệ thống token chuẩn của VDDS.

### Yêu cầu triển khai:
1. **Design Tokens & Theme:** Kế thừa đầy đủ bộ token màu VDDS (`--vnpt-blue: #005baa`, `--vnpt-blue-gradient`, `--accent-cyan: #06b6d4`, `--bg-primary`, `--bg-card`, `--border-color`).
2. **Typography chuẩn:** Tích hợp `Plus Jakarta Sans` cho nội dung, `Quicksand` cho tiêu đề/thương hiệu, và `JetBrains Mono` cho mã số thuế / số liệu đo lường.
3. **Sticky Top Header (50px):** Thanh header cố định trên đỉnh màn hình với logo VNPT Blue, nút ẩn/hiện Sidebar, trạng thái kết nối SSE, nút bật/tắt AI Inspector, nút chuyển đổi Dark/Light mode và avatar Quản trị viên.
4. **Collapsible Sidebar (240px ↔ 64px):** Menu bên trái có thể thu gọn mượt mà, chuyển đổi giữa chế độ đầy đủ và chế độ biểu tượng (icon-only).
5. **Dark Mode toàn diện:** Hỗ trợ chuyển đổi Theme sáng/tối tức thời, lưu vào `localStorage.getItem('gdt_theme')` và tự động áp dụng khi tải trang.
6. **Footer chuẩn VDDS (36px):** Hiển thị bản quyền, phiên bản hệ thống và trạng thái kết nối cơ sở dữ liệu.
7. **Tuân thủ quy chuẩn mã nguồn:** Mọi file sửa đổi đều phải nghiêm ngặt < 200 dòng theo `GEMINI.md`.

---

## 2. Kiến Trúc Giải Pháp & Bảng Tokens

### 2.1. Bảng Design Tokens (`static/css/style.css`)
```css
:root {
  --vnpt-blue: #005baa;
  --vnpt-blue-light: #0284c7;
  --vnpt-blue-gradient: linear-gradient(135deg, #005baa 0%, #0284c7 100%);
  --accent-cyan: #06b6d4;
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --border-color: #e2e8f0;
}

[data-theme='dark'] {
  --bg-primary: #0b1329;
  --bg-secondary: #0f172a;
  --bg-card: #1e293b;
  --bg-card-hover: #26354a;
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --border-color: #334155;
}
```

### 2.2. Cơ chế Dark Mode Adapter
Tự động chuyển đổi các class Tailwind CSS sẵn có của các sub-components mà không cần sửa đổi mã nguồn từng component:
- `[data-theme='dark'] .bg-white` $\rightarrow$ `var(--bg-card)`
- `[data-theme='dark'] .bg-slate-50` $\rightarrow$ `var(--bg-secondary)`
- `[data-theme='dark'] .border-slate-200` $\rightarrow$ `var(--border-color)`
- `[data-theme='dark'] input, select` $\rightarrow$ màu nền và viền tối chuẩn VDDS.

---

## 3. Danh Sách Tệp Thay Đổi

| STT | Tệp Tin | Số Dòng | Giới Hạn | Trạng Thái | Mô Tả |
|:---:|:---|:---:|:---:|:---:|:---|
| 1 | `static/css/style.css` | 111 dòng | < 200 dòng | ✅ Đạt | Tokens VDDS, Dark mode adapter, Table pattern, AI Inspector |
| 2 | `static/js/app.js` | 168 dòng | < 200 dòng | ✅ Đạt | Reactive theme, toggleTheme, isSidebarCollapsed, toggleSidebar |
| 3 | `templates/index.html` | 186 dòng | < 220 dòng | ✅ Đạt | 50px Sticky Header, Collapsible Sidebar, Footer 36px |

---

## 4. Bằng Chứng Nghiệm Thu & Kiểm Thử

1. **Kiểm tra giới hạn dòng code:**
   - `npx tsx tests/check_ts_line_limits.ts`: 100% 22/22 tệp TypeScript đạt tiêu chuẩn.
   - `python test_modular.py`: 100% 27/27 tệp Python & Frontend đạt tiêu chuẩn (< 200 dòng).
2. **Kiểm tra API & Hệ thống:**
   - Toàn bộ các API: `/api/provinces`, `/api/search`, `/api/filter`, `/api/crawler/start_all`, `/api/reports/crawler-health` phản hồi Status 200 OK.
3. **Kiểm thử giao diện với Playwright:**
   - Light Mode: Header xanh VNPT `#005baa`, thẻ chỉ số glassmorphism sáng sủa.
   - Dark Mode: Chuyển đổi nền `#0b1329`, thẻ `#1e293b`, chữ `#f8fafc`, tương phản sắc nét.
   - Collapsible Sidebar: Thu gọn từ 240px về 64px mượt mà chỉ hiển thị icon.
   - AI Inspector Mode (`Alt + I`): Viền sáng tím `#a855f7` và nhãn popover thông tin hiển thị chính xác.
