# @id 01M4V0HMPP1ZSQ313HDV5B2XYG
# @related 01M4V0HMP4K06YVK8GXXJP84SP, 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""
server_app.routers.views
Phục vụ điểm kiểm tra sức khỏe giao diện và tích hợp Graphify Codebase Visualizer.
"""

import os
import sys
import json
import asyncio
import subprocess
from fastapi import APIRouter
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse

router = APIRouter(tags=["views"])


@router.get("/", response_class=HTMLResponse)
async def read_index():
    """Trả về trang xác thực trạng thái dịch vụ (giao diện chính chạy trên Next.js 14 Port 8123)."""
    return HTMLResponse(
        content="<!DOCTYPE html><html><head><meta charset='utf-8'><title>GDT Tax Crawler Unified Engine</title></head>"
        "<body><h1>GDT Tax Crawler Unified Engine (Next.js 14 + Python Worker)</h1></body></html>",
        status_code=200,
    )


@router.get("/api/graphify/stats")
async def get_graphify_stats():
    """Trả về số liệu thống kê tổng quan của đồ thị kiến trúc codebase."""
    analysis_file = os.path.join("graphify-out", ".graphify_analysis.json")
    graph_file = os.path.join("graphify-out", "graph.json")
    if not os.path.exists(analysis_file) or not os.path.exists(graph_file):
        return JSONResponse({"status": "not_extracted", "nodes": 0, "edges": 0, "communities": 0})
    try:
        with open(graph_file, "r", encoding="utf-8") as f:
            g_data = json.load(f)
        with open(analysis_file, "r", encoding="utf-8") as f:
            a_data = json.load(f)
        node_count = len(g_data.get("nodes", []))
        edge_count = len(g_data.get("links", g_data.get("edges", [])))
        comm_count = len(a_data.get("communities", {}))
        return JSONResponse({
            "status": "ready",
            "nodes": node_count,
            "edges": edge_count,
            "communities": comm_count,
            "god_nodes": a_data.get("gods", [])[:10],
            "surprises": a_data.get("surprises", [])[:5]
        })
    except Exception as e:
        return JSONResponse({"status": "error", "message": str(e)}, status_code=500)


@router.get("/api/graphify/report", response_class=PlainTextResponse)
async def get_graphify_report():
    """Trả về nội dung báo cáo kiến trúc GRAPH_REPORT.md dạng text/markdown."""
    report_file = os.path.join("graphify-out", "GRAPH_REPORT.md")
    if not os.path.exists(report_file):
        return "# GRAPH_REPORT.md chưa được tạo. Hãy chạy quét đồ thị trước."
    with open(report_file, "r", encoding="utf-8") as f:
        return f.read()


def _rebuild_graph_sync():
    """Hàm ngầm thực thi quét lại AST và xuất đồ thị mà không treo server."""
    env = os.environ.copy()
    env["PYTHONHASHSEED"] = "0"
    subprocess.run([sys.executable, "-m", "graphify", "extract", ".", "--code-only"], env=env, check=False)
    subprocess.run(
        [sys.executable, "-m", "graphify", "export", "html", "--graph", "graphify-out/graph.json"],
        env=env, check=False
    )
    subprocess.run(
        [sys.executable, "-m", "graphify", "tree", "--graph", "graphify-out/graph.json"],
        env=env, check=False
    )


@router.post("/api/graphify/refresh")
async def refresh_graphify():
    """Kích hoạt tiến trình quét lại đồ thị kiến trúc trong background thread."""
    asyncio.create_task(asyncio.to_thread(_rebuild_graph_sync))
    return {"status": "refreshing", "message": "Tiến trình quét lại đồ thị kiến trúc đã được bắt đầu."}
