# 🎯 Kế Hoạch Triển Khai: Tối Ưu Hóa Toàn Diện WebView2 (Server Origin 8123 & Khắc Phục Triệt Để Mọi Trang Nghiệp Vụ)

> **Mã số phiên (STT):** 104  
> **Thời gian tạo:** 2026-10-14 01:45:00  
> **Loại tài liệu:** `implementation_plan`  
> **Trạng thái:** ⏳ SẴN SÀNG TRIỂN KHAI  
> **Mục tiêu:** Đưa WebView2 C# GUI về Server Origin chuẩn (`http://127.0.0.1:8123/`), loại bỏ hoàn toàn các lỗi nghẽn Mixed Content, CORS và Stream Buffer của reverse proxy tự chế, đảm bảo 100% trang nghiệp vụ (Quét MST, Báo cáo sản lượng, Bố cáo ĐKKD, Tra cứu Solr, Lọc Excel, Graphify) hoạt động mượt mà trong WebView2.

---

## 1. Phân Tích Kỹ Thuật & Nguyên Nhân Gốc Rễ (Root Cause)

| Hiện tượng | Nguyên nhân gốc rễ | Giải pháp kỹ thuật (Phương án 2) |
|:---|:---|:---|
| **Graphify không nạp được** | Iframe gọi `http://...` bị chặn bởi trang cha `https://app.local` (Active Mixed Content Block). | Chuyển WebView2 sang cùng origin `http://127.0.0.1:8123/` $\to$ Cùng giao thức HTTP, không bị Mixed Content. |
| **Bố cáo / Tra cứu gián đoạn** | Hàm `OnWebResourceRequested` của C# đọc stream `args.Request.Content` không đầy đủ header `Content-Type`. | Không qua proxy C# nữa; WebView2 giao tiếp trực tiếp với Fastify Gateway $\to$ 100% chuẩn HTTP/1.1 native. |
| **SSE Stream (/api/stream) chập chờn** | C# `CreateWebResourceResponse` giữ buffer của stream vô hạn, làm kẹt luồng xử lý của WebView2. | Kết nối SSE trực tiếp từ browser engine tới Fastify Node.js $\to$ Không bị kẹt bộ đệm. |
| **Màn hình trắng khi Web sập** | Khi chưa bật dịch vụ, WebView2 hiện lỗi mạng Chromium `ERR_CONNECTION_REFUSED`. | Tự động phát hiện trạng thái cổng 8123; nếu offline thì nạp giao diện chờ Offline sang trọng với nút "▶ Bật Dịch Vụ". |

---

## 2. Kế Hoạch Các Bước Thực Hiện

### Bước 1: Điều chỉnh `service_gui_csharp/MainForm.WebView.cs`
- Đổi mặc định `IsLocalMode = false` (ưu tiên `http://127.0.0.1:8123/`).
- Tinh chỉnh `NavigateToDashboard()`: Kiểm tra nếu port 8123 đang mở thì nạp thẳng `http://127.0.0.1:8123/`, nếu chưa mở thì nạp màn hình Offline Placeholder.
- Làm sạch và tối ưu `MainForm.WebView.cs` $\le 180$ dòng.

### Bước 2: Tự động phục hồi trong `service_gui_csharp/MainForm.Service.cs`
- Trong `CheckSystemStatusAsync()`: Khi phát hiện cổng 8123 chuyển từ `False` $\to$ `True` (dịch vụ vừa khởi động xong), WebView2 tự động nạp lại `NavigateToDashboard()` mà người dùng không cần bấm Nạp Lại.
- Khi người dùng bấm nút `▶ Bật`, tự động chuyển màn hình chờ sang trạng thái "Đang khởi động...".
- Giữ file $\le 180$ dòng.

### Bước 3: Đồng bộ giao diện Toolbar trong `service_gui_csharp/MainForm.cs`
- Cập nhật nhãn nút `btnMode`: Hiển thị rõ chế độ kết nối `🌐 Trực Tiếp (Port 8123)`.
- Giữ file $\le 180$ dòng.

### Bước 4: Kiểm thử tự động & Nghiệm thu
- Biên dịch C# .NET 10 (`Release` và `Debug`).
- Kiểm tra số dòng code (`npm run check:lines` và check C#).
- Dùng Playwright và API xác thực mọi trang.
- Lập Walkthrough và lưu trữ Audit Log STT 104 và 105 vào `docs/logs/`.
