---
name: gdt-workflow
description: >-
  Standard end-to-end development workflow for creating, upgrading, or refactoring
  modules and features in GDT Tax Crawler & Search Engine. Use this skill when asked to
  develop a new module, add a sub-feature, integrate backend and frontend, document a Topic,
  or manage audit logs.
---

# GDT Tax Crawler — Module Development Workflow

Quy trình chuẩn hóa 5 bước để phát triển, nâng cấp hoặc tái cấu trúc bất kỳ module
hoặc tính năng nào trong dự án.

---

## Chu Trình 5 Bước Phát Triển Chuẩn

```
[1. Phân tích & Lập Kế hoạch]
         ↓
[2. Khởi tạo Cấu trúc Module]
         ↓
[3. Xây dựng Backend API & Database]
         ↓
[4. Xây dựng Frontend UI & State]
         ↓
[5. Kiểm thử, Ghi chép Topic & Lưu Audit Log]
```

---

## Bước 1: Phân Tích & Lập Kế Hoạch

1. Xác định rõ yêu cầu kỹ thuật, nguồn dữ liệu (PostgreSQL, WAF, API).
2. Viết kế hoạch kỹ thuật vào `implementation_plan.md` trong thư mục artifacts:
   - Mô tả mục tiêu, bài toán kỹ thuật.
   - Danh sách tệp `[NEW]` / `[MODIFY]`.
   - Kế hoạch kiểm thử tự động và thủ công.
3. **Lưu trữ audit log bắt buộc (GEMINI.md Rule 6):**
   - Sao chép bản kế hoạch sang: `docs/logs/<STT>_<YYYYMMDD_HHMMSS>_implementation_plan.md`
   - Cập nhật dòng trạng thái vào: `docs/logs/INDEX.md`
   - **Chờ người dùng phê duyệt trước khi viết mã nguồn.**

---

## Bước 2: Khởi Tạo Cấu Trúc Module Chuẩn

Mọi tính năng nằm trong `src/modules/<feature-name>/`:

```
src/modules/<feature-name>/
├── <feature>.types.ts     # TypeScript interfaces (mỗi file ≤ 120 dòng)
├── <feature>.service.ts   # Database & service logic (mỗi file ≤ 180 dòng)
├── <feature>.routes.ts    # REST API routes (mỗi file ≤ 170 dòng)
└── index.ts               # Public API: chỉ export những gì bên ngoài cần
```

---

## Bước 3: Xây Dựng Backend & Database

1. Đảm bảo connection pool (`pg.Pool`), giải phóng connection sau truy vấn.
2. Với thao tác đọc/ghi lớn, sử dụng parameterized query và batch insert.
3. Đảm bảo circuit breaker và rate limiting bảo vệ WAF.

---

## Bước 4: Tích Hợp Giao Diện (Frontend)

1. Tách nhỏ Vue components trong `static/js/components/*.js` (mỗi file ≤ 180 dòng).
2. Giao tiếp qua REST API hoặc SSE (`/api/stream`).
3. Loading skeleton và xử lý lỗi trực quan.

---

## Bước 5: Kiểm Thử, Ghi Chép Topic & Lưu Audit Log

1. Chạy kiểm tra số dòng: không có file nào vượt quá 200 dòng.
2. Kiểm tra type safety: `npx tsc --noEmit` không có lỗi.
3. Tạo tài liệu Topic trong `docs/topics/topic-XX-<name>.md` và cập nhật `docs/TOPICS.md`.
4. Tạo `walkthrough.md`, sao chép sang `docs/logs/<STT>_<YYYYMMDD_HHMMSS>_walkthrough.md`, cập nhật `docs/logs/INDEX.md`.
