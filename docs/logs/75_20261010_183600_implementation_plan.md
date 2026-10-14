# Kế Hoạch Triển Khai: Chuẩn Hóa Cơ Chế Ghi Nhật Ký (Standardized Logging Engine)

> **Mã kế hoạch:** `75_20261010_183600_implementation_plan.md`  
> **Topic liên quan:** [Topic 14: Chuẩn Hóa Cơ Chế Ghi Nhật Ký (Standardized Logging Engine)](../topics/topic-14-standardized-logging-engine.md)  
> **Ngày lập:** 10/10/2026 — 18:36:00  
> **Tiêu chuẩn áp dụng:** `GEMINI.md` (< 180 dòng/file C#, zero warnings), `AGENTS.md`

---

## 1. Bài Toán & Nhu Cầu Kỹ Thuật

Hiện tại, cơ chế log của công cụ điều khiển Windows Service `GDTTaxCrawlerManager` (.NET 10 GUI Control) chưa được chuẩn hóa:
1. **Thiếu module Logger tập trung:** Các module ghi log rời rạc hoặc nuốt lỗi (catch empty), một số vị trí ghi thẳng vào file tạm `gui_debug.log` ở thư mục gốc.
2. **Không đồng bộ với cấu trúc `logs/` chung:** Toàn bộ backend Windows Service (Python crawler, Fastify server) đều ghi nhật ký vào thư mục `logs/` (`crawl_YYYYMMDD.log`, `service_out.log`, `service_err.log`), trong khi GUI Control chưa tích hợp vào cấu trúc này.
3. **Thiếu cấp độ & cấu trúc log chuẩn:** Chưa phân tách `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`, thiếu định dạng thời gian ISO/mili-giây và định danh thread/component.
4. **Thiếu thread-safety & cơ chế xoay vòng (Rotation):** Có nguy cơ xung đột truy cập file khi nhiều luồng đồng thời ghi log, chưa có cơ chế kiểm soát dung lượng file log.
5. **Tiện ích thao tác trực quan:** Chưa có chức năng mở nhanh thư mục log hoặc file log từ giao diện GUI hoặc khay hệ thống (System Tray).

---

## 2. Thiết Kế Giải Pháp Chuẩn Hóa

### 2.1. Cấu Trúc Module Mới: `service_gui_csharp/AppLogger.cs`
- **Định dạng log chuẩn hóa:**
  `[yyyy-MM-dd HH:mm:ss.fff] [LEVEL] [ThreadId] [Source] Nội dung thông điệp [Exception Details]`
- **Vị trí lưu trữ:**
  `logs/gui_yyyyMMdd.log` (tự động tạo thư mục `logs/` nếu chưa có).
- **Cơ chế Thread-safe & Buffer:** Sử dụng `lock (syncRoot)` đảm bảo mọi luồng ghi tuần tự, không bị khóa file (File Lock).
- **Xoay vòng dung lượng (Max Size Guard):** Giới hạn mỗi file log tối đa 10 MB; khi vượt ngưỡng tự động đổi tên thành `.1.log`, `.2.log`.
- **Event Bus cho UI:** Cung cấp `public static event Action<string, LogLevel>? OnLogEmitted;` để StatusStrip hoặc component theo dõi log trực tiếp.
- **Tiện ích điều hướng:**
  - `AppLogger.OpenLogFolder()`: Mở thư mục `logs/` trong File Explorer.
  - `AppLogger.OpenCurrentLogFile()`: Mở file log của ngày hiện tại bằng ứng dụng mặc định (Notepad).

### 2.2. Tích Hợp Chi Tiết Vào Các Module C#

| Tệp C# | Vị trí bổ sung log chuẩn |
|:---|:---|
| `Program.cs` | Ghi nhận khởi động (OS, .NET Runtime 10, PID, tham số CLI), bẫy lỗi toàn cục `AppDomain.CurrentDomain.UnhandledException` và `Application.ThreadException`, ghi nhận thoát ứng dụng |
| `MainForm.cs` | Ghi nhận kích thước giao diện, vị trí màn hình, thay đổi giao diện Dark/Light theme |
| `MainForm.WebView.cs` | Ghi nhận khởi tạo WebView2, nạp cache, ánh xạ Virtual Host `https://app.local/`, chuyển đổi chế độ `Local Vue` / `Server 8123`, log lỗi proxy và HTTP 503 |
| `MainForm.Service.cs` | Ghi nhận lệnh gửi tới `service.bat` (`start`, `stop`, `restart`), log sự kiện thay đổi trạng thái service và cổng mạng (8123, 8124) |
| `MainForm.Tray.cs` | Bổ sung 2 menu ngữ cảnh: `📁 Mở Thư Mục Logs` & `📝 Xem Log Hôm Nay`, ghi nhận sự kiện thu nhỏ / khôi phục cửa sổ |
| `MainForm.Snapshot.cs` | Ghi nhận quá trình chụp snapshot, kích thước ảnh và đường dẫn lưu trữ |

---

## 3. Các Bước Triển Khai Chi Tiết

1. **Bước 1: Tạo `service_gui_csharp/AppLogger.cs`:**
   - Xây dựng lớp tĩnh `AppLogger` với enum `LogLevel { DEBUG, INFO, WARN, ERROR, FATAL }`.
   - Viết các phương thức `Debug()`, `Info()`, `Warn()`, `Error()`, `OpenLogFolder()`, `OpenCurrentLogFile()`.
   - Đảm bảo $\le 130$ dòng code, tuân thủ `GEMINI.md`.

2. **Bước 2: Tích hợp vào `Program.cs` & `MainForm.cs`:**
   - Thay thế toàn bộ mã `File.AppendAllText("gui_debug.log", ...)` cũ bằng `AppLogger`.
   - Kết nối exception handlers chuẩn.

3. **Bước 3: Tích hợp vào `MainForm.WebView.cs` & `MainForm.Service.cs`:**
   - Ghi log chi tiết cho luồng khởi tạo WebView2 và chuyển đổi chế độ.
   - Ghi log các thao tác điều khiển service.

4. **Bước 4: Tích hợp vào `MainForm.Tray.cs`:**
   - Thêm nút mở file/thư mục log vào menu ngữ cảnh khay hệ thống.

5. **Bước 5: Kiểm tra biên dịch & hồi quy:**
   - `dotnet build service_gui_csharp\GDTTaxCrawlerManager.csproj -c Release` (0 Warning, 0 Error).
   - Kiểm tra giới hạn số dòng code: mọi file $\le 160$ dòng.
   - Chạy `npm run check:lines`, `npm run test:server`, `python test_modular.py`.
   - Đồng bộ AST Knowledge Graph: `graphify update .`.

6. **Bước 6: Tạo Topic 14 và Nghiệm thu Walkthrough:**
   - Tạo `docs/topics/topic-14-standardized-logging-engine.md`.
   - Cập nhật `docs/TOPICS.md`.
   - Tạo `docs/logs/75_20261010_183600_implementation_plan.md` và `docs/logs/76_20261010_184500_walkthrough.md`.
   - Cập nhật `docs/logs/INDEX.md`.
