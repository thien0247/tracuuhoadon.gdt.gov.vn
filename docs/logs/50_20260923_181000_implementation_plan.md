# Kế Hoạch Triển Khai: Phân Tích CSHARP_WINFORMS_TEMPLATE.md & Xây Dựng Ứng Dụng GUI C# WinForms Quản Trị GDT Tax Crawler

> **Mã kế hoạch:** `50_20260923_181000_implementation_plan.md`  
> **Module:** Windows Service & Process Management  
> **Nền tảng:** Native C# Windows Forms (.NET Framework 4.0/4.8 tích hợp sẵn trong Windows)  
> **Mục tiêu:** Tạo bộ GUI quản trị độc lập, hiện đại (Modern Card Flat UI, Dual Theme Sáng/Tối, Khay hệ thống, Đèn LED GDI+ 3D, Log có màu) biên dịch bằng `csc.exe` 1-click không cần cài thêm công cụ.

---

## 1. Phân Tích Toàn Diện `CSHARP_WINFORMS_TEMPLATE.md`

Tài liệu `CSHARP_WINFORMS_TEMPLATE.md` cung cấp một chuẩn kiến trúc GUI C# WinForms rất hoàn chỉnh và tối ưu cho môi trường Windows với các ưu điểm kỹ thuật vượt trội:

### 1.1. Triết Lý Thiết Kế Cốt Lõi
1. **Zero-Dependency (Không phụ thuộc môi trường):**
   - Viết hoàn toàn bằng Native C# WinForms thuần túy trong một file mã nguồn duy nhất.
   - Biên dịch trực tiếp thông qua trình biên dịch tích hợp sẵn của hệ điều hành Windows: `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe`.
   - Chạy độc lập trên mọi phiên bản Windows từ Windows 7, 8.1, 10 đến Windows 11 và Windows Server mà không cần cài đặt Visual Studio, .NET SDK hay gói thư viện NuGet.

2. **Khắc Phục "Bẫy Bố Cục" Docking & Anchoring trong WinForms:**
   - Gán `Width = clientW` và `Width = cardW` tường minh cho tất cả các Panel trước khi gắn các phần tử neo mép phải để tránh lệch vị trí.

3. **Hệ Thống Dual Theme (Sáng / Tối) Hiện Đại:**
   - Light Theme (Slate-100 `#F1F5F9`) & Dark Theme (Obsidian `#131316`).
   - Tự động lưu và nạp cấu hình từ `config.json`.

4. **Đèn LED Trạng Thái GDI+ 3D Khử Răng Cưa (Anti-Aliased):**
   - Vẽ điểm tròn màu sắc mịn màng bằng `SmoothingMode.AntiAlias` kèm vòng hào quang bán trong suốt 3D.

5. **Khay Hệ Thống (System Tray) Với Dynamic Icon:**
   - Tự động vẽ Icon 32x32 trực tiếp trong RAM, giải phóng GDI Handle bằng `DestroyIcon(IntPtr)`.

6. **Khung Log Terminal Đa Luồng An Toàn (Thread-Safe):**
   - RichTextBox với `InvokeRequired`, phân loại màu `SUCCESS`, `ERROR`, `WARN`, `STATUS`.

---

## 2. Thiết Kế Ứng Dụng GUI Dành Riêng Cho GDT Tax Crawler

- **Tên ứng dụng:** `GDT Tax Crawler - Quản Lý Dịch Vụ & Máy Chủ`
- **Mã nguồn:** `GDTTaxCrawlerManager.cs`
- **Tên dịch vụ Windows:** `GDTTaxCrawler`
- **Cổng Web Dashboard:** `8123`
- **Cổng AI Worker Bridge:** `8124`
- **Thư mục triển khai:** `service_gui_csharp/`
  + `GDTTaxCrawlerManager.cs`
  + `app.manifest`
  + `build.bat`
  + `config.json`
  + `run.bat`
  + `run_csharp_gui.bat` (Thư mục gốc)
