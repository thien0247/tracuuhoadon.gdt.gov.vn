# Kế Hoạch Triển Khai: Xây Dựng Ứng Dụng Python GUI Quản Trị Windows Service

> **Mục tiêu:** Xây dựng ứng dụng Desktop GUI trực quan bằng Python (Tkinter) kết nối với Windows Service `GDTTaxCrawler`:
> - Hệ thống đèn báo trạng thái đổi màu trực quan: Green (Đang chạy), Red (Đã dừng), Gray (Chưa đăng ký/Khóa).
> - Điều khiển đầy đủ: Đăng ký, Gỡ bỏ, Start, Stop, Reset, Mở Web Dashboard.
> - Bảng hiển thị nhật ký (Real-time Logs) đa luồng không treo giao diện.
> - Tuân thủ giới hạn dòng code theo `GEMINI.md` (< 200 dòng/file).

---

## 1. Kiến Trúc Phân Rã Mô-đun

Để không vi phạm giới hạn 200 dòng cho code Python, hệ thống phân rã thành 2 tệp:
1. **`service_gui_core.py` (Lõi xử lý nghiệp vụ):**
   - Quản lý đường dẫn NSSM và thực thi lệnh shell bất đồng bộ (Background Thread).
   - Kiểm tra socket các cổng 8123 và 8124 qua `socket.connect_ex`.
   - Kiểm tra trạng thái Windows Service qua PowerShell `Get-Service`.
   - Callback streaming từng dòng log về giao diện.
2. **`service_gui.py` (Giao diện người dùng Tkinter):**
   - Khung giao diện hiện đại với banner thông tin.
   - Các nhãn trạng thái và chấm tròn (●) đổi màu động.
   - Ma trận nút bấm điều khiển theo trạng thái dịch vụ.
   - Vùng `ScrolledText` hiển thị nhật ký có highlight màu (INFO, SUCCESS, WARNING, ERROR).
   - Polling ngầm mỗi 3 giây qua `root.after()`.
3. **`run_service_gui.bat` / `service_gui.bat`:**
   - Launcher 1-click tự động nâng quyền Administrator trước khi khởi chạy Python GUI.

---

## 2. Kế Hoạch Kiểm Thử
1. Kiểm tra giới hạn dòng code: Cả 2 tệp Python phải <= 200 dòng.
2. Kiểm tra chuyển đổi màu sắc:
   - Khi dịch vụ STOPPED: chấm đỏ, nút Start sáng xanh, nút Stop/Reset khóa xám.
   - Khi dịch vụ RUNNING: chấm xanh lá, nút Start khóa xám, nút Stop/Reset sáng màu.
   - Khi dịch vụ NOT_INSTALLED: chấm xám, chỉ nút Install mở.
3. Kiểm tra streaming log không bị giật lag giao diện.
