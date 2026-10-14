// @id 01M4V0HMJWCK2J48D609JNWFV9
// @related 01M4V0FH0DTKQEFJ3JJ6ZCZSCN, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/bocao/bocao.routes.ts
 * Đăng ký các REST API endpoints cho Module Bố Cáo Điện Tử.
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { BocaoService } from './bocao.service.js';
import { BocaoReconcileService } from './bocao-reconcile.service.js';
import type { BocaoFilterQuery, BocaoReconcileQuery } from './bocao.types.js';

export const bocaoRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  /**
   * GET /api/bocao/records - Lấy danh sách bố cáo với phân trang và tìm kiếm
   */
  app.get<{ Querystring: BocaoFilterQuery }>('/api/bocao/records', async (req, reply) => {
    try {
      const data = await BocaoService.getRecords(req.query);
      return reply.send(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.status(500).send({ error: 'Lỗi truy vấn bố cáo', details: msg });
    }
  });

  /**
   * GET /api/bocao/stats - Thống kê dữ liệu bố cáo điện tử
   */
  app.get('/api/bocao/stats', async (_req, reply) => {
    try {
      const stats = await BocaoService.getStats();
      return reply.send(stats);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.status(500).send({ error: 'Lỗi thống kê bố cáo', details: msg });
    }
  });

  /**
   * POST /api/bocao/crawl - Kích hoạt cào trang đầu tiên
   */
  app.post('/api/bocao/crawl', async (_req, reply) => {
    try {
      const result = await BocaoService.triggerCrawl();
      return reply.send(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.status(500).send({ error: 'Lỗi kích hoạt cào bố cáo', details: msg });
    }
  });

  /**
   * POST /api/bocao/crawl-all - Kích hoạt cào toàn bộ các trang bố cáo
   */
  app.post<{ Body: { max_pages?: number } }>('/api/bocao/crawl-all', async (req, reply) => {
    try {
      const maxPages = Number(req.body?.max_pages) || 5;
      const result = await BocaoService.triggerCrawlAll(maxPages);
      return reply.send(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.status(500).send({ error: 'Lỗi kích hoạt cào toàn bộ bố cáo', details: msg });
    }
  });

  /**
   * POST /api/bocao/dkkd-search - Tra cứu doanh nghiệp trực tuyến trên DKKD Solr
   */
  app.post<{ Body: { search_field: string } }>('/api/bocao/dkkd-search', async (req, reply) => {
    try {
      const sf = String(req.body?.search_field || '').trim();
      if (!sf) {
        return reply.status(400).send({ error: 'search_field không được để trống' });
      }
      const result = await BocaoService.searchDkkdOnline(sf);
      return reply.send(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.status(500).send({ error: 'Lỗi tra cứu DKKD Solr', details: msg });
    }
  });

  /**
   * GET /api/bocao/reconcile - Lấy danh sách đối soát bố cáo với tax_records
   */
  app.get<{ Querystring: BocaoReconcileQuery }>('/api/bocao/reconcile', async (req, reply) => {
    try {
      const data = await BocaoReconcileService.getReconcileRecords(req.query);
      return reply.send(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.status(500).send({ error: 'Lỗi đối soát bố cáo với CSDL thuế', details: msg });
    }
  });

  /**
   * GET /api/bocao/reconcile/stats - Thống kê tổng quan tỷ lệ khớp bố cáo với tax_records
   */
  app.get('/api/bocao/reconcile/stats', async (_req, reply) => {
    try {
      const stats = await BocaoReconcileService.getReconcileStats();
      return reply.send(stats);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.status(500).send({ error: 'Lỗi thống kê đối soát', details: msg });
    }
  });

  /**
   * POST /api/bocao/reconcile/sync-missing - Kích hoạt quét bù các MST chưa có trong Thuế
   */
  app.post<{ Body: { batch_size?: number } }>('/api/bocao/reconcile/sync-missing', async (req, reply) => {
    try {
      const batchSize = Math.max(1, Math.min(200, Number(req.body?.batch_size) || 60));
      const res = await BocaoReconcileService.triggerSyncMissing(batchSize);
      return reply.send(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return reply.status(500).send({ error: 'Lỗi quét bù đối soát', details: msg });
    }
  });
};


