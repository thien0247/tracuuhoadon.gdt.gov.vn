// @id 01M4V0HMM5TXCCZS2MD4YR0G6D
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/stream/stream.routes.ts
 * Next.js Native Web ReadableStream Server-Sent Events (SSE) Endpoint (/api/stream).
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildStreamPayload, startDbStatsWorker } from './stream.service.js';
import { generateUlid } from '../../utils/ulid.js';

let workerStarted = false;

export function handleStreamRoutes(
  req: NextRequest,
  pathname: string,
  method: string,
): NextResponse | null {
  if (pathname !== '/api/stream' || method !== 'GET') return null;

  if (!workerStarted) {
    workerStarted = true;
    startDbStatsWorker();
  }

  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      timer = setInterval(async () => {
        if (closed) return;
        try {
          const payload = await buildStreamPayload();
          if (!closed) {
            const eventId = generateUlid();
            controller.enqueue(encoder.encode(`id: ${eventId}\ndata: ${payload}\n\n`));
          }
        } catch {
          /* ignore transient SSE error */
        }
      }, 500);

      req.signal.addEventListener('abort', () => {
        closed = true;
        if (timer) clearInterval(timer);
        try { controller.close(); } catch { /* ignore */ }
      });
    },
    cancel() {
      closed = true;
      if (timer) clearInterval(timer);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
