# Bảng Kiểm Tra Refactor & Giới Hạn Dòng Code

## 1. Giới Hạn Dòng Code Bắt Buộc

Mọi file trong dự án phải tuân thủ nghiêm ngặt:
- **Mục tiêu lý tưởng:** 100 – 180 dòng / file.
- **Ngưỡng kiểm tra tự động (`test_modular.py`):** Tối đa không vượt quá **200 dòng / file**.
- **Hard cap tuyệt đối:** 250 dòng.

## 2. Kỹ Thuật Tinh Gọn File Dưới 200 Dòng

1. **Gộp Import (Import Consolidation):**
   Thay vì tách mỗi class/function trên một dòng riêng biệt, hãy gom nhóm:
   ```python
   # Trước (10 dòng)
   from module import (
       func_a,
       func_b,
       func_c
   )
   # Sau (1 dòng)
   from module import func_a, func_b, func_c
   ```

2. **Tách Sub-module Theo Chức Năng:**
   - Đặt schema vào `server_app/schemas/`.
   - Đặt logic điều khiển vào `server_app/routers/`.
   - Đặt cấu hình vào `server_app/core/config.py`.
   - Đặt kết nối CSDL vào `server_app/core/database.py`.

3. **Frontend Component Hóa:**
   - Mỗi component Vue 3 đặt tại `static/js/components/*.js`.
   - Mỗi component chỉ phụ trách 1 khung nhìn (Grid, List, Search, Filter, Config).
   - Component không vượt quá 180 dòng.

4. **Kiểm Tra Nhanh Bằng Lệnh:**
   ```powershell
   Get-ChildItem -Recurse -Include *.py,*.js | ForEach-Object { [PSCustomObject]@{ File=$_.Name; Lines=(Get-Content $_.FullName | Measure-Object -Line).Lines } } | Where-Object { $_.Lines -gt 200 }
   ```
