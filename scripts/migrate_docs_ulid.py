"""
scripts/migrate_docs_ulid.py
Chuyen doi ten tai lieu va them Frontmatter ULID vao docs/, docs/topics/, docs/playbooks/.
"""

import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from server_app.core.ulid import generate_ulid, is_valid_ulid

DOCS_DIR = PROJECT_ROOT / "docs"
TARGET_DIRS = [
    DOCS_DIR,
    DOCS_DIR / "playbooks",
    DOCS_DIR / "topics"
]

ULID_FILE_SUFFIX_REGEX = re.compile(r" - ([0-9A-HJKMNP-TV-Z]{26})\.md$")
FRONTMATTER_REGEX = re.compile(r"^---\r?\n(.*?)\r?\n---\r?\n", re.DOTALL)


def process_markdown_file(file_path: Path):
    rel_path = file_path.relative_to(PROJECT_ROOT)
    # Skip TOPICS.md (will be updated separately), and skip docs/logs/
    if file_path.name.upper() == "TOPICS.MD" or "logs" in file_path.parts:
        return None

    filename = file_path.name
    stem = file_path.stem
    match_suffix = ULID_FILE_SUFFIX_REGEX.search(filename)
    
    if match_suffix:
        ulid = match_suffix.group(1)
        base_name = filename[:match_suffix.start()]
    else:
        ulid = generate_ulid()
        base_name = stem

    raw_content = file_path.read_text(encoding="utf-8")
    now_iso = datetime.now(timezone.utc).isoformat()

    # Check existing frontmatter
    fm_match = FRONTMATTER_REGEX.match(raw_content)
    body = raw_content[fm_match.end():] if fm_match else raw_content

    # Aliases
    aliases = [base_name, f"{base_name}.md"]
    aliases_str = "\n".join([f'  - "{a}"' for a in aliases])

    frontmatter = f"""---
id: "{ulid}"
aliases:
{aliases_str}
created_at: "{now_iso}"
type: "documentation"
---
"""
    new_content = frontmatter + body.lstrip()

    new_filename = f"{base_name} - {ulid}.md"
    new_path = file_path.parent / new_filename

    # Write content
    if new_path != file_path:
        file_path.unlink()
    new_path.write_text(new_content, encoding="utf-8")

    return {
        "old_name": filename,
        "new_name": new_filename,
        "old_path": str(file_path),
        "new_path": str(new_path),
        "base_name": base_name,
        "ulid": ulid
    }


def main():
    print(f"[*] Bat dau chuan hoa ten tai lieu va inject ULID vao {DOCS_DIR}...")
    migrated = []
    
    # 1. Process files in docs/ (non-recursive first, then specific subdirs)
    for p in DOCS_DIR.glob("*.md"):
        if p.is_file():
            res = process_markdown_file(p)
            if res:
                migrated.append(res)

    for p in (DOCS_DIR / "playbooks").glob("*.md"):
        if p.is_file():
            res = process_markdown_file(p)
            if res:
                migrated.append(res)

    for p in (DOCS_DIR / "topics").glob("*.md"):
        if p.is_file():
            res = process_markdown_file(p)
            if res:
                migrated.append(res)

    print(f"[+] Da xu ly thanh cong {len(migrated)} tai lieu.")
    for item in migrated:
        print(f"  - {item['old_name']} -> {item['new_name']} (ULID: {item['ulid']})")

    # Update docs/TOPICS.md
    update_topics_index(migrated)


def update_topics_index(migrated):
    topics_file = DOCS_DIR / "TOPICS.md"
    if not topics_file.exists():
        return

    content = topics_file.read_text(encoding="utf-8")
    
    # Map base_name to new_name
    mapping = {m["base_name"]: m["new_name"] for m in migrated}

    for base_name, new_name in mapping.items():
        # Replace topic-XX-something.md with new filename
        pattern = re.escape(f"{base_name}.md")
        content = re.sub(pattern, new_name, content)
        # Also replace bare link
        pattern_bare = re.escape(base_name)
        content = re.sub(rf"\]\(topics/{pattern_bare}\)", f"](topics/{new_name})", content)

    topics_file.write_text(content, encoding="utf-8")
    print(f"[+] Da cap nhat muc luc {topics_file}")


if __name__ == "__main__":
    main()
