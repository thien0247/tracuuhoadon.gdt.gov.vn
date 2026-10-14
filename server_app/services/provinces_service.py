# @id 01M4V15VQ2E8ZG0MTQ3H81VZGQ
# @related 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0HMPBBMNYWQ237H5VNCDC, 01M4V0FH0C5JKJFSR38G6JSD62, 01M4V0FGZT243T45VNH4E9RQCG, 01M4V0FGZN8KJG6YHQM6560EK1
"""
server_app.services.provinces_service
Logic nghiệp vụ truy vấn, đối soát và cập nhật Max TIN thủ công cho từng tỉnh hoặc hàng loạt.
"""

from typing import Dict, Any, Optional
from datetime import datetime
from server_app.core.database import PROVINCES_CACHE, get_db_connection
from server_app.core.state import state


def detect_province_max_tin(prov_key: str) -> Dict[str, Any]:
    """Đối soát 4 nguồn dữ liệu để tìm ra đỉnh MST lớn nhất của tỉnh."""
    cfg = PROVINCES_CACHE.get(prov_key)
    if not cfg:
        raise ValueError(f"Không tìm thấy tỉnh {prov_key}")
    prefix = cfg["prefix"]

    lo, hi_tax, hi_bc = f"{prefix}00000000", f"{prefix}90000000", f"{prefix}99999999"
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT tin FROM tax_records WHERE tin >= %s AND tin < %s AND LENGTH(tin) = 10 ORDER BY tin DESC LIMIT 1", (lo, hi_tax))
            r_tax = cur.fetchone()
            db_tax_max = r_tax[0] if r_tax else None

            cur.execute("SELECT tin FROM bocao_records WHERE tin >= %s AND tin <= %s AND LENGTH(tin) = 10 ORDER BY tin DESC LIMIT 1", (lo, hi_bc))
            r_bc = cur.fetchone()
            db_bocao_max = r_bc[0] if r_bc else None

            cur.execute("SELECT last_tin FROM scan_progress WHERE prefix = %s", (prefix,))
            r = cur.fetchone()
            last_scanned = r[0] if r else None

    act_tin = cfg.get("activation_tin")
    candidates = [t for t in [db_tax_max, db_bocao_max, last_scanned, act_tin] if t and len(t) == 10]
    candidates.sort(reverse=True)

    return {
        "province_key": prov_key,
        "prefix": prefix,
        "current_max_tin": db_tax_max,
        "db_tax_max": db_tax_max,
        "db_bocao_max": db_bocao_max,
        "last_scanned_tin": last_scanned,
        "activation_tin": act_tin,
        "suggested_max_tin": candidates[0] if candidates else None
    }


def update_province_max_tin(prov_key: str, max_tin: str, update_scan_progress: bool = True, update_activation: bool = True) -> Dict[str, Any]:
    """Cập nhật giá trị Max TIN vào CSDL và runtime state."""
    cfg = PROVINCES_CACHE.get(prov_key)
    if not cfg:
        raise ValueError(f"Không tìm thấy tỉnh {prov_key}")
    prefix = cfg["prefix"]
    clean_tin = max_tin.strip()

    if not clean_tin or len(clean_tin) != 10 or not clean_tin.startswith(prefix) or not clean_tin.isdigit():
        raise ValueError(f"MST không hợp lệ. Phải gồm đúng 10 chữ số và bắt đầu bằng tiền tố {prefix}")

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            if update_scan_progress:
                sql = """
                    INSERT INTO scan_progress (prefix, last_tin, total_queried, total_found, updated_at)
                    VALUES (%s, %s, 0, 0, %s)
                    ON CONFLICT (prefix) DO UPDATE SET last_tin = EXCLUDED.last_tin, updated_at = %s
                """
                now_str = datetime.now().isoformat()
                cur.execute(sql, (prefix, clean_tin, now_str, now_str))

            if update_activation:
                cur.execute("UPDATE provinces SET activation_tin = %s WHERE prefix = %s", (clean_tin, prefix))
                cfg["activation_tin"] = clean_tin

    state.last_tins[prov_key] = clean_tin
    return {"success": True, "message": f"Đã cập nhật Max TIN cho tỉnh {prov_key}: {clean_tin}"}


def sync_all_provinces_max_tin() -> Dict[str, Any]:
    """Đồng bộ tự động Max TIN cho 62 tỉnh từ CSDL."""
    count = 0
    for key in list(PROVINCES_CACHE.keys()):
        try:
            info = detect_province_max_tin(key)
            if info.get("suggested_max_tin"):
                update_province_max_tin(key, info["suggested_max_tin"], update_scan_progress=True, update_activation=False)
                count += 1
        except Exception:
            pass
    return {"success": True, "synced_count": count}
