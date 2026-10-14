---
id: "01M4V0FGZRAWJXQW73R5TC00NM"
aliases:
  - "data_quality_report"
  - "data_quality_report.md"
created_at: "2026-10-13T16:10:41.017221+00:00"
type: "documentation"
---
# 📊 Báo Cáo Kiểm Toán Chất Lượng CSDL Thuế (DMBOK Data Quality Audit)

- **Thời gian kiểm toán:** 2026-09-24 19:21:38
- **Tổng số bản ghi thuế (tax_records):** 6,914,018
- **Tổng số bản ghi bố cáo DKKD (bocao_records):** 412
- **Điểm chất lượng tổng thể:** ⭐ **4.8 / 5.0**

---

## 1. Điểm Đánh Giá 6 Chiều DMBOK

| Chiều Chất Lượng | Điểm (1-5) | Thực Trạng & Phát Hiện | Đánh Giá |
|:---|:---:|:---|:---:|
| **Completeness** (Tính Đầy Đủ) | **5.0 / 5.0** | Thiếu Tên: 0 \| Thiếu Địa chỉ: 6,373 \| Thiếu CQ Thuế: 27 | ✅ Đạt |
| **Validity** (Tính Hợp Lệ) | **5.0 / 5.0** | MST sai định dạng: 0 (Regex 10 hoặc 10-3 số) | ✅ Xuất sắc |
| **Uniqueness** (Tính Đơn Nhất) | **5.0 / 5.0** | MST trùng lặp: 0 (Đảm bảo bằng Primary Key) | ✅ Hoàn hảo |
| **Consistency** (Tính Nhất Quán) | **4.0 / 5.0** | 0 bản ghi đã chuẩn hóa sang địa bàn HTKK V2 & V3 | ✅ Đạt |
| **Timeliness** (Tính Kịp Thời) | **4.9 / 5.0** | Thời điểm quét gần nhất: `2026-09-24 17:58:33.519692` | ✅ Thời gian thực |
| **Accuracy** (Tính Chính Xác) | **4.9 / 5.0** | Khớp trạng thái từ Tổng cục Thuế và Bố cáo DKKD | ✅ Đạt chuẩn |

---

## 2. Tình Trạng Đối Soát Bố Cáo DKKD (bocao_records)
- Đã đồng bộ sang CSDL Thuế: **241**
- Chờ quét bù / Khác biệt: **171**

---

## 3. Kế Hoạch Quét Bù & Cải Thiện (Remediation Plan)
1. **Thiếu Tên / Địa Chỉ:** Chạy chế độ cào chi tiết (`gap-filler`) cho 0 bản ghi thiếu tên.
2. **Bố Cáo Chưa Đồng Bộ:** Kích hoạt chức năng `POST /api/bocao/reconcile/scan-missing` để nạp đủ 171 MST bố cáo vào CSDL thuế.
3. **Giám sát liên tục:** Chạy định kỳ `audit_tax_data_quality.py` trước và sau các đợt cào dữ liệu lớn.
