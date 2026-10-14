---
name: crawler-incident-postmortem
description: Chuẩn hóa biên bản và quy trình điều tra sự cố vận hành cho GDT Tax Crawler, Windows Service và CSDL PostgreSQL khi gặp hiện tượng WAF block IP, sập luồng, hoặc nghẽn hàng đợi.
version: 1.0.0
category: operations
---

# Crawler Incident Postmortem

Sử dụng kỹ năng này khi hệ thống gặp sự cố gián đoạn dịch vụ cào dữ liệu, bị WAF F5 khóa địa chỉ IP, tràn kết nối CSDL hoặc dịch vụ Windows Service `GDTTaxCrawler` bị dừng đột ngột.

## Quy Trình 5 Bước Điều Tra Sự Cố (5-Step Protocol)

1. **Khoanh Vùng & Ứng Cứu Khẩn Cấp (Triage & Containment):**
   - Kiểm tra trạng thái Windows Service: `sc query GDTTaxCrawler` hoặc `service.bat status`.
   - Kiểm tra log Circuit Breaker: Xem có thông báo `[CIRCUIT BREAKER] State changed to OPEN` không.
   - Nếu bị WAF F5 chặn: Lập tức tạm dừng các worker, tăng cooldown time hoặc đổi IP proxy.
2. **Thu Thập Bằng Chứng (Evidence Gathering):**
   - Đọc 50 dòng log cuối cùng trong `logs/crawler.log` hoặc `logs/service.log`.
   - Kiểm tra số lượng kết nối đang hoạt động tới PostgreSQL: `SELECT count(*) FROM pg_stat_activity`.
   - Đo tỷ lệ giải CAPTCHA thành công trong 15 phút gần nhất.
3. **Phân Tích Nguyên Nhân Gốc (Root Cause Analysis - 5 Whys):**
   - Xác định điểm vỡ đầu tiên (Failure boundary): Lỗi từ mạng ngoài, bộ giải Captcha, hay CSDL cục bộ?
4. **Kế Hoạch Khắc Phục & Ngăn Ngừa (Remediation & Action Items):**
   - Biện pháp khắc phục tức thì (Immediate Fix).
   - Biện pháp phòng ngừa dài hạn (Long-term Prevention).
5. **Lưu Trữ Biên Bản Sự Cố:** Lưu vào `docs/postmortems/YYYY-MM-DD-<tên-su-co>.md`.

## Biểu Mẫu Biên Bản Sự Cố (Postmortem Template)

```markdown
# Incident Postmortem: [Tên Sự Cố]
- **Thời gian diễn ra:** YYYY-MM-DD HH:MM -> HH:MM (Thời gian gián đoạn: X phút)
- **Mức độ nghiêm trọng:** P1 (Chặn toàn bộ hệ thống) / P2 (Ảnh hưởng 1 số tỉnh) / P3 (Hiệu năng giảm)
- **Người xử lý:** [Tên người vận hành / AI Agent]

### 1. Hiện tượng & Triệu chứng (Observed vs Expected)
- Quan sát thấy:
- Kỳ vọng:

### 2. Nguyên nhân gốc rễ (Root Cause)
- [Mô tả chi tiết nguyên nhân]

### 3. Tác động (Impact)
- Số lượng MST bị trễ quét:
- Trạng thái các luồng:

### 4. Hành động khắc phục & Phòng ngừa
- [ ] Hành động 1:
- [ ] Hành động 2:
```
