---
id: "01M4V0FGZX2RGA2WBB5EMZJ0Z8"
aliases:
  - "LAYOUT_AND_HEALTH_REPORT_SPEC"
  - "LAYOUT_AND_HEALTH_REPORT_SPEC.md"
created_at: "2026-10-13T16:10:41.022382+00:00"
type: "documentation"
---
# ĐẶC TẢ NGHIỆP VỤ & KỸ THUẬT: BỐ CỤC 2 CỘT & BÁO CÁO SỨC KHỎE CRAWLER (03 NGÀY)

Tài liệu này chuẩn hóa toàn bộ yêu cầu nghiệp vụ, cấu trúc dữ liệu và kiến trúc triển khai cho tính năng **Bố cục Web 2 Cột (Left Sidebar + Main Content)** và **Báo Cáo Sức Khỏe Crawler & Recency 03 Ngày (TIN Max & Ngày Đăng Ký Mới Nhất)** trong hệ thống Vét Cạn Mã Số Thuế GDT.

---

## 1. Chuẩn Hóa Yêu Cầu Nghiệp Vụ

### A. Lý do & Mục tiêu
1. **Tối ưu không gian làm việc (2-Column Layout):**
   - Chuyển đổi từ thanh tab ngang chiếm diện tích cuộn dọc sang thanh điều hướng bên trái (Left Sidebar) cố định.
   - Tích hợp toàn bộ cụm điều khiển vận hành tổng thể (Quét Newest, Start/Stop All, Chọn số luồng song song, Live SSE status) vào Sidebar để luôn sẵn sàng thao tác ở bất kỳ tab nào.
   - Khung nội dung chính (Main Content) dành trọn vẹn cho bảng dữ liệu, biểu đồ chỉ số và console log.
2. **Giám sát sức khỏe Crawler trong phạm vi 03 ngày (Recency Health Monitor):**
   - Hàng ngày, mỗi tỉnh thành đều có doanh nghiệp mới thành lập và được cấp MST mới (thể hiện qua trường `regi_date`).
   - Nếu trong CSDL, một tỉnh có Ngày Đăng Ký Mới Nhất (`max_regi_date`) cách đây **quá 3 ngày**, hoặc số MST mới phát sinh trong 3 ngày qua bằng 0:
     $\rightarrow$ Hệ thống cảnh báo: **"Có thể có vấn đề trong tiến trình crawl của tỉnh này"** (ví dụ: bị dừng luồng sớm, kẹt CAPTCHA, seed TIN sai dải số, hoặc WAF chặn ngầm).

---

## 2. Tiêu Chí Phân Loại Sức Khỏe Crawler Của Tỉnh Thành

Hệ thống tự động tính toán số ngày chênh lệch từ ngày đăng ký mới nhất so với hiện tại (`days_diff = CURRENT_DATE - max_regi_date`) và phân loại theo 3 cấp độ:

| Trạng Thái Sức Khỏe | Điều Kiện Nhận Diện | Ý Nghĩa Thực Tế | Hành Động Khuyến Nghị |
| :--- | :--- | :--- | :--- |
| 🟢 **Bình thường (Healthy)** | `days_diff <= 3` ngày VÀ có MST mới trong 3 ngày | Dữ liệu cập nhật liên tục, crawler bám sát tiến độ đăng ký của Sở KH&ĐT / Cục Thuế. | Không cần can thiệp. |
| 🟡 **Cảnh báo (Warning)** | `3 < days_diff <= 7` ngày | Đã 4 đến 7 ngày chưa phát sinh MST mới trong CSDL. Có thể do địa phương ít doanh nghiệp thành lập mới hoặc crawler quét chưa tới dải số mới. | Nên bấm nút **`⚡ Quét TIN Max`** để kiểm tra bù. |
| 🔴 **Nguy cơ lỗi cào (Stalled / Error)** | `days_diff > 7` ngày HOẶC chưa có dữ liệu | Đã hơn 1 tuần không có MST mới. Gần như chắc chắn tiến trình crawler bị kẹt, seed TIN bị lệch hoặc WAF F5 ngắt luồng. | **Báo động đỏ:** Cần kiểm tra lại seed TIN và kích hoạt quét khẩn cấp. |

---

## 3. Thiết Kế API Backend: `GET /api/reports/crawler-health`

