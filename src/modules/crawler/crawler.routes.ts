// @id 01M4V0HMK2V308VQKSFW10XZ8F
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/crawler/crawler.routes.ts
 * REST API Endpoints điều khiển tiến trình crawler đa tỉnh.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  startCrawler,
  startAllNewest,
  stopCrawler,
  pauseCrawler,
  resumeCrawler,
  stopAllCrawlers,
  getQueueStatus,
  getScheduleStatus,
  toggleScheduleNewest,
  toggleScheduleGapFill,
  triggerScheduleNewest,
  triggerScheduleGapFill,
  setScheduleGapFillMode
} from './crawler.service.js';
import type {
  StartCrawlerDto,
  StartAllNewestDto,
  ProvinceControlDto
} from './crawler.types.js';

export const crawlerRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.post<{ Body: StartCrawlerDto }>('/api/crawler/start', async (req, reply) => {
    try {
      const res = await startCrawler(req.body);
      return reply.send(res);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.post<{ Body: StartAllNewestDto }>('/api/crawler/start_all_newest', async (req, reply) => {
    try {
      const res = await startAllNewest(req.body);
      return reply.send(res);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.post<{ Body: StartAllNewestDto }>('/api/crawler/start_all', async (req, reply) => {
    try {
      const res = await startAllNewest(req.body);
      return reply.send(res);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.get('/api/crawler/queue_status', async (_req, reply) => {
    const status = await getQueueStatus();
    return reply.send(status);
  });

  fastify.post<{ Body: ProvinceControlDto }>('/api/crawler/stop', async (req, reply) => {
    const provKey = req.body?.province_key;
    if (!provKey) return reply.status(400).send({ error: 'Thiếu province_key' });
    try {
      const res = await stopCrawler(provKey);
      return reply.send(res);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.post<{ Body: ProvinceControlDto }>('/api/crawler/pause', async (req, reply) => {
    const provKey = req.body?.province_key;
    if (!provKey) return reply.status(400).send({ error: 'Thiếu province_key' });
    try {
      const res = await pauseCrawler(provKey);
      return reply.send(res);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.post<{ Body: ProvinceControlDto }>('/api/crawler/resume', async (req, reply) => {
    const provKey = req.body?.province_key;
    if (!provKey) return reply.status(400).send({ error: 'Thiếu province_key' });
    try {
      const res = await resumeCrawler(provKey);
      return reply.send(res);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.post('/api/crawler/stop_all', async (_req, reply) => {
    try {
      const res = await stopAllCrawlers();
      return reply.send(res);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.get('/api/crawler/schedule/status', async (_req, reply) => {
    try {
      return reply.send(await getScheduleStatus());
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.post<{ Body: { enable?: boolean } }>('/api/crawler/schedule/toggle_newest', async (req, reply) => {
    try {
      return reply.send(await toggleScheduleNewest(req.body?.enable));
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.post<{ Body: { enable?: boolean } }>('/api/crawler/schedule/toggle_gap_fill', async (req, reply) => {
    try {
      return reply.send(await toggleScheduleGapFill(req.body?.enable));
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.post('/api/crawler/schedule/trigger_newest', async (_req, reply) => {
    try {
      return reply.send(await triggerScheduleNewest());
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.post('/api/crawler/schedule/trigger_gap_fill', async (_req, reply) => {
    try {
      return reply.send(await triggerScheduleGapFill());
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.post('/api/crawler/gap_fill_500/start_all', async (_req, reply) => {
    try {
      return reply.send(await triggerScheduleGapFill());
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  fastify.post<{ Body: { reset_on_existing: boolean } }>('/api/crawler/schedule/gap_fill_mode', async (req, reply) => {
    try {
      return reply.send(await setScheduleGapFillMode(req.body?.reset_on_existing ?? true));
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });
};
