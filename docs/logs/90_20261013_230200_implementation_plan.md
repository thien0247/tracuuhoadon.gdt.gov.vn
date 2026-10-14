# Kế Hoạch Áp Dụng Chuẩn Định Danh Bất Biến ULID Toàn Bộ Dự Án (Bao Gồm Đổi Tên Tệp Trong Docs)

**Mã tài liệu:** `90_20261013_230200_implementation_plan.md`  
**Mã ULID:** `01M4V069EVY6CSP27QAG6GXS30`  
**Ngày lập:** 13/10/2026  
**Dự án:** GDT Tax Crawler & Multi-Province Search Engine  
**Trạng thái:** ⏳ Chờ người dùng phê duyệt (Pending Approval)  

---

## Mục Tiêu & Bối Cảnh
Áp dụng toàn diện quy chuẩn **Định Danh Bất Biến ULID (Crockford Base32 26 ký tự viết hoa)** theo đúng tiêu chuẩn của kho template RAG (`02-templates/software-project-template/docs/QUY-CHUAN-DINH-DANH-VA-THAM-CHIEU-ULID.md`).

Theo yêu cầu mới nhất của người dùng, kế hoạch mở rộng bao gồm **quy chuẩn đổi tên vật lý toàn bộ tệp tài liệu trong thư mục `docs/`** theo công thức chuẩn:
```
<Tên Bài Viết Rõ Nghĩa> - <ULID_HOA>.md
```

---

## User Review Required

> [!IMPORTANT]
> **Quy Tắc Đặt Tên & Ranh Giới (Naming Boundaries):**
> 1. **Tài liệu Markdown (`docs/**/*.md`):** Đổi tên vật lý có hậu tố ` - <ULID_HOA>.md`.
>    - Ví dụ: `docs/ARCHITECTURE - 01M4TZTR9FX6TMCJ76K6442KAP.md`
>    - Ví dụ: `docs/topics/topic-01-hybrid-ts-backend - 01M4V1A...md`
>    - Mỗi file có Frontmatter:
>      ```yaml
>      ---
>      id: "01M4V1A..."
>      title: "..."
>      category: "topics"
>      aliases:
>        - "01M4V1A..."
>        - "topic-01-hybrid-ts-backend"
>      created_at: "..."
>      ---
>      ```
> 2. **Tệp Cổng Khai Báo Gốc:** `PROJECT_MANIFEST.md` giữ tên gốc tại root (theo chuẩn Gatekeeper của template RAG) và khai báo `id: "01M4TZTR3GXKYNSV7S1QFPCX72"` trong Frontmatter.
> 3. **Tệp Mã Nguồn (`.ts`, `.py`, `.cs`, `.vue`):** Giữ nguyên tên tệp vật lý để không làm gãy `import/export`, nhưng chèn `@id ULID` vào khối chú thích Header Metadata.

---

## Proposed Changes

### Phase 1: Chuẩn Hóa Tên Tệp Tài Liệu Trong `docs/` Kèm ULID
- Core Docs (`ARCHITECTURE`, `API_CONTRACT`, `DB_SCHEMA`, `DEVOPS_RUNBOOK`)
- 15 Topics trong `docs/topics/`
- Playbooks trong `docs/playbooks/`
- Cập nhật mục lục `docs/TOPICS.md`

### Phase 2: Xây Dựng Bộ Thư Viện Sinh Mã ULID Đa Ngôn Ngữ
- `scripts/New-Ulid.ps1` (PowerShell)
- `src/utils/ulid.ts` (TypeScript)
- `server_app/core/ulid.py` (Python)
- `service_gui_csharp/Utils/UlidGenerator.cs` (C# .NET 10)

### Phase 3: Gắn Nhãn Header Metadata (@id ULID) Cho 129 Tệp Code
- `src/` (43 files TS): JSDoc `@id <ULID>`
- `frontend/src/` (42 files Vue/TS): `<AiBadge ulid="<ULID>">` và JSDoc
- `service_gui_csharp/` (14 files CS): `// ULID: <ULID>`
- `crawler_core/` (7 files PY) & `server_app/` (23 files PY): Docstring `ULID: <ULID>`

### Phase 4: Ứng Dụng ULID Vào Runtime Entities & Logs
- `useServiceManager.ts` (Log ID)
- `/api/stream` (SSE Event ID)
- `crawler_core/engine.py` (Batch Run ID)

### Phase 5: Công Cụ Kiểm Toán & Tự Động Hóa
- `scripts/audit_ulid.py`
