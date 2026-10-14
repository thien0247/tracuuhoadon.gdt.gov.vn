"""
crawler_dak_lak.py
Facade tương thích ngược: nạp toàn bộ thành phần cốt lõi từ package crawler_core.
Đã tái cấu trúc theo bộ quy tắc giới hạn số dòng code và chuẩn hóa modular.
"""

from crawler_core.validator import validate_tin, generate_direction, WEIGHTS
from crawler_core.solver import CaptchaSolver, MODEL_PATH, VOCAB_PATH
from crawler_core.session import SessionManager, DEFAULT_ACTIVATION_TIN
from crawler_core.storage import Database, get_db_conn
from crawler_core.engine import CrawlerEngine

__all__ = [
    "validate_tin",
    "generate_direction",
    "WEIGHTS",
    "CaptchaSolver",
    "MODEL_PATH",
    "VOCAB_PATH",
    "SessionManager",
    "DEFAULT_ACTIVATION_TIN",
    "Database",
    "get_db_conn",
    "CrawlerEngine",
]
