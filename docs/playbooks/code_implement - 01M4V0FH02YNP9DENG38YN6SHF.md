---
id: "01M4V0FH02YNP9DENG38YN6SHF"
aliases:
  - "code_implement"
  - "code_implement.md"
created_at: "2026-10-13T16:10:41.027511+00:00"
type: "documentation"
---
# 🚀 Playbook: Triển Khai Mã Nguồn Chuẩn Sản Xuất (Code Implement Playbook)

> Áp dụng theo chuẩn CodexKit Playbooks kết hợp quy chuẩn GEMINI.md & AGENTS.md.

## Mẫu Điều Hướng Prompt Dành Cho AI Agent

```text
Triển khai tác vụ dưới tư duy kỹ sư phần mềm sản xuất (Production Mindset).

Quy tắc bất biến:
- Kiểm tra toàn bộ ngữ cảnh repo trước khi sửa đổi (Read before write).
- Can thiệp tối thiểu vào bề mặt mã nguồn (Change the minimum credible surface).
- Giữ hành vi phía người dùng tường minh, không làm biến mất tính năng cũ.
- Tuyệt đối tuân thủ giới hạn dòng: < 200 dòng/file (Hard cap: 250 dòng).
- Bắt buộc dùng Connection Pool và an toàn rate limit WAF.
- Chạy bài kiểm tra xác thực ngay lập tức trước khi bàn giao.

Kết quả trả về:
1. Những gì đã thay đổi (What changed)
2. Danh sách file can thiệp (Files touched & Line count)
3. Kết quả kiểm tra xác thực (Verification run: test_modular.py, API status)
4. Rủi ro còn lại (Remaining risks)

Nhiệm vụ:
[Dán yêu cầu tính năng / module cần tạo hoặc refactor]
```

## Checklist Tự Động Trước Khi Bàn Giao (Definition of Done)
- [ ] Số dòng từng file < 200 dòng (chạy `python test_modular.py`).
- [ ] Không có kiểu dữ liệu `any` trong TypeScript (`npx tsc --noEmit`).
- [ ] Đã cập nhật `implementation_plan.md`, `walkthrough.md` và lưu vào `docs/logs/`.
- [ ] Cập nhật bảng mục lục `docs/logs/INDEX.md` và `docs/TOPICS.md`.
- [ ] Đồng bộ đồ thị tri thức mã nguồn: `graphify update .`.
