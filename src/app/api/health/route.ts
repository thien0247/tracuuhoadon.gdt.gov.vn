// @id 01M4W0APJR0000000000000001
// @related 01M4W0APPR0000000000000001, 01M4V0HMJMKZ2T6WCWR7Q0PEW5

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    engine: 'Pure Next.js 14 App Router',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
