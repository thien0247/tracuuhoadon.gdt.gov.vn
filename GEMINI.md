# Quy Chuẩn Lập Trình & Giới Hạn Code — GDT Tax Crawler & Search Engine

> **Bắt buộc áp dụng:** Tất cả các thành phần mã nguồn trong dự án (Python, TypeScript, Vue 3, SQL)
> phải tuân thủ nghiêm ngặt các quy chuẩn dưới đây. Mọi vi phạm về độ dài dòng code hoặc kiến trúc
> module sẽ bị từ chối và yêu cầu tái cấu trúc.

---

## 1. Giới Hạn Số Dòng Code (Line Limits)

Nhằm đảm bảo tính dễ đọc, dễ bảo trì, dễ kiểm thử và tuân thủ nguyên lý Đơn trách nhiệm (Single Responsibility):

### 1.1. Giới hạn theo File
| Loại tệp | Mục tiêu lý tưởng | Giới hạn tối đa (Hard Cap) | Hành động khi vượt ngưỡng |
|:---|:---:|:---:|:---|
| **TypeScript / JS (.ts, .js)** | **100 – 160 dòng** | **200 dòng** | Phân rã thành sub-modules hoặc helpers |
| **Python Service / Router (.py)** | **100 – 160 dòng** | **200 dòng** | Chia tách schemas, database helpers |
| **Vue Component (.js)** | **120 – 160 dòng** | **180 dòng** | Tách nhỏ thành sub-components |
| **HTML UI Template** | **120 – 180 dòng** | **220 dòng** | Chia nhỏ các modal / tab riêng biệt |
| **Type Definition (.ts)** | **80 – 120 dòng** | **150 dòng** | Tách theo domain / feature model |

### 1.2. Giới hạn theo Hàm & Khối lệnh
| Đối tượng | Giới hạn tối đa | Ghi chú |
|:---|:---:|:---|
| **Hàm thông thường** | **45 dòng** | Nếu dài hơn, tách thành các hàm phụ trợ |
| **Callback / Event Handler** | **25 dòng** | Gọi hàm xử lý riêng có tên, không viết inline dài |
| **Arrow function inline** | **5 dòng** | Khai báo hàm độc lập có tên |
| **Số tham số của hàm** | **≤ 4 tham số** | Nhiều hơn phải gộp vào `Options` hoặc `Request` object |
| **Độ dài ký tự trên 1 dòng** | **120 ký tự** | Xuống dòng có thụt lề khi vượt quá 120 ký tự |

---

## 2. Kiến Trúc Hướng Module (Modular Architecture)

### 2.1. Cấu trúc chuẩn của một TypeScript Module (`src/modules/<feature>/`)
```
src/modules/<feature-name>/
├── <feature>.types.ts     # TypeScript interfaces & types riêng (≤ 120 dòng)
├── <feature>.service.ts   # Database access & business logic (≤ 180 dòng)
├── <feature>.routes.ts    # REST API / HTTP router endpoints (≤ 170 dòng)
├── <feature>.utils.ts     # Hàm tiện ích nội bộ nếu có (≤ 150 dòng)
└── index.ts               # Public API: Chỉ export những gì bên ngoài cần dùng
```

### 2.2. Quy tắc giao tiếp giữa các Module
1. **Encapsulation:** Các file bên ngoài module **CHỈ ĐƯỢC PHÉP** import thông qua file `index.ts`. Tuyệt đối không import sâu vào nội bộ.
2. **Loosely Coupled:** Các module độc lập, không tạo phụ thuộc vòng (circular dependencies).

---

## 3. Quy Chuẩn TypeScript & Clean Code

1. **Strict Type Safety:**
   - Tuyệt đối **KHÔNG DÙNG `any`**. Sử dụng `unknown`, generic hoặc type guard cụ thể.
   - Bật toàn bộ flags: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
   - Bật `verbatimModuleSyntax: true` → bắt buộc dùng `import type` cho type/interface.
2. **Quy tắc đặt tên:**
   - **Type / Interface / Class:** `PascalCase` (ví dụ: `ProvinceRecord`, `TaxSearchQuery`).
   - **Function / Method / Variable:** `camelCase` (ví dụ: `fetchProvinceStats`, `runningEngines`).
   - **Constant:** `UPPER_SNAKE_CASE` (ví dụ: `MAX_GLOBAL_RPS`, `DEFAULT_PORT`).
   - **Tên thư mục:** `kebab-case` hoặc snake_case đồng nhất.

---

## 4. Quy Chuẩn Database & An Toàn Mạng (WAF)

1. **Connection Pooling:** Luôn dùng Connection Pool (`pg.Pool` trong TS hoặc `ThreadedConnectionPool` trong Python). Tuyệt đối không mở/đóng kết nối rời rạc.
2. **Batch Insert:** Ghi nhận bản ghi thuế vào bảng `tax_records` theo lô (batch insert với `UNNEST` hoặc `execute_values`).
3. **An Toàn WAF & Rate Limiting:**
   - Giữ nguyên `safe_request_guard` và Circuit Breaker khi bị F5 WAF phản hồi `Request Rejected`.
   - Tái sử dụng session `curl_cffi` (impersonate Chrome 124) để tránh giải CAPTCHA lặp lại.

---

## 5. Quy Định Ghi Chép Tài Liệu Theo Topic (Topic Documentation)

Mọi phân tích, kiến trúc và giai đoạn triển khai đều phải được lưu trữ trong `docs/`:
- `docs/TOPICS.md`: Mục lục tổng hợp toàn bộ các Topic kỹ thuật.
- `docs/topics/topic-XX-<ten>.md`: Nội dung chi tiết từng Topic.

---

## 6. Quy Định Lưu Trữ Kế Hoạch & Nhật Ký Thực Thi (Audit Logs)

Nhằm đảm bảo tính minh bạch và khả năng truy vết:
1. Mỗi khi tạo hoặc cập nhật `implementation_plan.md` và `walkthrough.md`, bản sao phải được lưu vào `docs/logs/`.
2. Đặt tên có Thứ tự + Thời gian: `<STT>_<YYYYMMDD_HHMMSS>_<loai_tai_lieu>.md` (ví dụ: `01_20260919_234000_implementation_plan.md`).
3. Cập nhật dòng trạng thái vào mục lục `docs/logs/INDEX.md`.
