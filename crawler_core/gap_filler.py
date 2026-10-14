# @id 01M4V0HMQ3A7DWZWDSH8ENR1NN
# @related 01M4V0HMQ44CEANCD4YKA3HZ5X, 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0HMQ84SWGPZADDW1P3GNA, 01M4V0FH0PZ0CY8JH8XJ6K5CNY, 01M4V0FH0DTKQEFJ3JJ6ZCZSCN
"""
crawler_core.gap_filler
Thuật toán Gap-Fill Scan: Tra cứu bù MST Bố Cáo và quét lấp 500 lỗ hổng từ max_tin xuống.
"""
import logging
from crawler_core.session import SessionManager
from server_app.core.database import get_db_connection

logger = logging.getLogger(__name__)


def update_bocao_sync_status(tin: str, found: bool):
    """Cập nhật trạng thái đồng bộ của MST trong bảng bocao_records."""
    try:
        status = "synced" if found else "retry_later"
        err = None if found else "GDT replication pending"
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE bocao_records
                    SET sync_status = %s, last_synced_at = NOW(),
                        sync_attempts = COALESCE(sync_attempts, 0) + 1, last_error = %s
                    WHERE tin = %s;
                """, (status, err, tin))
            conn.commit()
    except Exception as e:
        logger.warning(f"Lỗi cập nhật sync_status cho MST {tin}: {e}")


def execute_gap_fill(engine):
    """Thực thi quét Gap-Fill cho MST Bố Cáo chưa có trong CSDL Thuế."""
    try:
        from server_app.core.database import get_gap_seeds_by_prefix
        seeds = get_gap_seeds_by_prefix(engine.prefix, limit=200)
    except Exception as e:
        logger.warning(f"Lỗi nạp hạt giống lỗ hổng [{engine.prefix}]: {e}")
        seeds = []

    seeds = seeds or ([engine.seed_tin] if engine.seed_tin else [])
    total_seeds = len(seeds)
    engine._log(f"Gap-Fill Scan | Bắt đầu tra cứu {total_seeds} MST Bố Cáo chưa có trong Thuế...")
    session_mgr = SessionManager(engine.solver, engine.activation_tin)

    for idx, st in enumerate(seeds, 1):
        if engine._stop_evt.is_set():
            break
        label = f"GAP-{st[-4:]}"
        found = engine._query_one(st, session_mgr, label=label)
        update_bocao_sync_status(st, found)
        res_msg = "ĐÃ TÌM THẤY & NẠP VÀO THUẾ" if found else "CHỜ GDT REPLICATE"
        engine._log(f"[{label}] ({idx}/{total_seeds}) MST {st}: {res_msg}")
    engine.db.flush()


def find_missing_gaps_downward(prefix: str, seed_tin: str, limit: int = 500) -> list:
    """Sinh limit MST hợp lệ giảm dần từ seed_tin và lọc ra các MST chưa có trong tax_records."""
    from crawler_core.validator import generate_direction
    try:
        gen = generate_direction(seed_tin, -1, prefix)
        candidates = []
        for _ in range(limit):
            try:
                candidates.append(next(gen))
            except StopIteration:
                break
        if not candidates:
            return []
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT tin FROM tax_records WHERE tin = ANY(%s)", (candidates,))
                existing = {r[0] for r in cur.fetchall()}
        return [t for t in candidates if t not in existing]
    except Exception as e:
        logger.warning(f"Lỗi tìm lỗ hổng 500 cho [{prefix}]: {e}")
        return []


def execute_gap_fill_500(engine, threshold: int = 500, reset_on_existing: bool = True):
    """Quét fill lỗ hổng liên tục từ max_tin xuống cho đến khi 500 MST liên tiếp không có mã nào vào DB.
    Option 1 (reset_on_existing=True): Gặp MST có trong DB -> reset miss=0 (Vét cạn sâu).
    Option 2 (reset_on_existing=False): Gặp MST có trong DB -> bỏ qua, chỉ reset miss=0 khi có mã MỚI nạp vào DB.
    """
    from crawler_core.validator import generate_direction
    try:
        from server_app.core.database import get_max_tin_by_prefix
        max_tin = get_max_tin_by_prefix(engine.prefix) or engine.seed_tin
    except Exception:
        max_tin = engine.seed_tin

    if not max_tin:
        engine._log(f"[{engine.prefix}] Không tìm thấy max_tin để quét lùi.")
        return

    mode_lbl = "Reset khi gặp MST trong DB" if reset_on_existing else "Chỉ reset khi có MST mới nạp DB"
    engine._log(f"Gap-Fill Scan (Ngưỡng {threshold} liên tiếp) | Từ {max_tin} xuống | Chế độ: {mode_lbl}")

    gen = generate_direction(max_tin, -1, engine.prefix)
    session_mgr = SessionManager(engine.solver, engine.activation_tin)
    consecutive_miss = 0
    total_checked, total_filled = 0, 0

    while not engine._stop_evt.is_set():
        batch_tins = []
        for _ in range(100):
            try: batch_tins.append(next(gen))
            except StopIteration: break
        if not batch_tins:
            engine._log(f"[{engine.prefix}] Đã duyệt hết dải MST của tỉnh.")
            break

        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT tin FROM tax_records WHERE tin = ANY(%s)", (batch_tins,))
                existing_set = {r[0] for r in cur.fetchall()}

        for tin in batch_tins:
            if engine._stop_evt.is_set(): break
            total_checked += 1

            if tin in existing_set:
                if reset_on_existing: consecutive_miss = 0
                continue

            label = f"GAP-{tin[-4:]}"
            found = engine._query_one(tin, session_mgr, label=label)
            if found:
                consecutive_miss = 0
                total_filled += 1
                engine._log(f"[{label}] {tin}: ĐÃ BÙ VÀO THUẾ (Tổng bù: {total_filled})")
            else:
                consecutive_miss += 1
                if consecutive_miss % 25 == 0 or consecutive_miss >= threshold:
                    engine._log(f"[{label}] {tin}: Không tồn tại trên GDT (Miss: {consecutive_miss}/{threshold})")

            if consecutive_miss >= threshold:
                engine._log(f"[{engine.prefix}] DỪNG LUỒNG: Đạt ngưỡng {threshold} MST liên tiếp không có mã mới vào DB! (Checked: {total_checked}, Bù: {total_filled})")
                engine.db.flush()
                return

        engine.db.flush()

    engine._log(f"[{engine.prefix}] Kết thúc Gap-Fill: Checked={total_checked}, Bù={total_filled}")
