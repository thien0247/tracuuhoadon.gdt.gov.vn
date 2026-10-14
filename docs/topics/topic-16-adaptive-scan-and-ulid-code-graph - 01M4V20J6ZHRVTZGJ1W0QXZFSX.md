---
id: "01M4V20J6ZHRVTZGJ1W0QXZFSX"
title: "Topic 16: Adaptive Dynamic Probe Scan Algorithm & ULID Bi-directional Knowledge Graph"
category: architecture
status: completed
created_at: "2026-10-13T23:35:00+07:00"
updated_at: "2026-10-13T23:45:00+07:00"
author: Antigravity Agent
  - 01M4V19Z0K6Z8G49K5X33Y36C5
related_code:
  - 01M4V0HMQ84SWGPZADDW1P3GNA
---
# Topic 16: Cải Tiến Giải Thuật Scan & Mạng Lưới Quan Hệ Bất Biến Code ↔ Docs

## 1. Bối Cảnh & Đánh Giá 5 Giải Thuật Scan Hiện Hữu

Hệ thống crawler của Tổng cục Thuế (`tracuuhoadon.gdt.gov.vn`) vận hành trên 5 giải thuật chính:
1. **Quét Mới Nhất (`newest`):** Quét tịnh tiến UP (+1) từ đỉnh động `max_tin`.
2. **Quét Hai Chiều (`bidirectional`):** Xuất phát từ `seed_tin`, quét đồng thời cả UP (+) và DOWN (-).
3. **Quét Bù Bố Cáo (`gap_fill`):** Quét các MST phát hiện từ Cổng thông tin ĐKKD Quốc gia nhưng chưa có trong GDT.
4. **Quét Vá Lỗ Hổng 500 (`gap_fill_500`):** Tự động phát hiện và vá dải trống $\le 500$ mã chưa được lưu trong CSDL.
5. **Quét Biên (`edges`):** Quét mở rộng từ `min_tin` và `max_tin` hiện có trong CSDL.

## 2. Điểm Nghẽn False Stop & Giải Thuật Adaptive Dynamic Probe

### 2.1. Hiện Tượng False Stop (Dừng Ảo Do Dải Số Nhảy Cóc)
- Trong giải thuật `newest`, hệ thống dừng luồng khi gặp `effective_gap = gap * workers` (thường là 20 MST liên tiếp rỗng).
- Tuy nhiên, Tổng cục Thuế phân bổ các lô MST cho các Chi cục Thuế quận/huyện khác nhau. Một quận kết thúc dải số có thể để lại khoảng trống 30 – 50 số trước khi quận tiếp theo bắt đầu.
- Hậu quả: Crawler gặp 20 số rỗng và dừng sớm, bỏ sót toàn bộ các doanh nghiệp mới thành lập ở lô số kế tiếp!

### 2.2. Cơ Chế Thăm Dò Adaptive Dynamic Probe
Khi chạm ngưỡng 20 rỗng ở chiều tăng UP, `CrawlerEngine` chưa vội dừng luồng mà kích hoạt cơ chế Probe Jump:
1. Tính toán điểm thăm dò tại `+50` và `+100` số cơ sở bằng hàm `get_probe_tin(current_tin, offset, prefix)`.
2. Truy vấn thử nghiệm với nhãn `UP-PROBE`.
3. Nếu phát hiện có MST tồn tại: Reset `consecutive_empty = 0`, ghi log thông báo phát hiện dải số nhảy cóc và tiếp tục quét.
4. Chỉ khi cả 2 điểm probe đều không tồn tại MST: Xác nhận đã chạm đỉnh thực tế và an toàn kết thúc luồng.

```
[Chạm 20 Rỗng] ---> Probe Jump (+50) ---> [Có MST?] --(Có)--> [Tiếp tục Quét]
                          |
                       (Không)
                          v
                    Probe Jump (+100) ---> [Có MST?] --(Có)--> [Tiếp tục Quét]
                          |
                       (Không)
                          v
                    [DỪNG LUỒNG: Thực sự hết đỉnh]
```

## 3. Chuẩn Liên Kết Hai Chiều Code ↔ Code & Code ↔ Docs Bằng ULID

Nhằm tạo ra một mạng lưới tri thức bất biến và hỗ trợ AI Agent nắm bắt ngữ cảnh tức thì:
- **Dòng 1 File Code:** Khai báo `@id <ULID>` định danh duy nhất của tệp.
- **Dòng 2 File Code:** Khai báo `@related <ULID_CODE_1>, <ULID_DOCS_1>, ...` liên kết trực tiếp tới các component, service, router phụ thuộc và tài liệu giải trình kỹ thuật.
- **Frontmatter File Docs:** Khai báo `related_code: [<ULID_1>, <ULID_2>, ...]` liên kết ngược lại toàn bộ các module triển khai thực tế.
- **Tính Toàn Vẹn Tuyệt Đối:** Được kiểm toán bằng `scripts/audit_code_graph.py` với cam kết 0 broken links và tuân thủ giới hạn $\le 180$ dòng code theo `GEMINI.md`.
