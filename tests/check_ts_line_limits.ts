/**
 * tests/check_ts_line_limits.ts
 * Kiểm tra tự động giới hạn số dòng code cho toàn bộ TypeScript source files (< 200 dòng).
 */

import fs from 'node:fs';
import path from 'node:path';

function scanDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function checkLimits(): void {
  const srcDir = path.resolve(process.cwd(), 'src');
  const files = scanDir(srcDir);
  console.log('=== KIỂM TRA GIỚI HẠN DÒNG CODE TYPESCRIPT (TARGET < 180, MAX 200) ===');

  let passed = true;
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8');
    const lines = content.split('\n').length;
    const relPath = path.relative(process.cwd(), f);
    const status = lines <= 200 ? 'OK (<200)' : 'EXCEEDED (>200)';
    console.log(`${relPath.padEnd(45)} : ${String(lines).padStart(4)} lines [${status}]`);
    if (lines > 200) passed = false;
  }

  if (!passed) {
    console.error('\n❌ Có tệp TypeScript vượt quá ngưỡng 200 dòng!');
    process.exit(1);
  }
  console.log('\n✅ 100% tệp TypeScript tuân thủ quy chuẩn giới hạn dòng code!\n');
}

checkLimits();
