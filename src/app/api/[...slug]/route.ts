// @id 01M4W0APJR0000000000000002
// @related 01M4V0HMJMKZ2T6WCWR7Q0PEW5, 01M4W0APJR0000000000000001

import { NextRequest, NextResponse } from 'next/server';
import type { FastifyInstance } from 'fastify';
import { createApp } from '@/app';

let appPromise: Promise<FastifyInstance> | null = null;

async function getFastifyApp(): Promise<FastifyInstance> {
  if (!appPromise) {
    appPromise = createApp().then(async (instance) => {
      await instance.ready();
      return instance;
    });
  }
  return appPromise;
}

async function handleApiBridge(req: NextRequest): Promise<NextResponse> {
  const fastify = await getFastifyApp();
  const url = new URL(req.url);
  const fullPath = `${url.pathname}${url.search}`;

  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k] = v;
  });

  let payload: string | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    try {
      payload = await req.text();
    } catch {
      payload = undefined;
    }
  }

  const res = await fastify.inject({
    method: req.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: fullPath,
    headers,
    payload,
  });

  const resHeaders = new Headers();
  Object.entries(res.headers).forEach(([k, v]) => {
    if (v !== undefined) {
      resHeaders.set(k, Array.isArray(v) ? v.join(', ') : String(v));
    }
  });

  return new NextResponse(new Uint8Array(res.rawPayload), {
    status: res.statusCode,
    headers: resHeaders,
  });
}

export async function GET(req: NextRequest) {
  return handleApiBridge(req);
}

export async function POST(req: NextRequest) {
  return handleApiBridge(req);
}

export async function PUT(req: NextRequest) {
  return handleApiBridge(req);
}

export async function DELETE(req: NextRequest) {
  return handleApiBridge(req);
}
