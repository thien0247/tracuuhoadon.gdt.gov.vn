---
id: "01M4V0FH014QA422MJEK6XSQE2"
aliases:
  - "SKILLS_INSTALLATION_GUIDE"
  - "SKILLS_INSTALLATION_GUIDE.md"
created_at: "2026-10-13T16:10:41.025275+00:00"
type: "documentation"
---
# NHẬT KÝ & HƯỚNG DẪN TRIỂN KHAI SKILLS (AGENT SKILLS LOG)

Tài liệu này ghi lại toàn bộ danh mục kỹ năng (Skills) đã được triển khai và cấu hình vào hệ thống Antigravity cho dự án **Vét Cạn Mã Số Thuế (GDT Tax Crawler & Search Engine)**, bao gồm nguồn kỹ năng từ kho mã nguồn mở [**`midudev/autoskills`**](https://github.com/midudev/autoskills).

---

## 1. Danh Sách Skills Đang Hoạt Động

Dự án hiện được trang bị **8 Skills chuyên sâu** đặt tại thư mục [`.agents/skills/`](file:///c:/tracuuhoadon.gdt.gov.vn/.agents/skills):

```text
.agents/skills/
├── fastapi-python/                    # Nguồn: mindrally/skills (npx skills)
│   └── SKILL.md
├── gdt-tax-crawler/                   # Nguồn: Local Customization (Dự án nội bộ)
│   ├── SKILL.md
│   └── references/
│       ├── crawler_modes.md
│       └── waf_and_network_safety.md
├── modular-code-standards/            # Nguồn: Local Customization (Dự án nội bộ)
│   ├── SKILL.md
│   └── references/
│       └── refactoring_checklist.md
├── postgresql-optimization/           # Nguồn: github/awesome-copilot (npx skills)
│   └── SKILL.md
├── supabase-postgres-best-practices/  # Nguồn: midudev/autoskills (npx skills)
│   └── SKILL.md
├── vue-best-practices/                # Nguồn: midudev/autoskills (npx skills)
│   └── SKILL.md
├── web-perf/                          # Nguồn: midudev/autoskills (npx skills)
│   └── SKILL.md
└── web-scraping/                      # Nguồn: mindrally/skills (npx skills)
    └── SKILL.md
```

---

## 2. Đánh Giá Kho Kỹ Năng `midudev/autoskills` Đối Với Dự Án

Kho [**`https://github.com/midudev/autoskills`**](https://github.com/midudev/autoskills) (do Miguel Ángel Durán - midudev, Google Developer Expert xây dựng) chứa hơn **219+ kỹ năng** chuẩn format Agentic AI.

Hệ sinh thái này **hoàn toàn tương thích 100%** và có thể nạp trực tiếp vào dự án qua lệnh:
```bash
npx skills add midudev/autoskills --skill <tên-skill> -y
```

### Các Kỹ Năng Đã Tuyển Chọn & Triển Khai Từ `midudev/autoskills`:
1. **`web-perf`**: Kỹ năng đo lường Core Web Vitals (LCP, INP, CLS) và phân tích hiệu năng mạng kết nối trực tiếp với **Chrome DevTools MCP** (chính là MCP server chúng ta đã tích hợp vào dự án!).
2. **`supabase-postgres-best-practices`**: Chuẩn thực hành tối ưu hóa PostgreSQL từ Supabase (quản lý connection pool, tối ưu hóa index, truy vấn theo lô, và thiết kế schema an toàn).
3. **`vue-best-practices`**: Hướng dẫn chuẩn hóa kiến trúc Vue 3 Composition API, tối ưu hệ thống phản ứng (reactivity) cho Dashboard đa tỉnh.

---

## 3. Tổng Hợp Bảng Kỹ Năng Đã Cài Đặt

| STT | Tên Skill | Nguồn cài đặt | Vai trò đối với dự án GDT Crawler |
| :---: | :--- | :--- | :--- |
| **1** | **`web-perf`** | `midudev/autoskills` | Phân tích hiệu năng tải trang, kiểm tra network waterfall và đo lường Web Vitals qua Chrome DevTools MCP. |
| **2** | **`supabase-postgres-best-practices`** | `midudev/autoskills` | Tối ưu hóa truy vấn SQL, kiến trúc schema và điều chỉnh Connection Pool cho CSDL 1.1M+ bản ghi. |
| **3** | **`vue-best-practices`** | `midudev/autoskills` | Chuẩn hóa Vue 3 Composition API, tách nhỏ components dưới 180 dòng, quản lý reactive state mượt mà. |
| **4** | **`web-scraping`** | `mindrally/skills` | Quản lý phiên HTTP, cookie, xoay vòng headers, exponential backoff và né bot detection của WAF. |
| **5** | **`fastapi-python`** | `mindrally/skills` | Chuẩn hóa API Router, Pydantic v2 schemas, xử lý background tasks và duy trì SSE `/api/stream`. |
| **6** | **`postgresql-optimization`** | `github/awesome-copilot` | Phân tích `EXPLAIN ANALYZE`, tối ưu index B-Tree trên `tin`, `prefix` và GIN trên `norm_name`. |
| **7** | **`gdt-tax-crawler`** | Local Customization | Điều phối Hàng Đợi Cuốn Chiếu, quét từ TIN Max với mốc dừng **20 TIN không tồn tại**, và ngắt mạch WAF F5. |
| **8** | **`modular-code-standards`** | Local Customization | Ràng buộc tiêu chuẩn code: **< 200 dòng/file**, Connection Pool bắt buộc, kiểm thử tự động với `test_modular.py`. |

---

## 4. Nhật Ký Lệnh Triển Khai (Deployment Log)

```bash
# 1. Cài đặt các kỹ năng Backend & Web Scraping
npx skills add mindrally/skills --skill web-scraping fastapi-python -y

# 2. Cài đặt kỹ năng Tối ưu CSDL PostgreSQL
npx skills add github/awesome-copilot@postgresql-optimization -y

# 3. Cài đặt các kỹ năng từ kho midudev/autoskills
npx skills add midudev/autoskills --skill web-perf -y
npx skills add midudev/autoskills --skill supabase-postgres-best-practices vue-best-practices -y

# 4. Kiểm tra danh sách kỹ năng liên kết với Antigravity
npx skills list
```

---

## 5. Hướng Dẫn Quản Trị Skills

1. **Tìm kiếm kỹ năng trong kho midudev/autoskills:**
   ```bash
   npx skills add midudev/autoskills -l
   ```
2. **Cài đặt kỹ năng cụ thể:**
   ```bash
   npx skills add midudev/autoskills --skill <tên-skill> -y
   ```
3. **Cập nhật tất cả kỹ năng trong dự án:**
   ```bash
   npx skills update -p -y
   ```
4. **Kiểm tra tính toàn vẹn hệ thống sau khi bổ sung Skill:**
   ```bash
   python test_modular.py
   ```
