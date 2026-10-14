# @id 01M4V0HMQ6QTMSNCHCXD7TCP1F
# @related 01M4V0HMP4K06YVK8GXXJP84SP, 01M4V0FH0PZ0CY8JH8XJ6K5CNY, 01M4V0FGZN8KJG6YHQM6560EK1
"""crawler_core.storage - Lưu trữ MST vào PostgreSQL: Connection Pool + Batch Insert.
Fix: DB commit ngoài self.lock, background flush 5s, fail counter, batch_size=50.
"""
import time
import threading
import logging
from datetime import datetime
from contextlib import contextmanager
from psycopg2.extras import execute_values
from psycopg2.pool import ThreadedConnectionPool
from server_app.core.config import DB_DSN
logger = logging.getLogger(__name__)
_db_pool = None
_db_pool_lock = threading.Lock()
_SQL_INIT = (
    "CREATE TABLE IF NOT EXISTS tax_records (tin TEXT PRIMARY KEY, norm_name TEXT, status TEXT, "
    "status_name TEXT, econ_name TEXT, economy TEXT, tran_addr TEXT, tran_dist TEXT, tran_tel TEXT, "
    "tran_fax TEXT, pay_taxo_id TEXT, pay_taxo_name TEXT, pay_taxo_name_blhd TEXT, regi_date TIMESTAMP, "
    "chan_date TIMESTAMP, tu_ngay TIMESTAMP, den_ngay TIMESTAMP, pare_tin TEXT, link TEXT, dvsd TEXT, "
    "org_type TEXT, address TEXT, tax_department TEXT, scraped_at TIMESTAMP, enriched_at TIMESTAMP, "
    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"
    "CREATE TABLE IF NOT EXISTS scan_progress (prefix TEXT PRIMARY KEY, last_tin TEXT, "
    "total_queried INTEGER, total_found INTEGER, updated_at TEXT);"
    "INSERT INTO scan_progress (prefix, last_tin, total_queried, total_found) VALUES (%s, NULL, 0, 0) "
    "ON CONFLICT (prefix) DO NOTHING;"
)
_COLS = "tin, norm_name, status, status_name, econ_name, economy, tran_addr, tran_dist, tran_tel, tran_fax, pay_taxo_id, pay_taxo_name, pay_taxo_name_blhd, regi_date, chan_date, tu_ngay, den_ngay, pare_tin, link, dvsd, scraped_at"
_SETS = ", ".join(f"{c.strip()} = EXCLUDED.{c.strip()}" for c in _COLS.split(",") if c.strip() != "tin")
_UPSERT = f"INSERT INTO tax_records ({_COLS}) VALUES %s ON CONFLICT (tin) DO UPDATE SET {_SETS}"


@contextmanager
def get_db_conn():
    """Cấp phát và hoàn trả kết nối từ ThreadedConnectionPool (max=10)."""
    global _db_pool
    if _db_pool is None:
        with _db_pool_lock:
            if _db_pool is None:
                _db_pool = ThreadedConnectionPool(2, 10, DB_DSN)
    conn = _db_pool.getconn()
    try:
        yield conn
    except Exception:
        if conn:
            try: conn.rollback()
            except Exception: pass
        raise
    finally:
        if _db_pool and conn:
            try: _db_pool.putconn(conn)
            except Exception: pass


def _parse_dt(val):
    return val.strip() if (val and isinstance(val, str) and val.strip().lower() not in ("null", "none", "")) else None


def _to_tuple(m: dict) -> tuple:
    p = _parse_dt
    return (
        m.get("tin"), m.get("norm_name"), m.get("status"), m.get("statusName"), m.get("econ_name"),
        m.get("economy"), m.get("tran_addr"), m.get("tran_dist"), m.get("tran_tel"), m.get("tran_fax"),
        m.get("pay_taxo_id"), m.get("pay_taxo_name"), m.get("pay_taxo_name_blhd"), p(m.get("regi_date")),
        p(m.get("chan_date")), p(m.get("tu_ngay")), p(m.get("den_ngay")), m.get("pare_tin"),
        m.get("link"), m.get("dvsd"), datetime.now().isoformat()
    )


