---
id: "01M4V0FGZPZSYW55AV5MVYEVEJ"
aliases:
  - "CHROME_DEVTOOLS_MCP_GUIDE"
  - "CHROME_DEVTOOLS_MCP_GUIDE.md"
created_at: "2026-10-13T16:10:41.015500+00:00"
type: "documentation"
---
# HƯỚNG DẪN TÍCH HỢP & SỬ DỤNG CHROME DEVTOOLS MCP (`chrome-devtools-mcp`)

Tài liệu này hướng dẫn chi tiết cách cấu hình, tích hợp và khai thác sức mạnh của **Chrome DevTools MCP** cho các AI Coding Agent (Antigravity, Claude Desktop, Cursor, VS Code Copilot).

---

## 1. Giới Thiệu Về `chrome-devtools-mcp`

- **Repository chính thức:** [https://github.com/ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- **Nhà phát triển:** Đội ngũ Google Chrome DevTools.
- **Bản chất:** Là một **Model Context Protocol (MCP) Server** cho phép AI Agent giao tiếp trực tiếp với trình duyệt Google Chrome thông qua Chrome DevTools Protocol (CDP) và Puppeteer.
- **Lợi ích:** Thay vì chỉ đọc code tĩnh, Agent có thể:
  - Xem và tương tác với giao diện Web đang chạy thực tế (`localhost:8000`).
  - Tự động phát hiện lỗi runtime JavaScript từ browser console.
  - Phân tích Network Request (REST API, SSE stream `/api/stream`).
  - Kiểm tra Core Web Vitals (LCP, CLS, INP) và đo lường hiệu năng.
  - Chụp ảnh màn hình trực quan để người dùng kiểm tra kết quả.

---

## 2. Cấu Trúc Tích Hợp Đã Triển Khai Trong Dự Án

Hệ thống đã được đóng gói thành chuẩn **Antigravity Plugin** tự động nhận diện:

```text
c:\tracuuhoadon.gdt.gov.vn\
├── .agents/
│   ├── plugins/
│   │   └── chrome-devtools/
│   │       ├── plugin.json                 # Khai báo manifest plugin
│   │       ├── mcp_config.json             # Cấu hình khởi chạy MCP server
│   │       └── rules/
│   │           └── chrome_devtools.md      # Quy tắc hướng dẫn Agent sử dụng tools
├── mcp_config.json                         # Cấu hình cấp workspace (tương thích mọi client)
└── start_chrome_debugging.bat              # Script khởi chạy Chrome với Remote Debugging Port
```

### Nội Dung Cấu Hình Chuẩn (`mcp_config.json`):
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "cmd.exe",
      "args": [
        "/c",
        "npx",
        "-y",
        "chrome-devtools-mcp@latest",
        "--no-usage-statistics"
      ]
    }
  }
}
```

---

## 3. Các Cách Khởi Chạy & Sử Dụng

### Cách 1: Chế độ Độc lập (Standalone - Mặc định)
- Agent sẽ tự động khởi tạo một instance Chrome riêng biệt thông qua Puppeteer khi nhận lệnh kiểm tra web.
- Phù hợp cho việc test nhanh, chạy headless hoặc chạy sandbox độc lập.

### Cách 2: Kết Nối Với Trình Duyệt Đang Mở (Remote Debugging)
Để Agent kết nối trực tiếp vào phiên duyệt web bạn đang thao tác:
1. Nhấp đúp chạy script [start_chrome_debugging.bat](file:///c:/tracuuhoadon.gdt.gov.vn/start_chrome_debugging.bat) (mở Chrome tại port `9222`).
2. Trong `mcp_config.json`, bạn có thể thêm cờ `--browserUrl`:
   ```json
   "args": [
     "/c", "npx", "-y", "chrome-devtools-mcp@latest",
     "--browserUrl", "http://127.0.0.1:9222",
     "--no-usage-statistics"
   ]
   ```
   *(hoặc cờ `--auto-connect` đối với Chrome phiên bản 144+)*.

---

## 4. Tích Hợp Vào Các Nền Tảng Khác

### A. Claude Desktop
Mở file cấu hình tại:
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Thêm cấu hình:
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "cmd.exe",
      "args": ["/c", "npx", "-y", "chrome-devtools-mcp@latest", "--no-usage-statistics"]
    }
  }
}
```

### B. Cursor IDE
- Mở **Settings** ➜ **Features** ➜ **MCP** ➜ **Add New MCP Server**.
- Điền:
  - **Name:** `chrome-devtools`
  - **Type:** `command`
  - **Command:** `npx -y chrome-devtools-mcp@latest --no-usage-statistics`

---

## 5. Danh Mục Các Công Cụ (Tools) Mà Agent Nhận Được

| Nhóm Công Cụ | Các Tools Tiêu Biểu | Mục Đích Sử Dụng |
| :--- | :--- | :--- |
| **Duyệt Web** | `navigate_page`, `click`, `fill`, `press_key` | Điều khiển trình duyệt, click nút bấm, nhập input |
| **Console & Debug** | `get_console_logs`, `evaluate_script` | Bắt lỗi JavaScript, thực thi script kiểm tra DOM |
| **Network** | `inspect_network`, `get_network_requests` | Kiểm tra request API, SSE stream, response headers |
| **Performance** | `get_performance_trace` | Thu thập chỉ số Web Vitals (LCP, CLS, INP) |
| **Hình Ảnh** | `take_screenshot` | Chụp ảnh toàn trang hoặc element để hiển thị cho user |

---

## 6. Các Câu Lệnh Prompt Mẫu Khi Giao Việc Cho Agent

1. **Kiểm tra chức năng Dashboard:**
   > *"Sử dụng chrome-devtools mở http://localhost:8000, nhấp vào nút '⚡ Quét MST Mới Toàn Bộ (TIN Max)', theo dõi log xem có xuất hiện thông báo khởi động không và chụp ảnh màn hình."*

2. **Kiểm tra lỗi Console & Network:**
   > *"Mở trang tra cứu http://localhost:8000, kiểm tra xem có bất kỳ lỗi JavaScript nào trong Console hoặc request API nào bị mã 4xx/5xx không."*

3. **Đánh giá tốc độ tải trang:**
   > *"Chạy phân tích hiệu năng Performance Trace trên http://localhost:8000 và đề xuất các điểm cần tối ưu hóa giao diện."*
