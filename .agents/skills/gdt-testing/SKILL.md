---
name: gdt-testing
description: >-
  Testing and visual verification standards for GDT Tax Crawler & Search Engine.
  Use when running line limit checks, TypeScript compilation checks, API regression tests,
  data quality audits, or preparing walkthrough documentation with the 4C Verification Model.
---

# GDT Tax Crawler — Testing & Verification Guide

Quy chuẩn kiểm thử và nghiệm thu bắt buộc trước khi bàn giao bất kỳ tính năng nào.

---

## 1. Kiểm Thử Tự Động (Automated Testing)

### 1.1. Kiểm Tra Giới Hạn Dòng Code (< 200 dòng) & API Regression
```bash
# Python modular check & API regression
python test_modular.py

# TypeScript modular check & type check
npx tsc --noEmit
```

### 1.2. Kiểm Toán Chất Lượng CSDL Thuế (DMBOK 6 Chiều)
```bash
# Rà soát 6.9M+ bản ghi tax_records và bocao_records
python scripts/audit_tax_data_quality.py
```

---

## 2. Kiểm Thử Giao Diện & Visual Verification

1. Mở Web Dashboard trên trình duyệt: `http://localhost:8123` (Fastify) hoặc `http://localhost:8000` (FastAPI).
2. Xác nhận các phân hệ giao diện hoạt động:
   - **Tab Tra cứu & Chi tiết:** Modal MST, DKKD Solr info.
   - **Tab Lọc Doanh Nghiệp:** Combobox search, lọc HTKK V2/V3, xuất Excel/CSV.
   - **Tab Bố Cáo DKKD:** Đối soát MST, tự động cào và quét bù vào thuế.
   - **Tab Crawler:** Rolling Queue pool, lịch sử quét, gap-filler.
   - **Tab Graphify:** Mạng lưới tương tác, sơ đồ cây D3 và báo cáo tri thức.

---

## 3. Khung Nghiệm Thu 4C Verification Model (CodexKit Standard)

Áp dụng đánh giá 4 câu hỏi trước khi hoàn tất `walkthrough.md`:

| Tiêu chí (4C) | Câu hỏi kiểm tra bắt buộc |
|:---|:---|
| **1. Correctness** (Tính Đúng Đắn) | Mã nguồn có tuân thủ 100% quy chuẩn < 200 dòng/file, connection pool và zero `any`? |
| **2. Completeness** (Tính Toàn Diện) | Đã kiểm thử đầy đủ API, Web UI, cơ sở dữ liệu PostgreSQL và tiến trình Windows Service chưa? |
| **3. Context-fit** (Phù Hợp Ngữ Cảnh) | Các tham số tốc độ cào có an toàn trước WAF F5 và giới hạn RPS của Tổng cục Thuế không? |
| **4. Consequence** (Đánh Giá Hậu Quả) | Nếu phát sinh ngoại lệ đột ngột, Circuit Breaker và cơ chế Retry có bảo vệ dữ liệu không bị thất thoát? |
