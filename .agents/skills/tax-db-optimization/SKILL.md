---
name: tax-db-optimization
description: >-
  Specialized query optimization guidelines, index strategies, and connection pooling patterns
  for the GDT Tax Database (tax_records table with 1.1M+ records) in PostgreSQL.
  Use when writing SQL queries, filtering records, building database migrations,
  or optimizing crawler read/write performance for AI agents.
---

# Tối Ưu Truy Vấn CSDL Thuế (GDT Tax Database Optimization)

Skill này cung cấp các nguyên tắc và mẫu truy vấn SQL tối ưu hóa hiệu năng cao nhất cho CSDL `taxdb` (hơn 1.1 triệu bản ghi doanh nghiệp).

---

## 1. Cấu Trúc Bảng Cốt Lõi (`tax_records`)

```sql
CREATE TABLE tax_records (
    tin TEXT PRIMARY KEY,               -- Mã số thuế 10 chữ số (B-Tree Index mặc định)
    norm_name TEXT,                     -- Tên doanh nghiệp chuẩn hóa (không dấu, chữ hoa)
    status TEXT,                        -- Trạng thái mã số thuế
    status_name TEXT,                   -- Tên trạng thái (Đang hoạt động, Tạm ngừng,...)
    econ_name TEXT,                     -- Loại hình kinh tế
    economy TEXT,                       -- Ngành nghề kinh doanh
    tran_addr TEXT,                     -- Địa chỉ trụ sở
    tran_dist TEXT,                     -- Quận/Huyện/Tỉnh
    pay_taxo_id TEXT,                   -- Mã cơ quan thuế quản lý
    pay_taxo_name TEXT,                 -- Tên cơ quan thuế
    regi_date TIMESTAMP,                -- Ngày cấp mã số thuế
    tu_ngay TIMESTAMP,                  -- Ngày bắt đầu hoạt động
    den_ngay TIMESTAMP,                 -- Ngày đóng cửa / giải thể
    scraped_at TIMESTAMP,               -- Thời điểm crawler thu thập
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. Quy Tắc Tối Ưu Hóa Truy Vấn Cho AI Agent

### A. Truy Vấn TIN Lớn Nhất/Nhỏ Nhất Theo Tỉnh (B-Tree Index Scan)
❌ **KÉM HIỆU QUẢ (Full table scan hoặc LIKE pattern):**
```sql
SELECT MAX(tin) FROM tax_records WHERE tin LIKE '60%' AND LENGTH(tin) = 10;
```
✅ **TỐI ƯU TUYỆT ĐỐI (Chỉ đọc 1 index page, < 0.1ms):**
```sql
-- Lấy TIN Max:
SELECT tin FROM tax_records 
WHERE tin >= '6000000000' AND tin <= '6099999999' 
ORDER BY tin DESC LIMIT 1;

-- Lấy TIN Min:
SELECT tin FROM tax_records 
WHERE tin >= '6000000000' AND tin <= '6099999999' 
ORDER BY tin ASC LIMIT 1;
```

### B. Bỏ Qua Kiểm Tra Trùng Khi Quét Mới (`newest` scan)
- Chế độ quét mới bắt đầu từ `tin_max` trở lên.
- **Quy tắc:** Tuyệt đối KHÔNG gọi `SELECT 1 FROM tax_records WHERE tin = %s` cho từng số trong chế độ `newest`, vì toàn bộ dãy số sinh ra đều lớn hơn `tin_max` và chưa từng có trong DB.

### C. Nạp Dữ Liệu Theo Lô (Batch Insert với `execute_values`)
- Luôn sử dụng bộ đệm (buffer) và `execute_values` của `psycopg2.extras` với mệnh đề `ON CONFLICT (tin) DO UPDATE`:
```python
from psycopg2.extras import execute_values

query = """
    INSERT INTO tax_records (tin, norm_name, status, status_name, regi_date, scraped_at)
    VALUES %s
    ON CONFLICT (tin) DO UPDATE SET
        norm_name = EXCLUDED.norm_name,
        status = EXCLUDED.status,
        status_name = EXCLUDED.status_name,
        updated_at = CURRENT_TIMESTAMP
"""
execute_values(cursor, query, batch_data, page_size=100)
```

### D. Tối Ưu Hóa Tìm Kiếm Tên & Lọc Theo Ngày
1. **Tìm kiếm theo tên (`norm_name`):** Sử dụng hàm chuẩn hóa không dấu và chỉ mục GIN Trigram (`pg_trgm`) cho tìm kiếm mờ (Fuzzy Search).
2. **Lọc theo khoảng ngày (`regi_date` / `tu_ngay`):** Sử dụng so sánh khoảng thời gian có chỉ mục:
   ```sql
   WHERE regi_date >= '2024-01-01' AND regi_date <= '2024-12-31'
   ```
