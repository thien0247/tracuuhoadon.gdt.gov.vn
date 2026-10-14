# Kế Hoạch Triển Khai: Tái Cấu Trúc Toàn Diện Kiến Trúc Hệ Thống (System Architecture Redesign)

> **Mã số:** Log 43 | **Thời gian:** 2026-09-22 11:20:00 | **Trạng thái:** ✅ Đã phê duyệt

---

## 1. Mục Tiêu & Phạm Vi

1. **Lưu trữ nhật ký & Tài liệu Topic:** Soạn thảo Topic 07 và cập nhật Index theo chuẩn Rule 5 & Rule 6 trong `GEMINI.md`.
2. **Dọn dẹp Workspace & Cô lập nợ kỹ thuật:** Di chuyển các tệp SQLite cũ (~116MB), CSV tạm và script refactor 1 lần vào thư mục `archive/`.
3. **Nâng cấp CSDL PostgreSQL 10M+:**
   - Kích hoạt extension `pg_trgm`.
   - Tạo Partial Index cho bảng `bocao_records` (`idx_bocao_records_unmatched`).
   - Tạo GIN Trigram Index cho `norm_name` trên bảng `tax_records` để tìm kiếm mờ siêu tốc.
   - Tạo B-Tree index cho `regi_date` để lọc thời gian cực nhanh.
   - Tạo bảng `crawler_jobs` hỗ trợ hàng đợi bền bỉ (Persistent State).
4. **Kiểm thử toàn vẹn:** Xác thực 100% tệp Python/TypeScript ≤ 200 dòng và vượt qua `test_modular.py`.
