---
name: gdt-standards
description: >-
  Strict TypeScript, Python, and Clean Code standards for GDT Tax Crawler & Search Engine.
  Use this skill whenever writing, refactoring, or reviewing code to enforce line limits (<200 lines),
  zero any, connection pooling, and encapsulation.
---

# GDT Tax Crawler — Strict Standards & Line Limits

Quy chuẩn lập trình bắt buộc áp dụng cho toàn bộ mã nguồn trong dự án theo quy định tại `GEMINI.md`.

---

## 1. Giới Hạn Số Dòng Code

### 1.1. Giới Hạn Theo File
- **File mã nguồn (.ts, .py, .js):** Tối đa 200 dòng (mục tiêu 100 – 160 dòng).
- **File HTML Template / UI:** Tối đa 220 dòng.
- **File Type Definition (.ts):** Tối đa 150 dòng.

### 1.2. Giới Hạn Theo Hàm
- **Hàm / Method:** Tối đa 45 dòng.
- **Callback / Handler:** Tối đa 25 dòng.
- **Inline Arrow:** Tối đa 5 dòng.
- **Số tham số:** ≤ 4 tham số (vượt quá phải gộp vào Object).

---

## 2. Quy Tắc TypeScript Bất Biến

### 2.1. Cấm Tuyệt Đối Kiểu `any`
Sử dụng Generic type, Type Guards hoặc `unknown`:
```ts
// ❌ Sai:
const processData = (data: any) => data.items;

// ✅ Đúng:
interface ApiResponse<T> {
  items: T[];
  total: number;
}
const processData = <T>(data: ApiResponse<T>): T[] => data.items;
```

### 2.2. Bắt Buộc Dùng `import type`
```ts
// ✅ Đúng:
import type { ProvinceRecord } from './provinces.types.js';
import { fetchProvinces } from './provinces.service.js';
```

---

## 3. Quy Chuẩn Database & An Toàn WAF

1. **Connection Pool:** Bắt buộc dùng `pg.Pool` (Node.js) hoặc `ThreadedConnectionPool` (Python).
2. **Batch Insert:** Ghi theo lô bản ghi MST vào `tax_records` để tối ưu I/O.
3. **WAF Protection:** Mọi request ra ngoài phải qua `safe_request_guard` kiểm soát RPS.
