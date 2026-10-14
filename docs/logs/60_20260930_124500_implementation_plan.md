# Kế Hoạch Kỹ Thuật: Module Báo Cáo Số Lượng MST Crawl (Ngày, Tháng, Năm & Biểu Đồ)

## 1. Giới Thiệu & Mục Tiêu Kỹ Thuật

Hiện tại, cơ sở dữ liệu `tax_records` lưu trữ gần **7.000.000 bản ghi mã số thuế**. Hệ thống cần một module báo cáo trực quan cho phép ban quản trị và người dùng:
1. **Thống kê sản lượng crawl**: Tổng hợp số lượng mã số thuế crawl được theo từng chu kỳ: **Ngày (Day)**, **Tháng (Month)**, **Năm (Year)**.
2. **Hỗ trợ 2 góc nhìn thời gian**:
   - *Thời gian Quét (Crawl Time - `scraped_at`)*: Phản ánh trực tiếp hiệu suất hoạt động của hệ thống crawler theo ngày/tháng/năm.
   - *Thời gian Đăng ký kinh doanh (Regi Date - `regi_date`)*: Phân tích xu hướng thành lập doanh nghiệp mới trên cả nước.
3. **Phân rã đa chiều**:
   - Lọc theo từng tỉnh thành hoặc toàn bộ 62 tỉnh thành.
   - Lọc khoảng thời gian linh hoạt (7 ngày, 30 ngày, 90 ngày, toàn bộ, tùy chọn từ ngày - đến ngày).
   - Danh sách Top 10 tỉnh thành đóng góp số lượng bản ghi nhiều nhất trong kỳ.
4. **Trực quan hóa biểu đồ (Visual Charts)**:
   - Biểu đồ Bar Chart (Cột) & Line Chart (Đường) responsive chuẩn giao diện VNPT VDDS, hỗ trợ Dark Mode & Tooltip chi tiết khi hover.
5. **Tối ưu hiệu năng truy vấn trên 7 triệu bản ghi**:
   - Bổ sung chỉ mục `idx_tax_records_scraped_at` trên PostgreSQL.
   - Truy vấn rút gọn (Aggregation) dưới 100ms.

---

## 2. Kiến Trúc Kỹ Thuật & Luồng Dữ Liệu

```
[Người Dùng / Web Dashboard]
        │
        ▼ (HTTP GET /api/reports/crawl-stats?period=day&province_key=all&...)
┌───────────────────────────────────────────────────────────────┐
│ Fastify TypeScript Gateway (Port 8123) / Python API (Port 8124)│
│  - src/modules/records/records.report.ts                      │
│  - server_app/routers/reports.py                              │
└───────────────────────────────┬───────────────────────────────┘
                                │ Parameterized SQL Aggregation
                                ▼
┌───────────────────────────────────────────────────────────────┐
│ PostgreSQL 16 (Port 5433 - taxdb)                              │
│  - Table: tax_records (6.92M+ rows)                           │
│  - Index: idx_tax_records_scraped_at                          │
│  - Group by: DATE_TRUNC(period, time_col)                     │
└───────────────────────────────────────────────────────────────┘
```

---

## 3. Danh Sách Tệp Thay Đổi & Khởi Tạo

| Tệp | Hành động | Mục tiêu số dòng | Trách nhiệm |
|:---|:---:|:---:|:---|
| `src/modules/records/records.report.ts` | **[NEW]** | ~140 dòng | Service tổng hợp báo cáo bằng SQL aggregation trên Fastify |
| `src/modules/records/records.routes.ts` | **[MODIFY]** | ~110 dòng | Khai báo endpoint `GET /api/reports/crawl-stats` |
| `src/modules/records/records.types.ts` | **[MODIFY]** | ~95 dòng | Định nghĩa DTO request & response cho Crawl Stats Report |
| `src/modules/records/index.ts` | **[MODIFY]** | ~15 dòng | Export hàm phân tích báo cáo cho module records |
| `server_app/routers/reports.py` | **[NEW]** | ~130 dòng | Router Python FastAPI tương đương cho kiểm thử modular |
| `server_app/main.py` | **[MODIFY]** | ~72 dòng | Gắn kết `reports.router` vào ứng dụng FastAPI |
| `static/js/components/crawled-report-tab.js` | **[NEW]** | ~175 dòng | Vue 3 Component giao diện báo cáo (KPIs, Bộ lọc, Biểu đồ, Bảng số liệu) |
| `templates/index.html` | **[MODIFY]** | ~218 dòng | Thêm mục menu "Báo Cáo Sản Lượng" và nhúng component |
| `static/js/app.js` | **[MODIFY]** | ~150 dòng | Khai báo component và state điều hướng |
| `test_modular.py` | **[MODIFY]** | ~195 dòng | Thêm kiểm tra số dòng và endpoint báo cáo tự động |
| `docs/topics/topic-11-crawled-tax-reporting-analytics.md` | **[NEW]** | ~150 dòng | Tài liệu chi tiết Topic 11 |
| `docs/TOPICS.md` | **[MODIFY]** | ~35 dòng | Đăng ký Topic 11 vào mục lục |

---

## 4. Kế Hoạch Tối Ưu Hóa Database

Chạy câu lệnh SQL tạo index:
```sql
CREATE INDEX IF NOT EXISTS idx_tax_records_scraped_at ON tax_records (scraped_at);
```
Câu lệnh truy vấn aggregation chính:
```sql
SELECT 
    DATE_TRUNC($1, COALESCE(scraped_at, created_at)) AS period_bucket,
    COUNT(*) AS record_count
FROM tax_records
WHERE ($2::text IS NULL OR tin LIKE $2::text || '%')
  AND ($3::timestamp IS NULL OR COALESCE(scraped_at, created_at) >= $3)
  AND ($4::timestamp IS NULL OR COALESCE(scraped_at, created_at) <= $4)
GROUP BY period_bucket
ORDER BY period_bucket ASC;
```

---

## 5. Kế Hoạch Kiểm Thử & Nghiệm Thu

1. **Kiểm tra giới hạn dòng code**:
   - `npm run check:lines`: Toàn bộ file TS/JS < 200 dòng (component <= 180 dòng).
   - `python test_modular.py`: Toàn bộ file Python < 200 dòng.
2. **Kiểm tra Type Safety**:
   - `npm run check:types`: 0 lỗi compilation, zero `any`.
3. **Kiểm thử API Endpoint**:
   - `GET /api/reports/crawl-stats?period=day`
   - `GET /api/reports/crawl-stats?period=month`
   - `GET /api/reports/crawl-stats?period=year`
   - `GET /api/reports/crawl-stats?province_key=tphcm`
4. **Kiểm thử giao diện người dùng**:
   - Chuyển đổi qua lại giữa Ngày / Tháng / Năm.
   - Tương tác với biểu đồ và bộ lọc tỉnh thành.
5. **Cập nhật tri thức**:
   - `graphify update .` đồng bộ AST đồ thị tri thức.
