# Kế Hoạch Áp Dụng Template & Chuyển Đổi Hybrid Backend Sang TypeScript

Kế hoạch này tích hợp toàn diện 2 nội dung do người dùng yêu cầu:
1. **Áp dụng cấu hình và quy chuẩn từ thư mục `templates/`** (bộ luật `GEMINI.md`, audit logs `docs/logs/`, tài liệu topic `docs/TOPICS.md`, các MCP tools `context7`, `memory-context`, và bộ kỹ năng chuẩn hóa `.agents/skills/`).
2. **Chuyển đổi 1 phần Backend sang TypeScript (Kiến trúc Hybrid)**: Xây dựng tầng Web API / Database Router / SSE Stream hiệu năng cao bằng **TypeScript (Fastify)**, kết nối với **Python Worker** phụ trách AI CRNN CAPTCHA Solver và `curl_cffi` WAF bypass.

---

## User Review Required

> [!IMPORTANT]
> **Kiến trúc song song (Zero Disruption):**
> * Tầng TypeScript backend mới sẽ được đặt trong thư mục `src/`, chạy độc lập qua cổng **8123** (hoặc tùy biến).
> * Hệ thống backend Python cũ (`server.py` / FastAPI) **vẫn được giữ nguyên 100%**, đảm bảo bạn có thể chuyển đổi qua lại bất kỳ lúc nào bằng lệnh khởi động (`run_server.bat` cho Python, hoặc `run_server_ts.bat` cho TypeScript).
> * Cơ sở dữ liệu PostgreSQL (`taxdb` trên port `5433`) được chia sẻ chung giữa TypeScript backend và Python crawler.

> [!WARNING]
> **Giữ nguyên AI CRNN & WAF Bypass ở Python Worker:**
> * Cổng tra cứu GDT áp dụng F5 WAF kiểm tra TLS Fingerprint (JA3/JA4) rất nghiêm ngặt. Thư viện Python `curl_cffi` giả lập Chrome 124 đã hoạt động ổn định và tin cậy tuyệt đối.
> * Việc giữ Python Crawler Worker nhận lệnh điều phối từ TypeScript Backend giúp tránh rủi ro bị WAF từ chối request, đồng thời không cần convert phức tạp mạng Deep Learning CRNN sang ONNX.

---

## Proposed Changes

Separated into 4 main phases:

### Phase 1: Áp Dụng Template & Chuẩn Hóa Quản Trị Dự Án

Áp dụng các tinh hoa từ thư mục `templates/` vào dự án:
- Tạo `GEMINI.md` kế thừa các chuẩn mực < 200 dòng/file, strict TypeScript, audit logs.
- Cập nhật `.agents/mcp_config.json` với `context7`, `memory-context`, `playwright`.
- Tạo các skills `gdt-workflow`, `gdt-standards`, `gdt-testing`.
- Tạo hệ thống tài liệu `docs/TOPICS.md` và audit logs `docs/logs/`.

### Phase 2: Cấu Hình TypeScript & Node.js Infrastructure

- Tạo `package.json`, `tsconfig.json`.
- Cài đặt dependencies `fastify`, `@fastify/static`, `@fastify/cors`, `pg`, `tsx`, `typescript`.

### Phase 3: Xây Dựng Tầng TypeScript Backend (`src/`)

- Modular Fastify server tuân thủ nghiêm ngặt < 200 dòng/file.
- Đầy đủ các module `provinces`, `records`, `crawler`, `stream`, `config`, `db`.

### Phase 4: Python Worker Bridge & Khởi Động Đồng Bộ

- Tạo `worker_bridge.py` và script `run_server_ts.bat`.