class Database:
    """Tầng lưu trữ dữ liệu thuế và tiến độ quét cho từng tiền tố tỉnh."""

    def __init__(self, prefix: str):
        self.prefix = prefix
        self.lock = threading.Lock()
        self.buffer: list = []
        self.batch_size = 50          # tăng từ 10 → giảm round-trips DB
        self.last_flush = time.time()
        self._tin_cache: set | None = None
        self._fail_count = 0
        self._stop_event = threading.Event()
        self._init_db()
        threading.Thread(target=self._bg_flush_loop, daemon=True).start()

    def _init_db(self):
        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(_SQL_INIT, (self.prefix,))
            conn.commit()

    def init_tin_cache(self):
        """Nạp toàn bộ TIN vào RAM Set — tra cứu O(1), triệt tiêu N+1 query."""
        lo = self.prefix + "0" * (10 - len(self.prefix))
        hi = self.prefix + "9" * (10 - len(self.prefix))
        try:
            with get_db_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT tin FROM tax_records WHERE tin BETWEEN %s AND %s", (lo, hi))
                    self._tin_cache = {r[0] for r in cur.fetchall()}
            logger.info(f"[{self.prefix}] TIN cache loaded: {len(self._tin_cache):,}")
        except Exception as e:
            logger.warning(f"[{self.prefix}] TIN cache init failed: {e}")
            self._tin_cache = None

    def has_tin(self, tin: str) -> bool:
        if self._tin_cache is not None:
            return tin in self._tin_cache
        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 FROM tax_records WHERE tin = %s", (tin,))
                return cur.fetchone() is not None

    def load_progress(self) -> dict:
        try:
            with get_db_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT last_tin, total_queried, total_found FROM scan_progress WHERE prefix=%s", (self.prefix,))
                    r = cur.fetchone()
                    if r:
                        return {"last_tin": r[0] or "", "total_queried": r[1] or 0, "total_found": r[2] or 0}
        except Exception as e:
            logger.warning(f"load_progress failed [{self.prefix}]: {e}")
        return {"last_tin": "", "total_queried": 0, "total_found": 0}

    def _get_boundary_tin(self, prefix: str, order: str) -> str | None:
        """Flush pending buffer trước khi đọc biên để đảm bảo read-your-writes."""
        self.flush()
        lo, hi = prefix + "0" * (10 - len(prefix)), prefix + "9" * (10 - len(prefix))
        with get_db_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT tin FROM tax_records WHERE tin BETWEEN %s AND %s ORDER BY tin {order} LIMIT 1", (lo, hi))
                r = cur.fetchone()
                return r[0] if r and r[0] else None

    def get_max_tin(self, prefix: str) -> str | None: return self._get_boundary_tin(prefix, "DESC")
    def get_min_tin(self, prefix: str) -> str | None: return self._get_boundary_tin(prefix, "ASC")

    def save_record(self, model: dict):
        """Append vào buffer dưới lock RAM; commit DB ngoài lock."""
        should_flush = False
        with self.lock:
            tin = model.get("tin")
            if tin and self._tin_cache is not None:
                self._tin_cache.add(tin)
            self.buffer.append(model)
            if len(self.buffer) >= self.batch_size or (time.time() - self.last_flush >= 3.0):
                should_flush = True
        if should_flush:
            self.flush()

    def flush(self):
        """Snapshot buffer dưới lock, commit DB ngoài lock (không block workers)."""
        with self.lock:
            if not self.buffer:
                return
            batch, self.buffer[:] = list(self.buffer), []
            self.last_flush = time.time()
        self._do_flush(batch)

    def _do_flush(self, batch: list):
        """Batch upsert vào PostgreSQL — không giữ self.lock."""
        if not batch:
            return
        try:
            with get_db_conn() as conn:
                with conn.cursor() as cur:
                    execute_values(cur, _UPSERT, [_to_tuple(m) for m in batch])
                conn.commit()
            self._fail_count = 0
        except Exception as e:
            self._fail_count += 1
            logger.error(f"[{self.prefix}] DB flush error [{self._fail_count}]: {e}")
            with self.lock:
                self.buffer[:0] = batch  # prepend để retry lần flush kế tiếp

    def _bg_flush_loop(self):
        """Background thread: flush mỗi 5s cho tới khi stop_event được kích hoạt."""
        while not self._stop_event.is_set():
            if self._stop_event.wait(timeout=5.0):
                break
            self.flush()

    def close(self):
        """Dừng luồng background flush và flush dữ liệu còn tồn đọng."""
        self._stop_event.set()
        self.flush()

    def update_progress(self, last_tin: str, total_queried: int, total_found: int):
        try:
            with get_db_conn() as conn:
                with conn.cursor() as cur:
                    sql = "UPDATE scan_progress SET last_tin=%s, total_queried=%s, total_found=%s, updated_at=%s WHERE prefix=%s"
                    cur.execute(sql, (last_tin, total_queried, total_found, datetime.now().isoformat(), self.prefix))
                conn.commit()
        except Exception as e:
            logger.warning(f"update_progress failed [{self.prefix}]: {e}")
