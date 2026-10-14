"""
server.py
Điểm khởi chạy chính (Entrypoint) của Hệ thống Vét Cạn Mã Số Thuế Đa Tỉnh Song Song.
Tương thích hoàn toàn với lệnh chạy:
    - python server.py
    - uvicorn server:app --reload
    - run_server.bat
"""

import uvicorn

from server_app.main import app, create_app
from server_app.core.config import load_config, DB_DSN
from server_app.core.database import PROVINCES_CACHE, load_provinces
from server_app.core.state import state

# Đảm bảo các đối tượng cốt lõi sẵn sàng cho import tương thích ngược
__all__ = ["app", "create_app", "state", "load_provinces", "PROVINCES_CACHE", "DB_DSN"]

if __name__ == "__main__":
    host, port = load_config()
    print(f"[Server] MST Crawler Dashboard running on http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)
