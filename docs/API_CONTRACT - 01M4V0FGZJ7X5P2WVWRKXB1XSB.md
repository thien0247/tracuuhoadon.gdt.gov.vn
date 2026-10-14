---
id: "01M4V0FGZJ7X5P2WVWRKXB1XSB"
aliases:
  - "API_CONTRACT"
  - "API_CONTRACT.md"
created_at: "2026-10-13T16:10:41.011831+00:00"
type: "documentation"
related_code:
  - 01M4V0HMKKDMKNBTXAPT1YDAYJ
  - 01M4V0HMKMKJ8KJM7W9Y8ZC1AW
  - 01M4V0HMKNWS255D6X91RPS6R3
  - 01M4V0HMKPPP2QZ57VFX12A48P
---
# 📜 API_CONTRACT.md — Chuẩn Hóa Giao Tiếp API

> **Host mặc định:** `http://127.0.0.1:8123` (Fastify Web Gateway)  
> **Định dạng dữ liệu:** `application/json; charset=utf-8`  

---

## 1. Cấu Trúc Envelope Response Chuẩn

Mọi phản hồi từ hệ thống tuân thủ phong cách đóng gói Envelope nhất quán:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-10-13T22:50:00+07:00"
}
```

- **Mã HTTP 200 OK:** Thành công, dữ liệu nằm trong trường `data`.
- **Mã HTTP 400/404/500:** Thất bại, `success: false`, thông tin lỗi nằm trong trường `error`.

---

## 2. Danh Mục Các Endpoint RESTful Cốt Lõi

### 2.1. Phân Hệ Doanh Nghiệp & Tra Cứu (`/api/records`, `/api/search`)

| Phương thức | Endpoint | Mô tả | Tham số chính |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/search` | Tìm kiếm NNT theo từ khóa / MST | `{ query, page, limit }` |
| `POST` | `/api/filter` | Lọc đa tiêu chí theo tỉnh / ngày / CQT | `{ prov_keys, from_date, to_date, page }` |
| `GET` | `/api/record/:tin` | Chi tiết bản ghi NNT theo MST 10/13 số | `tin` (Path parameter) |
| `GET` | `/api/records/export` | Xuất danh sách dạng CSV có BOM UTF-8 | Các query filters tương ứng |
| `GET` | `/api/records/export-xlsx` | Xuất danh sách định dạng Excel XLSX | Các query filters tương ứng |

### 2.2. Phân Hệ Bố Cáo ĐKKD (`/api/bocao`)

| Phương thức | Endpoint | Mô tả | Dữ liệu trả về |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bocao/reconcile/stats` | Thống kê số lượng khớp / chưa khớp | `{ total, matched, unmatched, rate }` |
| `GET` | `/api/bocao/reconcile` | Danh sách đối soát Bố cáo vs Thuế | `{ records: [...], total }` |
| `POST` | `/api/bocao/reconcile/scan-missing` | Kích hoạt quét bù các MST chưa có | `{ message: "scan_queued" }` |
| `POST` | `/api/bocao/sync` | Đồng bộ dữ liệu bố cáo từ Cổng ĐKKD | `{ synced_count: number }` |

### 2.3. Phân Hệ Điều Khiển Crawler (`/api/crawler`)

| Phương thức | Endpoint | Mô tả | Tham số / Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/crawler/start` | Kích hoạt quét 1 tỉnh cụ thể | `{ province: "Đắk Lắk (49)" }` |
| `POST` | `/api/crawler/stop` | Dừng tiến trình quét của 1 tỉnh | `{ province: "Đắk Lắk (49)" }` |
| `POST` | `/api/crawler/start_all_newest`| Quét tự động cuốn chiếu đa tỉnh | `{ max_concurrent: 3 }` |
| `GET` | `/api/crawler/queue_status` | Trạng thái hàng đợi Rolling Queue | Danh sách tỉnh đang chạy / chờ |

### 2.4. Phân Hệ Quản Trị Dịch Vụ Hệ Thống (`/api/services`)

| Phương thức | Endpoint | Mô tả | Tham số chính |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/services` | Danh sách dịch vụ và trạng thái sống | Không |
| `POST` | `/api/services/:id/start` | Khởi động dịch vụ tương ứng | `id` (web / crawler / postgres) |
| `POST` | `/api/services/:id/stop` | Dừng dịch vụ tương ứng | `id` (Path parameter) |
| `POST` | `/api/services/:id/restart` | Khởi động lại dịch vụ tương ứng | `id` (Path parameter) |

### 2.5. Luồng Dữ Liệu Thời Gian Thực (`/api/stream`)
- **Giao thức:** Server-Sent Events (SSE).
- **Endpoint:** `GET /api/stream`
- **Sự kiện phát:**
  - `status`: Cập nhật số MST mới cào được, tốc độ RPS, tỉ lệ giải CAPTCHA.
  - `log`: Dòng nhật ký thời gian thực từ crawler engine.
  - `queue`: Thay đổi trong danh sách hàng đợi các tỉnh thành.
