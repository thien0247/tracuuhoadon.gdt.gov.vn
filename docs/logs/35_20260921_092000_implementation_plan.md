# Kế Hoạch Triển Khai: Bộ Công Cụ Quản Trị Windows Service (Đăng Ký, Start, Stop, Reset)

> **Mục tiêu:** Xây dựng file thực thi `.bat` hoàn chỉnh quản lý vòng đời Windows Service của Hệ thống Vét Cạn Mã Số Thuế GDT Tax Crawler:
> 1. Đăng ký / Gỡ đăng ký dịch vụ (Install / Uninstall)
> 2. Start / Stop dịch vụ
> 3. Reset / Khởi động lại dịch vụ

---

## 1. Bối Cảnh & Phân Tích Kỹ Thuật

1. **Thực trạng triển khai:**
   - Hệ thống vận hành theo kiến trúc Hybrid: TypeScript Fastify Backend (Port 8123) và Python AI Worker Bridge (Port 8124).
   - Trước đây người dùng phải mở cửa sổ CMD/bat thủ công (`run_server_ts.bat`), nếu tắt cửa sổ hoặc đăng xuất khỏi Windows thì hệ thống ngừng hoạt động.
   - Để chạy ngầm liên tục 24/7 và tự khởi động cùng Windows, hệ thống cần được đăng ký dưới dạng một **Windows Service** chính quy trong Service Control Manager (SCM).

2. **Giải pháp kiến trúc:**
   - Sử dụng **NSSM (Non-Sucking Service Manager)** phiên bản 64-bit portable đặt trực tiếp trong `bin/nssm.exe`, đảm bảo tính độc lập không phụ thuộc cài đặt máy chủ bên ngoài.
   - Xây dựng `service_runner.bat`: Đóng vai trò là entrypoint tiến trình dịch vụ, tự động dọn cổng 8123/8124 bị kẹt, khởi chạy song song Python Worker và Fastify Backend.
   - Xây dựng `service.bat` (kèm alias `service_manager.bat`):
     - Giao diện menu console tương tác tiếng Việt thân thiện.
     - Tự động kiểm tra và nâng quyền Administrator (UAC).
     - Hỗ trợ đầy đủ tham số dòng lệnh CLI (`install`, `uninstall`, `start`, `stop`, `reset`, `status`, `logs`).
     - Cơ chế xoay vòng nhật ký dịch vụ (Log rotation 10MB) vào thư mục `logs/`.

---

## 2. Kế Hoạch Thực Hiện
1. Tích hợp `bin/nssm.exe` 64-bit vào cây mã nguồn dự án.
2. Xây dựng `service_runner.bat` với đường dẫn môi trường chuẩn hóa (Node, Python).
3. Xây dựng `service.bat` với cấu trúc CRLF chuẩn xác cho Windows CMD.
4. Kiểm thử chu trình: `install` ➔ `start` ➔ `status` (kiểm tra socket 8123, 8124) ➔ `reset` ➔ `stop` ➔ `uninstall`.
