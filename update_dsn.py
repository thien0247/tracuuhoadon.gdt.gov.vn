import os

files = ['crawler_dak_lak.py', 'crawler_gui.py', 'server.py', 'readme.md', 'migrate_to_pg.py']

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace("postgresql://zzsu:Zzs@123@localhost:5433/postgres", "postgresql://zzsu:Zzs@123@localhost:5433/taxdb")
    content = content.replace("postgresql://zzsu:Zzs%40123@localhost:5433/postgres", "postgresql://zzsu:Zzs%40123@localhost:5433/taxdb")
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
