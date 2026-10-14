---
id: "01M4V0FH0W7NNFX8F1Y2DM2JC1"
aliases:
  - "topic-14-standardized-logging-engine"
  - "topic-14-standardized-logging-engine.md"
created_at: "2026-10-13T16:10:41.053394+00:00"
type: "documentation"
---
# Topic 14: Chuẩn Hóa Cơ Chế Ghi Nhật Ký Hệ Thống (Standardized Logging Engine)

> **Mã Topic:** TOPIC-14  
> **Trạng thái:** ✅ Đã hoàn thành  
> **Ngày hoàn thành:** 10/10/2026  
> **Tài liệu liên quan:** `docs/logs/75_20261010_183600_implementation_plan.md`, `docs/logs/76_20261010_184500_walkthrough.md`, `GEMINI.md`  

---

## 1. Bối Cảnh & Bài Toán Kỹ Thuật

Trước đây, hệ thống ghi nhật ký trong công cụ điều khiển Windows Service `GDTTaxCrawlerManager` (.NET 10 GUI Control) gặp các nhược điểm:
1. **Thiếu module Logger tập trung:** Các module ghi log rời rạc, nuốt ngoại lệ âm thầm (silent catch) hoặc ghi vào file tạm `gui_debug.log` ở thư mục gốc.
2. **Không đồng bộ với cấu trúc `logs/` chung:** Các tiến trình crawler (Python worker) và backend (Fastify TypeScript) đều ghi nhật ký vào thư mục `logs/` (`crawl_YYYYMMDD.log`, `service_out.log`, `service_err.log`), trong khi GUI Control chưa được tích hợp vào cây thư mục này.
3. **Thiếu định dạng chuẩn:** Không có thời gian chính xác mili-giây, định danh luồng (Thread ID), nhãn thành phần (Component Tag), cấp độ log (`DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`).
4. **Nguy cơ tranh chấp file (Concurrency):** Không có cơ chế khóa luồng `syncLock` và không có cơ chế xoay vòng dung lượng file (file rotation).

---

## 2. Kiến Trúc Giải Pháp Chuẩn Hóa (Standardized Logging Architecture)

### 2.1. Cấu Trúc Định Dạng Nhật Ký Chuẩn
Mỗi dòng log được định dạng chuẩn xác:
```text
[yyyy-MM-dd HH:mm:ss.fff] [LEVEL] [ThreadId] [Source] Nội dung thông điệp
  [Exception: Type] Message
  StackTrace...
```
Ví dụ thực tế trích xuất từ `logs/gui_20261010.log`:
```text
[2026-10-10 18:39:28.873] [INFO ] [T02] [Bootstrap] Khởi động GDTTaxCrawlerManager .NET 10 (PID: 27000)
[2026-10-10 18:39:29.178] [INFO ] [T02] [CLI] Yêu cầu chụp snapshot tới: ...\gui_vue3_local_screenshot.png
[2026-10-10 18:39:30.002] [INFO ] [T02] [Tray] Đóng hoàn toàn ứng dụng.
[2026-10-10 18:39:30.063] [INFO ] [T02] [Bootstrap] Đã đóng ứng dụng.
```

### 2.2. Module Trung Tâm `service_gui_csharp/AppLogger.cs` (102 dòng)
- **Thread Safety:** Dùng `lock (syncLock)` bảo vệ thao tác ghi file, ngăn ngừa xung đột I/O giữa UI Thread và Background Worker Threads.
- **Xoay vòng file:** Tự động tạo file theo ngày `logs/gui_yyyyMMdd.log`. Giới hạn dung lượng mỗi file tối đa 10 MB; khi vượt ngưỡng tự động sao lưu sang `gui_yyyyMMdd_HHmmss.log`.
- **Event Bus cho UI:** Cung cấp `public static event Action<string, LogLevel>? OnLogEmitted;` giúp giao diện hiển thị nhật ký thời gian thực.
- **Tiện ích hệ thống:**
  - `AppLogger.OpenLogFolder()`: Mở thư mục `logs/` trong Windows Explorer.
  - `AppLogger.OpenCurrentLogFile()`: Mở file log hôm nay bằng trình soạn thảo mặc định (Notepad).

---

## 3. Tích Hợp Chi Tiết Vào Các Thành Phần GUI

| Tệp C# | Chức năng tích hợp AppLogger | Số dòng |
|:---|:---|:---:|
| `AppLogger.cs` | Module ghi log chuẩn hóa, rotation, thread safety, event bus | 102 dòng |
| `Program.cs` | Log vòng đời ứng dụng, bẫy ngoại lệ toàn cục `AppDomain` & `ThreadException` | 77 dòng |
| `MainForm.cs` | Log khởi tạo giao diện, mở browser ngoài, đổi theme Dark/Light | 158 dòng |
| `MainForm.WebView.cs` | Log Virtual Host `app.local`, nạp trang, đổi mode, lỗi API proxy 503 | 162 dòng |
| `MainForm.Service.cs` | Log lệnh Bật/Tắt/Restart service, giám sát trạng thái chuyển đổi | 76 dòng |
| `MainForm.Tray.cs` | Bổ sung 2 menu: `📁 Mở Thư Mục Logs` & `📝 Xem File Log Hôm Nay` | 107 dòng |
| `MainForm.Snapshot.cs` | Log quá trình kết xuất hình ảnh giao diện độ nét cao | 57 dòng |

---

## 4. Bằng Chứng Nghiệm Thu Kỹ Thuật

1. **Biên dịch:** Lệnh `dotnet build service_gui_csharp\GDTTaxCrawlerManager.csproj -c Release` thành công 100% với **0 Warning(s), 0 Error(s)**.
2. **Tuân thủ quy chuẩn GEMINI.md:** 100% tệp C# $\le 162$ dòng (nằm trong dải lý tưởng 100-160 dòng, hard cap 200 dòng).
3. **Thực thi ghi log:** File nhật ký `logs/gui_20261010.log` được sinh ra tự động, chứa đầy đủ các sự kiện vòng đời và chẩn đoán hệ thống.
4. **Hồi quy hệ thống:** Toàn bộ test suite `check:lines`, `test:server` và `test_modular.py` đều vượt qua 100%.
