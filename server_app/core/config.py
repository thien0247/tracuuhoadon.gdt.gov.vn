# @id 01M4V0HMP4K06YVK8GXXJP84SP
# @related 01M4V0HMP7JMDD0YG53KVWYT56, 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""
server_app.core.config
Quản lý cấu hình kết nối CSDL, thông số mạng và đường dẫn thư mục.
"""

import json
import os
from typing import Tuple

# Cấu hình CSDL PostgreSQL
DB_DSN: str = os.getenv(
    "DB_DSN",
    "postgresql://zzsu:Zzs%40123@localhost:5433/taxdb"
)

# Thư mục giao diện
STATIC_DIR: str = "static"
TEMPLATES_DIR: str = "templates"
CONFIG_PATH: str = "config.json"

# Cấu hình kiểm soát lưu lượng & chống WAF chặn toàn cục
MAX_GLOBAL_RPS: float = 8.0
MAX_CONCURRENT_REQUESTS: int = 4
STAGGER_DELAY_SECONDS: float = 1.5
WAF_COOLDOWN_SECONDS: float = 30.0


def load_config() -> Tuple[str, int]:
    """
    Đọc cấu hình hệ thống và thông số an toàn mạng từ config.json.
    """
    global MAX_GLOBAL_RPS, MAX_CONCURRENT_REQUESTS, STAGGER_DELAY_SECONDS, WAF_COOLDOWN_SECONDS
    host = "0.0.0.0"
    port = 8123
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                host = cfg.get("host", host)
                port = int(cfg.get("port", port))
                MAX_GLOBAL_RPS = float(cfg.get("max_global_rps", MAX_GLOBAL_RPS))
                MAX_CONCURRENT_REQUESTS = int(cfg.get("max_concurrent_requests", MAX_CONCURRENT_REQUESTS))
                STAGGER_DELAY_SECONDS = float(cfg.get("stagger_delay_seconds", STAGGER_DELAY_SECONDS))
                WAF_COOLDOWN_SECONDS = float(cfg.get("waf_cooldown_seconds", WAF_COOLDOWN_SECONDS))
        except Exception:
            pass
    return host, port


# Tự động nạp cấu hình khi import module
load_config()


def save_system_config(updates: dict) -> dict:
    """
    Cập nhật và lưu các thông số hệ thống vào config.json và bộ nhớ runtime.
    """
    global MAX_GLOBAL_RPS, MAX_CONCURRENT_REQUESTS, STAGGER_DELAY_SECONDS, WAF_COOLDOWN_SECONDS
    cfg = {}
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                cfg = json.load(f)
        except Exception:
            cfg = {}

    if "max_global_rps" in updates and updates["max_global_rps"] is not None:
        val = max(0.5, float(updates["max_global_rps"]))
        cfg["max_global_rps"] = val
        MAX_GLOBAL_RPS = val
        try:
            from server_app.core.limiter import rate_limiter
            rate_limiter.set_rate(val)
        except Exception:
            pass
    if "max_concurrent_requests" in updates and updates["max_concurrent_requests"] is not None:
        val = max(1, int(updates["max_concurrent_requests"]))
        cfg["max_concurrent_requests"] = val
        MAX_CONCURRENT_REQUESTS = val
    if "stagger_delay_seconds" in updates and updates["stagger_delay_seconds"] is not None:
        val = max(0.1, float(updates["stagger_delay_seconds"]))
        cfg["stagger_delay_seconds"] = val
        STAGGER_DELAY_SECONDS = val
    if "waf_cooldown_seconds" in updates and updates["waf_cooldown_seconds"] is not None:
        val = max(1.0, float(updates["waf_cooldown_seconds"]))
        cfg["waf_cooldown_seconds"] = val
        WAF_COOLDOWN_SECONDS = val

    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)

    return cfg


