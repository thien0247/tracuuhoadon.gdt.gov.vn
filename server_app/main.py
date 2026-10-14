# @id 01M4V0HMP2VCWRE67VTK1E0T8G
# @related 01M4V0HMP4K06YVK8GXXJP84SP, 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0HMPBBMNYWQ237H5VNCDC, 01M4V0HMPAXTQC0ACKNND9DMFE, 01M4V0FGZN8KJG6YHQM6560EK1
"""
server_app.main
Khởi tạo và cấu hình ứng dụng FastAPI, gắn kết router và thư mục Graphify.
"""

import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from server_app.core.database import load_provinces, fetch_all_province_stats
from server_app.core.state import state
from server_app.core.scheduler import crawler_scheduler
from server_app.routers import views, provinces, crawler, records, stream, scheduler, reports


async def db_stats_worker():
    """Tác vụ ngầm định kỳ cập nhật thống kê CSDL bằng 1 truy vấn duy nhất, không chặn Event Loop."""
    while True:
        try:
            stats = await asyncio.to_thread(fetch_all_province_stats)
            state.db_stats.update(stats)
        except Exception:
            pass
        await asyncio.sleep(10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Quản lý vòng đời ứng dụng: nạp danh mục tỉnh thành và khởi chạy worker thống kê."""
    load_provinces()
    crawler_scheduler.start()
    worker_task = asyncio.create_task(db_stats_worker())
    yield
    crawler_scheduler.stop()
    worker_task.cancel()


def create_app() -> FastAPI:
    """Factory hàm tạo và cấu hình instance FastAPI."""
    app = FastAPI(
        title="MST Crawler Multi-Province Web App",
        version="4.1.0",
        lifespan=lifespan
    )

    if os.path.exists("graphify-out"):
        app.mount("/graphify-out", StaticFiles(directory="graphify-out"), name="graphify_out")

    # Đăng ký các APIRouter phân tầng
    app.include_router(views.router)
    app.include_router(provinces.router)
    app.include_router(crawler.router)
    app.include_router(records.router)
    app.include_router(reports.router)
    app.include_router(stream.router)
    app.include_router(scheduler.router)

    return app


app = create_app()
