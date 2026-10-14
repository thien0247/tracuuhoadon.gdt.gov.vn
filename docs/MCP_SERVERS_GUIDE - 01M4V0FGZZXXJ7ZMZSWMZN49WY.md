---
id: "01M4V0FGZZXXJ7ZMZSWMZN49WY"
aliases:
  - "MCP_SERVERS_GUIDE"
  - "MCP_SERVERS_GUIDE.md"
created_at: "2026-10-13T16:10:41.024047+00:00"
type: "documentation"
---
# HƯỚNG DẪN CẤU HÌNH & VẬN HÀNH MCP SERVERS (MODEL CONTEXT PROTOCOL)

Tài liệu này hướng dẫn chi tiết kiến trúc, danh mục và cách thức vận hành toàn bộ **MCP Servers (Model Context Protocol)** được tích hợp riêng cho dự án **Vét Cạn Mã Số Thuế (GDT Tax Crawler & Search Engine)**.

---

## 1. Tổng Quan Về Model Context Protocol (MCP)

**Model Context Protocol (MCP)** là một tiêu chuẩn mở do Anthropic và cộng đồng mã nguồn mở khởi xướng, cho phép các mô hình ngôn ngữ lớn (LLM / AI Agent) kết nối an toàn, hai chiều với các công cụ, dịch vụ hạ tầng và nguồn dữ liệu bên ngoài qua giao thức chuẩn hóa JSON-RPC (Stdio hoặc SSE).

Trong dự án GDT Tax Crawler, MCP đóng vai trò là **"cánh tay nối dài"** giúp AI Agent:
- Trực tiếp chạy các câu lệnh SQL an toàn trên CSDL 6.2M+ bản ghi PostgreSQL (`taxdb`).
- Tương tác với hệ thống tệp tin dự án trong sandbox an toàn.
- Thăm dò các endpoint mạng của Tổng cục Thuế và phân tích phản hồi WAF F5.
- Đo đạc hiệu năng giao diện Web Dashboard thông qua Chrome DevTools.
- Kiểm soát lịch sử mã nguồn qua Git và tự động hóa trình duyệt qua Puppeteer.

---

## 2. Nguyên Tắc Phân Định Phạm Vi (Scope Isolation)

