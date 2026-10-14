---
name: {{project}}-workflow
description: >-
  Standard end-to-end development workflow for creating, upgrading, or refactoring
  modules and features in {{PROJECT_NAME}}. Use this skill when asked to develop a
  new module, add a sub-feature, integrate backend and frontend, document a Topic,
  or manage audit logs.
---

# {{PROJECT_NAME}} — Module Development Workflow

Quy trình chuẩn hóa 5 bước để phát triển, nâng cấp hoặc tái cấu trúc bất kỳ
module hoặc tính năng nào trong dự án.

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

1. Xác định rõ nguồn dữ liệu (URL, endpoint, tham số request, file export nếu có).
2. Viết kế hoạch kỹ thuật vào `implementation_plan.md` trong thư mục artifacts:
   - Mô tả mục tiêu, bài toán nghiệp vụ.
   - Danh sách tệp `[NEW]` / `[MODIFY]`.
   - Kế hoạch kiểm thử tự động và thủ công.
3. **Lưu trữ audit log bắt buộc (GEMINI.md Rule 5):**
   - Sao chép bản kế hoạch sang: `docs/logs/<STT>_<YYYYMMDD_HHMMSS>_implementation_plan.md`
   - Cập nhật dòng trạng thái vào: `docs/logs/INDEX.md`
   - **Chờ người dùng phê duyệt trước khi viết mã nguồn.**

---

## Bước 2: Khởi Tạo Cấu Trúc Module Chuẩn

Mọi tính năng nằm trong `src/modules/<feature-name>/`:

```
src/modules/<feature-name>/
├── components/    # Các component nội bộ (mỗi file ≤ 250 dòng)
├── hooks/         # Custom hooks quản lý state (mỗi file ≤ 150 dòng)
├── services/      # API client fetch dữ liệu (mỗi file ≤ 200 dòng)
├── types/         # TypeScript interfaces & types (mỗi file ≤ 150 dòng)
├── utils/         # Hàm tiện ích nội bộ (mỗi file ≤ 150 dòng)
├── styles/        # Modular CSS nếu tổng CSS vượt 250 dòng
└── index.ts       # Public API: chỉ export những gì bên ngoài cần
```

**Nguyên tắc đóng gói (Encapsulation):**
```ts
// ✅ Đúng — import qua index.ts:
import { FeatureView } from './modules/feature-name';

// ❌ Sai — import sâu vào nội bộ (bị từ chối):
import { SubTable } from './modules/feature-name/components/SubTable';
```

---

## Bước 3: Xây Dựng Backend API & Database

1. **Database (PostgreSQL):**
   - Đặt tên bảng có tiền tố domain: `<domain>_*` (ví dụ: `user_mgmt_*`, `report_*`).
   - Đánh index trên các field thường lọc (`period`, `user_id`, `department_code`).
2. **Python/Node API:**
   - Nếu logic ngắn (≤ 50 dòng), tích hợp vào file server chính.
   - Nếu phức tạp, tách thành service riêng (≤ 200 dòng) rồi import vào router.

---

## Bước 4: Xây Dựng Frontend UI & State

1. Định nghĩa Type an toàn (0 `any`) trong `types/index.ts`.
2. Tạo service fetch trong `services/<feature>Service.ts`.
3. Tạo custom hook quản lý state trong `hooks/use<Feature>.ts`.
4. Chia nhỏ giao diện thành sub-components độc lập:
   - Stats Panel: `<Feature>StatsPanel.tsx`
   - Control Bar: `<Feature>ControlBar.tsx`
   - Data Table: `<Feature>Table.tsx`
5. Tuân thủ **Enterprise Premium Dashboard**:
   - Tương thích Dark/Light mode.
   - Có Loading Skeleton / Spinner rõ ràng.
   - Xử lý Empty State trang nhã khi không có dữ liệu.

---

## Bước 5: Kiểm Thử, Ghi Chép Topic & Lưu Audit Log

1. **Build kiểm tra:**
   ```bash
   cd web-app && npm run build
   # Bắt buộc exit code 0, không có bất kỳ lỗi TS nào
   ```
2. **Khởi chạy và test thực tế:**
   - Backend: `python {{api_server}}.py {{BACKEND_PORT}}`
   - Frontend: `cd web-app && npm run dev`
3. **Kiểm thử trực quan:** Dùng `browser_subagent` ghi hình video `.webp` + chụp
   ảnh màn hình nghiệm thu.
4. **Ghi chép tài liệu Topic:**
   - Tạo/cập nhật `docs/topics/topic-XX-<ten>.md`.
   - Cập nhật mục tóm tắt trong `docs/TOPICS.md`.
5. **Lưu trữ báo cáo nghiệm thu:**
   - Tạo `walkthrough.md` trong thư mục artifacts.
   - Sao chép sang `docs/logs/<STT>_<YYYYMMDD_HHMMSS>_walkthrough.md`.
   - Cập nhật trạng thái `✅ Hoàn thành` vào `docs/logs/INDEX.md`.

---

## Checklist Hoàn Thành Module

- [ ] Giới hạn dòng code của toàn bộ file không vượt ngưỡng `GEMINI.md`
- [ ] 0 lỗi TypeScript (`npm run build` trả về exit code 0)
- [ ] Module chỉ export component gốc qua `index.ts`
- [ ] Đã chụp ảnh màn hình và ghi video kiểm thử trực quan
- [ ] Đã cập nhật `docs/topics/`, `docs/TOPICS.md`, `docs/logs/INDEX.md`
