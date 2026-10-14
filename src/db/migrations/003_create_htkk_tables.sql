-- Migration 003: Tạo các bảng danh mục địa bàn & cơ quan thuế HTKK (3 cấp & 2 cấp)

-- 1. Mô hình 3 cấp (Truyền thống): Tỉnh / Thành phố
CREATE TABLE IF NOT EXISTS htkk_provinces_v3 (
    province_code VARCHAR(10) PRIMARY KEY,
    province_name VARCHAR(255) NOT NULL,
    version VARCHAR(20)
);

-- 2. Mô hình 3 cấp (Truyền thống): Quận / Huyện / Thị xã
CREATE TABLE IF NOT EXISTS htkk_districts_v3 (
    district_code VARCHAR(10) PRIMARY KEY,
    province_code VARCHAR(10) REFERENCES htkk_provinces_v3(province_code) ON DELETE CASCADE,
    district_name VARCHAR(255) NOT NULL,
    version VARCHAR(20)
);

-- 3. Mô hình 3 cấp (Truyền thống): Xã / Phường / Thị trấn
CREATE TABLE IF NOT EXISTS htkk_communes_v3 (
    commune_code VARCHAR(20) PRIMARY KEY,
    district_code VARCHAR(10) REFERENCES htkk_districts_v3(district_code) ON DELETE CASCADE,
    province_code VARCHAR(10) REFERENCES htkk_provinces_v3(province_code) ON DELETE CASCADE,
    commune_name VARCHAR(255) NOT NULL,
    is_expired BOOLEAN DEFAULT FALSE,
    version VARCHAR(20)
);

-- 4. Mô hình 2 cấp (Mới - Sau sáp nhập): Tỉnh / Thành phố mới
CREATE TABLE IF NOT EXISTS htkk_provinces_v2 (
    province_code VARCHAR(10) PRIMARY KEY,
    province_name VARCHAR(255) NOT NULL,
    version VARCHAR(20)
);

-- 5. Mô hình 2 cấp (Mới - ĐÃ BỎ CẤP HUYỆN): Xã / Phường mới
CREATE TABLE IF NOT EXISTS htkk_communes_v2 (
    commune_code VARCHAR(20) PRIMARY KEY,
    province_code VARCHAR(10) REFERENCES htkk_provinces_v2(province_code) ON DELETE CASCADE,
    commune_name VARCHAR(255) NOT NULL,
    version VARCHAR(20)
);

-- 6. Danh mục Cơ quan thuế / Cơ quan thu (Cục Thuế & Mạng lưới Thuế cơ sở)
CREATE TABLE IF NOT EXISTS htkk_tax_offices (
    tax_office_code VARCHAR(20) PRIMARY KEY,
    tax_office_name VARCHAR(255) NOT NULL,
    province_code VARCHAR(10),
    version VARCHAR(20)
);

-- 7. Ánh xạ Địa bàn Xã mới sang Thuế cơ sở phụ trách
CREATE TABLE IF NOT EXISTS htkk_commune_tax_office_map (
    commune_code VARCHAR(20),
    tax_office_code VARCHAR(20),
    tax_office_name VARCHAR(255),
    PRIMARY KEY (commune_code, tax_office_code)
);

-- 8. Ánh xạ Tỉnh cũ sang Tỉnh mới sau sắp xếp
CREATE TABLE IF NOT EXISTS htkk_province_map (
    old_province_code VARCHAR(10),
    new_province_code VARCHAR(10),
    PRIMARY KEY (old_province_code, new_province_code)
);

-- 9. Ánh xạ Xã cũ sang Xã mới sau sáp nhập
CREATE TABLE IF NOT EXISTS htkk_commune_map (
    old_commune_code VARCHAR(20),
    new_commune_code VARCHAR(20),
    PRIMARY KEY (old_commune_code, new_commune_code)
);

-- Các chỉ mục B-Tree tăng tốc truy vấn
CREATE INDEX IF NOT EXISTS idx_htkk_districts_v3_prov ON htkk_districts_v3(province_code);
CREATE INDEX IF NOT EXISTS idx_htkk_communes_v3_dist ON htkk_communes_v3(district_code);
CREATE INDEX IF NOT EXISTS idx_htkk_communes_v3_prov ON htkk_communes_v3(province_code);
CREATE INDEX IF NOT EXISTS idx_htkk_communes_v2_prov ON htkk_communes_v2(province_code);
CREATE INDEX IF NOT EXISTS idx_htkk_tax_offices_prov ON htkk_tax_offices(province_code);
CREATE INDEX IF NOT EXISTS idx_htkk_cqt_map_tax_off ON htkk_commune_tax_office_map(tax_office_code);

-- 10. View Hợp Nhất Chuyển Đổi Địa Bàn Hành Chính & Cơ Quan Thuế (3 Cấp <-> 2 Cấp)
CREATE OR REPLACE VIEW v_htkk_administrative_mapping AS
SELECT
    p3.province_code AS v3_province_code,
    p3.province_name AS v3_province_name,
    d3.district_code AS v3_district_code,
    d3.district_name AS v3_district_name,
    c3.commune_code AS v3_commune_code,
    c3.commune_name AS v3_commune_name,
    c3.is_expired AS v3_commune_is_expired,
    pm.new_province_code AS v2_province_code,
    p2.province_name AS v2_province_name,
    c2.commune_code AS v2_commune_code,
    c2.commune_name AS v2_commune_name,
    ctom.tax_office_code,
    ctom.tax_office_name
FROM htkk_communes_v3 c3
JOIN htkk_districts_v3 d3 ON c3.district_code = d3.district_code
JOIN htkk_provinces_v3 p3 ON c3.province_code = p3.province_code
LEFT JOIN htkk_province_map pm ON p3.province_code = pm.old_province_code
LEFT JOIN htkk_provinces_v2 p2 ON pm.new_province_code = p2.province_code
LEFT JOIN htkk_commune_map cm ON c3.commune_code = cm.old_commune_code
LEFT JOIN htkk_communes_v2 c2 ON cm.new_commune_code = c2.commune_code
LEFT JOIN htkk_commune_tax_office_map ctom ON c2.commune_code = ctom.commune_code;

