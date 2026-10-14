---
name: {{project}}-data-sync
description: >-
  Procedures for authenticating, fetching, and synchronizing data from external
  systems, managing session cookies, processing Excel files, and loading relational
  data into PostgreSQL. Use this skill for data sync tasks, ETL scripts, cookie
  management, or debugging external API communication.
---

# {{PROJECT_NAME}} — Data Sync, ETL & Session Management

Quy trình chuẩn để quản lý phiên đăng nhập, trích xuất dữ liệu từ hệ thống bên ngoài,
xử lý file Excel và nạp đồng bộ vào PostgreSQL.

> **Lưu ý:** Đây là skill tùy chọn. Chỉ sử dụng nếu dự án cần sync dữ liệu
> từ nguồn bên ngoài (portal, API, file Excel).

---

## 1. Quản Lý Session Cookie

### 1.1. Cấu Trúc File Cookie (`cookies.json`)

Lưu cookie phiên làm việc tại thư mục gốc dự án:

```json
[
  { "name": "SessionId",  "value": "abc123..." },
  { "name": "AuthToken",  "value": "xyz789..." },
  { "name": "MOD_AUTH",   "value": "..." }
]
```

> Định dạng JSON chuẩn xuất từ trình duyệt (EditThisCookie hoặc DevTools → Application).

### 1.2. Kiểm Tra Phiên Đăng Nhập Còn Hiệu Lực

```bash
python check_cookie.py
# Kết quả 200 OK = còn hiệu lực
# Kết quả redirect về trang login = hết hạn → yêu cầu cookie mới
```

Nếu cookie hết hạn:
1. Thông báo người dùng cập nhật `cookies.json` từ trình duyệt.
2. Chạy `python sync_cookies.py` để đồng bộ format (nếu có).

---

## 2. Python Session Request Pattern

```python
import requests
import json

def get_portal_session(cookie_file: str = 'cookies.json') -> requests.Session:
    """Tạo requests.Session với cookie đã xác thực."""
    with open(cookie_file, 'r', encoding='utf-8') as f:
        cookie_list = json.load(f)

    session = requests.Session()
    for c in cookie_list:
        session.cookies.set(c['name'], c['value'])

    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': '{{EXTERNAL_SYSTEM_URL}}'
    })
    return session
```

---

## 3. Xử Lý File Excel Từ Nguồn Ngoài

```python
import pandas as pd
import openpyxl

# Trường hợp 1: File .xls chứa HTML table
df = pd.read_html('data.xls')[0]

# Trường hợp 2: File .xlsx đa sheet
wb = openpyxl.load_workbook('data.xlsx', data_only=True)
sheet_names = wb.sheetnames  # ['Sheet1', 'Sheet2', ...]
ws = wb[sheet_names[0]]

for row in ws.iter_rows(min_row=2, values_only=True):
    # Xử lý từng dòng dữ liệu
    pass
```

---

## 4. PostgreSQL Ingestion Pattern

### 4.1. Thông Tin Kết Nối

```python
DB_CONFIG = {
    'dbname':   '{{DB_NAME}}',
    'user':     '{{DB_USER}}',
    'password': '{{DB_PASSWORD}}',
    'host':     '{{DB_HOST}}',
    'port':     {{DB_PORT}},
}
```

### 4.2. Mẫu Script Ingestion Chuẩn

```python
import psycopg2
from psycopg2.extras import execute_batch, RealDictCursor

conn = psycopg2.connect(**DB_CONFIG)
cur = conn.cursor(cursor_factory=RealDictCursor)

# Idempotent: xóa dữ liệu kỳ cũ trước khi nạp kỳ mới
cur.execute(
    "DELETE FROM {{table_name}} WHERE period_key = %s",
    (period_key,)
)

INSERT_SQL = """
    INSERT INTO {{table_name}} (col1, col2, col3, value)
    VALUES (%s, %s, %s, %s)
"""
execute_batch(cur, INSERT_SQL, records_to_insert, page_size=500)

conn.commit()
cur.close()
conn.close()

print(f"✅ Đã nạp {len(records_to_insert)} bản ghi vào {{table_name}}")
```

---

## 5. Checklist Thực Thi Đồng Bộ Dữ Liệu

- [ ] Cookie còn hiệu lực (`check_cookie.py` trả về 200 OK)
- [ ] Xử lý encoding an toàn (UTF-8) khi đọc file Excel/CSV
- [ ] Dữ liệu cast đúng kiểu (`float`, `int`, `str.strip()`)
- [ ] Có xử lý trùng lặp (`ON CONFLICT` hoặc `DELETE` kỳ trước khi `INSERT`)
- [ ] Kiểm tra số bản ghi sau khi nạp:
  ```sql
  SELECT count(*) FROM {{table_name}} WHERE period_key = '...';
  ```
