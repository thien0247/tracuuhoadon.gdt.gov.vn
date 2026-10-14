with open('server.py', 'r', encoding='utf-8') as f:
    code = f.read()

old_get_provinces = """@app.get("/api/provinces")
async def get_provinces():
    res = {}
    for k, v in PROVINCES_CACHE.items():
        db_path = v["db"]
        rec_count = 0
        if os.path.exists(db_path):
            try:
                db = Database(db_path)
                rec_count = db.count_records()
            except Exception:
                rec_count = 0

        engine = state.engines.get(k)
        res[k] = {
            "prefix": v["prefix"],
            "db": v["db"],
            "activation_tin": v["activation_tin"],
            "count": rec_count,
            "running": engine._running if engine else False,
            "paused": engine._paused if engine else False
        }
    return JSONResponse(content={"provinces": res})"""

new_get_provinces = """@app.get("/api/provinces")
async def get_provinces():
    res = {}
    for k, v in PROVINCES_CACHE.items():
        prefix = v["prefix"]
        rec_count = 0
        try:
            db = Database(prefix)
            rec_count = db.count_records()
        except Exception:
            rec_count = 0

        engine = state.engines.get(k)
        res[k] = {
            "prefix": v["prefix"],
            "activation_tin": v["activation_tin"],
            "count": rec_count,
            "running": engine._running if engine else False,
            "paused": engine._paused if engine else False
        }
    return JSONResponse(content={"provinces": res})"""

code = code.replace(old_get_provinces, new_get_provinces)

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed get_provinces")
