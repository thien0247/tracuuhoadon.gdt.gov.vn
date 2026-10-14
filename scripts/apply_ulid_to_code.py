"""
# @id 01M4V2PYCODE00000000000001
scripts/apply_ulid_to_code.py
Tự động quét và nhúng metadata @id <ULID> vào phần đầu (header) của các tệp mã nguồn
trong toàn bộ dự án: TypeScript (src/), Frontend (frontend/src/), Python (server_app/, crawler_core/),
C# (service_gui_csharp/).
Tuyệt đối không đổi tên file mã nguồn để bảo toàn module imports.
Kiểm tra nghiêm ngặt giới hạn dòng code (target < 180 lines, hard cap 200 lines).
"""

import os
import re
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from server_app.core.ulid import generate_ulid, is_valid_ulid

# Regex bắt các dạng ULID đã tồn tại
ULID_TAG_REGEX = re.compile(r"(?:@id|ulid|ULID)\s*[:=]?\s*[\"']?([0-9A-HJKMNP-TV-Z]{26})[\"']?")

SCAN_DIRECTORIES = [
    (PROJECT_ROOT / "src", [".ts", ".js"]),
    (PROJECT_ROOT / "frontend" / "src", [".ts", ".js", ".vue"]),
    (PROJECT_ROOT / "server_app", [".py"]),
    (PROJECT_ROOT / "crawler_core", [".py"]),
    (PROJECT_ROOT / "service_gui_csharp", [".cs"]),
]

IGNORE_DIRS = {"node_modules", "dist", ".git", ".gemini", "obj", "bin", "__pycache__"}


def extract_existing_ulid(content: str):
    header_chunk = content[:600]
    match = ULID_TAG_REGEX.search(header_chunk)
    if match and is_valid_ulid(match.group(1)):
        return match.group(1)
    return None


def clean_and_normalize_file(file_path: Path, ext: str):
    content = file_path.read_text(encoding="utf-8")
    existing_ulid = extract_existing_ulid(content)
    ulid = existing_ulid if existing_ulid else generate_ulid()

    lines = content.splitlines()

    # Dọn dẹp dòng @id cũ bị lỗi cú pháp nếu có
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # Bỏ các dòng trơ trọi như "@id 01M4V..." không có dấu # hoặc //
        if stripped.startswith("@id ") and is_valid_ulid(stripped[4:].strip()):
            continue
        # Bỏ các dòng comment @id ở vị trí cũ để đặt chuẩn lên dòng 1
        if (stripped.startswith("# @id ") or stripped.startswith("// @id ") or
            stripped.startswith("<!-- @id ") or stripped.startswith("/* @id ") or
            stripped.startswith("* @id ")) and is_valid_ulid(stripped.split()[-1].rstrip("*/->")):
            continue
        cleaned_lines.append(line)

    # Chèn header chuẩn vào dòng 1
    if ext == ".py":
        header = f"# @id {ulid}"
    elif ext in [".ts", ".js", ".cs"]:
        header = f"// @id {ulid}"
    elif ext == ".vue":
        header = f"<!-- @id {ulid} -->"
    elif ext == ".sql":
        header = f"-- @id {ulid}"
    elif ext == ".ps1":
        header = f"# @id {ulid}"
    else:
        header = f"// @id {ulid}"

    final_lines = [header] + cleaned_lines
    new_content = "\n".join(final_lines) + "\n"
    
    file_path.write_text(new_content, encoding="utf-8")
    line_count = len(final_lines)

    return {
        "path": str(file_path.relative_to(PROJECT_ROOT)),
        "ulid": ulid,
        "lines": line_count
    }


def main():
    print("[*] Bat dau chuan hoa va gan @id ULID vao dong 1 cua tat ca file ma nguon...")
    all_results = []
    
    for base_dir, exts in SCAN_DIRECTORIES:
        if not base_dir.exists():
            continue
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for file in files:
                f_path = Path(root) / file
                ext = f_path.suffix.lower()
                if ext in exts:
                    res = clean_and_normalize_file(f_path, ext)
                    all_results.append(res)

    print(f"\n[+] Da chuan hoa xong {len(all_results)} file ma nguon:")
    over_180 = [r for r in all_results if r["lines"] > 180]
    over_200 = [r for r in all_results if r["lines"] > 200]

    print(f"  - Tong so file: {len(all_results)}")
    print(f"  - So file > 180 dong (canh bao ly tuong): {len(over_180)}")
    print(f"  - So file > 200 dong (vi pham hard cap): {len(over_200)}")

    if over_200:
        print("\n[!] VI PHAM HARD CAP 200 DONG:")
        for r in over_200:
            print(f"    {r['path']} ({r['lines']} dong)")

    if over_180:
        print("\n[*] File tren 180 dong (canh bao ly tuong):")
        for r in over_180:
            print(f"    {r['path']} ({r['lines']} dong)")


if __name__ == "__main__":
    main()
