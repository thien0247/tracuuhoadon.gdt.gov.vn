---
name: gdt-tax-crawler
description: >-
  Operational runbook, architectural guide, and troubleshooting procedures for the GDT Tax Crawler
  (Hệ thống Vét Cạn Mã Số Thuế). Use when starting, stopping, or tuning multi-province tax crawlers,
  configuring the Rolling Queue Pool (max_concurrent_provinces), managing WAF F5 rate limits and circuit breakers,
  handling AI CAPTCHA sessions, or debugging tax code crawling workflows.
---

# GDT Tax Crawler - Quy Trình Vận Hành & Điều Phối

Skill này cung cấp các hướng dẫn chuẩn hóa để vận hành, cấu hình và khắc phục sự cố hệ thống Vét Cạn Mã Số Thuế Đa Tỉnh Song Song (`tracuuhoadon.gdt.gov.vn`).

---

## 1. Kiến Trúc Cốt Lõi Hệ Thống

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Dashboard / Frontend                 │
│         (Vue 3 Composition API, SSE Client, Tailwind)       │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SSE (/api/stream)
┌──────────────────────────────▼──────────────────────────────┐
│                    FastAPI Server Layer                     │
│  - server_app/routers/crawler.py: Điều khiển luồng         │
│  - server_app/core/queue_manager.py: Hàng đợi cuốn chiếu    │
│  - server_app/core/limiter.py: Safe Request Guard & WAF CB  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
┌──────────────▼──────────────┐ ┌─────────────▼───────────────┐
│       crawler_core/         │ │     PostgreSQL Database     │
│ - engine.py: Worker & Loop  │ │ - Connection Pool (psycopg2)│
│ - session.py: curl_cffi WAF │ │ - Batch execute_values      │
│ - solver.py: CNN Captcha    │ │ - 1.1M+ Records Cached      │
│ - validator.py: Checksum 11 │ └─────────────────────────────┘
└─────────────────────────────┘
```

---

## 2. Quy Trình Vận Hành Thường Dùng

### A. Quét MST Mới Từ TIN Max Toàn Bộ 62 Tỉnh
Chế độ quét tối ưu để cập nhật các MST mới phát hành của mọi tỉnh thành:
1. **Gọi API hoặc Bấm nút UI**:
   - Web UI: Nhấp **`⚡ Quét MST Mới Toàn Bộ (TIN Max)`**.
   - API: `POST /api/crawler/start_all_newest`
     ```json
     {
       "gap": 20,
       "num_workers": 1,
       "max_concurrent_provinces": 3
     }
     ```
2. **Cơ chế dừng tự động**:
   - Mỗi luồng tỉnh tự động dừng ngay khi kiểm tra **20 MST liên tiếp không tồn tại**.
   - Hàng đợi cuốn chiếu tự động kích hoạt tỉnh kế tiếp cho đến khi hoàn tất 62 tỉnh.

Chi tiết: xem [crawler_modes.md](./references/crawler_modes.md).

### B. Điều Chỉnh Số Tỉnh Quét Đồng Thời (Concurrency Pool)
- Mặc định: 3 tỉnh chạy đồng thời.
- Để tăng/giảm số tỉnh:
  - Trên Web UI: Dùng menu thả xuống **`Song song: [ 1 / 2 / 3 / 4 ]`** ngay trên Header.
  - Qua API: Thay đổi trường `"max_concurrent_provinces"` trong request body.
- **Quy tắc an toàn**: Mỗi tỉnh chạy 1 worker. 3 tỉnh đồng thời tiêu thụ khoảng 3 – 6 req/s, hoàn toàn an toàn dưới ngưỡng `MAX_GLOBAL_RPS = 32`.

### C. Xử Lý Khẩn Cấp Khi Bị WAF F5 Chặn
Nếu log xuất hiện `F5 WAF: Request Rejected`:
1. Circuit Breaker tự động ngắt và ngủ trong 30 giây (`WAF_COOLDOWN_SECONDS`).
2. Nếu WAF vẫn chặn liên tục:
   - Dừng toàn bộ tiến trình: `POST /api/crawler/stop_all`.
   - Giảm tốc độ toàn cục: `POST /api/config/system` với `{"max_global_rps": 16.0}`.
   - Chờ 1 - 2 phút trước khi kích hoạt lại.

Chi tiết: xem [waf_and_network_safety.md](./references/waf_and_network_safety.md).

---

## 3. Lệnh Thường Dùng

- **Khởi động server**:
  ```bash
  python -m uvicorn server:app --host 0.0.0.0 --port 8000
  ```
- **Kiểm tra trạng thái hàng đợi**:
  ```bash
  curl http://localhost:8000/api/crawler/queue_status
  ```
- **Dừng tất cả crawler**:
  ```bash
  curl -X POST http://localhost:8000/api/crawler/stop_all
  ```
- **Chạy bộ kiểm thử tự động toàn diện**:
  ```bash
  python test_modular.py
  ```
