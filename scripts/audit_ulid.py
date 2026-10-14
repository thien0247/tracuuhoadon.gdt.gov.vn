# @id 01M4V3PYAUDIT0000000000001
"""
scripts/audit_ulid.py
Công cụ kiểm toán tự động toàn diện chuẩn định danh bất biến ULID trong dự án:
1. Xác thực 100% tài liệu docs/ có suffix ULID và YAML Frontmatter id hợp lệ.
2. Xác thực 100% tệp mã nguồn (src/, frontend/src/, server_app/, crawler_core/, service_gui_csharp/)
   đã có header @id ULID hợp lệ trên dòng 1.
3. Kiểm tra tính duy nhất (Uniqueness) — Phát hiện và cảnh báo nếu có trùng lặp (Collision = 0).
4. Kiểm tra giới hạn dòng code (target < 180 lines, hard cap 200 lines) theo quy chuẩn GEMINI.md.
"""

import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Set

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from server_app.core.ulid import is_valid_ulid

ULID_FILE_SUFFIX_REGEX = re.compile(r" - ([0-9A-HJKMNP-TV-Z]{26})\.md$")
FRONTMATTER_ID_REGEX = re.compile(r"^---\r?\n.*?id:\s*[\"']?([0-9A-HJKMNP-TV-Z]{26})[\"']?.*?\r?\n---", re.DOTALL)
CODE_HEADER_ID_REGEX = re.compile(r"@id\s+([0-9A-HJKMNP-TV-Z]{26})")

SCAN_CODE_DIRS = [
    (PROJECT_ROOT / "src", [".ts", ".tsx", ".js"]),
    (PROJECT_ROOT / "frontend" / "src", [".ts", ".js", ".vue"]),
    (PROJECT_ROOT / "server_app", [".py"]),
    (PROJECT_ROOT / "crawler_core", [".py"]),
    (PROJECT_ROOT / "service_gui_csharp", [".cs"]),
]

IGNORE_DIRS = {"node_modules", "dist", ".next", ".git", ".gemini", "obj", "bin", "__pycache__"}


def audit_documents():
    docs_dir = PROJECT_ROOT / "docs"
    doc_results = []
    
    # Target files in docs/, docs/playbooks/, docs/topics/
    target_files = []
    for p in docs_dir.glob("*.md"):
        if p.is_file() and p.name.upper() != "TOPICS.MD":
            target_files.append(p)
    for p in (docs_dir / "playbooks").glob("*.md"):
        if p.is_file():
            target_files.append(p)
    for p in (docs_dir / "topics").glob("*.md"):
        if p.is_file():
            target_files.append(p)

    for p in target_files:
        rel = p.relative_to(PROJECT_ROOT)
        content = p.read_text(encoding="utf-8")
        
        # Check suffix
        suffix_match = ULID_FILE_SUFFIX_REGEX.search(p.name)
        suffix_ulid = suffix_match.group(1) if suffix_match else None
        
        # Check frontmatter
        fm_match = FRONTMATTER_ID_REGEX.search(content)
        fm_ulid = fm_match.group(1) if fm_match else None

        valid_suffix = bool(suffix_ulid and is_valid_ulid(suffix_ulid))
        valid_fm = bool(fm_ulid and is_valid_ulid(fm_ulid))
        matched = (suffix_ulid == fm_ulid) if (suffix_ulid and fm_ulid) else False

        doc_results.append({
            "path": str(rel),
            "ulid": suffix_ulid or fm_ulid,
            "valid_suffix": valid_suffix,
            "valid_fm": valid_fm,
            "matched": matched,
            "ok": valid_suffix and valid_fm and matched
        })

    return doc_results


def audit_code_files():
    code_results = []

    for base_dir, exts in SCAN_CODE_DIRS:
        if not base_dir.exists():
            continue
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for file in files:
                f_path = Path(root) / file
                if f_path.suffix.lower() in exts:
                    rel = f_path.relative_to(PROJECT_ROOT)
                    content = f_path.read_text(encoding="utf-8")
                    lines = content.splitlines()
                    line_count = len(lines)

                    # Look for @id in the first 5 lines
                    header_chunk = "\n".join(lines[:5])
                    match = CODE_HEADER_ID_REGEX.search(header_chunk)
                    found_ulid = match.group(1) if match else None
                    valid = bool(found_ulid and is_valid_ulid(found_ulid))

                    code_results.append({
                        "path": str(rel),
                        "ulid": found_ulid,
                        "valid": valid,
                        "lines": line_count,
                        "line_ok": line_count <= 200,
                        "ideal_ok": line_count <= 180
                    })

    return code_results


