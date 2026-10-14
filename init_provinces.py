import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DSN = "postgresql://zzsu:Zzs%40123@localhost:5433/taxdb"
PROVINCES = {
    "Đắk Lắk (60)": {"prefix": "60", "activation_tin": "6001842955"},
    "Phú Yên (44)": {"prefix": "44", "activation_tin": "4401100224"},
    "Khánh Hòa (42)": {"prefix": "42", "activation_tin": "4200351468"},
    "Bình Định (41)": {"prefix": "41", "activation_tin": "4101695690"}
}

def init_provinces():
    conn = psycopg2.connect(DSN)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS provinces (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            prefix TEXT UNIQUE NOT NULL,
            activation_tin TEXT
        )
    """)
    
    for name, data in PROVINCES.items():
        cursor.execute("""
            INSERT INTO provinces (name, prefix, activation_tin) 
            VALUES (%s, %s, %s)
            ON CONFLICT (name) DO NOTHING
        """, (name, data["prefix"], data["activation_tin"]))
        
    print("Provinces table initialized successfully.")

if __name__ == "__main__":
    init_provinces()
