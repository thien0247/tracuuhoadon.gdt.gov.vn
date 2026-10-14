---
id: "01M4V0FH0HGEAR4GMV4J41M7P7"
aliases:
  - "topic-07-system-architecture-redesign"
  - "topic-07-system-architecture-redesign.md"
created_at: "2026-10-13T16:10:41.041834+00:00"
type: "documentation"
---
# Topic 07: Tái Cấu Trúc Toàn Diện Kiến Trúc Hệ Thống (System Architecture Redesign)

> **Mã số:** Topic 07 | **Ngày bắt đầu:** 22/09/2026 | **Tác giả:** AI Assistant & Pair Programmer  
> **Trạng thái:** ✅ Đã hoàn thành | **Quy mô mục tiêu:** Mở rộng từ 1.23M+ lên 10M+ bản ghi, 63 tỉnh thành

---

## 1. Bối Cảnh & 5 Điểm Nghẽn Kiến Trúc Cũ

Hệ thống GDT Tax Crawler qua quá trình phát triển nhanh đã tích lũy 5 điểm nghẽn cốt lõi:
1. **Nhập nhằng Dual-Backend:** Fastify (TS) và FastAPI (Py) cạnh tranh endpoint, gây phân mảnh logic nghiệp vụ và định tuyến.
2. **Trạng thái bay hơi (In-memory Volatility):** Hàng đợi `ProvinceQueueCoordinator` và tiến trình cào chỉ lưu trên RAM, khi tắt server hoặc crash sẽ mất sạch tiến trình.
3. **Tranh chấp luồng & GIL trong Python:** Một tiến trình CPython gánh cả HTTP server, suy luận TensorFlow CRNN CAPTCHA và hàng chục worker threads cào dữ liệu.
4. **Phình to CSDL & Phân mảnh Connection Pool:** Bảng `tax_records` > 1.23M dòng thiếu chỉ mục chuyên dụng; có tới 3 Connection Pool rời rạc tiêu tốn hơn 35 kết nối.
5. **Nợ kỹ thuật thư mục gốc:** Hơn 116MB tệp SQLite cũ, script refactor dùng 1 lần và file tạm rải rác ở thư mục gốc.

---

## 2. Kiến Trúc Mục Tiêu (Clean Decoupled Micro-Worker)

```
┌─────────────────────────────────────────────────────────────┐
│                 Client SPA (Vue 3, Offline-first)           │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API / SSE Multiplex Stream
┌──────────────────────────────▼──────────────────────────────┐
│  TẦNG 1: Unified API Gateway & BFF (TypeScript Fastify)     │
│  - Endpoint duy nhất phục vụ người dùng (Port 80/8123)      │
│  - Truy vấn CSDL hiệu năng cao, xuất báo cáo XLSX/CSV       │
│  - Phân phối SSE Events thời gian thực                      │
└──────────────┬──────────────────────────────┬───────────────┘
               │ Đẩy/Đọc Job                  │ Truy vấn dữ liệu
┌──────────────▼──────────────┐ ┌─────────────▼───────────────┐
│ TẦNG 2: Persistent State    │ │ TẦNG 4: PostgreSQL 10M+     │
│ - Bảng crawler_jobs         │ │ - tax_records (B-Tree + GIN)│
│ - Checkpoint last_tin       │ │ - bocao_records (Partial Idx│
│ - Zero Data Loss            │ │ - PgBouncer / ConnectionPool│
└──────────────▲──────────────┘ └─────────────▲───────────────┘
               │ Nhận task / Checkpoint       │ Ingestion 50 rows/page
┌──────────────┴──────────────────────────────┴───────────────┐
│  TẦNG 3: Headless Crawler Microservice (Python Worker)       │
│  - Worker Bridge (Port nội bộ 8124)                         │
│  - curl_cffi Chrome 124 impersonate & Safe Request Guard    │
│  - CaptchaSolver (TensorFlow CRNN)                          │
│  - gap_filler: Quét bổ sung MST Bố cáo vào Thuế             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Các Giải Pháp Kỹ Thuật Đã Triển Khai

1. **Dọn dẹp Workspace & Cô lập nợ kỹ thuật:**
   - Di chuyển 116MB SQLite cũ vào `archive/legacy_sqlite/`.
   - Di chuyển các script refactor tạm thời vào `archive/legacy_scripts/`.
   - Di chuyển các file CSV xuất khẩu vào `archive/legacy_exports/`.
2. **Tối ưu hóa CSDL PostgreSQL:**
   - Kích hoạt extension `pg_trgm`.
   - Tạo Partial Index `idx_bocao_records_unmatched` cho các bản ghi Bố cáo chưa đồng bộ (`sync_status != 'synced'`).
   - Tạo GIN Trigram Index `idx_tax_records_norm_name_trgm` trên `norm_name` cho tìm kiếm mờ không dấu tức thời.
   - Tạo chỉ mục B-Tree `idx_tax_records_regi_date` cho lọc khoảng thời gian cấp phép.
   - Tạo bảng `crawler_jobs` lưu trữ trạng thái hàng đợi cuốn chiếu bền vững.
3. **Tách module và chuẩn hóa giới hạn dòng code:**
   - Đảm bảo 100% tệp TypeScript và Python tuân thủ nghiêm ngặt trần ≤ 200 dòng/file.
