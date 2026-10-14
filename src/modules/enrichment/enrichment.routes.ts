// @id 01M4V0HMK8GCYJGZZW1JBSEZ37
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/enrichment/enrichment.routes.ts
 * REST API router cho Module Làm Giàu & Bổ Sung Dữ Liệu Thuế (Enrichment).
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { EnrichmentService } from './enrichment.service.js';
import { getProvincesCache } from '../provinces/index.js';

function resolveProvinceInfo(key: string): { prefix: string; name: string } {
  const clean = decodeURIComponent(key).trim();
  const cache = getProvincesCache();
  for (const name in cache) {
    if (cache[name].prefix === clean) return { prefix: clean, name };
    if (name.toLowerCase().includes(clean.toLowerCase()) || clean.toLowerCase().includes(name.toLowerCase())) {
      return { prefix: cache[name].prefix, name };
    }
  }
  return { prefix: clean, name: `Tỉnh (${clean})` };
}

export const enrichmentRoutes: FastifyPluginAsync = async (fastify) => {
  // Thống kê tổng quan dữ liệu bổ sung toàn quốc và 62 tỉnh
  fastify.get('/api/enrichment/summary', async (_req, reply: FastifyReply) => {
    const summary = await EnrichmentService.getNationalSummary();
    return reply.send(summary);
  });

  // Lấy tiến trình thời gian thực của toàn bộ các Job đồng bộ đang chạy
  fastify.get('/api/enrichment/jobs', async (_req, reply: FastifyReply) => {
    const jobs = EnrichmentService.getAllJobs();
    return reply.send({ jobs });
  });

  // Lấy tiến trình thời gian thực của một tỉnh cụ thể
  fastify.get('/api/enrichment/jobs/:provinceKey', async (
    req: FastifyRequest<{ Params: { provinceKey: string } }>,
    reply: FastifyReply
  ) => {
    const { prefix } = resolveProvinceInfo(req.params.provinceKey);
    const job = EnrichmentService.getJobProgress(prefix);
    return reply.send({ prefix, job });
  });

  // Tra cứu & bổ sung thông tin NNT cho 1 MST (chỉ cập nhật khi API tồn tại)
  fastify.get('/api/enrichment/:tin', async (
    req: FastifyRequest<{ Params: { tin: string } }>,
    reply: FastifyReply
  ) => {
    const { tin } = req.params;
    if (!tin) return reply.status(400).send({ error: 'Mã số thuế không được để trống' });
    const result = await EnrichmentService.enrichSingleRecord(tin);
    if (!result) return reply.status(404).send({ error: 'Không tìm thấy dữ liệu cho MST này' });
    return reply.send(result);
  });

  // Làm sạch / Reset dữ liệu suy đoán không chuẩn xác để đồng bộ chuẩn từ API
  fastify.post('/api/enrichment/reset-unverified', async (
    req: FastifyRequest<{ Body?: { prefix?: string } }>,
    reply: FastifyReply
  ) => {
    const prefix = req.body?.prefix;
    const result = await EnrichmentService.resetUnverifiedRecords(prefix);
    return reply.send({
      message: `Đã dọn dẹp ${result.affectedRows} bản ghi về trạng thái chờ đồng bộ chuẩn từ API`,
      ...result
    });
  });

  // Kiểm tra trạng thái & tỷ lệ hoàn thành dữ liệu bổ sung của 1 tỉnh
  fastify.get('/api/enrichment/province/:provinceKey/status', async (
    req: FastifyRequest<{ Params: { provinceKey: string } }>,
    reply: FastifyReply
  ) => {
    const { prefix, name } = resolveProvinceInfo(req.params.provinceKey);
    const status = await EnrichmentService.getProvinceStatus(prefix, req.params.provinceKey);
    return reply.send({ ...status, provinceName: name });
  });

  // Bắt đầu tiến trình nền đồng bộ trực tuyến API Xinvoice cho toàn bộ tỉnh
  fastify.post('/api/enrichment/province/:provinceKey/start', async (
    req: FastifyRequest<{ Params: { provinceKey: string } }>,
    reply: FastifyReply
  ) => {
    const { prefix, name } = resolveProvinceInfo(req.params.provinceKey);
    const started = EnrichmentService.startProvinceOnlineQueue(prefix, name);
    return reply.send({
      provinceKey: req.params.provinceKey, prefix, provinceName: name, started,
      message: started ? 'Đã khởi động tiến trình đồng bộ nền API' : 'Tiến trình đang chạy sẵn cho tỉnh này'
    });
  });

  // Dừng tiến trình nền đồng bộ trực tuyến cho 1 tỉnh
  fastify.post('/api/enrichment/province/:provinceKey/stop', async (
    req: FastifyRequest<{ Params: { provinceKey: string } }>,
    reply: FastifyReply
  ) => {
    const { prefix, name } = resolveProvinceInfo(req.params.provinceKey);
    const stopped = EnrichmentService.stopProvinceOnlineQueue(prefix);
    return reply.send({ provinceKey: req.params.provinceKey, prefix, provinceName: name, stopped });
  });
};
