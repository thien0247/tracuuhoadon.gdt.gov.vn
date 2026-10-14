# KẾ HOẠCH TRIỂN KHAI: TÍCH HỢP GRAPHIFY & PHA 1 (CODEBASE KNOWLEDGE GRAPH)
**Mã tài liệu:** `52_20260923_184500_implementation_plan`  
**Ngày lập:** 23/09/2026  
**Trạng thái:** ✅ Đã phê duyệt (Thực thi ngay)

---

## 1. MỤC TIÊU
1. Lưu báo cáo phân tích toàn diện về `Graphify-Labs/graphify` và ứng dụng cho dự án vào `docs/topics/topic-08-graphify-knowledge-graph-integration.md` và đăng ký vào `docs/TOPICS.md`.
2. Triển khai **Pha 1**: Xây dựng Knowledge Graph cho Codebase của hệ thống:
   - Cài đặt `graphifyy` qua pip (hỗ trợ Tree-sitter cho Python, C#, TypeScript, JavaScript, SQL).
   - Thiết lập `.graphifyignore` để loại bỏ các thư viện `node_modules`, `dist`, `__pycache__`, dữ liệu ảnh CAPTCHA, models.
   - Chạy trích xuất AST (`graphify extract . --code-only`) để xây dựng `graphify-out/graph.json` và `.graphify_analysis.json`.
   - Sinh giao diện web tương tác `graphify-out/graph.html` và cây phân cấp `graphify-out/GRAPH_TREE.html`.
   - Sinh báo cáo kiểm định kiến trúc `graphify-out/GRAPH_REPORT.md` (God nodes, Surprising connections, Import cycles).
   - Tích hợp Graphify skill cho Google Antigravity (`.agents/rules/graphify.md`, `.agents/workflows/graphify.md`).
3. Chạy `python test_modular.py` đảm bảo không có bất kỳ xung đột hay vi phạm quy chuẩn code nào.
