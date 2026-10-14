# Kế Hoạch Triển Khai: Tái Thiết Kế Menu Điều Hướng Theo Nhóm (Phương Án A)

> **Mã số:** Log 45 | **Thời gian:** 2026-09-22 11:45:00 | **Trạng thái:** ✅ Đã phê duyệt

---

## 1. Mục Tiêu

Chuyển đổi thanh điều hướng Sidebar từ danh sách phẳng 8 mục rời rạc sang **3 nhóm chức năng logic rõ ràng** (Phương án A):
1. **Vét Cạn & Giám Sát:**
   - 📊 Quản Lý Quét Đa Tỉnh (`scan`)
   - 🩺 Giám Sát Sức Khỏe (`health_report`)
   - ⚙️ Cấu Hình Tỉnh Thành (`config`)
2. **Bố Cáo & Đối Soát:**
   - 📰 Bố Cáo ĐKKD Mới Nhất (`bocao`)
   - ⚖️ Đối Soát Bố Cáo & Thuế (`bocao_reconcile`)
3. **Tra Cứu & Khai Thác:**
   - 🔍 Tra Cứu Doanh Nghiệp (`search`)
   - 📅 Lọc & Xuất Dữ Liệu (`filter`)
   - ✨ Làm Giàu Thuộc Tính (`enrichment`)

---

## 2. Tiêu Chí Kỹ Thuật

- Phân nhóm trực quan với tiêu đề in hoa nhỏ (`text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider`).
- Có đường phân cách mỏng (`border-t border-[var(--border-color)]`) giữa các nhóm.
- Tương thích hoàn hảo với chế độ Sidebar thu gọn (`isSidebarCollapsed`).
- Giữ vững Smart Badges cho `health_report` (số lượng tỉnh stalled).
- Kiểm soát độ dài file `templates/index.html` nghiêm ngặt ≤ 220 dòng theo `GEMINI.md`.
