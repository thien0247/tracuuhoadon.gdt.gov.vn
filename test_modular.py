import os
import sys

# Đảm bảo in ký tự tiếng Việt chuẩn trên mọi môi trường Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fastapi.testclient import TestClient


def check_line_counts():
    print("=== KIEM TRA SO DONG CAC TEP (RULE < 200 DONG) ===")
    targets = [
        "server.py", "server_app/main.py", "server_app/core/config.py",
        "server_app/core/database.py", "server_app/core/limiter.py",
        "server_app/core/state.py", "server_app/core/queue_manager.py",
        "server_app/core/scheduler.py", "server_app/schemas/requests.py",
        "server_app/routers/views.py", "server_app/routers/provinces.py",
        "server_app/routers/crawler.py", "server_app/routers/scheduler.py",
        "server_app/routers/records.py", "server_app/routers/reports.py",
        "server_app/routers/stream.py", "static/js/components/crawler-tab.js",
        "static/js/components/crawler-auto-schedule.js",
        "static/js/components/crawler-bocao-modal.js",
        "static/js/components/health-report-tab.js",
        "static/js/components/crawled-report-tab.js",
        "static/js/components/config-tab.js",
        "static/js/components/tax-detail-modal.js",
        "static/js/components/graphify-tab.js",
        "crawler_core/validator.py", "crawler_core/solver.py",
        "crawler_core/session.py", "crawler_core/storage.py",
        "crawler_core/engine.py", "crawler_core/gap_filler.py",
        "server_app/services/bocao_scan.py",
    ]
    all_ok = True
    for t in targets:
        if os.path.exists(t):
            with open(t, "r", encoding="utf-8") as f:
                cnt = len(f.readlines())
            status = "OK (<200)" if cnt <= 200 else "EXCEEDED"
            print(f"{t:<35} : {cnt:>4} lines [{status}]")
            if cnt > 200:
                all_ok = False
        else:
            print(f"{t:<35} : MISSING")
            all_ok = False
    assert all_ok, "Co tep vuot qua 200 dong!"


