# @id 01M4V0HMP67E26K49WVAQF0ERW
# @related 01M4V0HMP4K06YVK8GXXJP84SP, 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""
server_app.core.database
Quản lý kết nối PostgreSQL, bộ nhớ đệm danh mục tỉnh thành và các truy vấn thống kê.
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
import psycopg2
import psycopg2.pool
from contextlib import contextmanager
from server_app.core.config import DB_DSN
PROVINCES_CACHE: Dict[str, Dict[str, Any]] = {}

_server_pool: psycopg2.pool.SimpleConnectionPool | None = None
_pool_lock = __import__("threading").Lock()


def _get_server_pool() -> psycopg2.pool.SimpleConnectionPool:
    """Trả về SimpleConnectionPool dùng chung cho tầng API server (lazy init)."""
    global _server_pool
    if _server_pool is None:
        with _pool_lock:
            if _server_pool is None:
                _server_pool = psycopg2.pool.SimpleConnectionPool(1, 5, DB_DSN)
    return _server_pool


@contextmanager
def get_db_connection():
    """Context manager cấp phát kết nối từ SimpleConnectionPool và trả lại sau dùng."""
    pool = _get_server_pool()
    conn = pool.getconn()
    try:
        yield conn
    except Exception:
        try:
            conn.rollback()
        except Exception:
            pass
        raise
    finally:
        try:
            pool.putconn(conn)
        except Exception:
            pass


def load_provinces() -> Dict[str, Dict[str, Any]]:
    """Nạp danh mục tỉnh thành từ bảng provinces vào bộ nhớ đệm PROVINCES_CACHE."""
    global PROVINCES_CACHE
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id, name, prefix, activation_tin FROM provinces")
                PROVINCES_CACHE.clear()
                PROVINCES_CACHE.update({
                    r[1]: {"id": r[0], "prefix": r[2], "activation_tin": r[3]} for r in cursor.fetchall()
                })
    except Exception as e:
        print("[Database] Failed to load provinces:", e)
    return PROVINCES_CACHE


# Nạp sẵn danh mục tỉnh thành khi khởi tạo module
load_provinces()


def fetch_all_province_stats() -> Dict[str, Dict[str, Any]]:
    """Truy vấn thống kê toàn bộ tỉnh thành bằng 1 GROUP BY duy nhất."""
    stats_map = {}
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT SUBSTRING(tin, 1, 2), COUNT(*), MIN(tin), MAX(tin)
                    FROM tax_records WHERE LENGTH(tin) = 10 GROUP BY SUBSTRING(tin, 1, 2)
                """)
                pmap = {r[0]: {"db_count": r[1] or 0, "tin_min": r[2] or "", "tin_max": r[3] or ""} for r in cur.fetchall()}
                for name, cfg in PROVINCES_CACHE.items():
                    stats_map[name] = pmap.get(cfg["prefix"], {"db_count": 0, "tin_min": "", "tin_max": ""})
    except Exception as e:
        print("[Database] Failed to fetch grouped stats:", e)
    return stats_map


def get_max_tin_by_prefix(prefix: str) -> Optional[str]:
    """Lấy mã số thuế lớn nhất (Đỉnh Động) giữa tax_records và bocao_records."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT GREATEST(
                        (SELECT MAX(tin) FROM tax_records WHERE tin LIKE %s AND LENGTH(tin) = 10 AND tin < %s),
                        (SELECT MAX(tin) FROM bocao_records WHERE tin LIKE %s AND LENGTH(tin) = 10)
                    );
                """, (f"{prefix}%", f"{prefix}90000000", f"{prefix}%"))

                r = cur.fetchone()
                return r[0] if r and r[0] else None
    except Exception:
        return None


def get_gap_seeds_by_prefix(prefix: str, limit: int = 100) -> List[str]:
    """Lấy các MST Bố Cáo chưa có trong Thuế làm hạt giống quét lấp lỗ hổng."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT b.tin FROM bocao_records b
                    LEFT JOIN tax_records t ON b.tin = t.tin
                    WHERE b.tin LIKE %s AND LENGTH(b.tin) = 10 AND t.tin IS NULL
                    ORDER BY b.pub_time DESC LIMIT %s;
                """, (f"{prefix}%", limit))
                return [r[0] for r in cur.fetchall()]
    except Exception:
        return []



def fetch_crawler_health_report(days: int = 3) -> Dict[str, Any]:
    """
    Báo cáo sức khỏe crawler 62 tỉnh theo ngày đăng ký mới nhất và số lượng MST trong N ngày.
    Tận dụng idx_tax_regi_date và LATERAL PK scan để phản hồi cực nhanh (<150ms) trên 6.2M+ bản ghi.
    """
    report = []
    summary = {"total": 0, "healthy": 0, "warning": 0, "stalled": 0}
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        SUBSTRING(tin, 1, 2) AS pref,
                        COUNT(*) FILTER (WHERE regi_date >= CURRENT_DATE - (%s * INTERVAL '1 day')),
                        MAX(regi_date)
                    FROM tax_records
                    WHERE regi_date >= CURRENT_DATE - INTERVAL '60 days'
                    GROUP BY SUBSTRING(tin, 1, 2)
                """, (days,))
                recent_map = {r[0]: {"cnt": r[1] or 0, "max_d": r[2]} for r in cur.fetchall()}

                cur.execute("""
                    SELECT p.prefix, t.tin, t.regi_date
                    FROM provinces p
                    LEFT JOIN LATERAL (
                        SELECT tin, regi_date FROM tax_records 
                        WHERE tin >= p.prefix || '00000000' AND tin <= p.prefix || '99999999'
                        ORDER BY tin DESC LIMIT 1
                    ) t ON true
                """)
                tin_info_map = {r[0]: {"tin": r[1], "regi_date": r[2]} for r in cur.fetchall()}

                today = datetime.now().date()
                for prov_name, prov_cfg in PROVINCES_CACHE.items():
                    pref = prov_cfg["prefix"]
                    rec = recent_map.get(pref, {})
                    cnt = rec.get("cnt", 0)
                    t_info = tin_info_map.get(pref, {})
                    tin_max = t_info.get("tin") or prov_cfg.get("activation_tin", "")
                    max_d = rec.get("max_d") or t_info.get("regi_date")
                    d_val = max_d.date() if hasattr(max_d, "date") else max_d
                    days_diff = (today - d_val).days if d_val else 999
                    if days_diff <= days and cnt > 0:
                        status = "healthy"
                    elif days_diff <= 7:
                        status = "warning"
                    else:
                        status = "stalled"

                    summary["total"] += 1
                    summary[status] += 1
                    report.append({
                        "province": prov_name,
                        "prefix": pref,
                        "tin_max": str(tin_max) if tin_max else "",
                        "max_regi_date": max_d.strftime("%Y-%m-%d") if max_d else "Chưa có",
                        "days_diff": days_diff if max_d else None,
                        "new_records_in_range": cnt,
                        "status": status
                    })
    except Exception as e:
        print("[Database] fetch_crawler_health_report error:", e)
    return {"summary": summary, "provinces": report}

