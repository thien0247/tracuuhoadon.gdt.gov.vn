---
name: gdt-test-hardening
description: Gia cố độ bền bộ kiểm thử tự động cho hệ thống GDT Crawler và Web Dashboard. Tập trung vào WAF rate limit, Circuit Breaker, Rolling Queue, Captcha Worker Pool và kiểm tra hồi quy API.
version: 1.0.0
category: verification
---

# GDT Test Hardening

Sử dụng kỹ năng này khi nâng cấp hoặc sửa đổi crawler core, database pool hoặc các router API để bảo đảm hệ thống vận hành bền bỉ trên môi trường thực tế.

## Các Khu Vực Rủi Ro Cần Bảo Vệ (Risk Boundaries)

1. **WAF F5 & Rate Limiting (`limiter.py`):**
   - Circuit Breaker chuyển trạng thái đúng: `CLOSED` -> `OPEN` khi nhận 403 / "Request Rejected".
   - Cooldown time (mặc định 60s) phục hồi an toàn về `HALF_OPEN`.
   - Global RPS không bao giờ vượt ngưỡng `max_global_rps`.
2. **Rolling Queue & Stop Condition (`engine.py`, `queue_manager.py`):**
   - Kiểm tra điều kiện dừng: dừng luồng chính xác sau khi gặp đủ 20 MST không tồn tại liên tiếp.
   - Tránh deadlock khi chuyển tỉnh giữa các worker trong pool.
3. **Database Connection Pool (`database.py`):**
   - Giải phóng kết nối ngay trong khối `try...finally`.
   - Batch insert sử dụng `execute_values` xử lý trơn tru khi gặp duplicate MST (`ON CONFLICT DO NOTHING`).
4. **API Regression & Line Limits (`test_modular.py`):**
   - Tất cả 32+ file trong dự án phải thỏa mãn quy tắc `< 200 dòng/file`.
   - Tất cả endpoint `/api/*` trả về đúng mã trạng thái HTTP 200/201.

## Quy Trình Gia Cố Kiểm Thử (Hardening Workflow)

1. **Xác định hành vi cốt lõi:** Xác định rõ kết quả bắt buộc (ví dụ: cào ngắt an toàn, không bị WAF khóa IP).
2. **Viết test ở phạm vi hẹp nhất:** Ưu tiên unit test giả lập (mocked HTTP response) trước khi gọi mạng thật.
3. **Bao phủ 3 trường hợp:** Happy Path, Failure Path (WAF reject/DB disconnect), và Realistic Edge (mạng chập chờn).
4. **Kiểm tra Fail-First:** Đảm bảo test phát hiện được lỗi trước khi đưa ra bản vá.

## Khung Kiểm Thử 4C Verification

| Tiêu chí | Câu hỏi kiểm tra |
|:---|:---|
| **Correctness** | Mock response và điều kiện biên có phản ánh chính xác hành vi WAF F5 thực tế không? |
| **Completeness** | Đã kiểm thử cả Python FastAPI, TypeScript Fastify và kết nối PostgreSQL chưa? |
| **Context-fit** | Kịch bản test có chạy nhanh (< 15 giây) và không gây tải ảo lên server thật không? |
| **Consequence** | Nếu test bỏ sót lỗi rò rỉ session hoặc connection pool, hậu quả là gì? |
