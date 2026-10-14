---
id: "01M4V0FH0GKXYPS38JG5J0A4FF"
aliases:
  - "topic-06-windows-service-gui"
  - "topic-06-windows-service-gui.md"
created_at: "2026-10-13T16:10:41.040145+00:00"
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
# Topic 06: Kiến Trúc Quản Trị Windows Service & Ứng Dụng Python GUI Điều Khiển

> **Trạng thái:** ✅ Đã hoàn thành  
> **Ngày bắt đầu:** 21/09/2026  
> **Mục tiêu:** Chuyển đổi mô hình vận hành thủ công của hệ thống GDT Tax Crawler (Fastify 8123 + Python Worker 8124) sang Windows Service chạy ngầm 24/7, kèm bộ điều khiển CLI và ứng dụng Python Desktop GUI trực quan.

---

## 1. Bài Toán & Nhu Cầu Thực Tế

1. **Vấn đề vận hành:**
   - Hệ thống gồm 2 thành phần độc lập: Fastify Web Server (cổng 8123) và Python AI Worker Bridge (cổng 8124).
   - Trước đây cần chạy file batch trong cửa sổ console CMD. Khi người dùng đóng cửa sổ hoặc đăng xuất (logoff) khỏi Windows Server, toàn bộ tiến trình dừng hoạt động.
   - Không có cơ chế tự động khởi động cùng hệ điều hành và thiếu cơ chế xoay vòng log (log rotation) khi kích thước file phình to.

2. **Yêu cầu giải pháp:**
   - Đăng ký hệ thống thành một Windows Service chính quy mang tên `GDTTaxCrawler` trong Windows Service Control Manager (SCM).
   - Hỗ trợ đầy đủ vòng đời: Đăng ký (Install), Gỡ bỏ (Uninstall), Khởi động (Start), Dừng (Stop), Khởi động lại (Reset).
   - Cung cấp giao diện đồ họa (Python GUI) với đèn báo trạng thái động (Xanh lá - Running, Đỏ - Stopped, Xám - Not Installed) và streaming logs thời gian thực.

---

## 2. Kiến Trúc Giải Pháp & Sơ Đồ Khối

```
                           +-------------------------------+
                           |      Windows SCM (Service)    |
                           |       Name: GDTTaxCrawler     |
                           +---------------+---------------+
                                           |
                                           v
                           +---------------+---------------+
                           |      bin/nssm.exe (64-bit)    |
                           |   Auto-Restart & Log Rotation |
                           +---------------+---------------+
                                           |
                                           v
                           +---------------+---------------+
                           |       service_runner.bat      |
                           +-------+---------------+-------+
                                   |               |
             +---------------------+               +---------------------+
             v                                                           v
+-----------------------------+                             +-----------------------------+
|    Python Worker Bridge     |                             |   TypeScript Fastify Server |
|   (Port 8124 - AI CAPTCHA)  |                             |   (Port 8123 - Web UI/API)  |
+-----------------------------+                             +-----------------------------+
             ^                                                           ^
             |                                                           |
             +---------------------+---------------+---------------------+
                                   |               |
                           +-------+-------+ +-----+-------+
                           |  service.bat  | |service_gui.py|
                           | (CLI & Menu)  | |(Tkinter GUI)|
                           +---------------+ +-------------+
```

---

## 3. Danh Sách Tệp Triển Khai

| Tệp Tin | Loại | Mô Tả Chức Năng |
|:---|:---|:---|
| `bin/nssm.exe` | Binary | NSSM 2.24 64-bit portable quản lý tiến trình ngầm |
| `service_runner.bat` | Batch Script | Runner chuẩn bị PATH, dọn dẹp port 8123/8124 và khởi chạy cả 2 tiến trình |
| `service.bat` / `service_manager.bat` | Batch Script | Menu tương tác tiếng Việt + tham số dòng lệnh CLI, tự động nâng quyền Admin |
| `service_gui_core.py` | Python Core | Module kiểm tra trạng thái SCM, socket cổng 8123/8124, async command execution (122 dòng) |
| `service_gui.py` | Python GUI | Giao diện Tkinter hiện đại, status badges 3 màu Green/Red/Gray, log real-time (170 dòng) |
| `run_service_gui.bat` / `service_gui.bat` | Batch Script | Phím tắt khởi chạy GUI với quyền Administrator |

---

## 4. Bằng Chứng Nghiệm Thu & Kiểm Thử

1. **Khởi chạy ngầm & Quản lý Cổng:**
   - Cổng 8123 (Fastify Web Dashboard): `HTTP 200 OK`.
   - Cổng 8124 (Python AI Worker): `HTTP 200 OK`.
2. **Cơ chế Reset an toàn:**
   - Dừng dịch vụ ➔ giải phóng triệt để socket ➔ khởi động lại mới trong ~7 giây.
3. **Tuân thủ quy chuẩn GEMINI.md:**
   - `service_gui_core.py`: 122 dòng (chuẩn < 200 dòng).
   - `service_gui.py`: 170 dòng (chuẩn < 200 dòng).
