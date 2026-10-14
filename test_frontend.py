import os
from fastapi.testclient import TestClient
import server

def test_frontend_files():
    print("=== KIEM TRA SO DONG FRONTEND ===")
    targets = [
        "templates/index.html",
        "static/css/style.css",
        "static/js/api.js",
        "static/js/components/crawler-grid.js",
        "static/js/components/crawler-list.js",
        "static/js/components/crawler-tab.js",
        "static/js/components/console-log.js",
        "static/js/components/filter-tab.js",
        "static/js/components/config-tab.js",
        "static/js/components/search-tab.js",
        "static/js/app.js",
    ]
    all_ok = True
    for t in targets:
        if os.path.exists(t):
            with open(t, "r", encoding="utf-8") as f:
                cnt = len(f.readlines())
            status = "OK (<150)" if cnt <= 150 else ("WARN (<200)" if cnt <= 200 else "EXCEEDED")
            print(f"{t:<38} : {cnt:>4} lines [{status}]")
            if cnt > 200:
                all_ok = False
        else:
            print(f"{t:<38} : MISSING")
            all_ok = False
    assert all_ok, "Co tep vuot qua 200 dong!"

def test_static_serves():
    print("\n=== KIEM TRA SERVE STATIC FILES ===")
    client = TestClient(server.app)

    endpoints = [
        ("/", 200, "text/html"),
        ("/static/css/style.css", 200, "text/css"),
        ("/static/js/api.js", 200, "javascript"),
        ("/static/js/components/crawler-grid.js", 200, "javascript"),
        ("/static/js/components/crawler-list.js", 200, "javascript"),
        ("/static/js/components/crawler-tab.js", 200, "javascript"),
        ("/static/js/components/console-log.js", 200, "javascript"),
        ("/static/js/components/filter-tab.js", 200, "javascript"),
        ("/static/js/components/config-tab.js", 200, "javascript"),
        ("/static/js/components/search-tab.js", 200, "javascript"),
        ("/static/js/app.js", 200, "javascript"),
    ]

    for path, expected_status, content_type_sub in endpoints:
        res = client.get(path)
        print(f"GET {path:<42} : Status {res.status_code} ({res.headers.get('content-type', '')})")
        assert res.status_code == expected_status
        assert content_type_sub in res.headers.get("content-type", "")

    print("\n>>> FRONTEND KIEM TRA HOAN TOAN THANH CONG! <<<")

if __name__ == "__main__":
    test_frontend_files()
    test_static_serves()
