# @id 01M4V0HMPM36E31004JH9CKM38
# @related 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0HMPBBMNYWQ237H5VNCDC, 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""
server_app.routers.stream
Quản lý luồng SSE (Server-Sent Events) phát dữ liệu và log thời gian thực về Dashboard.
"""

import asyncio
import json
import time
from datetime import datetime

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from server_app.core.database import PROVINCES_CACHE
from server_app.core.state import state

router = APIRouter(tags=["stream"])


@router.get("/api/stream")
async def stream_status():
    """SSE Endpoint phát trực tiếp trạng thái tổng thể, từng tỉnh và 50 logs gần nhất."""
    async def event_generator():
        while True:
            await asyncio.sleep(0.5)
            now = time.time()
            master_queried = 0
            master_found = 0
            master_speed = 0.0
            master_db = 0
            running_count = 0
            prov_data = {}

            for prov_key, prov_cfg in PROVINCES_CACHE.items():
                engine = state.engines.get(prov_key)
                is_running = False
                is_paused = False
                queried = 0
                found = 0
                uptime_str = "00:00:00"

                if engine:
                    is_running = engine._running
                    is_paused = engine._paused
                    queried = engine.total_queried
                    found = engine.total_found

                    if is_running:
                        running_count += 1
                        st = state.start_times.get(prov_key)
                        if st:
                            elapsed = int((datetime.now() - st).total_seconds())
                            hours, rem = divmod(elapsed, 3600)
                            minutes, seconds = divmod(rem, 60)
                            uptime_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"

                # Tính tốc độ quét (req/s)
                last_time = state.last_calc_times.get(prov_key, now)
                last_q = state.last_queried_counts.get(prov_key, 0)
                dt = now - last_time
                speed = state.speeds.get(prov_key, 0.0)
                if dt >= 1.0:
                    speed = round((queried - last_q) / dt, 1)
                    state.speeds[prov_key] = speed
                    state.last_calc_times[prov_key] = now
                    state.last_queried_counts[prov_key] = queried

                # Đọc DB stats từ RAM (cực nhanh, không truy vấn DB làm nghẽn Event Loop)
                stats = state.db_stats.get(prov_key) or {}
                db_count = stats.get("db_count", 0)
                tin_min = stats.get("tin_min", "")
                tin_max = stats.get("tin_max", "")

                master_queried += queried
                master_found += found
                master_speed += speed
                master_db += db_count

                prov_data[prov_key] = {
                    "running": is_running,
                    "paused": is_paused,
                    "queried": queried,
                    "found": found,
                    "speed": speed,
                    "last_tin": state.last_tins.get(prov_key, ""),
                    "uptime": uptime_str,
                    "db_count": db_count,
                    "tin_min": tin_min,
                    "tin_max": tin_max,
                    "scan_mode": engine.scan_mode if engine else "bidirectional",
                    "num_workers": engine.num_workers if engine else 3
                }

            payload = {
                "master": {
                    "total_queried": master_queried,
                    "total_found": master_found,
                    "total_speed": round(master_speed, 1),
                    "total_db_records": master_db,
                    "running_count": running_count
                },
                "provinces": prov_data,
                "logs": list(state.logs)[-50:]
            }
            yield f"data: {json.dumps(payload)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
