---
id: "01M4V0FH0QCJ0ZDCZAAMF0MAWX"
aliases:
  - "topic-11-crawled-tax-reporting-analytics"
  - "topic-11-crawled-tax-reporting-analytics.md"
created_at: "2026-10-13T16:10:41.048389+00:00"
type: "documentation"
---
# Topic 11 — Module Báo Cáo Phân Tích Số Lượng Mã Số Thuế Crawl (Ngày, Tháng, Năm & Biểu Đồ)

> **Trạng thái:** ✅ Đã hoàn thành  
> **Phiên bản:** v3.8.0  
> **Ngày cập nhật:** 30/09/2026  
> **Tác giả:** VNPT Đắk Lắk & AI Engineering Team  

---

## 1. Bối Cảnh & Mục Tiêu Kỹ Thuật

Cơ sở dữ liệu `tax_records` hiện lưu trữ gần **7.000.000 bản ghi mã số thuế**. Trước phiên bản v3.8.0, hệ thống chỉ có bảng giám sát sức khỏe (`health_report_tab`) theo dõi ngày trễ nhất mà chưa có module phân tích sản lượng:
- Không theo dõi được số lượng MST thu thập theo từng **Ngày (Day)**, **Tháng (Month)**, **Năm (Year)**.
- Chưa có góc nhìn phân tách giữa **Hiệu suất quét của Crawler (`scraped_at`)** và **Xu hướng thành lập doanh nghiệp của Cục Thuế (`regi_date`)**.
- Thiếu biểu đồ trực quan hóa dữ liệu và tỷ lệ đóng góp của từng địa bàn tỉnh thành.

**Mục tiêu giải pháp:**
1. Cung cấp API tổng hợp báo cáo đa chiều `GET /api/reports/crawl-stats`.
2. Tạo chỉ mục tối ưu trên CSDL PostgreSQL (`idx_tax_records_scraped_at`).
3. Xây dựng giao diện Vue 3 `crawled-report-tab.js` với thẻ KPI, bộ lọc linh hoạt, biểu đồ tương tác SVG (Cột/Đường), và bảng chi tiết có xuất CSV.

---

## 2. Kiến Trúc Luồng Dữ Liệu & Tối Ưu Truy Vấn

