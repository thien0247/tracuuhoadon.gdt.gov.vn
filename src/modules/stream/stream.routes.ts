// @id 01M4V0HMM5TXCCZS2MD4YR0G6D
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/stream/stream.routes.ts
 * Server-Sent Events (SSE) Endpoint truyền dữ liệu trực tiếp về Dashboard.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { buildStreamPayload, startDbStatsWorker } from './stream.service.js';
import { generateUlid } from '../../utils/ulid.js';

export const streamRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Khởi động worker cập nhật db stats ngầm
  startDbStatsWorker();

  fastify.get('/api/stream', (req, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    reply.raw.flushHeaders?.();

    let isClosed = false;
    const interval = setInterval(async () => {
      if (isClosed) return;
      try {
        const payload = await buildStreamPayload();
        if (!isClosed) {
          const eventId = generateUlid();
          reply.raw.write(`id: ${eventId}\ndata: ${payload}\n\n`);
        }
      } catch (err) {
        console.error('[SSE Stream] Lỗi phát dữ liệu:', err);
      }
    }, 500);

    req.raw.on('close', () => {
      isClosed = true;
      clearInterval(interval);
    });
  });
};
