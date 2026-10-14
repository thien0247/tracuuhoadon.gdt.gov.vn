---
id: "01M4V0FGZT243T45VNH4E9RQCG"
aliases:
  - "DB_SCHEMA"
  - "DB_SCHEMA.md"
created_at: "2026-10-13T16:10:41.018955+00:00"
type: "documentation"
related_code:
  - 01M4V0HMP3JFH2PF7JCKS57JM3
  - 01M4V0HMP4K06YVK8GXXJP84SP
  - 01M4V0HMP67E26K49WVAQF0ERW
  - 01M4V0HMP7JMDD0YG53KVWYT56
  - 01M4V0HMP9AXBMNGFKX4NP343A
  - 01M4V0HMPBBMNYWQ237H5VNCDC
  - 01M4V0HMPD5RMB27GTCR3YJ83N
  - 01M4V0HMPJ04STMP34AVWP92A1
  - 01M4V0HMPM36E31004JH9CKM38
  - 01M4V0HMPM4JN2CFPJ2DDFF343
  - 01M4V0HMPP1ZSQ313HDV5B2XYG
  - 01M4V0HMPQ9ZM45JA36JWA91FM
  - 01M4V0HMPSXCSFX3CC2P2JTJCN
  - 01M4V0HMPTSJFVSDB4F04Q445M
  - 01M4V0HMPWWYTQA9Z8K68MEQXP
  - 01M4V0HMPZ2W0RRVHJPXDXMCPC
  - 01M4V0HMQ0XNDQ3284D2D2TE8C
  - 01M4V15VQ2E8ZG0MTQ3H81VZGQ
  - 01M4V1PY000000000000000001
---
# 🗄️ DB_SCHEMA.md — Lược Đồ Cơ Sở Dữ Liệu

> **CSDL:** PostgreSQL 16 | **Database:** `taxdb` | **Port:** `:5433` (hoặc `:5432`)  
> **Dung lượng:** 1.1M+ bản ghi NNT toàn quốc  

---

## 1. Bảng Dữ Liệu Doanh Nghiệp Thuế (`tax_records`)

Bảng lưu trữ thông tin NNT được cào về từ Tổng cục Thuế:

```sql
CREATE TABLE IF NOT EXISTS tax_records (
    mst VARCHAR(20) PRIMARY KEY,              -- Mã số thuế (10 số hoặc 13 số)
    norm_name TEXT NOT NULL,                   -- Tên người nộp thuế đã chuẩn hóa
    address TEXT,                              -- Địa chỉ trụ sở chính
    status VARCHAR(100),                       -- Trạng thái hoạt động (NNT đang hoạt động...)
    regi_date DATE,                            -- Ngày cấp MST / Ngày thành lập
    chan_date DATE,                            -- Ngày thay đổi thông tin gần nhất
    cqt_ql VARCHAR(255),                       -- Cơ quan thuế quản lý trực tiếp
    province_prefix VARCHAR(5),                -- 2 chữ số đầu của MST (VD: 49 cho Đắk Lắk, 03 cho HCM)
    tran_tel VARCHAR(50),                      -- Số điện thoại liên hệ
    org_type VARCHAR(100),                     -- Loại hình tổ chức / doanh nghiệp
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Thời điểm hệ thống cào bản ghi
    raw_html TEXT                              -- Nội dung HTML thô (phục vụ đối soát)
);

-- Chỉ mục tối ưu hóa tốc độ tìm kiếm và thống kê
CREATE INDEX IF NOT EXISTS idx_tax_records_prefix ON tax_records(province_prefix);
CREATE INDEX IF NOT EXISTS idx_tax_records_regi_date ON tax_records(regi_date);
CREATE INDEX IF NOT EXISTS idx_tax_records_scraped_at ON tax_records(scraped_at);
CREATE INDEX IF NOT EXISTS idx_tax_records_norm_name_trgm ON tax_records USING gin (norm_name gin_trgm_ops);
```

---

## 2. Bảng Đối Soát Bố Cáo Đăng Ký Kinh Doanh (`bocao_records`)

Bảng lưu trữ thông tin doanh nghiệp thành lập mới từ Cổng Bố cáo Quốc gia:

```sql
CREATE TABLE IF NOT EXISTS bocao_records (
    id SERIAL PRIMARY KEY,
    tin VARCHAR(20) UNIQUE NOT NULL,           -- Mã số doanh nghiệp công bố
    name TEXT NOT NULL,                        -- Tên công ty đăng ký
    province VARCHAR(100),                     -- Tỉnh / Thành phố cấp phép
    publish_date DATE,                         -- Ngày đăng bố cáo
    reconcile_status VARCHAR(30) DEFAULT 'unmatched', -- matched / unmatched / retry_later
    matched_at TIMESTAMP WITH TIME ZONE,       -- Thời điểm khớp thành công với tax_records
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bocao_tin ON bocao_records(tin);
CREATE INDEX IF NOT EXISTS idx_bocao_reconcile ON bocao_records(reconcile_status);
```

---

## 3. Bảng Tổng Hợp Sản Lượng Hàng Ngày (`crawl_stats_daily` & `regi_stats_daily`)

```sql
-- Sản lượng cào được theo ngày
CREATE TABLE IF NOT EXISTS crawl_stats_daily (
    crawl_date DATE NOT NULL,
    province_key VARCHAR(50) NOT NULL,
    record_count INT DEFAULT 0,
    PRIMARY KEY (crawl_date, province_key)
);

-- Sản lượng theo ngày cấp phép thành lập
CREATE TABLE IF NOT EXISTS regi_stats_daily (
    regi_date DATE NOT NULL,
    province_key VARCHAR(50) NOT NULL,
    record_count INT DEFAULT 0,
    PRIMARY KEY (regi_date, province_key)
);
```

---

## 4. Nguyên Tắc Thao Tác CSDL Bất Biến

1. **Connection Pooling:** Tuyệt đối dùng Connection Pool (`SimpleConnectionPool` trong Python, `pg.Pool` trong TS), kích thước pool 5-20 kết nối.
2. **Batch Persistence:** Toàn bộ dữ liệu crawler cào về được commit theo lô (batch size 100 - 500 bản ghi) bằng `execute_values(..., page_size=500)` hoặc `UNNEST`.
3. **Upsert Safety:** Sử dụng `ON CONFLICT (mst) DO UPDATE SET norm_name = EXCLUDED.norm_name, updated_at = NOW()` để đảm bảo không lỗi trùng khóa chính.
