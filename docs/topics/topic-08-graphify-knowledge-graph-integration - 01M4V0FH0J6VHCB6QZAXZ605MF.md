---
id: "01M4V0FH0J6VHCB6QZAXZ605MF"
aliases:
  - "topic-08-graphify-knowledge-graph-integration"
  - "topic-08-graphify-knowledge-graph-integration.md"
created_at: "2026-10-13T16:10:41.042808+00:00"
type: "documentation"
---
# Topic 08: Ứng Dụng Graphify & Kiến Trúc Knowledge Graph Cho Codebase & Hệ Thống Thuế

> **Trạng thái:** 🟡 Đang triển khai (Pha 1: Codebase Knowledge Graph)  
> **Ngày bắt đầu:** 23/09/2026  
> **Tác giả:** Antigravity Team  
> **Tham chiếu:** [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify), `GEMINI.md`, `AGENTS.md`

---

## 1. Bối Cảnh & Đặt Vấn Đề

Dự án **GDT Tax Crawler & Search Engine** (`tracuuhoadon.gdt.gov.vn`) hiện quản lý hơn **1.23 triệu mã số thuế doanh nghiệp** cùng dữ liệu bố cáo ĐKKD. Hệ thống được xây dựng trên kiến trúc đa tầng (FastAPI backend, Fastify TypeScript, C# WinForms native service manager, Vue 3 modular frontend, CSDL PostgreSQL).

Nhằm tối ưu hóa công tác phát triển cũng như nâng cao năng lực nghiệp vụ, giải pháp **Graphify (Knowledge Graph)** từ `Graphify-Labs/graphify` được nghiên cứu và áp dụng vào dự án:
1. **Quản trị Kiến trúc Codebase (Developer & AI Agent Intelligence):** Codebase tuân thủ nghiêm ngặt quy định `< 200 dòng/file` dẫn đến việc phân mảnh thành hàng chục sub-module. Graphify giúp phân tích cú pháp AST cục bộ (deterministic), dựng bản đồ phụ thuộc, phát hiện các "God nodes" và chu trình phụ thuộc vòng (circular imports).
2. **Nâng cấp Nghiệp vụ Dữ liệu Thuế (Enterprise Tax Knowledge Graph):** Chuyển dịch từ mô hình quan hệ bảng phẳng (flat rows) sang mạng lưới thực thể đồ thị (`Company`, `Person`, `Address`, `TaxOffice`, `Industry`). Điều này mở ra khả năng phát hiện doanh nghiệp "ma", chuỗi mua bán hóa đơn bất hợp pháp và người đại diện đứng tên hàng loạt công ty.

---

## 2. Kiến Trúc Giải Pháp & 2 Chiều Giá Trị

```
                       HỆ SINH THÁI GRAPHIFY TẠI GDT PROJECT
                                        │
         ┌──────────────────────────────┴──────────────────────────────┐
         ▼                                                             ▼
  [CHIỀU 1: CODEBASE GRAPH]                                     [CHIỀU 2: TAX DATA GRAPH]
  Kiến trúc & Tối ưu AI Agent                                  Mạng lưới Tình báo Doanh nghiệp
  - Deterministic AST Parser (Tree-sitter)                     - Entity: Doanh nghiệp, Người ĐDPL, Địa chỉ
  - Visual Network Graph (graph.html)                          - Edge: REPRESENTS, LOCATED_AT, OPERATES_IN
  - God Nodes & Architecture Report (GRAPH_REPORT.md)          - Phát hiện cụm DN rủi ro cao (Community Detection)
  - Obsidian Vault & Wiki articles cho AI Agent                - Trực quan hóa tương tác trên Web Dashboard
```

---

## 3. Lộ Trình Triển Khai 4 Giai Đoạn (Roadmap)

### Pha 1: Triển khai Graphify cho Codebase (Đang thực hiện)
- Cài đặt package `graphifyy` qua pip.
- Cấu hình và chạy quét toàn bộ repository để sinh bộ artifacts kiến trúc trong `graphify-out/`:
  - `graph.html`: Sơ đồ mạng lưới tương tác toàn bộ functions, classes, modules, components của hệ thống.
  - `GRAPH_REPORT.md`: Báo cáo các hub trung tâm (God nodes), phụ thuộc chéo và kiến nghị tái cấu trúc.
  - `graph.json`: Dữ liệu đồ thị lưu trữ phục vụ AI Agent tra cứu với chi phí token tối thiểu (giảm ~70x).

### Pha 2: Xây dựng Tax Graph Engine (Backend Service)
- Xây dựng module `server_app/services/tax_graph.py` trích xuất mạng lưới liên kết từ bảng `tax_records` và `bocao_records`:
  - Quan hệ Doanh nghiệp - Người đại diện pháp luật (Người đại diện đứng tên bao nhiêu DN).
  - Quan hệ Doanh nghiệp - Địa chỉ trụ sở (Bao nhiêu DN cùng chung 1 số nhà/tầng/tòa nhà).
  - Quan hệ Doanh nghiệp - Chi cục thuế / Tỉnh thành.
- Endpoint API: `GET /api/records/{tin}/network` trả về payload chuẩn đồ thị `{ nodes: [...], edges: [...] }`.

### Pha 3: Trực quan hóa Mạng lưới Doanh nghiệp trên Web Dashboard (Frontend)
- Tạo component Vue 3: `tax-graph-modal.js` hoặc tích hợp Cytoscape.js / Vis-Network.
- Người dùng khi tra cứu 1 MST có thể bấm nút **"Mạng Lưới Liên Kết"** để bung ra biểu đồ mạng nhện tương tác trực tiếp.

### Pha 4: Phân tích Tình báo Rủi ro & Cảnh báo Doanh nghiệp "Ma" (Radar / Fraud Detection)
- Áp dụng thuật toán phát hiện cộng đồng (Community Detection) và phân tích chỉ số trung tâm (Centrality).
- Cảnh báo các cá nhân đại diện bất thường và cụm doanh nghiệp giải thể / ngừng hoạt động tập trung cao.

---

## 4. Tài Liệu Kiểm Thử & Nghiệm Thu
- Nhật ký thực thi: `docs/logs/52_20260923_184500_implementation_plan.md`
- Kết quả quét kiến trúc: `graphify-out/GRAPH_REPORT.md`
