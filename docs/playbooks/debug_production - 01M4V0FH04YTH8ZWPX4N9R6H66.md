---
id: "01M4V0FH04YTH8ZWPX4N9R6H66"
aliases:
  - "debug_production"
  - "debug_production.md"
created_at: "2026-10-13T16:10:41.029229+00:00"
type: "documentation"
---
# 🛠️ Playbook: Xử Lý Sự Cố Khẩn Cấp Trên Production (Debug Production Issue)

> Áp dụng theo chuẩn CodexKit Playbooks kết hợp kiến trúc Windows Service & Crawler GDT.

## Mẫu Điều Hướng Prompt Dành Cho AI Agent

```text
Khảo sát và xử lý lỗi hệ thống dưới tư duy kỹ sư vận hành Production (SRE Mindset).

Quy trình bắt buộc gồm 6 bước:
1. Observed vs Expected: Hành vi quan sát được thực tế so với kỳ vọng.
2. Probable Failure Boundary: Ranh giới vỡ (WAF F5, Captcha Solver, Windows Service, hay DB Pool).
3. Cheapest Reproduction Path: Cách tái hiện lỗi tối thiểu, không gây tải mạng thật.
4. Likely Root Cause: Phân tích nguyên nhân gốc rễ (5 Whys).
5. Fix Strategy: Chiến lược vá an toàn (< 200 dòng/file, không phá vỡ logic xung quanh).
6. Verification Plan: Kế hoạch xác thực (4C: Correctness, Completeness, Context-fit, Consequence).

Thông tin sự cố:
[Dán log lỗi, trạng thái Windows Service, HTTP status code hoặc triệu chứng]
```

## Các Bước Xử Lý Nhanh Cho Dự Án GDT Tax Crawler

### 1. Khi Windows Service Không Khởi Động Được
- **Kiểm tra trạng thái:** Chạy `service.bat status` hoặc `sc query GDTTaxCrawler`.
- **Đọc log:** Mở `logs/service.log` và `logs/service_error.log`.
- **Xử lý nhanh:** Chạy `service.bat restart` với quyền Administrator.

### 2. Khi Bị WAF F5 Chặn IP ("Request Rejected" hoặc 403)
- **Triệu chứng:** Log hiển thị `[CIRCUIT BREAKER] State changed to OPEN`.
- **Hành động:** 
  - Không cố gắng spam request.
  - Hạ `max_global_rps` xuống dưới 10 qua API `POST /api/config/system`.
  - Tạm dừng queue trong 60-120 giây để WAF hạ nhiệt.

### 3. Khi Quá Tải Kết Nối PostgreSQL (FATAL: remaining connection slots are reserved)
- **Kiểm tra:** `SELECT count(*), state FROM pg_stat_activity GROUP BY state;`.
- **Xử lý:** Đảm bảo toàn bộ truy vấn dùng `with get_db_connection() as conn:` để giải phóng kết nối ngay.
