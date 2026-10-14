---
id: "01M4V0FGZWGH323BATKPX8JHEV"
aliases:
  - "DEVOPS_RUNBOOK"
  - "DEVOPS_RUNBOOK.md"
created_at: "2026-10-13T16:10:41.020685+00:00"
type: "documentation"
---
# 🚀 DEVOPS_RUNBOOK.md — Sổ Tay Vận Hành Hệ Thống

> **Hệ thống:** GDT Tax Crawler & Multi-Province Search Engine  
> **Môi trường vận hành:** Windows Server 2022 / Windows 11  

---

## 1. Bản Đồ Dịch Vụ & Tiến Trình Hệ Thống

| Dịch vụ | Công nghệ | Cổng mạng | Script khởi động | File nhật ký |
| :--- | :--- | :---: | :--- | :--- |
| **Web Gateway API** | Fastify (Node.js) | `:8123` | `run_server_ts.bat` | `logs/fastify.log` |
| **AI Solver & Crawler**| Python 3.10+ | `:8124` | `service_runner.bat` | `logs/crawler.log` |
| **Desktop Control GUI**| C# .NET 10 | — | `run_csharp_gui.bat` | Console / Debug log |
| **CSDL PostgreSQL** | PostgreSQL 16 | `:5433` / `:5432` | Windows Service `postgresql-x64-16` | Event Viewer / PG Data |

---

## 2. Quy Trình Khởi Động & Giám Sát Hàng Ngày

### 2.1. Khởi động nhanh toàn bộ hệ thống
Sử dụng ứng dụng Desktop Control Manager:
```powershell
# Chạy trình điều khiển C# Native GUI (có sẵn WebView2 Dashboard)
.\run_csharp_gui.bat
```
Hoặc khởi động thủ công qua console:
```powershell
# 1. Khởi động Web Gateway Fastify
.\run_server_ts.bat

# 2. Khởi động Python Worker & AI CAPTCHA Solver
.\service_runner.bat
```

### 2.2. Kiểm tra nhanh trạng thái các cổng
```powershell
powershell -ExecutionPolicy Bypass -File scripts\check-ports.ps1
```

---

## 3. Quy Trình Ứng Phó Sự Cố Vận Hành (Incident Playbook)

### 3.1. Sự cố 1: Cổng mạng `:8123` hoặc `:8124` bị treo ngầm (`EADDRINUSE`)
- **Dấu hiệu:** Web Gateway hoặc Python Worker báo lỗi không bind được cổng khi khởi động lại.
- **Xử lý nhanh:**
  ```powershell
  # Giải phóng cổng 8123
  powershell -ExecutionPolicy Bypass -File scripts\kill-port.ps1 -Port 8123

  # Giải phóng cổng 8124
  powershell -ExecutionPolicy Bypass -File scripts\kill-port.ps1 -Port 8124
  ```

### 3.2. Sự cố 2: F5 WAF Phản Hồi `Request Rejected` / HTTP 403
- **Nguyên nhân:** Tần suất request vượt ngưỡng an toàn của WAF Tổng cục Thuế.
- **Cơ chế tự bảo vệ:** Hệ thống kích hoạt **Circuit Breaker** và chuyển sang trạng thái tạm dừng trong 30 giây (`waf_cooldown_seconds = 30.0`).
- **Hành động kỹ sư:**
  1. Kiểm tra cấu hình `config.json`, giảm `max_global_rps` từ `32.0` xuống `16.0` hoặc `8.0`.
  2. Tăng `stagger_delay_seconds` lên `2.0` giây.
  3. Không cố gắng bắn request liên tục bằng tay trong thời gian cooldown.

### 3.3. Sự cố 3: Lỗi Proxy Loopback `400 Direct IP access is not allowed`
- **Nguyên nhân:** Biến môi trường hệ thống chứa `http_proxy=http://127.0.0.1:53585` làm các request nội bộ đến `127.0.0.1` bị chuyển hướng sai.
- **Xử lý:** Đảm bảo thêm biến `NO_PROXY`:
  ```powershell
  $env:NO_PROXY="127.0.0.1,localhost,app.local"
  ```
  *(Đã được cấu hình tự động trong `Program.cs` và `client.ts`)*.

---

## 4. Bảo Trì & Sao Lưu Định Kỳ

1. **Kiểm tra giới hạn dòng code:** Chạy `npm run check:lines` và `python test_modular.py` trước mỗi phiên release.
2. **Vacuum & Reindex PostgreSQL định kỳ hàng tháng:**
   ```sql
   VACUUM ANALYZE tax_records;
   REINDEX TABLE tax_records;
   ```
3. **Đồng bộ Knowledge Graph:** Chạy `graphify update .` sau khi hoàn thành đợt cập nhật mã nguồn lớn.