> [!IMPORTANT]
> **Quy Tắc Bất Di Bất Dịch:**
> Toàn bộ các MCP Server của dự án này được cấu hình **riêng biệt trong phạm vi dự án (Project Scope)** tại tệp [`.agents/mcp_config.json`](file:///c:/tracuuhoadon.gdt.gov.vn/.agents/mcp_config.json) và thư mục [`.agents/plugins/`](file:///c:/tracuuhoadon.gdt.gov.vn/.agents/plugins).
> Không can thiệp hoặc ghi đè tệp cấu hình toàn cục máy chủ (`~/.gemini/config/mcp_config.json`) để đảm bảo tính độc lập và không xung đột với các dự án khác.

---

## 3. Danh Mục MCP Servers Đã Cấu Hình Trong Dự Án

Cấu hình chi tiết tại [`.agents/mcp_config.json`](file:///c:/tracuuhoadon.gdt.gov.vn/.agents/mcp_config.json):

| MCP Server | Runtime & Package | Phạm vi & Kết nối | Vai trò cốt lõi trong dự án |
| :--- | :--- | :--- | :--- |
| **`postgres-db`** | `cmd /c npx @modelcontextprotocol/server-postgres` | `localhost:5433/taxdb` | Truy vấn CSDL 6.2M+ bản ghi `tax_records`, kiểm tra tiến độ `scan_progress`. |
| **`filesystem`** | `cmd /c npx @modelcontextprotocol/server-filesystem` | `c:\tracuuhoadon.gdt.gov.vn` | Đọc/ghi an toàn file AI model (`captcha_model.h5`), file config và xuất dữ liệu. |
| **`fetch`** | `cmd /c npx @modelcontextprotocol/server-fetch` | HTTP / HTTPS Client | Gửi request thăm dò trực tiếp các endpoint GDT (`gettin.html`, `Captcha.jpg`). |
| **`time`** | `cmd /c npx @modelcontextprotocol/server-time` | System Time / Timezones | Đồng bộ múi giờ GMT+7, tính toán uptime và hỗ trợ lập lịch quét. |
| **`git`** | `uvx mcp-server-git` | `c:\tracuuhoadon.gdt.gov.vn` | Tra cứu lịch sử commit, diff code, branch và blame lịch sử thuật toán crawler. |
| **`puppeteer`** | `cmd /c npx @modelcontextprotocol/server-puppeteer` | Headless Chromium | Tự động hóa trình duyệt headless, render JavaScript và chụp ảnh trang WAF. |
| **`chrome-devtools`** | `cmd /c npx chrome-devtools-mcp` | Plugin `.agents/plugins/` | Điều khiển Chrome thật, audit Core Web Vitals và network waterfall của Dashboard. |
| **`mikrotik`** | `uvx mcp-server-mikrotik` | RouterOS SSH :22 | Quản lý Router MikroTik: định tuyến đa WAN, xoay IP vượt WAF, WireGuard VPN, kiểm soát băng thông (`/queue`) và tường lửa. |

---

## 4. Chi Tiết File Cấu Hình [`.agents/mcp_config.json`](file:///c:/tracuuhoadon.gdt.gov.vn/.agents/mcp_config.json)

```json
{
  "mcpServers": {
    "postgres-db": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://zzsu:Zzs@123@localhost:5433/taxdb"
      ],
      "env": {}
    },
    "filesystem": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "c:\\tracuuhoadon.gdt.gov.vn"
      ],
      "env": {}
    },
    "fetch": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@modelcontextprotocol/server-fetch"
      ],
      "env": {}
    },
    "time": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@modelcontextprotocol/server-time"
      ],
      "env": {}
    },
    "git": {
      "command": "uvx",
      "args": [
        "mcp-server-git",
        "--repository",
        "c:\\tracuuhoadon.gdt.gov.vn"
      ],
      "env": {}
    },
    "puppeteer": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "@modelcontextprotocol/server-puppeteer"
      ],
      "env": {}
    },
    "mikrotik": {
      "command": "uvx",
      "args": [
        "mcp-server-mikrotik",
        "--host",
        "192.168.88.1",
        "--username",
        "admin",
        "--password",
        "your_password",
        "--port",
        "22"
      ],
      "env": {}
    }
  }
}
```

---

## 5. Hướng Dẫn Kích Hoạt & Prompt Mẫu Cho Từng MCP Server

Khi làm việc với AI Agent trong Antigravity IDE, bạn có thể ra lệnh bằng ngôn ngữ tự nhiên để Agent tự động kích hoạt công cụ tương ứng:

### A. Truy vấn CSDL (`postgres-db`)
- **Prompt:** *"Dùng MCP postgres-db kiểm tra xem tỉnh Đắk Lắk (tiền tố 60) hiện tại có bao nhiêu MST trong bảng tax_records và cho biết MST lớn nhất là bao nhiêu?"*
- **Công cụ được gọi:** `postgres-db:query` với SQL `SELECT count(*), max(tin) FROM tax_records WHERE tin LIKE '60%'`.

### B. Kiểm tra phản hồi mạng GDT (`fetch`)
- **Prompt:** *"Dùng MCP fetch gửi GET request đến https://tracuuhoadon.gdt.gov.vn/tbphtc.html và kiểm tra xem server có trả về cookie Set-Cookie hoặc chặn WAF F5 hay không."*
- **Công cụ được gọi:** `fetch:fetch`.

### C. Quản lý tệp tin dự án (`filesystem`)
- **Prompt:** *"Dùng MCP filesystem kiểm tra dung lượng của tệp captcha_model.h5 và liệt kê các tệp trong thư mục crawler_core."*
- **Công cụ được gọi:** `filesystem:get_file_info`, `filesystem:list_directory`.

### D. Kiểm tra lịch sử mã nguồn (`git`)
- **Prompt:** *"Dùng MCP git kiểm tra 5 commit gần nhất của repository và xem các thay đổi trong tệp crawler_core/limiter.py."*
- **Công cụ được gọi:** `git:git_log`, `git:git_diff`.

### E. Tự động hóa Browser (`puppeteer` / `chrome-devtools`)
- **Prompt:** *"Dùng puppeteer truy cập trang http://localhost:8000 và chụp ảnh màn hình tổng thể bảng điều khiển Dashboard."*
- **Công cụ được gọi:** `puppeteer:navigate`, `puppeteer:screenshot`.

### F. Quản Trị Hạ Tầng Mạng & Router MikroTik (`mikrotik`)
- **Prompt 1 (Kiểm tra interface & băng thông):** *"Dùng MCP mikrotik liệt kê danh sách interface mạng và kiểm tra thông lượng traffic đang truyền nhận trên cổng ether1-WAN."*
- **Prompt 2 (Quản trị Firewall & NAT):** *"Dùng MCP mikrotik kiểm tra các rule NAT masquerade và firewall filter đang hoạt động xem có rule nào chặn port 8000 không."*
- **Prompt 3 (WireGuard & Định tuyến an toàn):** *"Dùng MCP mikrotik bật phiên Safe Mode, sau đó kiểm tra cấu hình WireGuard peer kết nối giữa các máy chủ crawler."*
- **Công cụ được gọi:** `list_interfaces`, `get_interface`, `list_filter_rules`, `list_nat_rules`, `enable_safe_mode`, `list_wireguard_peers`.

---

## 6. Lưu Ý Kỹ Thuật & Khắc Phục Sự Cố

1. **Chuỗi kết nối PostgreSQL trên Windows:**
   - Khi chạy qua `cmd /c npx`, nếu mật khẩu chứa ký tự đặc biệt như `@`, một số parser URL có thể bị nhầm lẫn giữa mật khẩu và hostname. Nếu gặp lỗi kết nối, hãy đảm bảo cổng `5433` và database `taxdb` đang hoạt động bình thường.
2. **Khởi chạy Python Stdio Servers với `uvx`:**
   - Server `git` sử dụng `uvx mcp-server-git`. Công cụ `uv` đã được cài đặt sẵn trên máy (`uv 0.10.6`), cho phép tự động tải môi trường ảo cô lập cực nhanh (< 1 giây) mà không làm ô nhiễm môi trường Python toàn cục.
3. **Giới hạn quyền truy cập Filesystem:**
   - `@modelcontextprotocol/server-filesystem` chỉ được cấp quyền truy cập trong đúng thư mục gốc của dự án `c:\tracuuhoadon.gdt.gov.vn`, ngăn chặn hoàn toàn việc can thiệp ra ngoài các thư mục hệ thống Windows.
4. **Vận hành an toàn với MikroTik RouterOS (Safe-Mode & SSH):**
   - Server `mikrotik` sử dụng gói `mcp-server-mikrotik` từ repo [jeff-nasseri/mikrotik-mcp](https://github.com/jeff-nasseri/mikrotik-mcp), chạy trực tiếp qua `uvx` mà không cần cài đặt Python dependency thủ công.
   - MCP kết nối qua giao thức SSH cổng 22 (hoặc port tùy chỉnh) bằng mật khẩu hoặc SSH private key (`--key-filename`).
   - Cung cấp **19 phân hệ quản trị** toàn diện: VLAN, Firewall, NAT, DHCP, DNS, Routes, WireGuard, IP Pool, Queues, Safe Mode, PoE, v.v.
   - **Cơ chế Safe-Mode:** Khi thực hiện các thay đổi định tuyến mạng nhạy cảm (như xoay WAN, đổi IP gateway, chỉnh sửa firewall), RouterOS sẽ tự động rollback nếu kết nối bị ngắt, đảm bảo không bao giờ bị mất quyền truy cập thiết bị từ xa.

---

## 7. Cơ Chế Tối Ưu Hóa & Nén Token Trước Khi Gửi Lên LLM (Token Pre-Optimization)

Khi AI Agent tương tác với cơ sở dữ liệu quy mô lớn (hơn 6.2 triệu bản ghi `tax_records`), nhật ký crawl hàng chục nghìn dòng, hoặc mã nguồn HTML thô từ Tổng cục Thuế:
- Nếu MCP trả về nguyên bản JSON 1.000 dòng, context window sẽ bị nạp hàng trăm nghìn token dư thừa.
- Hậu quả: Làm chậm thời gian phản hồi, tăng chi phí API và gây hiện tượng "ảo giác" hoặc bỏ sót thông tin cốt lõi (*Needle in a Haystack problem*).

### A. 4 Cấp Độ Nén & Tối Ưu Token Trong Dự Án

```mermaid
flowchart TD
    RawData["Dữ liệu thô<br/>(PostgreSQL 6.2M rows / HTML GDT / Logs)"] --> L1["Cấp 1: MCP Tool Level<br/>(Projection, LIMIT, TSV thay vì JSON)"]
    L1 --> L2["Cấp 2: MCP Memory / Semantic RAG<br/>(Chỉ lấy tóm tắt & Vector Top-K)"]
    L2 --> L3["Cấp 3: Skill Progressive Disclosure<br/>(Chỉ nạp SKILL.md khi được gọi)"]
    L3 --> Compressed["Context Nhỏ Gọn & Tinh Khiết<br/>(Tiết kiệm 70% - 90% Tokens)"]
    Compressed --> LLM["Gửi lên Máy Chủ AI (LLM)"]
```

1. **Định dạng dữ liệu trả về (JSON ➔ Compact Markdown / TSV):**
   - Định dạng JSON lặp lại tên key (`{"tin": "...", "norm_name": "...", "status": "..."}`) trên từng dòng khiến token tăng gấp 3 lần.
   - Khi truy vấn qua MCP `postgres-db`, định dạng dữ liệu trả về bảng Markdown hoặc TSV (Tab-Separated Values) giúp giảm ngay **50% – 65% token** mà LLM vẫn hiểu chính xác 100%.
2. **Chiến lược Projection & Aggregation (Tầng truy vấn SQL):**
   - Nghiêm cấm `SELECT * FROM tax_records` (trả về 23 cột cả những trường rỗng).
   - Luôn chỉ định cột cần thiết (`SELECT tin, norm_name, status_name FROM tax_records WHERE ... LIMIT 20`) hoặc dùng hàm tổng hợp (`COUNT`, `MAX`, `GROUP BY`) để LLM chỉ đọc kết quả phân tích cô đọng.
3. **Bộ nhớ đồ thị tri thức (Knowledge Graph Memory MCP):**
   - Thay vì nạp toàn bộ 500 dòng log quét gần nhất, MCP `memory-context` trích xuất thành các thực thể ngắn gọn:
     - `Đắk Lắk (60) ➔ tin_max: 6001842955 | trạng thái: bình thường`
     - `F5 WAF ➔ ngưỡng_an_toàn: 10 req/s | cooldown: 30s`
   - Tiết kiệm hơn **95% token** so với việc đọc trực tiếp nhật ký log thô.
4. **Kỹ thuật "Progressive Disclosure" của Skill:**
   - Các file hướng dẫn chuyên sâu (`SKILL.md`) không bao giờ được nạp cứng toàn bộ vào System Prompt ban đầu.
   - Hệ thống chỉ lưu tiêu đề và 1 dòng tóm tắt (~50 token). Khi Agent thực sự đối mặt với bài toán cụ thể, tệp hướng dẫn mới được mở đọc theo yêu cầu (On-demand Retrieval).

---

## 8. Danh Mục MCP Servers Mở Rộng Tiềm Năng (Advanced Scaling)

Khi dự án mở rộng quy mô thu thập đa luồng trên toàn quốc hoặc phân tích chuyên sâu dữ liệu hóa đơn, các MCP Server sau có thể được bổ sung trực tiếp vào [`.agents/mcp_config.json`](file:///c:/tracuuhoadon.gdt.gov.vn/.agents/mcp_config.json):

| MCP Server | Gói Thực Thi | Vai Trò & Tình Huống Ứng Dụng | Mức Độ Tiết Kiệm Token |
| :--- | :--- | :--- | :--- |
| **`duckdb`** | `mcp-server-duckdb` | **Phân tích OLAP siêu tốc:** Chạy SQL trên file Parquet/CSV hàng chục triệu bản ghi mà không tốn tải PostgreSQL, chỉ trả về bảng thống kê cô đọng. | ⭐⭐⭐⭐⭐ (Chỉ trả về aggregated stats) |
| **`redis`** | `@modelcontextprotocol/server-redis` | **Quản lý Session Pool phân tán:** Lưu trữ session `curl_cffi` còn sống và token bucket giữa nhiều tiến trình crawler. | ⭐⭐⭐⭐ (Tra cứu Key-Value tức thì) |
| **`sqlite-vec`** | `mcp-server-sqlite-vec` | **Tìm kiếm ngữ nghĩa (Semantic Search):** Thay thế việc query `LIKE '%tên công ty%'` nặng nề bằng vector search, chỉ lấy Top-3 kết quả sát nhất. | ⭐⭐⭐⭐⭐ (Tiết kiệm 90% so với scan bảng) |
| **`docker`** | `@modelcontextprotocol/server-docker` | **Quản trị Container hạ tầng:** Cho phép AI Agent tự kiểm tra container PostgreSQL, restart service hoặc kiểm tra tài nguyên CPU/RAM. | ⭐⭐⭐ (Chỉ đọc status & logs container) |
| **`brave-search`** | `@modelcontextprotocol/server-brave-search` | **Tra cứu đối chiếu Internet:** Hỗ trợ Agent tìm kiếm văn bản pháp luật thuế hoặc cổng thông tin doanh nghiệp quốc gia khi gặp MST nghi ngờ. | ⭐⭐⭐⭐ (Tự động tóm tắt snippet) |

### Cấu Hình Mẫu Bổ Sung DuckDB Vào [`.agents/mcp_config.json`](file:///c:/tracuuhoadon.gdt.gov.vn/.agents/mcp_config.json)

```json
{
  "mcpServers": {
    "duckdb": {
      "command": "cmd",
      "args": [
        "/c",
        "npx",
        "-y",
        "mcp-server-duckdb",
        "--db-path",
        "c:\\tracuuhoadon.gdt.gov.vn\\analytics.duckdb"
      ],
      "env": {}
    }
  }
}
```
