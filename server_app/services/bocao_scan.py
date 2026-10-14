# @id 01M4V0HMPZ2W0RRVHJPXDXMCPC
# @related 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0HMP9AXBMNGFKX4NP343A, 01M4V0HMPSXCSFX3CC2P2JTJCN, 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""server_app.services.bocao_scan — Khởi động Gap-Fill scan cho MST Bố Cáo chưa khớp."""
from typing import Any, Dict
from server_app.core.database import PROVINCES_CACHE, get_db_connection
from server_app.core.queue_manager import queue_coordinator
from server_app.schemas.requests import StartRequest

_SQL_UNMATCHED_PREFIXES = """
    SELECT SUBSTRING(b.tin, 1, 2), COUNT(*)
    FROM bocao_records b LEFT JOIN tax_records t ON b.tin = t.tin
    WHERE t.tin IS NULL AND LENGTH(b.tin) = 10
      AND (b.sync_status IS NULL OR b.sync_status != 'synced')
    GROUP BY SUBSTRING(b.tin, 1, 2) ORDER BY 2 DESC
"""


def launch_bocao_gap_fill_scan(gap: int = 20, num_workers: int = 1, max_concurrent: int = 2) -> Dict[str, Any]:
    """Tạo StartRequest gap_fill cho từng tỉnh có MST Bố Cáo chưa khớp và đẩy vào Rolling Queue."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(_SQL_UNMATCHED_PREFIXES)
            prefix_rows = cur.fetchall()

    prefix_map = {cfg["prefix"]: (name, cfg) for name, cfg in PROVINCES_CACHE.items()}
    requests = [
        StartRequest(
            province_key=name, scan_mode="gap_fill",
            seed_tin=cfg["activation_tin"], gap=gap, num_workers=num_workers
        )
        for (prefix, _cnt) in prefix_rows
        if prefix in prefix_map
        for name, cfg in [prefix_map[prefix]]
    ]
    if not requests:
        return {"status": "nothing_to_scan", "total_provinces": 0, "queued": 0}
    queue_coordinator.start_batch(requests, max_concurrent=max_concurrent, mode="append")
    return {"status": "scan_queued", "total_provinces": len(requests),
            "queued": len(requests), "max_concurrent": max_concurrent, "gap": gap}
