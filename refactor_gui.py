with open('crawler_gui.py', 'r', encoding='utf-8') as f:
    code = f.read()

old_provinces = """PROVINCES = {
    "Đắk Lắk (60)": {"prefix": "60", "db": "dak_lak_tax.db", "activation_tin": "6001842955"},
    "Phú Yên (44)": {"prefix": "44", "db": "phu_yen_tax.db", "activation_tin": "4401100224"},
    "Khánh Hòa (42)": {"prefix": "42", "db": "khanh_hoa_tax.db", "activation_tin": "4200351468"},
    "Bình Định (41)": {"prefix": "41", "db": "binh_dinh_tax.db", "activation_tin": "4101695690"}
}"""

new_provinces = """DB_DSN = "postgresql://zzsu:Zzs%40123@localhost:5433/taxdb"

PROVINCES = {}
try:
    with psycopg2.connect(DB_DSN) as conn:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name, prefix, activation_tin FROM provinces")
            for row in cursor.fetchall():
                name, prefix, act_tin = row
                PROVINCES[name] = {"prefix": prefix, "activation_tin": act_tin}
except Exception as e:
    print("Failed to load PROVINCES from DB in GUI:", e)
    # Fallback just in case
    PROVINCES = {
        "Đắk Lắk (60)": {"prefix": "60", "activation_tin": "6001842955"}
    }
"""

code = code.replace(old_provinces, new_provinces)

# Fix references to DB_PATH
code = code.replace("DB_PATH", "DB_DSN")

with open('crawler_gui.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Refactored crawler_gui.py")