def main():
    print("=" * 70)
    print("=== KIEM TOAN TOAN DIEN CHUAN DINH DANH BAT BIEN ULID & GEMINI.MD ===")
    print("=" * 70)

    # 1. Audit Docs
    doc_res = audit_documents()
    docs_ok = sum(1 for d in doc_res if d["ok"])
    print(f"\n[1] KIEM TOAN TAI LIEU DOCS (docs/, topics/, playbooks/):")
    print(f"    Tong so tai lieu kiem tra : {len(doc_res)}")
    print(f"    Tai lieu dat chuan ULID   : {docs_ok}/{len(doc_res)} ({(docs_ok/len(doc_res)*100):.1f}%)")
    
    doc_errors = [d for d in doc_res if not d["ok"]]
    if doc_errors:
        print("    [!] Cac tai lieu chua dat chuan:")
        for d in doc_errors:
            print(f"      - {d['path']} (Suffix OK: {d['valid_suffix']}, FM OK: {d['valid_fm']})")

    # 2. Audit Code
    code_res = audit_code_files()
    code_ulid_ok = sum(1 for c in code_res if c["valid"])
    code_hard_ok = sum(1 for c in code_res if c["line_ok"])
    code_ideal_ok = sum(1 for c in code_res if c["ideal_ok"])

    print(f"\n[2] KIEM TOAN TEP MA NGUON (TypeScript, Vue, Python, C#):")
    print(f"    Tong so tep ma nguon       : {len(code_res)}")
    print(f"    Tep co header @id hop le   : {code_ulid_ok}/{len(code_res)} ({(code_ulid_ok/len(code_res)*100):.1f}%)")
    print(f"    Tep dat Hard Cap <= 200    : {code_hard_ok}/{len(code_res)} ({(code_hard_ok/len(code_res)*100):.1f}%)")
    print(f"    Tep dat Ideal Target <= 180: {code_ideal_ok}/{len(code_res)} ({(code_ideal_ok/len(code_res)*100):.1f}%)")

    code_missing = [c for c in code_res if not c["valid"]]
    if code_missing:
        print("    [!] Cac file thieu @id ULID:")
        for c in code_missing:
            print(f"      - {c['path']}")

    code_over_200 = [c for c in code_res if not c["line_ok"]]
    if code_over_200:
        print("    [!] VI PHAM HARD CAP 200 DONG:")
        for c in code_over_200:
            print(f"      - {c['path']} ({c['lines']} dong)")

    # 3. Collision Check
    all_ulids: Dict[str, List[str]] = {}
    for d in doc_res:
        if d["ulid"]:
            all_ulids.setdefault(d["ulid"], []).append(d["path"])
    for c in code_res:
        if c["ulid"]:
            all_ulids.setdefault(c["ulid"], []).append(c["path"])

    collisions = {u: paths for u, paths in all_ulids.items() if len(paths) > 1}
    print(f"\n[3] KIEM TRA TRUNG LAP MA DINH DANH (COLLISION DETECTION):")
    print(f"    Tong so ULID da kiem tra   : {len(all_ulids)}")
    print(f"    So truong hop trung lap    : {len(collisions)}")

    if collisions:
        print("    [!] PHAT HIEN TRUNG LAP ULID:")
        for u, paths in collisions.items():
            print(f"      - ULID {u}: {', '.join(paths)}")

    # Summary
    all_passed = (len(doc_errors) == 0 and len(code_missing) == 0 and 
                  len(code_over_200) == 0 and len(collisions) == 0)

    print("\n" + "=" * 70)
    if all_passed:
        print(">>> KET LUAN: KIEM TOAN THANH CONG 100%! TAT CA CHUAN DEU DAT YEU CAU! <<<")
    else:
        print(">>> KET LUAN: CAN DIEU CHINH MOT SO MUC CHUA DAT <<<")
    print("=" * 70)

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
