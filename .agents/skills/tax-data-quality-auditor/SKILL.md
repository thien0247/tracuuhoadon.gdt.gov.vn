---
name: tax-data-quality-auditor
description: Kiểm toán chất lượng CSDL Người Nộp Thuế (bảng tax_records và bocao_records) theo 6 chiều DMBOK (Completeness, Accuracy, Consistency, Timeliness, Validity, Uniqueness). Chấm điểm chất lượng và lập kế hoạch quét bù.
version: 1.0.0
category: verification
---

# Tax Data Quality Auditor (GDT Database)

Dùng kỹ năng này để rà soát, đánh giá và lập báo cáo chất lượng cho hơn 1.2 triệu bản ghi thuế trong PostgreSQL.

## 6 Chiều Kiểm Toán Dữ Liệu (DMBOK Dimensions)

| Chiều | Tiêu chí đánh giá tại GDT Database | Ngưỡng đạt |
|:---|:---|:---:|
| **Completeness** | Tỷ lệ bản ghi có đầy đủ `name`, `address`, `status`, `tin`, `org_type` | > 98% |
| **Validity** | Định dạng MST: 10 chữ số (doanh nghiệp) hoặc 10-3 số (chi nhánh). Ngày thành lập hợp lệ | 100% |
| **Uniqueness** | Không tồn tại MST trùng lặp trong bảng `tax_records` (`PRIMARY KEY (tin)`) | 100% |
| **Consistency** | Mã tỉnh trong MST (`tin.substring(0,2)`) khớp với địa bàn tỉnh/thành phố và `tran_dist` | > 95% |
| **Timeliness** | Độ tươi dữ liệu: MST bố cáo DKKD mới nhất được đồng bộ vào CSDL thuế trong 24h | < 24h |
| **Accuracy** | Tên pháp nhân và trạng thái hoạt động khớp với dữ liệu gốc của Tổng cục Thuế | > 99% |

## Quy Trình Thực Hiện (5 Bước)

1. **Phân tích Tổng quan:** Đếm tổng số dòng, ngày quét gần nhất, số MST theo từng tỉnh thành.
2. **Quét Ngoại Lệ (Anomaly Detection):**
   - Tìm các MST có `name` rỗng hoặc mang ký tự rác.
   - Tìm các MST có ngày thành lập bất thường (trong tương lai hoặc trước năm 1980).
   - Kiểm tra các MST có `address` không xác định.
3. **Chấm Điểm Chất Lượng (Quality Scoring):** Chấm thang điểm 1.0 - 5.0 cho từng chiều.
4. **Lập Kế Hoạch Quét Bù (Remediation Plan):**
   - Đưa các MST thiếu thông tin vào hàng đợi ưu tiên cao (`queue_manager.py`).
   - Kích hoạt chế độ `gap-filler` đối với các dải số bị gián đoạn.
5. **Thiết Lập Quy Tắc Cảnh Báo (Monitoring Gates):** Ngăn chặn việc nạp dữ liệu rác vào CSDL.

## Khung Kiểm Thử 4C Verification

| Tiêu chí | Câu hỏi kiểm tra |
|:---|:---|
| **Correctness** | Thuật toán regex và truy vấn SQL có kiểm tra đúng chuẩn MST Việt Nam không? |
| **Completeness** | Đã bao phủ toàn bộ bảng `tax_records` và bảng đối soát `bocao_records` chưa? |
| **Context-fit** | Kịch bản kiểm toán có sử dụng connection pool để tránh làm nghẽn crawler không? |
| **Consequence** | Dữ liệu sai lệch có ảnh hưởng tới chức năng xuất báo cáo thuế hoặc tra cứu không? |
