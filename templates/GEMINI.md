# Quy Chuẩn Lập Trình & Giới Hạn Code — Dự Án {{PROJECT_NAME}}

> **Bắt buộc áp dụng:** Tất cả các thành phần mã nguồn trong dự án phải tuân thủ
> nghiêm ngặt các quy chuẩn dưới đây. Mọi vi phạm về độ dài dòng code hoặc kiến
> trúc module sẽ bị từ chối và yêu cầu tái cấu trúc.

---

## 1. Giới Hạn Số Dòng Code (Line Limits)

Nhằm đảm bảo tính dễ đọc, dễ bảo trì, dễ kiểm thử và tuân thủ nguyên lý
Đơn trách nhiệm (Single Responsibility Principle):

### 1.1. Giới hạn theo File

| Loại tệp | Giới hạn tối đa | Hành động khi vượt ngưỡng |
|:---|:---:|:---|
| **React Component (`.tsx`)** | **200 - 250 dòng** | Tách thành các sub-components hoặc custom hooks |
| **Custom Hook (`useX.ts`)** | **150 dòng** | Tách reducer, action hoặc helper logic |
| **Service / API Client (`.ts`)** | **200 dòng** | Chia theo domain hoặc tách HTTP helper |
| **Utility / Helper (`.ts`)** | **150 dòng** | Tách thành các hàm chuyên biệt |
| **Type Definition (`.ts`)** | **150 dòng** | Chia tách theo domain/feature models |
| **CSS / Styling File** | **250 dòng** | Chia theo component hoặc modular CSS |

### 1.2. Giới hạn theo Hàm & Khối lệnh

| Đối tượng | Giới hạn tối đa | Ghi chú |
|:---|:---:|:---|
| **Hàm thông thường** | **50 dòng** | Nếu dài hơn, tách thành các hàm phụ trợ |
| **Callback / Event Handler** | **30 dòng** | Gọi hàm xử lý riêng, không viết inline logic dài |
| **Arrow function inline** | **5 dòng** | Nếu dài hơn, khai báo thành hàm độc lập có tên |
| **Số tham số của hàm** | **≤ 4 tham số** | Nhiều hơn phải gộp vào `Props` hoặc `Options` object |
| **Độ dài ký tự trên 1 dòng** | **120 ký tự** | Xuống dòng có thụt lề khi vượt quá 120 ký tự |

---

## 2. Kiến Trúc Hướng Module (Modular Architecture)

Dự án được tổ chức theo kiến trúc **Domain/Feature-Driven Modules**.
Mã nguồn được đặt trong `src/modules/<module-name>/`.

### 2.1. Cấu trúc chuẩn của một Module

```
src/modules/<feature-name>/
├── components/    # Các component nội bộ của module (mỗi file ≤ 250 dòng)
├── hooks/         # Custom hooks quản lý state/logic của module (≤ 150 dòng)
├── services/      # API call, fetch data liên quan đến module (≤ 200 dòng)
├── types/         # TypeScript interfaces & types riêng của module (≤ 150 dòng)
├── utils/         # Hàm tiện ích nội bộ (≤ 150 dòng)
├── styles/        # Modular CSS nếu tổng CSS vượt 250 dòng
└── index.ts       # Public API: Chỉ export những gì module khác cần dùng
```

### 2.2. Quy tắc giao tiếp giữa các Module

1. **Encapsulation:** Các file bên ngoài module **CHỈ ĐƯỢC PHÉP** import thông qua
   file `index.ts` của module đó. Tuyệt đối không import sâu vào nội bộ.
   ```ts
   // ✅ Đúng:
   import { UserTable } from './modules/user-management';
   // ❌ Sai (Bị từ chối):
   import { UserRow } from './modules/user-management/components/UserRow';
   ```
2. **Loosely Coupled:** Các module giao tiếp với nhau qua `props`, `custom events`
   hoặc `shared context/store`, không tạo phụ thuộc vòng (circular dependencies).

---

## 3. Quy Chuẩn TypeScript & Clean Code

1. **Strict Type Safety:**
   - Tuyệt đối **KHÔNG DÙNG `any`**. Sử dụng `unknown`, generic hoặc định nghĩa
     kiểu chính xác.
   - Bật toàn bộ flags: `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.
   - Bật `verbatimModuleSyntax: true` → bắt buộc dùng `import type` cho type/interface.

2. **Quy tắc đặt tên (Naming Conventions):**
   - **Component / Type / Interface:** `PascalCase` (ví dụ: `UserTable`, `ApiResponse`).
   - **Custom Hook:** `useCamelCase` (ví dụ: `useUserFilter`, `useThemeMode`).
   - **Hàm / Biến:** `camelCase` (ví dụ: `calculateTotal`, `selectedDate`).
   - **Hằng số:** `UPPER_SNAKE_CASE` (ví dụ: `MAX_PAGE_SIZE`, `DEFAULT_YEAR`).
   - **Tên thư mục:** `kebab-case` (ví dụ: `user-management`, `control-panel`).

3. **Thẩm mỹ giao diện (UI/UX Standards):**
   - Tuân thủ phong cách **Enterprise Premium Dashboard**: Dark/Light mode linh hoạt,
     Glassmorphism tinh tế, bảng số liệu dễ nhìn, font chữ Inter/Quicksand cao cấp.
   - Có trạng thái **Loading Skeleton** và **Error Boundary** rõ ràng, không để màn
     hình trắng hay vỡ layout khi lỗi mạng.

---

## 4. Quy Định Ghi Chép Tài Liệu Theo Topic (Topic Documentation)

Mọi phân tích, kiến trúc, thay đổi và giai đoạn triển khai đều phải được ghi chép
và lưu trữ đầy đủ trong thư mục `docs/` dạng Markdown:

- `docs/TOPICS.md`: Mục lục và nội dung chi tiết các Topic từ nghiên cứu đến nghiệm thu.
- `docs/topics/topic-XX-<ten>.md`: Nội dung chi tiết từng Topic.
- Mỗi Topic phải có: Tiêu đề rõ ràng, Mô tả mục tiêu, Giải pháp kỹ thuật,
  Bằng chứng kiểm thử/nghiệm thu.

---

## 5. Quy Định Lưu Trữ Kế Hoạch & Nhật Ký Thực Thi

Nhằm đảm bảo tính minh bạch, khả năng truy vết và lưu trữ nhật ký lâu dài:

1. **Tự động lưu trữ kế hoạch và kết quả:** Mỗi khi tạo hoặc cập nhật
   `implementation_plan.md` và `walkthrough.md`, bản sao phải được lưu vào `docs/logs/`.
2. **Quy tắc đặt tên có Thứ tự + Thời gian:**
   - Cú pháp: `<STT>_<YYYYMMDD_HHMMSS>_<loai_tai_lieu>.md`
   - Ví dụ: `01_20260916_070700_implementation_plan.md`
3. **Mục lục theo dõi (Audit Log Index):** Duy trì file `docs/logs/INDEX.md` tổng
   hợp toàn bộ danh sách các phiên lập kế hoạch và nghiệm thu kèm liên kết Markdown.
