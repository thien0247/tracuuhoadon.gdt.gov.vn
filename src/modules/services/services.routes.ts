// @id 01M4V0HMKZ342AVKBY8R7T82E8
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/services/services.routes.ts
 * REST API Endpoints điều khiển và giám sát các dịch vụ liên quan.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { ServicesService } from './services.service.js';
import { ServicesDiagService } from './services.diag.js';
import type { ServiceControlDto } from './services.types.js';

export const servicesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Chẩn đoán chuyên sâu sức khỏe hệ thống
  fastify.get('/api/services/diagnostics', async (_req, reply) => {
    try {
      const data = await ServicesDiagService.runSystemDiagnostics();
      return reply.send(data);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // Tự phục hồi hệ thống khi có sự cố
  fastify.post('/api/services/auto_heal', async (_req, reply) => {
    try {
      const result = await ServicesDiagService.executeAutoHeal();
      return reply.send(result);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });
  // Lấy tổng quan trạng thái các dịch vụ
  fastify.get('/api/services/status', async (_req, reply) => {
    try {
      const data = await ServicesService.getOverview();
      return reply.send(data);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // Điều khiển tác vụ trên một dịch vụ cụ thể
  fastify.post<{ Body: ServiceControlDto }>('/api/services/control', async (req, reply) => {
    try {
      const { service_id, action } = req.body || {};
      if (!service_id || !action) {
        return reply.status(400).send({ error: 'Thiếu trường service_id hoặc action hợp lệ' });
      }
      const result = await ServicesService.executeControl(req.body);
      return reply.send(result);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // Khởi động lại toàn bộ dịch vụ an toàn
  fastify.post('/api/services/restart_all', async (_req, reply) => {
    try {
      const result = await ServicesService.executeControl({
        service_id: 'gdt_windows_service',
        action: 'restart'
      });
      return reply.send(result);
    } catch (err) {
      return reply.status(500).send({ error: (err as Error).message });
    }
  });

  // Endpoint tương thích ngược
  fastify.post('/api/system/restart', async (_req, reply) => {
    const result = await ServicesService.executeControl({ service_id: 'gdt_windows_service', action: 'restart' });
    return reply.send(result);
  });
};
