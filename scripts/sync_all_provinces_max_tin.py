# @id 01M4V3PYSYNCMAXTIN000001
# @related 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0HMKNWS255D6X91RPS6R3, 01M4V20J6ZHRVTZGJ1W0QXZFSX
"""
scripts/sync_all_provinces_max_tin.py
Tự động đồng bộ mốc quét đỉnh mới nhất (Max TIN) cho toàn bộ 62 tỉnh thành vào scan_progress.
Loại bỏ triệt để các mã giả định dị biệt (0199990001, 0399990002, 6099990005) và ưu tiên đỉnh Bố Cáo mới nhất.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from server_app.core.database import get_db_connection
from crawler_core.validator import validate_tin


def sync_max_tin_all():
    print("=" * 80)
    print("=== ĐỒNG BỘ HÓA MỐC QUÉT ĐỈNH MỚI NHẤT (MAX TIN) CHO 62 TỈNH THÀNH ===")
    print("=" * 80)

    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # 1. Danh sách tỉnh
            cur.execute("SELECT id, name, prefix, activation_tin FROM provinces ORDER BY prefix;")
            provinces = cur.fetchall()

            # 2. Max thật từ tax_records (bỏ qua mã giả định >= xx90000000)
            cur.execute("""
                SELECT SUBSTRING(tin, 1, 2) AS pref, MAX(tin)
                FROM tax_records
                WHERE LENGTH(tin) = 10 AND tin < CONCAT(SUBSTRING(tin, 1, 2), '90000000')
                GROUP BY SUBSTRING(tin, 1, 2);
            """)
            tax_max_map = {r[0]: r[1] for r in cur.fetchall()}

            # 3. Max từ bocao_records
            cur.execute("""
                SELECT SUBSTRING(tin, 1, 2) AS pref, MAX(tin)
                FROM bocao_records
                WHERE LENGTH(tin) = 10
                GROUP BY SUBSTRING(tin, 1, 2);
            """)
            bocao_max_map = {r[0]: r[1] for r in cur.fetchall()}

            # 4. Mốc hiện tại trong scan_progress
            cur.execute("SELECT prefix, last_tin FROM scan_progress;")
            prog_map = {r[0]: r[1] for r in cur.fetchall()}

            synced = 0
            adjusted_dummy = 0
            bocao_promoted = 0

            for pid, name, prefix, act_tin in provinces:
                t_max = tax_max_map.get(prefix)
                b_max = bocao_max_map.get(prefix)
                cur_prog = prog_map.get(prefix)

                # Chọn đỉnh lớn nhất hợp lệ
                candidates = [t_max, b_max, act_tin]
                valid_cands = [c for c in candidates if c and len(c) == 10 and c.isdigit() and validate_tin(c)]
                best_max = max(valid_cands) if valid_cands else cur_prog or act_tin

                # Phát hiện nếu cur_prog đang là mã dị biệt (019999..., 039999..., 609999...)
                is_dummy = bool(cur_prog and cur_prog >= f"{prefix}90000000")
                if is_dummy:
                    adjusted_dummy += 1

                if b_max and t_max and b_max > t_max:
                    bocao_promoted += 1

                # Cập nhật scan_progress
                cur.execute("""
                    INSERT INTO scan_progress (prefix, last_tin, total_queried, total_found, updated_at)
                    VALUES (%s, %s, 0, 0, NOW()::text)
                    ON CONFLICT (prefix) DO UPDATE
                    SET last_tin = EXCLUDED.last_tin, updated_at = NOW()::text;
                """, (prefix, best_max))
                synced += 1

                marker = ""
                if is_dummy:
                    marker = f" [ĐÃ SỬA MÃ DỊ BIỆT: {cur_prog} -> {best_max}]"
                elif b_max and t_max and b_max > t_max:
                    marker = f" [BỐ CÁO ĐI TRƯỚC: {t_max} -> {best_max}]"

                print(f"[{prefix}] {name:<22} -> Mốc đỉnh: {best_max}{marker}")

            conn.commit()

    print("=" * 80)
    print(f"✅ ĐÃ ĐỒNG BỘ THÀNH CÔNG: {synced}/62 tỉnh thành!")
    print(f"   - Số tỉnh đã sửa mã dị biệt (Dummy Peaks) : {adjusted_dummy}")
    print(f"   - Số tỉnh đón đầu đỉnh Bố Cáo mới hơn Thuế: {bocao_promoted}")
    print("=" * 80)


if __name__ == "__main__":
    sync_max_tin_all()
