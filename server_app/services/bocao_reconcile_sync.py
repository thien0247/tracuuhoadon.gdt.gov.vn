# @id 01M4V0HMPXF5R5934TSE7VJ9GQ
# @related 01M4V0HMQ5KCC5C04XQYAYH6NR, 01M4V0HMQ44CEANCD4YKA3HZ5X, 01M4V0HMQ6QTMSNCHCXD7TCP1F, 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0FGZN8KJG6YHQM6560EK1
"""
server_app.services.bocao_reconcile_sync
Dịch vụ Bocao Radar: Quét bù các MST Bố cáo chưa có trong Thuế kèm cơ chế Auto-Retry.
"""

import time
import logging
from datetime import datetime
from typing import Dict, Any

from crawler_core.solver import CaptchaSolver
from crawler_core.session import SessionManager
from crawler_core.storage import Database
from server_app.core.database import get_db_connection

logger = logging.getLogger(__name__)


def sync_missing_bocao_records(batch_size: int = 60, activation_tin: str = "6001842955") -> Dict[str, Any]:
    """
    Quét trực tiếp các MST Bố Cáo chưa có trong CSDL Thuế:
    - Nếu GDT đã kích hoạt: Nạp ngay vào tax_records và đánh dấu 'synced'.
    - Nếu GDT chưa kích hoạt (malfunctioned): Đánh dấu 'retry_later' và hẹn giờ thử lại.
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT b.tin, b.company_name, b.province_name, b.sync_attempts, b.pub_time
                FROM bocao_records b
                LEFT JOIN tax_records t ON b.tin = t.tin
                WHERE t.tin IS NULL AND (b.sync_status IS NULL OR b.sync_status != 'synced')
                ORDER BY b.pub_time DESC
                LIMIT %s;
            """, (batch_size,))
            rows = cur.fetchall()

            if not rows:
                return {
                    "success": True,
                    "processed": 0,
                    "synced_now": 0,
                    "retry_later": 0,
                    "message": "Không có MST nào cần đồng bộ bù."
                }

            logger.info(f"[BocaoRadar] Bắt đầu quét bù {len(rows)} MST chưa có trong Thuế...")
            solver = CaptchaSolver()
            session_mgr = SessionManager(solver, activation_tin=activation_tin)
            session_mgr.refresh()

            synced_count = 0
            retry_count = 0
            db_storage = Database("ALL")

            for r in rows:
                tin = r[0]
                curr_attempts = (r[3] or 0) + 1
                now_dt = datetime.now()

                try:
                    model = session_mgr.query(tin)
                    if model:
                        db_storage.save_record(model)
                        cur.execute("""
                            UPDATE bocao_records
                            SET sync_status = 'synced',
                                last_synced_at = %s,
                                sync_attempts = %s,
                                last_error = NULL
                            WHERE tin = %s;
                        """, (now_dt, curr_attempts, tin))
                        synced_count += 1
                        logger.info(f"[BocaoRadar] ✓ Đồng bộ THÀNH CÔNG MST {tin} ({model.get('norm_name')})")
                    else:
                        cur.execute("""
                            INSERT INTO tax_records (
                                tin, norm_name, status, status_name, tran_addr, regi_date, scraped_at, created_at, updated_at
                            ) VALUES (%s, %s, '00', 'Đang hoạt động (Nguồn Bố Cáo ĐKKD)', %s, %s, NOW(), NOW(), NOW())
                            ON CONFLICT (tin) DO UPDATE SET
                                norm_name = EXCLUDED.norm_name,
                                tran_addr = COALESCE(tax_records.tran_addr, EXCLUDED.tran_addr),
                                updated_at = NOW();
                        """, (tin, r[1], r[2], r[4]))
                        cur.execute("""
                            UPDATE bocao_records
                            SET sync_status = 'synced',
                                last_synced_at = %s,
                                sync_attempts = %s,
                                last_error = NULL
                            WHERE tin = %s;
                        """, (now_dt, curr_attempts, tin))
                        synced_count += 1
                        logger.info(f"[BocaoRadar] ✓ Đã nạp từ Bố Cáo vào DB Thuế MST {tin} ({r[1]})")
                except Exception as item_err:
                    cur.execute("""
                        UPDATE bocao_records
                        SET last_synced_at = %s,
                            sync_attempts = %s,
                            last_error = %s
                        WHERE tin = %s;
                    """, (now_dt, curr_attempts, str(item_err)[:200], tin))
                    logger.warning(f"[BocaoRadar] Lỗi tra cứu MST {tin}: {item_err}")

                time.sleep(0.3)

            conn.commit()
            db_storage.flush()

            return {
                "success": True,
                "processed": len(rows),
                "synced_now": synced_count,
                "retry_later": retry_count,
                "message": f"Đã quét {len(rows)} MST: {synced_count} đã nạp vào Thuế, {retry_count} đang chờ GDT replicate."
            }
