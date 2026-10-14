---
id: "01M4V0FH0Y37YAJEQCSBTEP0YK"
aliases:
  - "topic-15-services-control-tab"
  - "topic-15-services-control-tab.md"
created_at: "2026-10-13T16:10:41.054775+00:00"
type: "documentation"
related_code:
  - 01M4V18JXRGFZS2AGBE3VJD8SP
---
# Topic 15: Tích Hợp Tab Quản Trị & Điều Khiển Toàn Bộ Các Dịch Vụ Liên Quan (Services Control Center)

> **Mã chủ đề:** `topic-15-services-control-tab`  
> **Trạng thái:** 🟡 ĐANG TRIỂN KHAI  
> **Ngày bắt đầu:** 11/10/2026  
> **Phạm vi:** Backend Fastify (`src/modules/services/`) & Frontend Vue 3 (`ServicesTab.vue`)

---

## 1. Đặt Vấn Đề & Yêu Cầu Người Dùng

Trong quá trình vận hành hệ thống Vét Cạn Mã Số Thuế GDT, hệ thống bao gồm nhiều dịch vụ phối hợp đa tầng:
1. **Windows Service `GDTTaxCrawler`**: Quản lý tiến trình nền hệ điều hành.
2. **Fastify Web Server (Cổng 8123)**: Cung cấp API Gateway & Dashboard.
3. **Python AI Worker (Cổng 8124)**: Giải CAPTCHA, kết nối F5 WAF & Scraper.
4. **PostgreSQL Database Server (Cổng 5432)**: Lưu trữ 1.1M+ bản ghi NNT và kết nối connection pool.
5. **Scheduler Quét Đỉnh & Quét Fill 500 (12h)**: Lập lịch cron tự động.
6. **Data Enrichment Worker**: Tiến trình làm giàu thuộc tính công ty.

Trước đây, người dùng chỉ có nút bật/tắt toàn bộ dịch vụ trên thanh công cụ C# hoặc khay hệ thống, **chưa có một Tab giao diện trung tâm** để quan sát sức khỏe chi tiết và độc lập điều khiển (Start / Stop / Reset) từng dịch vụ liên quan.

---

## 2. Kiến Trúc Giải Pháp Kỹ Thuật

```
Vue 3 Dashboard (ServicesTab.vue)
        │
        ▼ HTTP GET/POST /api/services/*
Fastify Backend (src/modules/services/)
   ├── ServicesService.getStatus()
   │     ├── sc queryex GDTTaxCrawler (Windows Service PID & State)
   │     ├── TCP Port 8123 (Fastify Web Server)
   │     ├── TCP Port 8124 (Python AI Worker)
   │     ├── TCP Port 5432 & pool.query('SELECT 1') (PostgreSQL)
   │     ├── Crawler Schedule Bridge (/worker/schedule/status)
   │     └── Enrichment Job Progress
   └── ServicesService.controlService(serviceId, action)
         ├── service.bat start / stop / restart
         ├── /worker/stop_all
         ├── /worker/schedule/toggle_*
         └── EnrichmentJobManager
```

---

## 3. Danh Mục Các Service Được Quản Trị

| Mã định danh | Tên dịch vụ | Cổng | Loại hình | Các thao tác hỗ trợ |
|:---|:---|:---:|:---:|:---|
| `gdt_windows_service` | Windows Service `GDTTaxCrawler` | — | Windows Service | Start, Stop, Restart |
| `fastify_web` | Fastify Web API & Dashboard | 8123 | HTTP API Gateway | Restart, Health Check |
| `python_worker` | Python AI CAPTCHA & Scraper | 8124 | AI Worker Bridge | Start, Stop, Reset |
| `postgresql_db` | PostgreSQL Database Server | 5432 | Relational Database | Test Connection, Pool Ping |
| `crawler_scheduler` | Lập Lịch Quét Đỉnh & Fill 500 | — | Cron Scheduler | Bật Auto, Tắt Auto, Quét Ngay |
| `enrichment_worker` | Bộ Làm Giàu Dữ Liệu NNT | — | Background Job | Bắt Đầu Job, Dừng Job |
