// @id 01M4V0HMKEPGGZD0CQX0RQQJ5E
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/htkk/htkk.routes.ts
 * REST API endpoints cho Danh mục Địa bàn Hành chính & Cơ quan thuế HTKK.
 */

import type { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { HtkkService } from './htkk.service.js';

export const htkkRoutes: FastifyPluginAsync = async (fastify) => {
  // Thống kê số lượng bản ghi các bảng danh mục HTKK
  fastify.get('/api/htkk/stats', async (_req, reply: FastifyReply) => {
    const stats = await HtkkService.getStats();
    return reply.send(stats);
  });

  // Mô hình 3 cấp (Cũ): Danh mục 63 Tỉnh/Thành phố
  fastify.get('/api/htkk/v3/provinces', async (_req, reply: FastifyReply) => {
    const provinces = await HtkkService.getProvincesV3();
    return reply.send({ total: provinces.length, provinces });
  });

  // Mô hình 3 cấp (Cũ): Danh mục Quận/Huyện theo Tỉnh
  fastify.get('/api/htkk/v3/districts/:provinceCode', async (
    req: FastifyRequest<{ Params: { provinceCode: string } }>,
    reply: FastifyReply
  ) => {
    const { provinceCode } = req.params;
    const districts = await HtkkService.getDistrictsV3(provinceCode);
    return reply.send({ provinceCode, total: districts.length, districts });
  });

  // Mô hình 3 cấp (Cũ): Danh mục Xã/Phường theo Quận/Huyện
  fastify.get('/api/htkk/v3/communes/:districtCode', async (
    req: FastifyRequest<{ Params: { districtCode: string } }>,
    reply: FastifyReply
  ) => {
    const { districtCode } = req.params;
    const communes = await HtkkService.getCommunesV3(districtCode);
    return reply.send({ districtCode, total: communes.length, communes });
  });

  // Mô hình 2 cấp (Mới): Danh mục 34 Tỉnh/Thành phố sau sáp nhập
  fastify.get('/api/htkk/v2/provinces', async (_req, reply: FastifyReply) => {
    const provinces = await HtkkService.getProvincesV2();
    return reply.send({ total: provinces.length, provinces });
  });

  // Mô hình 2 cấp (Mới): Danh mục Xã/Phường mới (ĐÃ BỎ CẤP HUYỆN)
  fastify.get('/api/htkk/v2/communes/:provinceCode', async (
    req: FastifyRequest<{ Params: { provinceCode: string } }>,
    reply: FastifyReply
  ) => {
    const { provinceCode } = req.params;
    const communes = await HtkkService.getCommunesV2(provinceCode);
    return reply.send({ provinceCode, total: communes.length, communes });
  });

  // Danh mục Cơ quan thuế / Mạng lưới Thuế cơ sở
  fastify.get('/api/htkk/tax-offices', async (
    req: FastifyRequest<{ Querystring: { provinceCode?: string } }>,
    reply: FastifyReply
  ) => {
    const { provinceCode } = req.query;
    const offices = await HtkkService.getTaxOffices(provinceCode);
    return reply.send({ total: offices.length, offices });
  });

  // Tra cứu ánh xạ chuyển đổi đa cấp & Thuế cơ sở theo mã xã
  fastify.get('/api/htkk/mapping/:communeCode', async (
    req: FastifyRequest<{ Params: { communeCode: string } }>,
    reply: FastifyReply
  ) => {
    const { communeCode } = req.params;
    const mapping = await HtkkService.getMappingByCommune(communeCode);
    if (!mapping) return reply.status(404).send({ error: 'Không tìm thấy ánh xạ cho mã địa bàn này' });
    return reply.send(mapping);
  });

  // Phân giải địa bàn 3 cấp & 2 cấp cho Người nộp thuế theo MST
  fastify.get('/api/htkk/tax-record/:tin', async (
    req: FastifyRequest<{ Params: { tin: string } }>,
    reply: FastifyReply
  ) => {
    const { tin } = req.params;
    const mapping = await HtkkService.resolveTaxpayerMapping(tin);
    if (!mapping) return reply.status(404).send({ error: 'Không tìm thấy MST hoặc không thể ánh xạ' });
    return reply.send(mapping);
  });
};