### Thông số truy vấn & hiệu năng
- Endpoint: `GET /api/reports/crawler-health?days=3`
- Tận dụng chỉ mục có sẵn `idx_tax_regi_date` trên PostgreSQL để thực hiện quét Bitmap Index Scan trong **< 10 mili-giây**, không làm ảnh hưởng đến hiệu năng các worker crawler đang chạy.

### Cấu trúc phản hồi JSON
```json
{
  "total_provinces": 62,
  "summary": {
    "healthy": 48,
    "warning": 10,
    "stalled": 4
  },
  "records": [
    {
      "province_name": "Đắk Lắk",
      "prefix": "60",
      "tin_max": "6001846597",
      "max_regi_date": "2026-09-11 00:00:00",
      "days_since_last_regi": 2,
      "new_records_in_range": 44,
      "latest_scraped_at": "2026-09-13 01:17:04",
      "health_status": "healthy"
    }
  ]
}
```

---

## 4. Thiết Kế Giao Diện Người Dùng (UI/UX)

### A. Layout 2 cột
- **Left Sidebar (`aside`):**
  - Brand header với icon định danh hệ thống.
  - Badge trạng thái SSE Live Connection.
  - Menu điều hướng dọc gồm 5 mục:
    1. 🚀 Quản Lý Quét Đa Tỉnh (`scan`)
    2. 📊 Báo Cáo Sức Khỏe 3 Ngày (`health_report`)
    3. 📅 Lọc & Xuất Dữ Liệu (`filter`)
    4. 🔍 Tra Cứu MST (`search`)
    5. ⚙️ Cấu Hình Tỉnh Thành (`config`)
  - Quick Controls widget: Nút "Quét MST Mới Toàn Bộ", nút "Start All", "Stop All", bộ chọn số tỉnh song song.
- **Main Content (`main`):**
  - Master Metrics Overview Bar (5 thẻ chỉ số: Tốc độ quét, Số tỉnh đang chạy, Tổng đã quét, Tổng tìm thấy, Tổng DB).
  - Vùng hiển thị tương ứng với tab được chọn.

### B. Component `health-report-tab.js`
- 4 thẻ thống kê tóm tắt nhanh (Click để lọc tức thì theo trạng thái):
  - 🏢 Tổng Số Tỉnh Thành (62 tỉnh)
  - 🟢 Tỉnh Khỏe Mạnh (Cập nhật $\le$ 3 ngày)
  - 🟡 Tỉnh Cần Lưu Ý (4 – 7 ngày)
  - 🔴 Tỉnh Nguy Cơ Lỗi Cào (> 7 ngày)
- **Hệ thống Bộ Lọc Nâng Cao (Advanced Filters):**
  - **Ô tìm kiếm tức thời:** Tra cứu trực tiếp theo tên tỉnh thành hoặc mã tiền tố (hỗ trợ tiếng Việt).
  - **Bộ lọc trạng thái (Pills):** Tất Cả / Bình Thường / Chú Ý / Tắc Nghẽn.
  - **Bộ lọc phát sinh MST:** Lọc riêng tỉnh có MST mới (`> 0`) hoặc chưa có MST mới (`= 0`).
  - **Bộ sắp xếp đa tiêu chí:**
    - ⏳ Ngày trễ nhất lên đầu (Ưu tiên cào bù)
    - 🔥 Nhiều MST mới nhất (Tỉnh sôi động nhất)
    - 🔢 Mã tiền tố (01 $\rightarrow$ 99)
    - 🔤 Tên tỉnh (A $\rightarrow$ Z)
  - **Nút "✕ Xóa lọc":** Tự động xuất hiện khi có bộ lọc hoạt động, khôi phục bảng về mặc định một chạm.
  - **Dòng đếm kết quả:** Hiển thị số lượng tỉnh sau khi lọc (e.g., `Hiển thị 60 / 62 tỉnh thành`).
- **Bảng hiển thị thông tin chi tiết:**
  - Cột Tỉnh Thành, Tiền tố, TIN Max hiện tại.
  - Cột Ngày Đăng Ký Mới Nhất kèm nhãn khoảng cách ngày (`X ngày trước`).
  - Cột Số MST mới (3 ngày).
  - Cột Trạng Thái Sức Khỏe với badge màu sắc trực quan.
  - Cột Thao Tác: Nút **`⚡ Quét TIN Max`** giúp người dùng bấm một chạm là crawler bắt đầu quét bù ngay cho tỉnh đó.

