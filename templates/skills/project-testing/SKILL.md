---
name: {{project}}-testing
description: >-
  Procedures for launching services, running TypeScript build checks, and executing
  automated visual testing with browser_subagent in {{PROJECT_NAME}}. Use this skill
  whenever asked to run servers, test UI features, verify builds, capture visual
  evidence, or create walkthrough reports.
---

# {{PROJECT_NAME}} — Testing, Server Launcher & Visual Verification

Quy chuẩn kiểm thử, vận hành server và thực thi kiểm thử tự động trực quan
bằng `browser_subagent`.

---

## 1. Vận Hành & Khởi Chạy Hệ Thống

### 1.1. Cấu Hình Cổng Dịch Vụ

| Dịch vụ | Port | Lệnh khởi chạy |
|:---|:---:|:---|
| **Frontend SPA (Vite)** | `{{FRONTEND_PORT}}` | `cd web-app && npm run dev` |
| **Backend API Server** | `{{BACKEND_PORT}}` | `python {{api_server}}.py {{BACKEND_PORT}}` |
| **PostgreSQL Database** | `{{DB_PORT}}` | — (service hệ điều hành) |

### 1.2. Khởi Chạy Khi Làm Việc Với Agent

```powershell
# Khởi chạy Backend daemon (background):
python {{api_server}}.py {{BACKEND_PORT}}

# Khởi chạy Frontend dev server daemon (background):
cd web-app; npm run dev
```

---

## 2. Quy Trình Kiểm Tra Bản Build

Trước khi kiểm thử giao diện hoặc bàn giao:

1. Chạy lệnh build kiểm tra TypeScript:
   ```bash
   cd web-app && npm run build
   ```
2. **Yêu cầu nghiêm ngặt:** Lệnh phải kết thúc với exit code 0, không có
   bất kỳ lỗi TS nào (`TS2339`, `TS7006`, `TS2307`, v.v.).
3. Kiểm tra số dòng code không vượt giới hạn trong `GEMINI.md`.

---

## 3. Kiểm Thử Trực Quan Tự Động (`browser_subagent`)

Mọi tính năng giao diện mới hoặc sửa đổi đều phải kiểm thử bằng `browser_subagent`.

### 3.1. Nguyên Tắc Soạn Prompt Cho Subagent

- Chỉ định rõ URL: `http://localhost:{{FRONTEND_PORT}}/?module=<module-name>`
- Mô tả chi tiết từng thao tác: click tab nào, nhập vào ô tìm kiếm, chọn dropdown.
- Chỉ định rõ tên và thời điểm chụp ảnh:
  - Ảnh 1: Trạng thái ban đầu / Bộ lọc active.
  - Ảnh 2: Kết quả sau tương tác / Dữ liệu đã lọc.
- Đặt `RecordingName` ngắn gọn (≤ 3 từ, lowercase, underscore):
  ```
  ví dụ: user_table_filter, report_export_test
  ```

### 3.2. Quy Tắc Nhúng Ảnh & Video Nghiệm Thu

```markdown
✅ Đúng — dùng cú pháp embed:
  ![Mô tả ảnh](file:///C:/path/to/image.png)
  ![Mô tả video](file:///C:/path/to/video.webp)

❌ Sai — cú pháp link thường KHÔNG hiển thị media:
  [Tên file](path/to/file.png)
```

---

## 4. Quy Trình Lưu Trữ Walkthrough & Audit Log

Sau khi kiểm thử hoàn tất:

1. Tạo `walkthrough.md` trong thư mục artifacts với đầy đủ:
   - Thay đổi đã thực hiện.
   - Kết quả kiểm thử thực tế.
   - Bảng tổng hợp hình ảnh minh chứng.
   - Video ghi hình phiên kiểm thử.

2. **Lưu trữ vào `docs/logs/` (GEMINI.md Rule 5):**
   ```
   docs/logs/<STT>_<YYYYMMDD_HHMMSS>_walkthrough.md
   ví dụ: docs/logs/05_20260919_143000_walkthrough.md
   ```

3. Cập nhật trạng thái `✅ Hoàn thành` vào `docs/logs/INDEX.md`.
