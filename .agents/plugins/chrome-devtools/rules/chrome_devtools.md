# Hướng Dẫn Sử Dụng Chrome DevTools MCP Cho Agent

Khi plugin `chrome-devtools` được kích hoạt, Agent có quyền truy cập vào các công cụ Chrome DevTools để hỗ trợ phát triển web:

## 1. Các Tình Huống Nên Sử Dụng:
- **Kiểm thử giao diện (UI Verification):** Điều hướng tới trang web (`http://localhost:8000`), tương tác click, nhập input, cuộn trang.
- **Bắt lỗi Console:** Đọc các thông báo lỗi JavaScript, warning, hoặc uncaught exceptions từ console của trình duyệt.
- **Phân tích Network:** Theo dõi các request API (`/api/provinces`, `/api/stream`, `/api/crawler/*`), kiểm tra mã HTTP status, payload và thời gian phản hồi.
- **Đánh giá hiệu năng:** Thu thập Performance Traces và chỉ số Core Web Vitals (LCP, CLS, INP) khi tối ưu tốc độ render.
- **Chụp ảnh màn hình (Screenshots):** Chụp lại trạng thái trang để báo cáo trực quan cho người dùng.

## 2. Lưu Ý Vận Hành:
- Luôn tắt thu thập dữ liệu thống kê bằng cờ `--no-usage-statistics`.
- Không gửi thông tin nhạy cảm hoặc mật khẩu qua context MCP.
