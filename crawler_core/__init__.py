# @id 01M4V0HMQ8MVMM9DT1602XN0J0
# @related 01M4V0HMQ84SWGPZADDW1P3GNA, 01M4V0HMQ5KCC5C04XQYAYH6NR, 01M4V0HMQ44CEANCD4YKA3HZ5X, 01M4V0HMQ6QTMSNCHCXD7TCP1F, 01M4V0HMQ2XD03NEEV125TBK52
"""
crawler_core package
Module hóa hệ thống vét cạn MST tuân thủ chuẩn tối ưu và giới hạn số dòng code.
"""

from crawler_core.validator import validate_tin, generate_direction
from crawler_core.solver import CaptchaSolver
from crawler_core.session import SessionManager
from crawler_core.storage import Database, get_db_conn
from crawler_core.engine import CrawlerEngine

__all__ = [
    "validate_tin",
    "generate_direction",
    "CaptchaSolver",
    "SessionManager",
    "Database",
    "get_db_conn",
    "CrawlerEngine",
]
