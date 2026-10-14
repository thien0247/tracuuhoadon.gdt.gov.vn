-- 004_add_v2_v3_to_tax_records.sql
-- Bổ sung bộ cột Địa bàn Hành chính 3 cấp (V3) và 2 cấp (V2) vào bảng tax_records

ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS v3_province_code VARCHAR(10);
ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS v3_province_name VARCHAR(100);
ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS v3_district_code VARCHAR(10);
ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS v3_district_name VARCHAR(150);
ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS v3_commune_code VARCHAR(15);
ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS v3_commune_name VARCHAR(150);

ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS v2_province_code VARCHAR(10);
ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS v2_province_name VARCHAR(100);
ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS v2_commune_code VARCHAR(15);
ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS v2_commune_name VARCHAR(150);
ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS thue_co_so_code VARCHAR(20);
ALTER TABLE tax_records ADD COLUMN IF NOT EXISTS thue_co_so_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_tax_records_v3_dist ON tax_records(v3_district_code);
CREATE INDEX IF NOT EXISTS idx_tax_records_v2_prov ON tax_records(v2_province_code);
CREATE INDEX IF NOT EXISTS idx_tax_records_thue_co_so ON tax_records(thue_co_so_code);
