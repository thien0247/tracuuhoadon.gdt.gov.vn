"""
scripts/import_htkk.py - ETL nạp toàn bộ danh mục địa bàn & thuế HTKK vào PostgreSQL.
Hỗ trợ cả mô hình 3 cấp (có huyện) và mô hình 2 cấp cải cách (đã bỏ huyện).
"""

import os
import sys
import xml.etree.ElementTree as ET
import psycopg2
from psycopg2.extras import execute_values

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

DB_DSN = os.getenv("DB_DSN", "postgresql://zzsu:Zzs%40123@localhost:5433/taxdb")
HTKK_DIR = "htkk"


def parse_items(file_path):
    full = os.path.join(HTKK_DIR, file_path)
    if not os.path.exists(full):
        return [], "N/A"
    tree = ET.parse(full)
    root = tree.getroot()
    ver = root.attrib.get("Version", "N/A")
    return root.findall(".//Item"), ver


def run_etl():
    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor()
    print("=== BẮT ĐẦU NẠP DỮ LIỆU DANH MỤC HTKK VÀO POSTGRESQL ===")

    # 1. htkk_provinces_v3
    items, ver = parse_items("Catalogue_Dia_Ban_Tinh.xml")
    rows = []
    for it in items:
        val = it.attrib.get("Value", "")
        parts = val.split("###")
        if len(parts) >= 3:
            rows.append((parts[1].strip(), parts[2].strip(), ver))
    cur.execute("TRUNCATE TABLE htkk_provinces_v3 CASCADE;")
    execute_values(cur, "INSERT INTO htkk_provinces_v3 (province_code, province_name, version) VALUES %s ON CONFLICT DO NOTHING;", rows)
    print(f"✅ 1. htkk_provinces_v3: Đã nạp {len(rows)} tỉnh (3 cấp)")

    # 2. htkk_districts_v3
    items, ver = parse_items("Catalogue_Dia_Ban_Huyen.xml")
    rows = []
    for it in items:
        val = it.attrib.get("Value", "")
        parts = val.split("###")
        if len(parts) >= 4:
            rows.append((parts[2].strip(), parts[1].strip(), parts[3].strip(), ver))
    cur.execute("TRUNCATE TABLE htkk_districts_v3 CASCADE;")
    execute_values(cur, "INSERT INTO htkk_districts_v3 (district_code, province_code, district_name, version) VALUES %s ON CONFLICT DO NOTHING;", rows)
    print(f"✅ 2. htkk_districts_v3: Đã nạp {len(rows)} quận/huyện (3 cấp)")

    # 3. htkk_communes_v3
    items, ver = parse_items("Catalogue_Dia_Ban_Xa.xml")
    rows = []
    for it in items:
        val = it.attrib.get("Value", "")
        parts = val.split("###")
        if len(parts) >= 5:
            name = parts[4].strip()
            expired = "hết hiệu lực" in name.lower()
            rows.append((parts[3].strip(), parts[2].strip(), parts[1].strip(), name, expired, ver))
    cur.execute("TRUNCATE TABLE htkk_communes_v3 CASCADE;")
    execute_values(cur, "INSERT INTO htkk_communes_v3 (commune_code, district_code, province_code, commune_name, is_expired, version) VALUES %s ON CONFLICT DO NOTHING;", rows)
    print(f"✅ 3. htkk_communes_v3: Đã nạp {len(rows)} xã/phường (3 cấp)")

    # 4. htkk_provinces_v2
    items, ver = parse_items("Catalogue_Dia_Ban_Tinh_Moi.xml")
    rows = []
    for it in items:
        val = it.attrib.get("Value", "")
        parts = val.split("###")
        if len(parts) >= 3:
            rows.append((parts[1].strip(), parts[2].strip(), ver))
    cur.execute("TRUNCATE TABLE htkk_provinces_v2 CASCADE;")
    execute_values(cur, "INSERT INTO htkk_provinces_v2 (province_code, province_name, version) VALUES %s ON CONFLICT DO NOTHING;", rows)
    print(f"✅ 4. htkk_provinces_v2: Đã nạp {len(rows)} tỉnh mới (2 cấp)")

    # 5. htkk_communes_v2
    items, ver = parse_items("Catalogue_Dia_Ban_Xa_Moi.xml")
    rows = []
    for it in items:
        val = it.attrib.get("Value", "")
        parts = val.split("###")
        if len(parts) >= 3:
            rows.append((parts[1].strip(), parts[0].strip(), parts[2].strip(), ver))
    cur.execute("TRUNCATE TABLE htkk_communes_v2 CASCADE;")
    execute_values(cur, "INSERT INTO htkk_communes_v2 (commune_code, province_code, commune_name, version) VALUES %s ON CONFLICT DO NOTHING;", rows)
    print(f"✅ 5. htkk_communes_v2: Đã nạp {len(rows)} xã/phường mới (2 cấp - ĐÃ BỎ HUYỆN)")

    # 6. htkk_tax_offices
    items, ver = parse_items("Catalogue_CoQuanThu.xml")
    rows = []
    for it in items:
        val = it.attrib.get("Value", "")
        parts = val.split("###")
        if len(parts) >= 3:
            rows.append((parts[1].strip(), parts[2].strip(), parts[0].strip(), ver))
    cur.execute("TRUNCATE TABLE htkk_tax_offices CASCADE;")
    execute_values(cur, "INSERT INTO htkk_tax_offices (tax_office_code, tax_office_name, province_code, version) VALUES %s ON CONFLICT DO NOTHING;", rows)
    print(f"✅ 6. htkk_tax_offices: Đã nạp {len(rows)} cơ quan thuế/thuế cơ sở")

    # 7. htkk_commune_tax_office_map
    items, _ = parse_items("Catalogue_CQThu_Dia_Ban.xml")
    rows = []
    for it in items:
        ma_xa = it.attrib.get("MaXa", "").strip()
        ma_cqt = it.attrib.get("MaCQThu", "").strip()
        ten_cqt = it.attrib.get("TenCQThu", "").strip()
        if ma_xa and ma_cqt:
            rows.append((ma_xa, ma_cqt, ten_cqt))
    cur.execute("TRUNCATE TABLE htkk_commune_tax_office_map;")
    execute_values(cur, "INSERT INTO htkk_commune_tax_office_map (commune_code, tax_office_code, tax_office_name) VALUES %s ON CONFLICT DO NOTHING;", rows)
    print(f"✅ 7. htkk_commune_tax_office_map: Đã nạp {len(rows)} ánh xạ xã -> CQT")

    # 8. htkk_province_map
    items, _ = parse_items("Catalogue_Dia_Ban_Tinh_Map.xml")
    rows = []
    for it in items:
        ma_cu_list = it.attrib.get("MaCu", "").split(",")
        ma_moi = it.attrib.get("MaMoi", "").strip()
        for c in ma_cu_list:
            c = c.strip()
            if c and ma_moi:
                rows.append((c, ma_moi))
    cur.execute("TRUNCATE TABLE htkk_province_map;")
    execute_values(cur, "INSERT INTO htkk_province_map (old_province_code, new_province_code) VALUES %s ON CONFLICT DO NOTHING;", rows)
    print(f"✅ 8. htkk_province_map: Đã nạp {len(rows)} ánh xạ tỉnh cũ -> tỉnh mới")

    # 9. htkk_commune_map
    items, _ = parse_items("Catalogue_Dia_Ban_Xa_Map.xml")
    rows = []
    for it in items:
        ma_cu_list = it.attrib.get("MaCu", "").split(",")
        ma_moi = it.attrib.get("MaMoi", "").strip()
        for c in ma_cu_list:
            c = c.strip()
            if c and ma_moi:
                rows.append((c, ma_moi))
    cur.execute("TRUNCATE TABLE htkk_commune_map;")
    if rows:
        execute_values(cur, "INSERT INTO htkk_commune_map (old_commune_code, new_commune_code) VALUES %s ON CONFLICT DO NOTHING;", rows)
    print(f"✅ 9. htkk_commune_map: Đã nạp {len(rows)} ánh xạ xã cũ -> xã mới")

    conn.commit()
    cur.close()
    conn.close()
    print("=== NẠP DỮ LIỆU HTKK HOÀN TẤT THÀNH CÔNG! ===")


if __name__ == "__main__":
    run_etl()
