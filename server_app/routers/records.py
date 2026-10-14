# @id 01M4V0HMPHM21B4BA3C72AJJGX
# @related 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0HMPSXCSFX3CC2P2JTJCN, 01M4V0HMPZ2W0RRVHJPXDXMCPC, 01M4V0HMPXF5R5934TSE7VJ9GQ, 01M4V0FGZN8KJG6YHQM6560EK1
"""server_app.routers.records - Tra cứu dữ liệu, lọc, xuất CSV và đối soát Bố Cáo."""
import csv
import io
import unicodedata
from fastapi import APIRouter, HTTPException, Query, Response
from server_app.core.database import (
    PROVINCES_CACHE,
    get_db_connection,
    fetch_crawler_health_report
)
from server_app.schemas.requests import FilterRequest, SearchRequest
router = APIRouter(tags=["records"])


@router.post("/api/filter")
async def filter_records(req: FilterRequest):
    """Lọc các doanh nghiệp mới thành lập theo khoảng ngày đăng ký kinh doanh."""
    if req.province_key not in PROVINCES_CACHE:
        raise HTTPException(status_code=400, detail="Tỉnh thành không hợp lệ")

    prov_cfg = PROVINCES_CACHE[req.province_key]
    try:
        from_d = (req.from_date or "").strip() or None
        to_d = (req.to_date or "").strip() or None
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT tin, norm_name, regi_date, status_name, tran_addr, pay_taxo_name, COALESCE(tran_tel, '')
                    FROM tax_records
                    WHERE tin LIKE %s
                      AND (%s IS NULL OR regi_date::date >= %s::date)
                      AND (%s IS NULL OR regi_date::date <= %s::date)
                    ORDER BY regi_date DESC LIMIT 500
                """, (prov_cfg["prefix"] + '%', from_d, from_d, to_d, to_d))
                rows = cur.fetchall()
                cur.execute("""
                    SELECT COUNT(*) FROM tax_records
                    WHERE tin LIKE %s
                      AND (%s IS NULL OR regi_date::date >= %s::date)
                      AND (%s IS NULL OR regi_date::date <= %s::date)
                """, (prov_cfg["prefix"] + '%', from_d, from_d, to_d, to_d))
                total = cur.fetchone()[0]

        headers = ["Mã Số Thuế", "Tên Doanh Nghiệp", "Ngày Đăng Ký", "Trạng Thái", "Địa Chỉ", "Cơ Quan Thuế", "Số Điện Thoại"]
        return {"headers": headers, "rows": rows, "count": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/search")
async def search_records(req: SearchRequest):
    """Tìm kiếm tức thời doanh nghiệp theo Mã Số Thuế hoặc Tên Doanh Nghiệp."""
    try:
        tin, name = (req.tin or "").strip(), (req.name or "").strip()
        prov_key = (req.province_key or "").strip()
        p_filter = PROVINCES_CACHE[prov_key]["prefix"] if prov_key in PROVINCES_CACHE else None
        conds, params = [], []

        if tin:
            conds.append("tin LIKE %s")
            params.append(tin + '%' if len(tin) < 10 else tin)
        if name:
            n_norm = ''.join(c for c in unicodedata.normalize('NFD', name) if unicodedata.category(c) != 'Mn').upper()
            conds.append("(norm_name ILIKE %s OR unaccent(norm_name) ILIKE %s)")
            params.extend(['%' + name + '%', '%' + n_norm + '%'])
        if p_filter:
            conds.append("tin LIKE %s")
            params.append(p_filter + '%')

        where = ("WHERE " + " AND ".join(conds)) if conds else ""
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(f"SELECT tin, norm_name, regi_date, status_name, tran_addr, pay_taxo_name FROM tax_records {where} ORDER BY regi_date DESC NULLS LAST LIMIT 200", params)
                rows = cur.fetchall()
                cur.execute(f"SELECT COUNT(*) FROM tax_records {where}", params)
                total = cur.fetchone()[0]
        return {"rows": rows, "count": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/export")
async def export_csv(province_key: str = Query(...), from_date: str = Query(""), to_date: str = Query("")):
    """Xuất danh sách doanh nghiệp sang tệp CSV UTF-8 BOM."""
    if province_key not in PROVINCES_CACHE:
        raise HTTPException(status_code=400, detail="Tỉnh thành không hợp lệ")
    prov_cfg = PROVINCES_CACHE[province_key]
    try:
        from_d, to_d = (from_date or "").strip() or None, (to_date or "").strip() or None
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT * FROM tax_records WHERE tin LIKE %s
                      AND (%s IS NULL OR regi_date::date >= %s::date)
                      AND (%s IS NULL OR regi_date::date <= %s::date)
                    ORDER BY regi_date DESC
                """, (prov_cfg["prefix"] + '%', from_d, from_d, to_d, to_d))
                rows = cur.fetchall()
                headers = [d[0] for d in cur.description]
        output = io.StringIO()
        output.write('\ufeff')
        writer = csv.writer(output)
        writer.writerow(headers)
        writer.writerows(rows)
        fn = f"export_{prov_cfg['prefix']}_{from_d or 'all'}_to_{to_d or 'all'}.csv"
        return Response(content=output.getvalue().encode('utf-8-sig'), media_type="text/csv",
                        headers={"Content-Disposition": f"attachment; filename={fn}"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/reports/crawler-health")
async def get_crawler_health_report(days: int = Query(3, ge=1, le=30)):
    """Báo cáo tình trạng cập nhật mã số thuế theo 62 tỉnh."""
    try:
        return fetch_crawler_health_report(days=days)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/record/{tin}")
async def get_record_detail(tin: str):
    """Lấy thông tin chi tiết đầy đủ của một Mã Số Thuế."""
    tin_clean = (tin or "").strip()
    if not tin_clean:
        raise HTTPException(status_code=400, detail="Mã số thuế không hợp lệ")
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT * FROM tax_records WHERE tin = %s", (tin_clean,))
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Không tìm thấy mã số thuế")
                cols = [d[0] for d in cur.description]
                return {k: (v.isoformat() if hasattr(v, 'isoformat') else v) for k, v in zip(cols, row)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/bocao/reconcile/scan-missing")
async def bocao_scan_missing(payload: dict = None):
    """Khởi động Gap-Fill scan cho tỉnh có MST Bố Cáo chưa khớp qua Rolling Queue."""
    from server_app.services.bocao_scan import launch_bocao_gap_fill_scan
    req = payload or {}
    try:
        return launch_bocao_gap_fill_scan(
            gap=int(req.get("gap", 20)), num_workers=int(req.get("num_workers", 1)),
            max_concurrent=int(req.get("max_concurrent", 2))
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api/bocao/reconcile/sync-missing")
async def bocao_sync_missing(payload: dict = None):
    """Quét trực tiếp danh sách MST Bố Cáo chưa có trong CSDL Thuế."""
    from server_app.services.bocao_reconcile_sync import sync_missing_bocao_records
    req = payload or {}
    try:
        return sync_missing_bocao_records(batch_size=int(req.get("batch_size", 60)))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/bocao/reconcile/stats")
async def bocao_reconcile_stats():
    """Lấy thống kê tỷ lệ đối soát giữa Bố Cáo và tax_records."""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT COUNT(*),
                           COUNT(t.tin),
                           COUNT(CASE WHEN t.tin IS NULL AND (b.sync_status IS NULL OR b.sync_status != 'retry_later') THEN 1 END),
                           COUNT(CASE WHEN b.sync_status = 'retry_later' THEN 1 END)
                    FROM bocao_records b LEFT JOIN tax_records t ON b.tin = t.tin
                """)
                tot, matched, unmatched, retry_later = cur.fetchone()
                rate = round((matched / tot * 100), 1) if tot > 0 else 0
                return {"total_bocao": tot, "matched_count": matched,
                        "unmatched_count": unmatched, "retry_later_count": retry_later, "match_rate": rate}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
