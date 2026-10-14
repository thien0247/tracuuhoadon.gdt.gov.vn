---
id: "01M4V0FH0MEFCTM2A5NWQE870T"
aliases:
  - "topic-09-codexkit-agent-skills-integration"
  - "topic-09-codexkit-agent-skills-integration.md"
created_at: "2026-10-13T16:10:41.044969+00:00"
type: "documentation"
---
# Topic 09: Tích Hợp Hệ Thống Kỹ Năng, Tiêu Chuẩn & Kiểm Toán Dữ Liệu CodexKit

> **Trạng thái:** ✅ Đã hoàn thành (3 Pha toàn diện)  
> **Ngày bắt đầu:** 24/09/2026  
> **Tác giả:** Antigravity Team  
> **Tham chiếu:** [hoavdc/CodexKit](https://github.com/hoavdc/CodexKit), `GEMINI.md`, `AGENTS.md`

---

## 1. Bối Cảnh & Mục Tiêu

Kho lưu trữ mã nguồn mở **CodexKit** (`hoavdc/CodexKit`) cung cấp một bộ công cụ vận hành toàn diện cho các AI Coding Agent (OpenAI Codex, Claude, Antigravity) với 90 kỹ năng, các kịch bản phản ứng nhanh (Playbooks) và công thức tự động hóa (Automations).

Nhằm nâng cao năng lực tự động hóa, tính chuẩn mực của mã nguồn và độ tin cậy của dữ liệu cho dự án **GDT Tax Crawler & Search Engine**, dự án đã triển khai tích hợp có chọn lọc theo lộ trình 3 pha:
1. **Pha 1:** Tiếp thu và chuẩn hóa 3 Agent Skills kỹ thuật cốt lõi vào `.agents/skills/`.
2. **Pha 2:** Xây dựng công cụ kiểm toán chất lượng dữ liệu 6 chiều DMBOK trên gần 7 triệu bản ghi CSDL thuế (`tax_records`).
3. **Pha 3:** Tích hợp mô hình nghiệm thu 4C Verification Model và bộ Playbook chuẩn sản xuất.

---

## 2. Kiến Trúc Tích Hợp

```
                                HỆ SINH THÁI CODEXKIT TẠI GDT
                                              │
          ┌───────────────────────────────────┼───────────────────────────────────┐
          ▼                                   ▼                                   ▼
   [PHA 1: AGENT SKILLS]             [PHA 2: DMBOK AUDIT]                [PHA 3: SRE PLAYBOOKS]
- tax-data-quality-auditor         - scripts/audit_tax_data_quality.py   - docs/playbooks/debug_production.md
- gdt-test-hardening               - 6 chiều DMBOK (6.9M+ bản ghi)       - docs/playbooks/code_implement.md
- crawler-incident-postmortem      - Xuất docs/data_quality_report.md    - Mô hình nghiệm thu 4C Verification
```

---

## 3. Chi Tiết Các Hạng Mục Đã Triển Khai

### 3.1. Bộ Kỹ Năng Kỹ Thuật (.agents/skills/)
- **`tax-data-quality-auditor`:** Kiểm toán chất lượng CSDL Người Nộp Thuế theo 6 chiều DMBOK (*Completeness, Accuracy, Consistency, Timeliness, Validity, Uniqueness*).
- **`gdt-test-hardening`:** Tăng cường độ tin cậy kiểm thử cho Circuit Breaker, WAF rate limiter, Rolling Queue và Captcha Worker Pool.
- **`crawler-incident-postmortem`:** Chuẩn hóa quy trình 5 bước ứng phó sự cố (WAF 403, lỗi Captcha, sập dịch vụ Windows).

### 3.2. Công Cụ Kiểm Toán Dữ Liệu Thực Tế (`scripts/audit_tax_data_quality.py`)
- Kiểm toán toàn bộ **6,914,018 bản ghi thuế** và **412 bản ghi bố cáo DKKD**:
  - **Điểm chất lượng tổng thể:** ⭐ **4.8 / 5.0**.
  - Không có MST sai định dạng (0 lỗi format regex).
  - Không có MST trùng lặp (Uniqueness đạt 100% nhờ khóa chính `tin`).
  - Báo cáo chi tiết được tự động kết xuất ra `docs/data_quality_report.md`.

### 3.3. Bộ Playbooks & Mô Hình Nghiệm Thu 4C Verification
- **`debug_production.md`:** Kịch bản 6 bước điều tra lỗi production (Observed vs Expected -> Failure Boundary -> Reproduction -> Root Cause -> Fix Strategy -> Verification Plan).
- **`code_implement.md`:** Quy chuẩn triển khai mã nguồn tối thiểu ("Change the minimum credible surface", < 200 dòng/file).
- **Mô hình 4C Verification:** Tích hợp 4 câu hỏi định lượng (*Correctness, Completeness, Context-fit, Consequence*) vào tài liệu `gdt-testing` và `walkthrough.md`.

---

## 4. Bằng Chứng Nghiệm Thu & Kiểm Thử
- **Line Limit Check:** Toàn bộ các file mới và sửa đổi đều tuân thủ nghiêm ngặt `< 200 dòng/file`.
- **Modular Regression:** `python test_modular.py` vượt qua 100% (32 files OK, tất cả API hoạt động chuẩn).
- **Database Query:** Script kiểm toán chạy an toàn qua Connection Pool trong 27 giây trên gần 7 triệu bản ghi mà không làm nghẽn hệ thống.
