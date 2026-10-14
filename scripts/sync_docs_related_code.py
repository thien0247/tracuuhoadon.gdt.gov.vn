# @id 01M4V3PYSYNCDOCS000000001
"""
scripts/sync_docs_related_code.py
Thu thập siêu dữ liệu @related từ 136 tệp mã nguồn và đồng bộ ngược hai chiều
vào trường `related_code: [...]` trong YAML Frontmatter của các tài liệu docs/*.md.
"""

import os
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Set

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
from server_app.core.ulid import is_valid_ulid

SCAN_CODE_DIRS = [
    (PROJECT_ROOT / "src", [".ts", ".js"]),
    (PROJECT_ROOT / "frontend" / "src", [".ts", ".js", ".vue"]),
    (PROJECT_ROOT / "server_app", [".py"]),
    (PROJECT_ROOT / "crawler_core", [".py"]),
    (PROJECT_ROOT / "service_gui_csharp", [".cs"]),
]
IGNORE_DIRS = {"node_modules", "dist", ".git", ".gemini", "obj", "bin", "__pycache__"}
DOC_ID_REGEX = re.compile(r"^---\r?\n.*?id:\s*[\"']?([0-9A-HJKMNP-TV-Z]{26})[\"']?", re.DOTALL)


def collect_doc_code_relations() -> Dict[str, Set[str]]:
    """Quét 136 tệp code để tìm các mã doc ULID được tham chiếu trong @related."""
    doc_to_codes = defaultdict(set)
    for base_dir, exts in SCAN_CODE_DIRS:
        if not base_dir.exists(): continue
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                p = Path(root) / f
                if p.suffix.lower() in exts:
                    content = p.read_text(encoding="utf-8", errors="ignore")
                    lines = content.splitlines()[:5]
                    header = "\n".join(lines)
                    m_id = re.search(r"@id\s+([0-9A-HJKMNP-TV-Z]{26})", header)
                    m_rel = re.search(r"@related\s+([0-9A-HJKMNP-TV-Z\s,]+)", header)
                    if m_id and m_rel:
                        code_id = m_id.group(1)
                        rel_ids = [r.strip() for r in m_rel.group(1).split(",") if is_valid_ulid(r.strip())]
                        for rid in rel_ids:
                            doc_to_codes[rid].add(code_id)
    return doc_to_codes


def update_doc_frontmatter(doc_path: Path, code_ids: List[str]):
    content = doc_path.read_text(encoding="utf-8")
    if not content.startswith("---"):
        return
    parts = content.split("---", 2)
    if len(parts) < 3:
        return

    fm_raw, body = parts[1].strip(), parts[2]
    # Loại bỏ trường related_code cũ nếu có
    fm_clean = re.sub(r"related_code:\s*\n(?:\s+-\s+[0-9A-HJKMNP-TV-Z]{26}\r?\n)*", "", fm_raw)

    # Thêm related_code mới
    code_block = "related_code:\n" + "".join(f"  - {cid}\n" for cid in sorted(code_ids))
    new_fm = fm_clean.strip() + "\n" + code_block
    new_content = f"---\n{new_fm}---\n{body.lstrip()}"
    doc_path.write_text(new_content, encoding="utf-8")



def main():
    doc_to_codes = collect_doc_code_relations()
    docs_dir = PROJECT_ROOT / "docs"
    all_docs = list(docs_dir.glob("*.md")) + list((docs_dir / "playbooks").glob("*.md")) + list((docs_dir / "topics").glob("*.md"))
    
    updated = 0
    for doc in all_docs:
        if not doc.is_file() or doc.name.upper() == "TOPICS.MD": continue
        content = doc.read_text(encoding="utf-8", errors="ignore")
        m = DOC_ID_REGEX.search(content)
        if m:
            doc_id = m.group(1)
            codes = sorted(list(doc_to_codes.get(doc_id, set())))
            if codes:
                update_doc_frontmatter(doc, codes)
                updated += 1
    print(f"[sync_docs_related_code] Đã đồng bộ trường related_code cho {updated}/{len(all_docs)} tài liệu docs!")


if __name__ == "__main__":
    main()
