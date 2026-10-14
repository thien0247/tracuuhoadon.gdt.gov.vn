---
id: "01M4V0FH0V3ZG4NN14DWF01R81"
aliases:
  - "topic-13-net10-webview2-gui-control"
  - "topic-13-net10-webview2-gui-control.md"
created_at: "2026-10-13T16:10:41.051740+00:00"
type: "documentation"
related_code:
  - 01M4TZTRA1H79B5QWVJ4KZNV9G
  - 01M4V0HMQAJ9H85W8KCM8Q4RFP
  - 01M4V0HMQB3VNDDV8M4FBM1N7F
  - 01M4V0HMQCV19SGACM596DQMTQ
  - 01M4V0HMQDMVPRXWNXZTR2Y3QS
  - 01M4V0HMQEN69ZHMDM5T6XNFXF
  - 01M4V0HMQF6K64FPQE93ATGC0A
  - 01M4V0HMQGDB16NT9P2FKVF63X
  - 01M4V0HMQHZDQ6GK30H9JBAF90
  - 01M4V0HMQJ895M409P5XRR77B1
  - 01M4V0HMQKJ4A3VP1ZH65XQA77
  - 01M4V0HMQMVTWS9TDDF30AH9FQ
  - 01M4V0HMQNHW18B9RC8VXA2ZRR
  - 01M4V0HMQPHB38ARVEXSTMPDD9
  - 01M4V0HMQQ83ZT1TE4WM0ZT476
---
# Topic 13: Nâng Cấp GUI Control Sang .NET 10 & Tích Hợp WebView2 Vue 3 Native

> **Mã Topic:** TOPIC-13  
> **Trạng thái:** ✅ Đã hoàn thành  
> **Ngày hoàn thành:** 10/10/2026  
> **Tài liệu liên quan:** `docs/logs/72_20261010_175200_implementation_plan.md`, `docs/logs/73_20261010_175500_walkthrough.md`, `GEMINI.md`  

---

## 1. Bối Cảnh & Mục Tiêu Kỹ Thuật

Trước đây, công cụ điều khiển Windows Service `GDTTaxCrawlerManager` được xây dựng dưới dạng ứng dụng C# WinForms .NET Framework 4.0 cũ được biên dịch thông qua `csc.exe` trong một tệp mã nguồn nguyên khối (`GDTTaxCrawlerManager.cs` dài ~1100 dòng). Ứng dụng này chỉ có các nút lệnh khởi động dịch vụ cơ bản và mở trình duyệt ngoài để xem dashboard.

Sau khi giao diện Frontend được nâng cấp toàn diện sang chuẩn **Vue 3 SPA (Vite 5 + TypeScript + Tailwind CSS)** tại Topic 12, yêu cầu đặt ra là hiện đại hóa công cụ GUI điều khiển:
1. Chuyển đổi nền tảng sang **.NET 10 SDK** (`net10.0-windows`), tận dụng runtime hiệu năng cao và các cải tiến High DPI mới nhất.
2. Nhúng trực tiếp control **Microsoft.Web.WebView2** (Edge Chromium) vào ứng dụng để hiển thị toàn vẹn giao diện Vue 3 Dashboard bên trong một cửa sổ Windows bản địa duy nhất.
3. Hỗ trợ **Nạp Cục Bộ Zero-Latency (Virtual Host Mapping)**: Ánh xạ thư mục `frontend/dist` sang domain ảo `https://app.local` thông qua `SetVirtualHostNameToFolderMapping`. Intercept `https://app.local/api/*` để proxy trong suốt sang backend port 8123, loại bỏ hoàn toàn độ trễ mạng và lỗi CORS/Mixed Content.
4. Cung cấp nút chuyển đổi 1-click tức thời giữa **`📁 Local Vue`** và **`🌐 Server 8123`**.
5. Cung cấp bộ công cụ điều phối dịch vụ Windows Service kép (Fastify 8123 + Python 8124), System Tray Icon thu nhỏ khay hệ thống, DevTools và Reload.
6. Phân rã mã nguồn C# thành các module đơn trách nhiệm tuân thủ quy chuẩn $\le 160$ dòng code mỗi tệp.

---

## 2. Kiến Trúc & Cấu Trúc Module

Mã nguồn tại `service_gui_csharp/` được chia tách hoàn chỉnh:

```
service_gui_csharp/
├── GDTTaxCrawlerManager.csproj   # Cấu hình .NET 10 Windows Forms, packages WebView2 & ServiceController
├── Program.cs                     # Điểm khởi chạy ứng dụng (15 dòng)
├── ThemeManager.cs                # Quản lý bảng màu Dark/Light Theme VNPT VDDS (66 dòng)
├── ServiceHelper.cs               # Quản lý Windows Service, Socket TCP 8123/8124, PID (127 dòng)
├── MainForm.cs                    # Form shell, bố cục 8 nút toolbar, theme & toggle (146 dòng)
├── MainForm.WebView.cs            # Ánh xạ Virtual Host app.local, Proxying API, Reload, DevTools (148 dòng)
├── MainForm.Service.cs            # Polling trạng thái, Bật/Tắt/Restart service, Offline placeholder (65 dòng)
├── MainForm.Tray.cs               # Khay hệ thống System Tray, icon động an toàn GDI (97 dòng)
├── build.bat                      # Kịch bản tự động biên dịch Release .NET 10
├── run.bat                        # Kịch bản khởi chạy file thực thi .NET 10
└── bin/Release/net10.0-windows/   # Thư mục chứa GDTTaxCrawlerManager.exe và runtime WebView2
```

---

## 3. Nghiệm Thu Kỹ Thuật

1. **Biên dịch:** Lệnh `dotnet build GDTTaxCrawlerManager.csproj -c Release` thành công 100% với 0 Warning, 0 Error trong 8.3s.
2. **Kích thước file thực thi:** File nhị phân `GDTTaxCrawlerManager.exe` gọn nhẹ (~164 KB).
3. **Line Limits:** 100% tệp C# đều đạt $\le 148$ dòng, nằm gọn trong dải lý tưởng (100-160 dòng).
4. **Hồi quy hệ thống:** Toàn bộ test suite backend TypeScript (`test:server`), line check (`check:lines`), và API Python (`test_modular.py`) đều vượt qua 100%.