def check_api():
    print("\n=== KIEM TRA API TU DONG ===")
    import server

    print(f"Server app loaded: {server.app.title} (v{server.app.version})")

    client = TestClient(server.app)

    # 1. Test GET /
    res = client.get("/")
    print(f"GET / : Status {res.status_code}")
    assert res.status_code == 200

    # 2. Test GET /api/configs/provinces
    res = client.get("/api/configs/provinces")
    data = res.json()
    print(f"GET /api/configs/provinces : Status {res.status_code} ({len(data.get('provinces', {}))} provinces)")
    assert res.status_code == 200
    assert len(data.get("provinces", {})) > 0

    # 3. Test GET /api/provinces
    res = client.get("/api/provinces")
    data = res.json()
    print(f"GET /api/provinces : Status {res.status_code} ({len(data.get('provinces', {}))} provinces)")
    assert res.status_code == 200

    # 4. Test POST /api/search with limit
    first_prov = list(server.PROVINCES_CACHE.keys())[0]
    res = client.post("/api/search", json={"tin": "03", "province_key": first_prov})
    data = res.json()
    print(f"POST /api/search : Status {res.status_code} ({len(data.get('rows', []))} rows, total: {data.get('count')})")
    assert res.status_code == 200

    # 5. Test POST /api/filter
    res = client.post("/api/filter", json={"province_key": first_prov, "from_date": "", "to_date": ""})
    data = res.json()
    print(f"POST /api/filter ({first_prov}) : Status {res.status_code} ({len(data.get('rows', []))} rows, total: {data.get('count')})")
    assert res.status_code == 200

    # 6. Test POST /api/crawler/start_all & stop_all
    res = client.post("/api/crawler/start_all", json=[])
    assert res.status_code == 200
    print(f"POST /api/crawler/start_all : Status {res.status_code} ({res.json().get('status')})")

    # 7. Test POST /api/crawler/start_all_newest & queue_status
    res = client.post("/api/crawler/start_all_newest", json={"gap": 20, "num_workers": 1, "max_concurrent_provinces": 3})
    assert res.status_code == 200 and res.json().get("status") == "started_all_newest_scheduled"
    print(f"POST /api/crawler/start_all_newest : Status 200 (max_concurrent={res.json().get('max_concurrent')})")

    q_res = client.get("/api/crawler/queue_status")
    assert q_res.status_code == 200 and q_res.json().get("is_running") is True
    print(f"GET /api/crawler/queue_status : Status 200 (is_running=True)")

    client.post("/api/crawler/stop_all")
    assert client.get("/api/crawler/queue_status").json().get("is_running") is False
    print("Queue stopped successfully.")

    # 8. Test GET & POST /api/config/system
    res = client.get("/api/config/system")
    assert res.status_code == 200
    print(f"GET /api/config/system : Status 200 (max_rps={res.json().get('max_global_rps')})")
    res = client.post("/api/config/system", json={"max_global_rps": 32.0})
    assert res.status_code == 200
    print(f"POST /api/config/system : Status 200")

    # 9. Test GET /api/reports/crawler-health
    res = client.get("/api/reports/crawler-health?days=3")
    assert res.status_code == 200
    h_data = res.json()
    print(f"GET /api/reports/crawler-health : Status {res.status_code} (total={h_data.get('summary', {}).get('total')}, healthy={h_data.get('summary', {}).get('healthy')})")
    assert "summary" in h_data and "provinces" in h_data
    assert len(h_data["provinces"]) > 0

    # 9b. Test GET /api/reports/crawl-stats
    res = client.get("/api/reports/crawl-stats?period=day")
    assert res.status_code == 200
    cs_data = res.json()
    print(f"GET /api/reports/crawl-stats : Status 200 (total={cs_data.get('summary', {}).get('total_records')})")
    assert "summary" in cs_data and "timeline" in cs_data and "top_provinces" in cs_data

    # 10. Test POST /api/system/reset
    res = client.post("/api/system/reset")
    assert res.status_code == 200 and res.json().get("success") is True
    print(f"POST /api/system/reset : Status {res.status_code} ({res.json().get('message')})")

    # 11. Test GET /api/record/{tin} & Bocao APIs
    res = client.get("/api/record/4900127704")
    assert res.status_code == 200 and res.json().get("tin") == "4900127704"
    print(f"GET /api/record/4900127704 : Status 200")

    b_res = client.get("/api/bocao/reconcile/stats")
    assert b_res.status_code == 200
    print(f"GET /api/bocao/reconcile/stats : Status 200 (total={b_res.json().get('total_bocao')})")

    b_scan = client.post("/api/bocao/reconcile/scan-missing", json={"gap": 20})
    assert b_scan.status_code == 200
    print(f"POST /api/bocao/reconcile/scan-missing : Status 200 ({b_scan.json().get('status')})")

    # 12. Test Graphify Endpoints & Static Files
    assert client.get("/graphify-out/graph.html").status_code == 200
    assert client.get("/api/graphify/stats").status_code == 200
    print("GET /graphify-out/graph.html & /api/graphify/stats : Status 200")

    # 13. Test Scheduler & Gap Fill 500 APIs
    s_res = client.get("/api/crawler/schedule/status")
    assert s_res.status_code == 200 and "gap_fill_500" in s_res.json()
    print(f"GET /api/crawler/schedule/status : Status 200")

    print("\n>>> TAT CA CAC BUOC KIEM TRA DEU THANH CONG! <<<")


def check_stopping_condition():
    print("\n=== KIEM TRA DIEU KIEN DUNG (20 TIN KO TON TAI -> DUNG LUONG) ===")
    from crawler_core.engine import CrawlerEngine
    import crawler_core.session as session_module
    old_refresh = session_module.SessionManager.refresh
    session_module.SessionManager.refresh = lambda self, *args, **kwargs: None
    try:
        logs = []
        engine = CrawlerEngine(
            seed_tin="6000000000", prefix="60", activation_tin="6000000000",
            num_workers=1, scan_mode="newest", gap=20, on_log=lambda m: logs.append(m)
        )
        def mock_query(tin, sess, label=""):
            with engine._counter_lock:
                engine.total_queried += 1
            return False
        engine._query_one = mock_query
        engine.start()
        engine._thread.join(timeout=6.0)
        assert not engine._running, "Engine van dang chay sau khi gap 20 tin khong ton tai!"
        assert engine.total_queried in (20, 22), f"So tin da kiem tra phai la 20 hoac 22 (kem probe) nhung la {engine.total_queried}"
        assert any("20 MST liên tiếp không tồn tại" in l for l in logs), "Thieu log thong bao dung luong!"
        print(f"PASS: CrawlerEngine dung luong an toan: {engine.total_queried} tin (gom ca Adaptive Probe).")
    finally:
        session_module.SessionManager.refresh = old_refresh



if __name__ == "__main__":
    check_line_counts()
    check_api()
    check_stopping_condition()
