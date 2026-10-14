// @id 01M4W0APJR0000000000000002
// @related 01M4V0HMJMKZ2T6WCWR7Q0PEW5, 01M4W0APJR0000000000000001

import { NextRequest, NextResponse } from 'next/server';
import { dispatchApiRequest } from '@/app';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  return dispatchApiRequest(req);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  return dispatchApiRequest(req);
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  return dispatchApiRequest(req);
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  return dispatchApiRequest(req);
}
