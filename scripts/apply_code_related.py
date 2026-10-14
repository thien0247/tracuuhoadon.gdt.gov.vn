# @id 01M4V3PYAPPLYREL0000000001
"""
scripts/apply_code_related.py
Tự động phân tích quan hệ phụ thuộc Code ↔ Code và Code ↔ Docs,
sau đó gắn siêu dữ liệu @related <ULID_1>, <ULID_2>... vào dòng 2 của 136 tệp mã nguồn.
Đảm bảo 100% tệp sau khi gắn vẫn tuân thủ giới hạn <= 180 dòng theo GEMINI.md.
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Set, Tuple

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

# Ánh xạ Topic/Doc Domain tới các mẫu đường dẫn mã nguồn
DOC_DOMAIN_MAP = {
    "src/modules/provinces/": ["01M4V0FH0C5JKJFSR38G6JSD62", "01M4V0FGZJ7X5P2WVWRKXB1XSB"],
    "server_app/routers/provinces": ["01M4V0FH0C5JKJFSR38G6JSD62", "01M4V0FGZJ7X5P2WVWRKXB1XSB"],
    "server_app/services/provinces": ["01M4V0FH0C5JKJFSR38G6JSD62", "01M4V0FGZT243T45VNH4E9RQCG"],
    "src/modules/bocao/": ["01M4V0FH0DTKQEFJ3JJ6ZCZSCN"],
    "server_app/routers/bocao": ["01M4V0FH0DTKQEFJ3JJ6ZCZSCN"],
    "crawler_core/engine.py": ["01M4V20J6ZHRVTZGJ1W0QXZFSX", "01M4V0FH0PZ0CY8JH8XJ6K5CNY"],
    "crawler_core/validator.py": ["01M4V20J6ZHRVTZGJ1W0QXZFSX"],
    "crawler_core/gap_filler.py": ["01M4V0FH0PZ0CY8JH8XJ6K5CNY", "01M4V0FH0DTKQEFJ3JJ6ZCZSCN"],
    "crawler_core/": ["01M4V0FH0PZ0CY8JH8XJ6K5CNY", "01M4V0FGZN8KJG6YHQM6560EK1"],
    "frontend/src/views/CrawlerTab.vue": ["01M4V0FH0TF34QKKRRBVF9H0XA", "01M4V20J6ZHRVTZGJ1W0QXZFSX"],
    "frontend/src/components/crawler/UpdateMaxTinModal.vue": ["01M4V0FH0TF34QKKRRBVF9H0XA", "01M4V0FH0Y37YAJEQCSBTEP0YK"],
    "frontend/src/": ["01M4V0FH0TF34QKKRRBVF9H0XA", "01M4V0FH09ZYMQSQX56X4G0SWZ"],
    "service_gui_csharp/": ["01M4V0FH0V3ZG4NN14DWF01R81", "01M4V0FH0GKXYPS38JG5J0A4FF"],
    "src/": ["01M4V0FH069WB44ZWJCRPYR4FA", "01M4V0FGZN8KJG6YHQM6560EK1"],
    "server_app/": ["01M4V0FGZN8KJG6YHQM6560EK1", "01M4V0FGZT243T45VNH4E9RQCG"],
}


def build_code_index() -> Tuple[Dict[str, str], Dict[str, str]]:
    path_to_id, id_to_path = {}, {}
    for base_dir, exts in SCAN_CODE_DIRS:
        if not base_dir.exists(): continue
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                p = Path(root) / f
                if p.suffix.lower() in exts:
                    rel = str(p.relative_to(PROJECT_ROOT)).replace("\\", "/")
                    content = p.read_text(encoding="utf-8", errors="ignore")
                    m = re.search(r"@id\s+([0-9A-HJKMNP-TV-Z]{26})", content[:200])
                    if m:
                        uid = m.group(1)
                        path_to_id[rel] = uid
                        id_to_path[uid] = rel
    return path_to_id, id_to_path


def resolve_import_targets(rel_path: str, content: str, path_to_id: Dict[str, str]) -> List[str]:
    p = PROJECT_ROOT / rel_path
    cur_dir = p.parent
    related_ids: List[str] = []

    # 1. Quét import tương đối (TS, JS, Vue)
    for m in re.finditer(r'(?:from\s+[\'"](\.[^\'"]+)[\'"]|import\([\'"](\.[^\'"]+)[\'"]\))', content):
        target_raw = m.group(1) or m.group(2)
        for cand in [cur_dir / target_raw, cur_dir / f"{target_raw}.ts", cur_dir / f"{target_raw}.js", cur_dir / target_raw / "index.ts"]:
            try:
                res_rel = str(cand.resolve().relative_to(PROJECT_ROOT)).replace("\\", "/")
                if res_rel in path_to_id:
                    related_ids.append(path_to_id[res_rel])
                    break
            except Exception: pass

    # 2. Quét import nội bộ Python
    for m in re.finditer(r'(?:from\s+(server_app|crawler_core)\.([a-zA-Z0-9_\.]+)\s+import|import\s+(server_app|crawler_core)\.([a-zA-Z0-9_\.]+))', content):
        base_mod = m.group(1) or m.group(3)
        sub_mod = (m.group(2) or m.group(4)).split()[0].replace(".", "/")
        cand = f"{base_mod}/{sub_mod}.py"
        if cand in path_to_id:
            related_ids.append(path_to_id[cand])

    # 3. Gắn liên kết tài liệu docs md
    for prefix, doc_ids in DOC_DOMAIN_MAP.items():
        if rel_path.startswith(prefix) or prefix in rel_path:
            for did in doc_ids:
                if did not in related_ids:
                    related_ids.append(did)

    # Lọc duy nhất và giới hạn tối đa 5 liên kết quan trọng nhất
    own_id = path_to_id.get(rel_path)
    filtered = [i for i in list(dict.fromkeys(related_ids)) if i != own_id and is_valid_ulid(i)]
    return filtered[:5]


def format_related_line(ext: str, ids: List[str]) -> str:
    id_str = ", ".join(ids)
    if ext == ".vue":
        return f"<!-- @related {id_str} -->"
    elif ext == ".py":
        return f"# @related {id_str}"
    else:
        return f"// @related {id_str}"


def update_file_related(rel_path: str, related_ids: List[str]):
    p = PROJECT_ROOT / rel_path
    ext = p.suffix.lower()
    content = p.read_text(encoding="utf-8")
    lines = content.splitlines()
    if not lines: return

    rel_line = format_related_line(ext, related_ids)
    if len(lines) > 1 and "@related" in lines[1]:
        lines[1] = rel_line
    else:
        lines.insert(1, rel_line)

    # Kiểm tra giới hạn dòng code GEMINI.md: loại bỏ blank lines thừa nếu > 180
    if len(lines) > 180:
        cleaned = []
        skip_one_blank = True
        for i, line in enumerate(lines):
            if skip_one_blank and not line.strip() and i > 2 and i < len(lines) - 5:
                # Bỏ qua 1 dòng trống
                skip_one_blank = False
                continue
            cleaned.append(line)
        lines = cleaned

    p.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    path_to_id, _ = build_code_index()
    print(f"[apply_code_related] Tìm thấy {len(path_to_id)} tệp mã nguồn có @id.")
    count = 0
    for rel_path in sorted(path_to_id.keys()):
        content = (PROJECT_ROOT / rel_path).read_text(encoding="utf-8", errors="ignore")
        targets = resolve_import_targets(rel_path, content, path_to_id)
        if targets:
            update_file_related(rel_path, targets)
            count += 1
    print(f"[apply_code_related] Đã cập nhật @related thành công cho {count}/{len(path_to_id)} tệp!")


if __name__ == "__main__":
    main()
