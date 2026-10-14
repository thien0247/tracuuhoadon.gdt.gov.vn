// @id 01M4W0APJR0000000000000004
// @related 01M4W0GRPH0000000000000001, 01M4V0HMJMKZ2T6WCWR7Q0PEW5

import path from 'node:path';
import fs from 'node:fs';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: { file: string } },
): Promise<NextResponse> {
  const file = path.basename(context.params.file || '');
  const filePath = path.resolve(process.cwd(), 'graphify-out', file);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const contentType = file.endsWith('.html')
      ? 'text/html; charset=utf-8'
      : file.endsWith('.json')
        ? 'application/json; charset=utf-8'
        : 'text/plain; charset=utf-8';
    const content = fs.readFileSync(filePath);
    return new NextResponse(new Uint8Array(content), {
      headers: { 'Content-Type': contentType },
    });
  }

  return NextResponse.json(
    { message: `Route GET:/graphify-out/${file} not found`, error: 'Not Found', statusCode: 404 },
    { status: 404 },
  );
}
