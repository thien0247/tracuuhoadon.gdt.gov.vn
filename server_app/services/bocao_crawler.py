# @id 01M4V0HMPWWYTQA9Z8K68MEQXP
# @related 01M4V0HMP67E26K49WVAQF0ERW, 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V0FGZT243T45VNH4E9RQCG
"""
server_app.services.bocao_crawler
Thu thập dữ liệu Bố Cáo Điện Tử từ Cổng thông tin ĐKKD (bocaodientu.dkkd.gov.vn)
sử dụng curl_cffi Chrome 124 TLS bypass, cào đa trang và tra cứu Solr GetSearch.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
import re
import json
from bs4 import BeautifulSoup
from curl_cffi import requests
from psycopg2.extras import execute_values
from server_app.core.database import get_db_connection
BOCAO_URL = "https://bocaodientu.dkkd.gov.vn/egazette/Forms/Egazette/DefaultAnnouncements.aspx"
SRV_URL = "https://bocaodientu.dkkd.gov.vn/egazette/Public/Srv.aspx/GetSearch"


def parse_vietnamese_datetime(dt_str: str) -> Optional[datetime]:
    """Chuyển đổi chuỗi thời gian tiếng Việt (dd/MM/yyyy hh:mm:ss SA/CH) sang datetime."""
    try:
        s = dt_str.strip()
        match = re.match(r"(\d{2})/(\d{2})/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(SA|CH)?", s, re.IGNORECASE)
        if not match:
            return None
        d, m, y, hour, minute, second, period = match.groups()
        h = int(hour)
        if period:
            period = period.upper()
            if period == "CH" and h < 12:
                h += 12
            elif period == "SA" and h == 12:
                h = 0
        return datetime(int(y), int(m), int(d), h, int(minute), int(second))
    except Exception:
        return None


def extract_announcements(html_content: str) -> List[Dict[str, Any]]:
    """Phân tích bảng HTML ctl00_C_CtlList và trích xuất các bản ghi bố cáo."""
    soup = BeautifulSoup(html_content, "html.parser")
    table = soup.find("table", {"id": "ctl00_C_CtlList"})
    if not table:
        return []

    records = []
    for tr in table.find_all("tr"):
        tds = tr.find_all("td")
        if len(tds) < 4: continue
        raw_time = tds[0].get_text(strip=True)
        pub_dt = parse_vietnamese_datetime(raw_time)
        if not pub_dt: continue

        comp_cell = tds[1].get_text(" ", strip=True)
        tin_match = re.search(r"M[ÃA]\s*S[ỐO]\s*DN:\s*(\d+)", comp_cell, re.IGNORECASE)
        tin = tin_match.group(1).strip() if tin_match else ""
        if not tin: continue

        comp_name = re.sub(r"M[ÃA]\s*S[ỐO]\s*DN:\s*\d+", "", comp_cell, flags=re.IGNORECASE).strip()
        location, notice_type = tds[2].get_text(strip=True), tds[3].get_text(strip=True)
        view_link = tds[4].find("a") if len(tds) > 4 else None
        view_href = view_link.get("href") if view_link else ""

        records.append({
            "tin": tin, "company_name": comp_name, "province_name": location,
            "announcement_type": notice_type, "pub_time": pub_dt,
            "raw_data": json.dumps({"raw_time": raw_time, "view_href": view_href})
        })
    return records


def save_announcements_batch(items: List[Dict[str, Any]]) -> int:
    """Ghi nhận lô danh sách bố cáo vào bảng CSDL bocao_records."""
    if not items:
        return 0
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            insert_query = """
                INSERT INTO bocao_records (tin, company_name, province_name, announcement_type, pub_time, raw_data)
                VALUES %s
                ON CONFLICT (tin, pub_time, announcement_type) DO NOTHING
                RETURNING id;
            """
            tuples = [
                (it["tin"], it["company_name"], it["province_name"], it["announcement_type"], it["pub_time"], it["raw_data"])
                for it in items
            ]
            res = execute_values(cur, insert_query, tuples, fetch=True)
            conn.commit()
            return len(res) if res else 0


def crawl_and_save_bocao(url: str = BOCAO_URL) -> Dict[str, Any]:
    """Cào dữ liệu trang bố cáo hiện tại và ghi nhận lô vào CSDL PostgreSQL."""
    session = requests.Session(impersonate="chrome124")
    try:
        response = session.get(url, timeout=25)
        if response.status_code != 200:
            return {"success": False, "error": f"HTTP status {response.status_code}"}
        items = extract_announcements(response.text)
        return {"success": True, "total_found": len(items), "new_inserted": save_announcements_batch(items)}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        session.close()


def crawl_all_bocao_pages(max_pages: int = 5) -> Dict[str, Any]:
    """Cào toàn bộ các trang bố cáo có trong thanh phân trang bằng Postback."""
    session = requests.Session(impersonate="chrome124")
    try:
        resp = session.get(BOCAO_URL, timeout=25)
        if resp.status_code != 200:
            return {"success": False, "error": f"HTTP status {resp.status_code}"}

        items = extract_announcements(resp.text)
        total_found, total_inserted, pages_crawled = len(items), save_announcements_batch(items), 1
        soup = BeautifulSoup(resp.text, "html.parser")
        hd_inp = soup.find("input", {"id": "ctl00_hdParameter"})
        hd_param = hd_inp.get("value", "") if hd_inp else ""

        for p in range(2, max_pages + 1):
            vs = soup.find("input", {"id": "__VIEWSTATE"})
            ev = soup.find("input", {"id": "__EVENTVALIDATION"})
            post_data = {
                "__EVENTTARGET": "ctl00$C$CtlList", "__EVENTARGUMENT": f"Page${p}",
                "__VIEWSTATE": vs.get("value", "") if vs else "",
                "__EVENTVALIDATION": ev.get("value", "") if ev else "", "ctl00$hdParameter": hd_param
            }
            p_resp = session.post(BOCAO_URL, data=post_data, headers={"Referer": BOCAO_URL}, timeout=25)
            if p_resp.status_code != 200:
                break
            p_items = extract_announcements(p_resp.text)
            if not p_items:
                break
            total_found += len(p_items)
            total_inserted += save_announcements_batch(p_items)
            pages_crawled += 1
            soup = BeautifulSoup(p_resp.text, "html.parser")

        return {
            "success": True, "pages_crawled": pages_crawled,
            "total_found": total_found, "new_inserted": total_inserted
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        session.close()


def query_dkkd_solr(search_field: str) -> Dict[str, Any]:
    """Truy vấn dữ liệu doanh nghiệp qua API GetSearch của DKKD bằng token động hdParameter."""
    session = requests.Session(impersonate="chrome124")
    try:
        resp = session.get(BOCAO_URL, timeout=20)
        soup = BeautifulSoup(resp.text, "html.parser")
        hd = soup.find("input", {"id": "ctl00_hdParameter"})
        if not hd or not hd.get("value"):
            return {"success": False, "error": "Không tìm thấy token ctl00_hdParameter"}

        h_token = hd.get("value", "")
        headers = {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "content-type": "application/json; charset=UTF-8",
            "x-requested-with": "XMLHttpRequest",
            "Referer": BOCAO_URL
        }
        body = "{ 'searchField': '" + str(search_field).replace("'", "") + "','h': '" + h_token + "'}"
        srv_resp = session.post(SRV_URL, headers=headers, data=body.encode("utf-8"), timeout=15)
        if srv_resp.status_code != 200:
            return {"success": False, "error": f"DKKD Srv status {srv_resp.status_code}"}

        data = srv_resp.json()
        results = data.get("d") or []
        return {"success": True, "count": len(results), "enterprises": results}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        session.close()
