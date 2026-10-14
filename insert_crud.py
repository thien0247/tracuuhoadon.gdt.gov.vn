with open('server.py', 'r', encoding='utf-8') as f:
    code = f.read()

crud_api = """
# ─── PROVINCES CONFIG API ────────────────────────────────────────────────────────

@app.get("/api/configs/provinces")
def get_configs_provinces():
    load_provinces()
    return {"provinces": PROVINCES_CACHE}

class ProvinceCreate(BaseModel):
    name: str
    prefix: str
    activation_tin: str

@app.post("/api/configs/provinces")
def add_province(prov: ProvinceCreate):
    try:
        with psycopg2.connect(DB_DSN) as conn:
            with conn.cursor() as cursor:
                cursor.execute(
                    "INSERT INTO provinces (name, prefix, activation_tin) VALUES (%s, %s, %s)",
                    (prov.name, prov.prefix, prov.activation_tin)
                )
        load_provinces()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/api/configs/provinces/{pid}")
def delete_province(pid: int):
    try:
        with psycopg2.connect(DB_DSN) as conn:
            with conn.cursor() as cursor:
                cursor.execute("DELETE FROM provinces WHERE id = %s", (pid,))
        load_provinces()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

"""

code = code.replace("# API Routes", crud_api + "\n# API Routes")

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Injected CRUD API into server.py")
