# KẾ HOẠCH TRIỂN KHAI: ÁP DỤNG BỘ TEMPLATE SOFTWARE PROJECT CHUẨN AI VÀO DỰ ÁN

**Mã kế hoạch:** `88_20261013_225500_implementation_plan.md`  
**Dự án:** Hệ Thống Vét Cạn Mã Số Thuế & Tra Cứu Hóa Đơn (`gdt-tax-crawler`)  
**Nguồn tham chiếu:** `E:\GoogleDrive\obsidian\zz\02-templates\software-project-template\`  
**Trạng thái:** 🚀 Đang triển khai  

---

## 1. Mục Tiêu & Bối Cảnh
Áp dụng toàn diện bộ quy chuẩn **AI-Ready Software Project Template** từ RAG Obsidian Vault vào dự án `c:\tracuuhoadon.gdt.gov.vn` theo diện Dự án Hiện Hữu (Brownfield Project). Đảm bảo chuẩn hóa:
1. **Gatekeeper Manifest:** Khởi tạo bản khai báo dự án `PROJECT_MANIFEST.md` tại thư mục gốc với trạng thái `APPROVED`.
2. **Port & Infrastructure Registry:** Đăng ký chính thức cổng `8123` (Fastify Web Gateway) và `8124` (Python AI Solver) vào `PORT_REGISTRY.md`.
3. **Bộ Tài Liệu Kiến Trúc & Đặc Tả (`docs/`):**
   - `docs/ARCHITECTURE.md`: Mô hình 4 phân hệ (Fastify + Vue 3 + C# Desktop + Python Worker).
   - `docs/API_CONTRACT.md`: Đặc tả chuẩn hóa giao tiếp API và Envelope Response.
   - `docs/DB_SCHEMA.md`: Lược đồ CSDL PostgreSQL bảng thuế và đối soát bố cáo.
   - `docs/DEVOPS_RUNBOOK.md`: Cẩm nang vận hành Windows Service, xử lý nghẽn cổng và F5 WAF Cooldown.
4. **Bộ Scripts Tiện Ích (`scripts/`):**
   - `scripts/check-ports.ps1`: Kiểm tra cổng mạng dự án.
   - `scripts/kill-port.ps1`: Giải phóng nhanh tiến trình treo cổng.
5. **Kỷ luật mã nguồn:** Toàn bộ tệp tạo mới tuân thủ nghiêm ngặt giới hạn $\le 180$ dòng (Hard cap 200 dòng theo `GEMINI.md`).

---

## 2. Các Giai Đoạn Thực Hiện

### Giai Đoạn 1: Khởi Tạo `PROJECT_MANIFEST.md`
- Tạo tệp `PROJECT_MANIFEST.md` tại thư mục gốc `c:\tracuuhoadon.gdt.gov.vn`.
- Điền đầy đủ 5 phần theo mẫu: Định danh & Tài nguyên hạ tầng, Phạm vi nghiệp vụ & Core features, Công nghệ (Node.js + Python + C# .NET 10 + Vue 3), Thực thể dữ liệu & API contract, Phê duyệt `APPROVED`.

### Giai Đoạn 2: Đăng Ký Vào `PORT_REGISTRY.md` Toàn Máy Trạm
- Cập nhật bảng phân bổ cổng tại `E:\GoogleDrive\obsidian\zz\02-templates\software-project-template\PORT_REGISTRY.md` để ghi nhận `gdt-tax-crawler` chạy port `:8123` (Web Gateway/Vue 3), `:8124` (AI Solver), CSDL `:5433`/`:5432` `taxdb`.

### Giai Đoạn 3: Thiết Lập Bộ Tài Liệu Đặc Tả Chuẩn (`docs/`)
- Tạo `docs/ARCHITECTURE.md`: Vẽ sơ đồ luồng dữ liệu 4 tầng và mối quan hệ giữa Fastify, Python Worker, Vue 3 SPA và C# WebView2 Control.
- Tạo `docs/API_CONTRACT.md`: Quy chuẩn Request/Response cho `/api/records`, `/api/bocao`, `/api/crawler`, `/api/services`, `/api/stream`.
- Tạo `docs/DB_SCHEMA.md`: Đặc tả các bảng `tax_records`, `bocao_records`, `crawl_stats_daily`, `regi_stats_daily`, chỉ mục `GIN`, `B-Tree` và ràng buộc dữ liệu.
- Tạo `docs/DEVOPS_RUNBOOK.md`: Sổ tay hướng dẫn quản trị Windows Service, chạy ngầm daemon, khôi phục khi bị WAF chặn IP và giám sát tài nguyên.

### Giai Đoạn 4: Trang Bị Scripts Quản Trị Cổng Mạng (`scripts/`)
- Tạo `scripts/check-ports.ps1`: Giám sát tức thì cổng `8123`, `8124`, `5432`, `5433`.
- Tạo `scripts/kill-port.ps1`: Giải phóng nhanh PID đang chiếm giữ cổng khi dịch vụ gặp sự cố.

### Giai Đoạn 5: Kiểm Thử & Lưu Vết Nhật Ký Nghiệm Thu
- Kiểm tra số dòng code của toàn bộ tệp tài liệu và script mới ($\le 180$ dòng).
- Chạy thử `scripts/check-ports.ps1`.
- Cập nhật `walkthrough.md`, lưu bản sao vào `docs/logs/` và cập nhật `docs/logs/INDEX.md`.