```
[Người Dùng / Web Dashboard]
        │
        ▼ (HTTP GET /api/reports/crawl-stats?period=day&time_field=scraped_at&...)
┌────────────────────────────────────────────────────────────────────────┐
│ Fastify Gateway (src/modules/records/records.report.ts - Port 8123)    │
│ FastAPI Worker (server_app/routers/reports.py - Port 8124)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Parameterized SQL Aggregation
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PostgreSQL 16 (taxdb, Port 5433)                                       │
│  - Table: tax_records (6.97M+ records)                                 │
│  - Index: idx_tax_records_scraped_at                                   │
│  - Aggregation: TO_CHAR(DATE_TRUNC(period, time_col), format)          │
│  - Top Contributors: SUBSTRING(tin FROM 1 FOR 2)                       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Đặc Tả API Hợp Nhất: `GET /api/reports/crawl-stats`

### Tham số Query:
| Tham số | Kiểu | Mặc định | Ý nghĩa |
|:---|:---|:---|:---|
| `period` | string | `day` | Chu kỳ gom nhóm: `day` (ngày), `month` (tháng), `year` (năm) |
| `time_field` | string | `scraped_at` | Trường thời gian: `scraped_at` (thời gian crawl), `regi_date` (ngày ĐKKD) |
| `province_key`| string | `all` | Mã tỉnh hoặc `all` để thống kê toàn quốc (62 tỉnh) |
| `from_date` | string | `null` | Ngày bắt đầu (`YYYY-MM-DD`) |
| `to_date` | string | `null` | Ngày kết thúc (`YYYY-MM-DD`) |

### Định dạng Dữ liệu Trả về:
```json
{
  "period": "day",
  "time_field": "scraped_at",
  "province_key": "all",
  "summary": {
    "total_records": 6973888,
    "peak_period": "08/09/2026",
    "peak_count": 1363849,
    "avg_per_period": 188483,
    "period_count": 37
  },
  "timeline": [
    { "period": "2026-09-29", "label": "29/09/2026", "count": 293 },
    { "period": "2026-09-30", "label": "30/09/2026", "count": 55019 }
  ],
  "top_provinces": [
    { "prefix": "03", "province_name": "TP Hồ Chí Minh", "count": 1290912, "percentage": 18.5 }
  ]
}
```

---

## 4. Danh Sách Tệp Triển Khai & Kiểm Soát Dòng Code

| Tệp Mã Nguồn | Chức Năng | Số Dòng | Giới Hạn (Hard Cap) | Trạng Thái |
|:---|:---|:---:|:---:|:---:|
| `src/modules/records/records.report.ts` | Service tổng hợp báo cáo Fastify | 164 | 200 | ✅ Đạt |
| `src/modules/records/records.routes.ts` | Khai báo endpoint Fastify | 106 | 170 | ✅ Đạt |
| `src/modules/records/records.types.ts` | Kiểu dữ liệu TypeScript Report | 110 | 150 | ✅ Đạt |
| `src/modules/records/index.ts` | Export public interface | 12 | 20 | ✅ Đạt |
| `server_app/routers/reports.py` | FastAPI Router báo cáo | 97 | 200 | ✅ Đạt |
| `server_app/main.py` | Gắn kết router FastAPI | 70 | 200 | ✅ Đạt |
| `static/js/components/crawled-report-tab.js` | Vue 3 Component Báo cáo & Biểu đồ | 177 | 180 | ✅ Đạt |
| `static/js/app.js` | Khởi tạo component & state | 191 | 200 | ✅ Đạt |
| `templates/index.html` | Menu điều hướng & tab container | 218 | 220 | ✅ Đạt |
| `tests/test_ts_server.ts` | Bộ test tự động Fastify | 111 | 200 | ✅ Đạt |
| `test_modular.py` | Bộ test tự động Python & line count | 194 | 200 | ✅ Đạt |

---

## 5. Kiến Trúc Bảng Chuyên Biệt `crawl_stats_daily` & Trigger Tự Động

Do bảng `tax_records` có quy mô xấp xỉ 7 triệu dòng, việc quét tuần tự hoặc gom nhóm trực tiếp tốn tới 13.6 giây. Hệ thống đã triển khai bảng tổng hợp chuyên biệt và trigger tự động:

### 5.1. Cấu Trúc Bảng `crawl_stats_daily`:
```sql
CREATE TABLE IF NOT EXISTS crawl_stats_daily (
    id SERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    province_prefix VARCHAR(4) NOT NULL,
    total_crawled INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_stat_date_province UNIQUE (stat_date, province_prefix)
);
CREATE INDEX IF NOT EXISTS idx_crawl_stats_date ON crawl_stats_daily(stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_crawl_stats_prefix ON crawl_stats_daily(province_prefix);
```

### 5.2. Trigger Tự Động Duy Trì Dữ Liệu Thời Gian Thực:
```sql
CREATE OR REPLACE FUNCTION update_crawl_stats_daily()
RETURNS TRIGGER AS $$
DECLARE
    v_date DATE;
    v_prefix VARCHAR(4);
BEGIN
    v_date := DATE(COALESCE(NEW.scraped_at, NEW.created_at, CURRENT_TIMESTAMP));
    v_prefix := SUBSTRING(NEW.tin FROM 1 FOR 2);
    IF v_date IS NOT NULL AND v_prefix IS NOT NULL AND LENGTH(v_prefix) = 2 THEN
        INSERT INTO crawl_stats_daily (stat_date, province_prefix, total_crawled, updated_at)
        VALUES (v_date, v_prefix, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (stat_date, province_prefix)
        DO UPDATE SET total_crawled = crawl_stats_daily.total_crawled + 1, updated_at = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tax_records_stats
AFTER INSERT ON tax_records
FOR EACH ROW EXECUTE FUNCTION update_crawl_stats_daily();
```

### 5.3. Hiệu Quả Tăng Tốc Độ Truy Vấn:
- Trước tối ưu (quét trực tiếp `tax_records` 6.97M dòng): **13.600 ms** (13.6 giây).
- Sau tối ưu (truy vấn bảng `crawl_stats_daily` 862 dòng): **6.9 ms** (tăng tốc gần **2.000 lần**, tải CPU CSDL giảm về 0%).
- Endpoint đồng bộ thủ công khi cần: `POST /api/reports/sync-stats`.

### 5.4. Bảng Thống Kê Ngày Thành Lập ĐKKD: `regi_stats_daily`
Hệ thống cung cấp thêm góc nhìn phân tích theo **Ngày thành lập đăng ký kinh doanh (`regi_date`)**:
```sql
CREATE TABLE IF NOT EXISTS regi_stats_daily (
    id SERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    province_prefix VARCHAR(4) NOT NULL,
    total_records INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_regi_stat_date_province UNIQUE (stat_date, province_prefix)
);
CREATE TRIGGER trg_tax_records_regi_stats
AFTER INSERT ON tax_records
FOR EACH ROW EXECUTE FUNCTION update_regi_stats_daily();
```
- Độ trễ truy vấn ngày ĐKKD: **19ms**.
- Giao diện hỗ trợ chuyển đổi linh hoạt: `🕒 Ngày Quét (Crawler)` vs `🏢 Ngày ĐKKD (Thành Lập)`.

### 5.5. Hiển Thị Số Lượng & Ngày Trên Đầu Cột Biểu Đồ SVG
- Bỏ điều kiện ẩn nhãn `points.length <= 16`.
- Bổ sung hàm rút gọn thông minh `compactNum(n)` (`58.5k`, `703`, `1.4M`) với vị trí `:y="Math.max(p.y - 4, 10)"` giúp số lượng luôn nổi bật trên đầu mỗi cột mà không bị đè chữ.
- Nhãn ngày (`DD/MM`) cố định dưới chân cột và tooltip chi tiết khi rê chuột.

---

## 6. Kết Quả Kiểm Thử & Nghiệm Thu

1. **Kiểm tra giới hạn dòng code:**
   - `npm run check:lines`: 100% file TypeScript tuân thủ < 200 dòng (`records.report.ts` 130 dòng).
   - `python test_modular.py`: 100% file Python & Component tuân thủ < 200 dòng (`crawled-report-tab.js` đạt 178 dòng <= 180 dòng, `reports.py` 125 dòng).
2. **Kiểm tra TypeScript Type Safety:**
   - `npm run check:types`: 0 lỗi compilation, zero `any`.
3. **Kiểm thử tích hợp Fastify & Python:**
   - `npm run test:server`: 12/12 bài test PASS.
   - `test_modular.py`: 100% endpoint PASS (Search, Filter, Crawler, Health, Crawl-Stats, Reset).
4. **Kiểm tra hiển thị giao diện:**
   - Số lượng hiển thị rõ ràng trên đầu mọi cột của biểu đồ SVG.
   - Hỗ trợ chuyển đổi giữa Ngày Quét và Ngày Thành Lập ĐKKD.
   - Bảng số liệu và tính năng xuất file CSV hoạt động chính xác.
