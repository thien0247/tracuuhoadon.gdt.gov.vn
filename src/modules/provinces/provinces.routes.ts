// @id 01M4V0HMKMKJ8KJM7W9Y8ZC1AW
// @related 01M4V0FH0C5JKJFSR38G6JSD62, 01M4V0FGZJ7X5P2WVWRKXB1XSB, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/provinces/provinces.routes.ts
 * REST API Endpoints quản lý tỉnh thành, thông số hệ thống và reset.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  loadProvinces,
  getProvincesCache,
  createProvince,
  deleteProvince,
  updateProvinceTargets,
  fetchProvinceStats,
  detectProvinceMaxTin,
  updateProvinceMaxTin,
  syncAllProvincesMaxTin
} from './provinces.service.js';
import type { CreateProvinceDto, UpdateTargetsDto, UpdateMaxTinDto } from './provinces.types.js';
import { env, saveSystemConfig, type SystemConfig } from '../../config/index.js';
import { getWorkerStatus, stopAllCrawlers } from '../crawler/index.js';
import { dbStatsCache } from '../stream/index.js';

export const provincesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get('/api/configs/provinces', async (_req, reply) => {
    await loadProvinces();
    return reply.send({ provinces: getProvincesCache() });
  });

  fastify.get('/api/provinces', async (_req, reply) => {
    const cache = getProvincesCache();
    const workerStatus = await getWorkerStatus();
    const engines = workerStatus?.engines || {};

    const res: Record<string, unknown> = {};
    for (const [name, cfg] of Object.entries(cache)) {
      const eng = engines[name];
      const count = dbStatsCache[name]?.db_count || 0;
      res[name] = {
        prefix: cfg.prefix,
        activation_tin: cfg.activation_tin,
        count,
        running: eng ? Boolean(eng.is_running) : false,
        paused: eng ? Boolean(eng.is_paused) : false
      };
    }
    return reply.send({ provinces: res });
  });

  fastify.post<{ Body: CreateProvinceDto }>('/api/configs/provinces', async (req, reply) => {
    const { name, prefix, activation_tin } = req.body || {};
    if (!name || !prefix || !activation_tin) {
      return reply.status(400).send({ error: 'Thiếu thông tin tỉnh thành bắt buộc' });
    }
    await createProvince({ name, prefix, activation_tin });
    return reply.send({ success: true });
  });

  fastify.delete<{ Params: { pid: string } }>('/api/configs/provinces/:pid', async (req, reply) => {
    const pid = parseInt(req.params.pid, 10);
    if (isNaN(pid)) return reply.status(400).send({ error: 'ID tỉnh thành không hợp lệ' });
    await deleteProvince(pid);
    return reply.send({ success: true });
  });

  fastify.post<{ Params: { pid: string }; Body: UpdateTargetsDto }>(
    '/api/configs/provinces/:pid/targets',
    async (req, reply) => {
      const pid = parseInt(req.params.pid, 10);
      if (isNaN(pid)) return reply.status(400).send({ error: 'ID tỉnh thành không hợp lệ' });
      await updateProvinceTargets(pid, req.body || {});
      return reply.send({ success: true });
    }
  );

  fastify.get<{ Params: { key: string } }>('/api/provinces/:key/max-tin-detect', async (req, reply) => {
    try {
      const key = decodeURIComponent(req.params.key);
      const res = await detectProvinceMaxTin(key);
      return reply.send(res);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  fastify.post<{ Params: { key: string }; Body: UpdateMaxTinDto }>('/api/provinces/:key/max-tin', async (req, reply) => {
    try {
      const key = decodeURIComponent(req.params.key);
      const res = await updateProvinceMaxTin(key, req.body || { max_tin: '' });
      return reply.send(res);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  fastify.post('/api/provinces/sync-all-max-tin', async (_req, reply) => {
    const res = await syncAllProvincesMaxTin();
    return reply.send({ success: true, ...res });
  });

  fastify.get('/api/provinces/stats', async (_req, reply) => {
    const stats = await fetchProvinceStats();
    return reply.send(stats);
  });

  const getSysConfig = async () => ({
    max_global_rps: env.maxGlobalRps,
    max_concurrent_requests: env.maxConcurrentRequests,
    stagger_delay_seconds: env.staggerDelaySeconds,
    waf_cooldown_seconds: env.wafCooldownSeconds
  });

  fastify.get('/api/config/system', getSysConfig);
  fastify.get('/api/configs/system', getSysConfig);

  const updateSysConfig = async (req: { body?: Partial<SystemConfig> }, reply: { send: (data: unknown) => unknown }) => {
    const saved = saveSystemConfig(req.body || {});
    return reply.send({
      success: true,
      config: {
        max_global_rps: saved.maxGlobalRps,
        max_concurrent_requests: saved.maxConcurrentRequests,
        stagger_delay_seconds: saved.staggerDelaySeconds,
        waf_cooldown_seconds: saved.wafCooldownSeconds
      }
    });
  };

  fastify.post<{ Body: Partial<SystemConfig> }>('/api/config/system', updateSysConfig);
  fastify.post<{ Body: Partial<SystemConfig> }>('/api/configs/system', updateSysConfig);

  fastify.post('/api/system/reset', async (_req, reply) => {
    await stopAllCrawlers().catch(() => null);
    await loadProvinces();
    return reply.send({ message: 'Đã reset bộ nhớ và dừng toàn bộ tiến trình thành công.' });
  });
};
