import psycopg2

db_dsn = "postgresql://zzsu:Zzs%40123@localhost:5433/taxdb"
with psycopg2.connect(db_dsn) as conn:
    with conn.cursor() as cursor:
        cursor.execute("SELECT regi_date FROM tax_records LIMIT 10")
        print("Mẫu dữ liệu regi_date:", cursor.fetchall())
