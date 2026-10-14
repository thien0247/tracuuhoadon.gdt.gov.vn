# 📁 Templates — AI Agent Configuration

Thư mục chứa các template cấu hình AI Agent có thể tái sử dụng cho dự án mới,
được tổng hợp từ dự án **VDDS VNPT Đắk Lắk**.

---

## 📂 Cấu Trúc Thư Mục

```
templates/
├── README.md                          ← File này
├── GEMINI.md                          ← Rules bắt buộc cho AI Agent
├── mcp_config.json                    ← Cấu hình MCP Servers
└── skills/
    ├── project-workflow/
    │   └── SKILL.md                   ← Quy trình phát triển module 5 bước
    ├── project-standards/
    │   └── SKILL.md                   ← TypeScript & Clean Code standards
    ├── project-testing/
    │   └── SKILL.md                   ← Testing & visual verification
    └── project-data-sync/
        └── SKILL.md                   ← ETL / Data sync (tùy chọn)
```

---

## 🚀 Hướng Dẫn Áp Dụng Cho Dự Án Mới

### Bước 1: Sao chép file vào dự án đích

```bash
# Tạo cấu trúc thư mục
mkdir -p <dự-án-mới>/.agents/skills/{<project>-workflow,<project>-standards,<project>-testing}

# Sao chép từng file
cp templates/GEMINI.md          <dự-án-mới>/GEMINI.md
cp templates/mcp_config.json    <dự-án-mới>/.agents/mcp_config.json
cp templates/skills/project-workflow/SKILL.md  <dự-án-mới>/.agents/skills/<project>-workflow/SKILL.md
# ... tương tự với các skill khác
```

### Bước 2: Thay thế Placeholder

| Placeholder | Ý nghĩa | Ví dụ |
|:---|:---|:---|
| `{{PROJECT_NAME}}` | Tên dự án đầy đủ | `My Enterprise App` |
| `{{project}}` | Slug lowercase | `myapp` |
| `{{FRONTEND_PORT}}` | Port dev server | `3000` |
| `{{BACKEND_PORT}}` | Port API server | `8000` |
| `{{DB_HOST}}` | Host PostgreSQL | `localhost` |
| `{{DB_PORT}}` | Port PostgreSQL | `5432` |
| `{{DB_NAME}}` | Tên database | `myapp_db` |
| `{{DB_USER}}` | Username | `myuser` |
| `{{DB_PASSWORD}}` | Password | `secret` |
| `{{api_server}}` | Tên file Python server | `api_server` |

### Bước 3: Xóa hoặc thêm Skills

- **Xóa** `project-data-sync` nếu không cần ETL / sync dữ liệu ngoài.
- **Thêm** skill domain-specific cho các nghiệp vụ đặc thù (GIS, Payroll, CRM…).

---

## 💡 Triết Lý Thiết Kế

| Nguyên tắc | Áp dụng |
|:---|:---|
| **Single Responsibility** | Mỗi file/hàm làm đúng 1 việc, giới hạn dòng nghiêm ngặt |
| **Encapsulation** | Module chỉ lộ public API qua `index.ts` |
| **Type Safety** | Zero `any`, 100% typed, strict TS config |
| **Audit Trail** | Mọi thay đổi có `implementation_plan` + `walkthrough` theo timestamp |
| **Visual Verification** | Mọi UI feature phải có video + screenshot nghiệm thu |
| **Documentation First** | Mọi topic có tài liệu trước khi code |
