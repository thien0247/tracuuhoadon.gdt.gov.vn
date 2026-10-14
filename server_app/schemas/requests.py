# @id 01M4V0HMPSXCSFX3CC2P2JTJCN
# @related 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""
server_app.schemas.requests
Các mô hình Pydantic định nghĩa cấu trúc dữ liệu gửi lên từ Web Dashboard.
"""

from typing import Optional
from pydantic import BaseModel, Field


class StartRequest(BaseModel):
    """Yêu cầu khởi chạy crawler cho một tỉnh."""
    province_key: str
    scan_mode: str = Field(default="bidirectional", description="bidirectional, edges, newest, down_from_min")
    seed_tin: Optional[str] = None
    gap: int = 5000
    num_workers: int = 3
    reset_on_existing: bool = True


class GapFillModeRequest(BaseModel):
    """Yêu cầu cấu hình chế độ quét lùi lỗ hổng (Option 1 vs Option 2)."""
    reset_on_existing: bool = True


class StartAllNewestRequest(BaseModel):
    """Yêu cầu khởi chạy quét MST mới từ TIN Max cho tất cả các tỉnh."""
    selected_provinces: Optional[list[str]] = None
    gap: int = 20
    num_workers: int = 2
    max_concurrent_provinces: int = 3


class ProvinceControlRequest(BaseModel):
    """Yêu cầu tạm dừng hoặc dừng crawler theo tỉnh."""
    province_key: str


class FilterRequest(BaseModel):
    """Yêu cầu lọc bản ghi theo tỉnh và khoảng ngày cấp phép."""
    province_key: str
    from_date: str = ""
    to_date: str = ""


class SearchRequest(BaseModel):
    """Yêu cầu tìm kiếm theo MST hoặc tên công ty."""
    tin: Optional[str] = ""
    name: Optional[str] = ""
    province_key: Optional[str] = ""  # Rỗng nghĩa là tìm kiếm trên toàn quốc


class ProvinceCreate(BaseModel):
    """Yêu cầu thêm cấu hình tỉnh thành mới vào hệ thống."""
    name: str
    prefix: str
    activation_tin: str


class SystemConfigUpdate(BaseModel):
    """Yêu cầu cập nhật cấu hình hệ thống và thông số an toàn mạng."""
    max_global_rps: Optional[float] = None
    max_concurrent_requests: Optional[int] = None
    stagger_delay_seconds: Optional[float] = None
    waf_cooldown_seconds: Optional[float] = None


class UpdateMaxTinRequest(BaseModel):
    """Yêu cầu cập nhật Max TIN thủ công cho một tỉnh."""
    max_tin: str
    update_scan_progress: bool = True
    update_activation_tin: bool = True


