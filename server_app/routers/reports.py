# @id 01M4V0HMPJ04STMP34AVWP92A1
# @related 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""server_app.routers.reports - Báo cáo sản lượng MST crawl từ bảng chuyên biệt crawl_stats_daily."""
from fastapi import APIRouter, HTTPException, Query
from server_app.core.database import get_db_connection, PROVINCES_CACHE

router = APIRouter(tags=["reports"])

PERIOD_MAP = {
    "day": ("day", "YYYY-MM-DD", lambda s: f"{s.split('-')[2]}/{s.split('-')[1]}/{s.split('-')[0]}" if len(s.split('-')) == 3 else s),
    "month": ("month", "YYYY-MM", lambda s: f"{s.split('-')[1]}/{s.split('-')[0]}" if len(s.split('-')) == 2 else s),
    "year": ("year", "YYYY", lambda s: s)
}


def _resolve_prefix(prov_key: str | None) -> str | None:
    if not prov_key or prov_key == "all":
        return None
    for name, cfg in PROVINCES_CACHE.items():
        k = name.lower().replace(" ", "_")
        if cfg.get("prefix") == prov_key or k == prov_key.lower() or name.lower() == prov_key.lower():
            return cfg.get("prefix")
    return prov_key if len(prov_key) == 2 and prov_key.isdigit() else None


@router.post("/api/reports/sync-stats")
async def sync_stats():
    """Đồng bộ bảng thống kê chuyên biệt crawl_stats_daily & regi_stats_daily từ tax_records."""
    try:
        with get_db_connection() as conn:
            conn.autocommit = True
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO crawl_stats_daily (stat_date, province_prefix, total_crawled, updated_at)
                    SELECT DATE(COALESCE(scraped_at, created_at)) AS stat_date,
                           SUBSTRING(tin FROM 1 FOR 2) AS province_prefix,
                           COUNT(*)::int AS total_crawled, CURRENT_TIMESTAMP
                    FROM tax_records WHERE COALESCE(scraped_at, created_at) IS NOT NULL GROUP BY 1, 2
                    ON CONFLICT (stat_date, province_prefix)
                    DO UPDATE SET total_crawled = EXCLUDED.total_crawled, updated_at = CURRENT_TIMESTAMP;
                    INSERT INTO regi_stats_daily (stat_date, province_prefix, total_records, updated_at)
                    SELECT DATE(regi_date) AS stat_date, SUBSTRING(tin FROM 1 FOR 2) AS province_prefix,
                           COUNT(*)::int AS total_records, CURRENT_TIMESTAMP
                    FROM tax_records WHERE regi_date IS NOT NULL GROUP BY 1, 2
                    ON CONFLICT (stat_date, province_prefix)
                    DO UPDATE SET total_records = EXCLUDED.total_records, updated_at = CURRENT_TIMESTAMP;
                """)
                cur.execute("SELECT COUNT(*), SUM(total_crawled) FROM crawl_stats_daily;")
                cnt, tot = cur.fetchone()
        return {"success": True, "synced_rows": cnt, "total_records": tot}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/reports/crawl-stats")
async def get_crawl_stats(
    period: str = Query("day", pattern="^(day|month|year)$"),
    time_field: str = Query("scraped_at", pattern="^(scraped_at|regi_date)$"),
    province_key: str = Query("all"),
    from_date: str | None = Query(None),
    to_date: str | None = Query(None)
):
    """Lấy số lượng MST theo ngày, tháng, năm từ crawl_stats_daily hoặc regi_stats_daily (< 20ms)."""
    trunc, to_char, fmt_label = PERIOD_MAP.get(period, PERIOD_MAP["day"])
    prefix = _resolve_prefix(province_key)
    target_table = "regi_stats_daily" if time_field == "regi_date" else "crawl_stats_daily"
    count_col = "total_records" if time_field == "regi_date" else "total_crawled"

    where_parts = ["1=1"]
    params = []
    if prefix:
        where_parts.append("province_prefix = %s")
        params.append(prefix)
    if from_date:
        where_parts.append("stat_date >= %s::date")
        params.append(from_date)
    if to_date:
        where_parts.append("stat_date <= %s::date")
        params.append(to_date)

    where_sql = " AND ".join(where_parts)
    date_col = "stat_date" if period == "day" else f"DATE_TRUNC('{trunc}', stat_date)"
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(f"""
                    SELECT TO_CHAR({date_col}, '{to_char}') AS p_key, SUM({count_col})::int
                    FROM {target_table} WHERE {where_sql} GROUP BY 1 ORDER BY 1 ASC
                """, params)
                timeline_rows = cur.fetchall()

                top_where = [p for p in where_parts if not p.startswith("province_prefix")]
                top_params = [p for i, p in enumerate(params) if not prefix or i > 0]
                cur.execute(f"""
                    SELECT province_prefix, SUM({count_col})::int
                    FROM {target_table} WHERE {' AND '.join(top_where)} GROUP BY 1 ORDER BY 2 DESC LIMIT 10
                """, top_params)
                top_rows = cur.fetchall()

        timeline = [{"period": r[0], "label": fmt_label(r[0]), "count": r[1]} for r in timeline_rows if r[0]]
        total_records = sum(t["count"] for t in timeline)
        peak_item = max(timeline, key=lambda x: x["count"]) if timeline else None

        prefix_map = {cfg["prefix"]: (name, name.lower().replace(" ", "_")) for name, cfg in PROVINCES_CACHE.items()}
        top_provinces = []
        for r_pref, r_cnt in top_rows:
            p_name, p_key = prefix_map.get(r_pref, (f"Tỉnh {r_pref}", r_pref))
            pct = round((r_cnt / total_records * 100), 1) if total_records > 0 else 0.0
            top_provinces.append({
                "prefix": r_pref, "province_name": p_name, "province_key": p_key,
                "count": r_cnt, "percentage": pct
            })

        return {
            "period": period, "time_field": time_field, "province_key": province_key,
            "summary": {
                "total_records": total_records,
                "peak_period": peak_item["label"] if peak_item else None,
                "peak_count": peak_item["count"] if peak_item else 0,
                "avg_per_period": round(total_records / len(timeline)) if timeline else 0,
                "period_count": len(timeline)
            },
            "timeline": timeline,
            "top_provinces": top_provinces
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
