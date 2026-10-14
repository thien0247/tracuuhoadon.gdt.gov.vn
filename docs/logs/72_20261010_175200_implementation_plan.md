# Kế Hoạch Triển Khai: Nâng Cấp GUI Control Sang .NET 10 & Tích Hợp WebView2 Vue 3

> **Dự án:** GDT Tax Crawler & Search Engine  
> **Chủ đề:** GUI Control C# WinForms Modernization (.NET 10 + WebView2 + Vue 3)  
> **Thời gian:** 10/10/2026  
> **Mã kiểm toán:** STT 72  

---

## 1. Mục Tiêu & Yêu Cầu Kỹ Thuật

1. **Nâng cấp nền tảng:**
   - Chuyển đổi công cụ quản trị C# WinForms từ .NET 4.0 cũ (`csc.exe`) sang **.NET 10 SDK 10.0.201** (`net10.0-windows`).
   - Sử dụng cơ chế build hiện đại với `dotnet build -c Release`.
2. **Tích hợp WebView2 hiển thị Vue 3:**
   - Nhúng control `Microsoft.Web.WebView2.WinForms.WebView2` vào giao diện chính.
   - Trực tiếp render giao diện Web Dashboard Vue 3 (`http://127.0.0.1:8123/`) bên trong ứng dụng Windows bản địa.
   - Hỗ trợ F12 DevTools, F5/Ctrl+R Reload, tự động phát hiện trạng thái cổng 8123 để điều hướng mượt mà.
3. **Điều khiển Service & Giám Sát Kép:**
   - Thanh điều khiển Topbar hiện đại: Nút Start, Stop, Restart service, Reload WebView, Mở trình duyệt ngoài, Toggle Dark/Light Theme.
   - Đèn LED trạng thái thời gian thực và giám sát cổng mạng TCP 8123 (Fastify Web) & 8124 (Python Worker).
   - System Tray Icon tích hợp menu chuột phải điều khiển nhanh.
4. **Quy chuẩn mã nguồn:**
   - Phân rã mã nguồn C# thành các file module đơn trách nhiệm $\le 150$ dòng / file (`Program.cs`, `ThemeManager.cs`, `ServiceHelper.cs`, `MainForm.cs`, `MainForm.WebView.cs`, `MainForm.Tray.cs`).
   - Kiểm tra biên dịch `dotnet build -c Release` thành công 100% không lỗi.

---

## 2. Các Bước Triển Khai Chi Tiết

- [ ] **Bước 1: Cấu hình Project .NET 10 (`GDTTaxCrawlerManager.csproj`)**
  - Khai báo `<TargetFramework>net10.0-windows</TargetFramework>`, `<UseWindowsForms>true</UseWindowsForms>`.
  - Package references: `Microsoft.Web.WebView2` (1.0.2903.40), `System.ServiceProcess.ServiceController` (10.0.12).
- [ ] **Bước 2: Xây dựng các module C# phân tầng**
  - `ThemeManager.cs`: Bảng màu Light/Dark theme theo chuẩn VNPT VDDS.
  - `ServiceHelper.cs`: Quản lý Windows Service (`GDTTaxCrawler`), kiểm tra cổng TCP 8123/8124, lấy PID.
  - `MainForm.cs`: Shell giao diện chính, Banner Header, Toolbar điều khiển, Status bar.
  - `MainForm.WebView.cs`: Khởi tạo môi trường WebView2 (`CoreWebView2Environment`), thiết lập thư mục cache, điều hướng `http://127.0.0.1:8123`, DevTools.
  - `MainForm.Tray.cs`: Quản lý Khay hệ thống, icon đổi màu theo trạng thái RAM/GDI an toàn.
  - `Program.cs`: Điểm khởi chạy `[STAThread]` với `ApplicationConfiguration.Initialize()`.
- [ ] **Bước 3: Cập nhật kịch bản Build & Khởi chạy**
  - Cập nhật `service_gui_csharp/build.bat` sử dụng `dotnet build -c Release`.
  - Cập nhật `run_csharp_gui.bat` ngoài thư mục gốc để khởi chạy file nhị phân .NET 10.
- [ ] **Bước 4: Biên dịch & Kiểm thử**
  - Chạy `dotnet build -c Release` trong `service_gui_csharp/`.
  - Xác thực khởi tạo WebView2, kiểm tra tải Dashboard Vue 3.
  - Chạy lại bộ kiểm thử hồi quy `npm run check:lines`, `npm run test:server`, `python test_modular.py`.
- [ ] **Bước 5: Tài liệu hóa & Kiểm toán (Audit Log)**
  - Cập nhật `docs/logs/INDEX.md` với STT 72 và STT 73.
  - Tạo biên bản nghiệm thu walkthrough.
