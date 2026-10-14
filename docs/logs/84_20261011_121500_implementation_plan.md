# Kế Hoạch Triển Khai: Áp Dụng Mô Hình Service Manager & WebView2 Bridge Từ Muasamcong

- **Mã kế hoạch:** `84_20261011_121500_implementation_plan`
- **Ngày tạo:** 11/10/2026
- **Tác giả:** Antigravity AI Agent
- **Trạng thái:** 🚀 Đang triển khai

---

## 1. Mục Tiêu & Bối Cảnh
Áp dụng mô hình kiến trúc điều khiển dịch vụ và cầu nối WebView2 (WebViewBridge) từ dự án tham khảo `E:\muasamcong.mpi.gov.vn\service-manager` sang dự án `C:\tracuuhoadon.gdt.gov.vn`.

### Điểm Ưu Việt Của Kiến Trúc Tham Khảo:
1. **Giao tiếp Hai Chiều (Bi-directional Native IPC):**
   - C# gửi thông điệp JSON tới WebView2 (`PostWebMessageAsJson`) cho các sự kiện `STATUS_UPDATE`, `LOG`, `LOG_HISTORY`, `SERVICE_RELOADED`.
   - Vue 3 giao tiếp trực tiếp với tiến trình C# host qua `window.chrome.webview.postMessage()` với các action `INIT`, `GET_STATUS`, `START_SERVICE`, `STOP_SERVICE`, `RESTART_SERVICE`, `START_ALL`, `STOP_ALL`, `CLEAR_LOGS`, `OPEN_URL`, `RELOAD_PAGE`.
   - **Lợi ích cốt lõi:** Bỏ qua hoàn toàn HTTP proxy của hệ thống, không sợ bị chặn IP nội bộ hay timeout mạng, phản hồi tức thời microsecond.
2. **Chế Độ Lai Tự Động (Hybrid Native + Web Fallback):**
   - Khi chạy trong C# WebView2 GUI: Kích hoạt Native IPC.
   - Khi người dùng truy cập qua trình duyệt web thông thường (Chrome, Edge độc lập): Tự động fallback sang REST API (`/api/services/status`, `/api/services/control`).
3. **Giám Sát Cổng Không Proxy (Proxy-Safe HealthChecker):**
   - Dùng `TcpClient` probe socket trực tiếp và `HttpClient { UseProxy = false }` với timeout 1000-1500ms.
4. **Hệ Thống Log Tập Trung Trực Quan (Centralized Live Log Terminal):**
   - Stream log thời gian thực từ C# AppLogger và backend sang Vue 3 với bộ lọc tiến trình, sao chép clipboard và tự cuộn.

---

## 2. Danh Mục Các Bước Thực Hiện

### Giai Đoạn 1: Cấu Trúc C# Backend (`service_gui_csharp/`)
1. **`service_gui_csharp/Models/ServiceInfo.cs`** (< 40 dòng):
   - Định nghĩa model `ServiceInfo`, enum `ServiceStatus` (Stopped, Starting, Running, Error).
2. **`service_gui_csharp/Services/HealthChecker.cs`** (< 80 dòng):
   - Kiểm tra TCP port và HTTP health check với `UseProxy = false`.
3. **`service_gui_csharp/Services/LogManager.cs`** (< 70 dòng):
   - Quản lý nhật ký tập trung trong bộ nhớ đệm, phát event `LogReceived`.
   - Kết nối với `AppLogger.cs`.
4. **`service_gui_csharp/Services/WebViewBridge.cs`** (< 175 dòng):
   - Đăng ký và xử lý `CoreWebView2.WebMessageReceived`.
   - Quản lý danh sách 5 dịch vụ GDT (`gdt_windows_service`, `fastify_web`, `python_worker`, `postgresql_db`, `crawler_scheduler`).
   - Phát sóng `STATUS_UPDATE`, `LOG`, `LOG_HISTORY`, `SERVICE_RELOADED`.
5. **Cập nhật `MainForm.cs` & `MainForm.WebView.cs`:**
   - Khởi tạo và gắn `WebViewBridge.Attach(webView.CoreWebView2)`.
   - Đảm bảo tuân thủ giới hạn < 180 dòng/file.

### Giai Đoạn 2: Frontend Vue 3 (`frontend/src/`)
1. **`frontend/src/types/service.ts`** (< 50 dòng):
   - Kiểu `ManagedService`, `ServiceLogMessage`, `BridgeIncomingMessage`, `BridgeOutgoingMessage`.
2. **`frontend/src/composables/useServiceManager.ts`** (< 160 dòng):
   - Nhận diện `window.chrome.webview`, xử lý sự kiện `message`, phát lệnh native hoặc fallback REST API.
3. **`frontend/src/components/services/ServiceLogViewer.vue`** (< 130 dòng):
   - Terminal log phong cách dark theme, lọc theo service (ALL, SYSTEM, PROXY, FASTIFY, WORKER, SCHEDULER), copy, clear.
4. **`frontend/src/components/services/ServicesTab.vue`** (< 180 dòng):
   - Tích hợp `useServiceManager`, hiển thị card dịch vụ, nút Start/Stop/Reset/Ping/Tham số, trạng thái Native/Web.

### Giai Đoạn 3: Kiểm Thử & Xác Minh (4C Verification)
1. **Compile & Check Lines:** Chạy `dotnet build` và kiểm tra số dòng code không file nào vượt 180 dòng.
2. **Frontend Build:** Chạy `npm run build` không lỗi type hay warning.
3. **Line Limits & Tests:** Chạy `python test_modular.py` và `npm run check:lines`.
4. **Lưu Walkthrough:** Ghi lại nhật ký vào `docs/logs/85_20261011_123000_walkthrough.md` và cập nhật `docs/logs/INDEX.md`.
