---
name: {{project}}-standards
description: >-
  Strict TypeScript, React, and Clean Code standards for {{PROJECT_NAME}}.
  Use this skill whenever writing, refactoring, or reviewing TypeScript code,
  React components (.tsx), hooks (.ts), services, types, or CSS to enforce
  line limits, zero any, and verbatimModuleSyntax compliance.
---

# {{PROJECT_NAME}} — Strict TypeScript & Clean Code Standards

Quy chuẩn lập trình bắt buộc áp dụng cho toàn bộ mã nguồn TypeScript, React
và CSS trong dự án theo quy định tại `GEMINI.md`.

---

## 1. Bảng Giới Hạn Số Dòng Code

### 1.1. Giới Hạn Theo Loại Tệp

| Loại tệp | Giới hạn tối đa | Hành động bắt buộc khi vượt ngưỡng |
|:---|:---:|:---|
| **React Component (`.tsx`)** | **200 - 250 dòng** | Tách sub-components hoặc custom hooks |
| **Custom Hook (`useX.ts`)** | **150 dòng** | Tách reducer, action hoặc helper logic |
| **Service / API Client (`.ts`)** | **200 dòng** | Chia theo domain hoặc tách HTTP helper |
| **Utility / Helper (`.ts`)** | **150 dòng** | Tách thành các hàm chuyên biệt |
| **Type Definition (`.ts`)** | **150 dòng** | Chia tách theo domain/feature models |
| **CSS / Styling File** | **250 dòng** | Tách thành modular CSS |

### 1.2. Giới Hạn Theo Hàm & Khối Lệnh

| Đối tượng | Giới hạn tối đa | Quy tắc xử lý |
|:---|:---:|:---|
| **Hàm thông thường** | **50 dòng** | Tách thành hàm phụ trợ độc lập |
| **Callback / Event Handler** | **30 dòng** | Gọi hàm xử lý riêng có tên |
| **Arrow function inline** | **5 dòng** | Khai báo hàm có tên ở phạm vi component |
| **Số tham số của hàm** | **≤ 4 tham số** | Nhiều hơn gộp vào `Props` / `Options` object |
| **Độ dài ký tự trên 1 dòng** | **120 ký tự** | Xuống dòng có thụt lề |

---

## 2. Quy Tắc TypeScript Bất Biến

### 2.1. Cấm Tuyệt Đối Kiểu `any`

Sử dụng Generic type, Discriminated Union hoặc `unknown` kèm Type Guard:

```ts
// ❌ Sai:
const handleData = (res: any) => res.data;

// ✅ Đúng:
interface ApiResponse<T> {
  data: T;
  status: number;
}
const handleData = <T>(res: ApiResponse<T>): T => res.data;
```

### 2.2. Bắt Buộc Dùng `import type`

Dự án bật `verbatimModuleSyntax: true`. Mọi type/interface phải dùng `import type`:

```ts
// ✅ Đúng:
import React, { useState, useMemo } from 'react';
import type { UserData, ApiResponse } from '../types';

// ❌ Sai — gây lỗi TS build:
import { useState, UserData } from 'react';
```

### 2.3. Quy Tắc Đặt Tên (Naming Conventions)

| Đối tượng | Convention | Ví dụ |
|:---|:---|:---|
| **Component / Interface / Type** | `PascalCase` | `UserTable`, `ApiResponse<T>` |
| **Custom Hook** | `useCamelCase` | `useUserFilter`, `useThemeMode` |
| **Hàm / Biến** | `camelCase` | `calculateTotal`, `selectedDate` |
| **Hằng số** | `UPPER_SNAKE_CASE` | `MAX_PAGE_SIZE`, `DEFAULT_YEAR` |
| **Tên tệp component / view** | `PascalCase.tsx` | `UserTableView.tsx` |
| **Tên tệp hook / service** | `camelCase.ts` | `userService.ts` |
| **Tên thư mục** | `kebab-case` | `user-management`, `control-panel` |

---

## 3. Kỹ Thuật Tái Cấu Trúc Khi Gần Ngưỡng Dòng

### 3.1. Tách Logic Lọc & Sắp Xếp Ra Hook Riêng

Khi component bảng + filter + tính tổng vượt 250 dòng:
1. Tạo `hooks/use<Feature>Filter.ts` (≤ 150 dòng) đóng gói `useMemo` tính
   `filteredRows`, `visibleColumns`, `footerTotals`.
2. Component chỉ giữ JSX render và state UI cơ bản (`filterText`, `sortField`).

### 3.2. Tách CSS Sang Modular

Khi file CSS > 250 dòng, tạo thư mục `styles/`:

```css
/* <feature>.css — Master Import file */
@import './styles/<feature>-common.css';   /* Header, KPI cards, control bar */
@import './styles/<feature>-tables.css';   /* Tables, sticky cols, footer, filters */
```

---

## 4. Lệnh Kiểm Tra Quy Chuẩn Nhanh

```bash
# 1. Kiểm tra biên dịch TypeScript nghiêm ngặt (0 lỗi)
cd web-app && npm run build

# 2. Kiểm tra số dòng code của các file trong module (PowerShell)
Get-ChildItem -Recurse web-app/src/modules/<feature-name> `
  -Include *.tsx,*.ts,*.css |
  ForEach-Object {
    "$($_.FullName): $((Get-Content $_.FullName).Count) lines"
  }
```
