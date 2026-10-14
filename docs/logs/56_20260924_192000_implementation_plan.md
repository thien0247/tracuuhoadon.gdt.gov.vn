# Kế Hoạch Triển Khai: Tích Hợp Hệ Thống Kỹ Năng & Tiêu Chuẩn CodexKit (Topic 09)

## 1. Mục Tiêu & Phạm Vi
Tiếp thu có chọn lọc các tinh hoa từ bộ công cụ [hoavdc/CodexKit](https://github.com/hoavdc/CodexKit) vào hệ thống **GDT Tax Crawler & Search Engine** (`tracuuhoadon.gdt.gov.vn`):
- Chuẩn hóa các Agent Skills theo cấu trúc `.agents/skills/`.
- Xây dựng công cụ kiểm soát chất lượng dữ liệu 1.23M+ bản ghi thuế theo 6 chiều DMBOK.
- Tích hợp mô hình nghiệm thu 4C Verification Model và bộ Playbook vận hành sản xuất.

---

## 2. Kế Hoạch 3 Pha Chi Tiết

### Pha 1: Chọn Lọc & Việt Hóa Bộ Kỹ Năng Kỹ Thuật (Agent Skills)
- Tạo `.agents/skills/tax-data-quality-auditor/SKILL.md`: Kiểm toán chất lượng CSDL thuế theo 6 chiều DMBOK (*Completeness, Accuracy, Consistency, Timeliness, Validity, Uniqueness*).
- Tạo `.agents/skills/gdt-test-hardening/SKILL.md`: Tăng cường độ tin cậy của bộ kiểm thử tự động, tập trung vào WAF F5, Circuit Breaker, Rolling Queue và Captcha Pool.
- Tạo `.agents/skills/crawler-incident-postmortem/SKILL.md`: Chuẩn hóa biên bản và quy trình xử lý sự cố khi bị WAF chặn IP ("Request Rejected"), lỗi Captcha hoặc treo dịch vụ.

### Pha 2: Xây Dựng Công Cụ Kiểm Toán Dữ Liệu Thực Tế (Data Quality Audit Tool)
- Viết kịch bản `scripts/audit_tax_data_quality.py` (< 200 dòng, tuân thủ `GEMINI.md`).
- Kết nối CSDL PostgreSQL qua Connection Pool để kiểm toán bảng `tax_records` (1,234,743 dòng) và `bocao_records`.
- Xuất báo cáo điểm chất lượng và danh sách ngoại lệ ra `docs/data_quality_report.md`.

### Pha 3: Tích Hợp Playbook Vận Hành Sản Xuất & Mô Hình 4C Verification
- Tạo thư mục `docs/playbooks/` chứa:
  - `debug_production.md`: Quy trình 6 bước ứng phó sự cố khẩn cấp trên Production.
  - `code_implement.md`: Quy chuẩn triển khai mã nguồn tối thiểu, an toàn WAF và kiểm thử ngay.
- Cập nhật `.agents/skills/gdt-testing/SKILL.md` tích hợp khung đánh giá 4C Verification (Correctness, Completeness, Context-fit, Consequence).
- Tạo tài liệu Topic 09 tại `docs/topics/topic-09-codexkit-agent-skills-integration.md` và cập nhật `docs/TOPICS.md`.
- Chạy `python test_modular.py` và `graphify update .` để đồng bộ toàn bộ hệ thống.

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. Cả 3 Skills mới trong `.agents/skills/` tuân thủ đúng chuẩn YAML frontmatter, 4C check và < 200 dòng.
2. Script `scripts/audit_tax_data_quality.py` chạy thành công trên 1.23M+ bản ghi, tạo báo cáo cụ thể.
3. Toàn bộ các file mới và chỉnh sửa đều tuân thủ `GEMINI.md` (< 200 dòng/file).
4. `python test_modular.py` vượt qua 100% các bài test và API.
5. Nhật ký và Topic được ghi nhận đầy đủ trong `docs/TOPICS.md` và `docs/logs/INDEX.md`.
