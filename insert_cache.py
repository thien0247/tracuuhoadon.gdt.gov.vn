with open('server.py', 'r', encoding='utf-8') as f:
    code = f.read()

cache_logic = """
DB_DSN = "postgresql://zzsu:Zzs%40123@localhost:5433/taxdb"

# Dynamic Provinces Cache
PROVINCES_CACHE = {}

def load_provinces():
    global PROVINCES_CACHE
    try:
        with psycopg2.connect(DB_DSN) as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, name, prefix, activation_tin FROM provinces")
                rows = cursor.fetchall()
                new_cache = {}
                for row in rows:
                    pid, name, prefix, act_tin = row
                    new_cache[name] = {
                        "id": pid,
                        "prefix": prefix,
                        "activation_tin": act_tin
                    }
                PROVINCES_CACHE = new_cache
    except Exception as e:
        print("Failed to load provinces:", e)

# Load on startup
load_provinces()

"""

# Insert right after `state = AppState()` block which ends around line 45.
target_line = "state = AppState()\n"
code = code.replace(target_line, target_line + cache_logic)

with open('server.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Injected PROVINCES_CACHE into server.py")
