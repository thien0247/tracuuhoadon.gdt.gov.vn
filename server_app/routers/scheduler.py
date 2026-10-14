# @id 01M4V0HMPM4JN2CFPJ2DDFF343
# @related 01M4V0HMPAXTQC0ACKNND9DMFE, 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""
server_app.routers.scheduler
APIs điều khiển bộ lập lịch tự động: Quét đỉnh mới nhất (6h) & Quét fill lỗ hổng 500 MST (12h).
"""

from fastapi import APIRouter
from server_app.core.scheduler import crawler_scheduler

router = APIRouter(tags=["scheduler"])


@router.get("/api/crawler/schedule/status")
def get_schedule_status():
    """Lấy trạng thái vận hành của 2 lịch trình Newest (6h) và Gap-Fill 500 (12h)."""
    return crawler_scheduler.get_status()


@router.post("/api/crawler/schedule/toggle_newest")
def toggle_newest(payload: dict = None):
    """Bật/Tắt lịch tự động quét Newest Mode."""
    enable = payload.get("enable") if payload else None
    return {"enabled": crawler_scheduler.toggle_newest(enable)}


@router.post("/api/crawler/schedule/toggle_gap_fill")
def toggle_gap_fill(payload: dict = None):
    """Bật/Tắt lịch tự động quét Fill Lỗ Hổng 500 MST định kỳ 12h."""
    enable = payload.get("enable") if payload else None
    return {"enabled": crawler_scheduler.toggle_gap_fill(enable)}


@router.post("/api/crawler/schedule/trigger_newest")
def trigger_newest():
    """Kích hoạt chạy ngay lập tức đợt quét Newest cho 62 tỉnh."""
    crawler_scheduler.trigger_newest()
    return {"status": "triggered_newest"}


@router.post("/api/crawler/schedule/trigger_gap_fill")
@router.post("/api/crawler/gap_fill_500/start_all")
def trigger_gap_fill():
    """Kích hoạt chạy ngay lập tức đợt quét Fill Lỗ Hổng 500 MST cho 62 tỉnh."""
    crawler_scheduler.trigger_gap_fill()
    return {"status": "triggered_gap_fill_500"}


@router.post("/api/crawler/schedule/gap_fill_mode")
def set_gap_fill_mode(payload: dict = None):
    """Thiết lập chế độ Gap-Fill: Option 1 (reset khi gặp trong DB) vs Option 2 (chỉ reset khi có mã mới)."""
    reset = (payload or {}).get("reset_on_existing", True)
    return {"reset_on_existing": crawler_scheduler.set_gap_fill_mode(reset)}
