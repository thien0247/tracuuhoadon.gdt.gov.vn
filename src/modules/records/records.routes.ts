// @id 01M4V0HMKVZHSS62XMK5WXBH1P
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/records/records.routes.ts
 * REST API Endpoints tra cứu, lọc, xuất dữ liệu và báo cáo thống kê đa chiều (HTKK V2 & V3).
 */

import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { filterRecords, searchRecords, getRecordDetail, getFilterOptions, getFilterOptionsV2, getFilterOptionsV3 } from './records.service.js';
import { exportCsvData, exportXlsxData } from './records.export.js';
import { fetchCrawlerHealthReport } from './records.health.js';
import { fetchCrawlStats, syncCrawlDailyStats } from './records.report.js';
import { fetchV2MergedStats, getV2MergedCatalog } from './records.v2report.js';
import { exportCrawlStatsToExcel, exportV2MergedStatsToExcel, exportHealthToExcel } from './records.report-export.js';
import type { FilterRequestDto, SearchRequestDto, CrawlStatsQueryDto } from './records.types.js';

function splitParam(val?: string | string[]): string[] {
  if (!val) return [];
  const arr = Array.isArray(val) ? val : [val];
  return arr.flatMap(s => s.split(',')).map(s => s.trim()).filter(Boolean);
}

export const recordsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get<{ Querystring: { province_key?: string; model?: string; province_code?: string; district_code?: string } }>(
    '/api/records/filter-options',
    async (req, reply) => {
      const { model, province_code, district_code, province_key } = req.query || {};
      if (model === 'v2') return reply.send(await getFilterOptionsV2(province_code));
      if (model === 'v3') return reply.send(await getFilterOptionsV3(province_code, district_code));
      return reply.send(await getFilterOptions(province_key || province_code || ''));
    }
  );

  fastify.post<{ Body: FilterRequestDto }>('/api/filter', async (req, reply) => {
    try { return reply.send(await filterRecords(req.body || {})); }
    catch (err) { return reply.status(400).send({ error: (err as Error).message }); }
  });

  fastify.post<{ Body: SearchRequestDto }>('/api/search', async (req, reply) => {
    try { return reply.send(await searchRecords(req.body || { query: '' })); }
    catch (err) { return reply.status(400).send({ error: (err as Error).message }); }
  });

  fastify.get<{ Querystring: { province_key?: string | string[]; from_date?: string; to_date?: string; commune_name?: string | string[]; tax_office_name?: string | string[] } }>('/api/export', async (req, reply) => {
    const { province_key, from_date, to_date, commune_name, tax_office_name } = req.query || {};
    try {
      const { filename, csvContent } = await exportCsvData(splitParam(province_key), from_date || null, to_date || null, splitParam(commune_name), splitParam(tax_office_name));
      reply.header('Content-Type', 'text/csv; charset=utf-8').header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(csvContent);
    } catch (err) { return reply.status(400).send({ error: (err as Error).message }); }
  });

  fastify.get<{ Querystring: { province_key?: string | string[]; from_date?: string; to_date?: string; commune_name?: string | string[]; tax_office_name?: string | string[] } }>('/api/export-xlsx', async (req, reply) => {
    const { province_key, from_date, to_date, commune_name, tax_office_name } = req.query || {};
    try {
      const { filename, buffer } = await exportXlsxData(splitParam(province_key), from_date || null, to_date || null, splitParam(commune_name), splitParam(tax_office_name));
      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(buffer);
    } catch (err) { return reply.status(400).send({ error: (err as Error).message }); }
  });

  fastify.get<{ Querystring: { days?: string } }>('/api/reports/crawler-health', async (req, reply) => {
    const days = parseInt(req.query?.days || '3', 10);
    return reply.send(await fetchCrawlerHealthReport(days > 0 ? days : 3));
  });

  fastify.get<{ Querystring: { days?: string } }>('/api/reports/health-excel', async (req, reply) => {
    const days = parseInt(req.query?.days || '3', 10);
    const data = await fetchCrawlerHealthReport(days > 0 ? days : 3);
    const { filename, buffer } = await exportHealthToExcel(data.provinces);
    reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').header('Content-Disposition', `attachment; filename="${filename}"`);
    return reply.send(buffer);
  });

  fastify.get<{ Querystring: CrawlStatsQueryDto }>('/api/reports/crawl-stats', async (req, reply) => {
    try { return reply.send(await fetchCrawlStats(req.query || {})); }
    catch (err) { return reply.status(500).send({ error: (err as Error).message }); }
  });

  fastify.get<{ Querystring: CrawlStatsQueryDto }>('/api/reports/crawl-stats-excel', async (req, reply) => {
    try {
      const data = await fetchCrawlStats(req.query || {});
      const { filename, buffer } = await exportCrawlStatsToExcel(data);
      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(buffer);
    } catch (err) { return reply.status(500).send({ error: (err as Error).message }); }
  });

  fastify.post('/api/reports/sync-stats', async (_req, reply) => {
    try { return reply.send({ success: true, ...(await syncCrawlDailyStats()) }); }
    catch (err) { return reply.status(500).send({ error: (err as Error).message }); }
  });

  fastify.get('/api/reports/v2-merged-stats', async (_req, reply) => {
    try { return reply.send(await fetchV2MergedStats()); }
    catch (err) { return reply.status(500).send({ error: (err as Error).message }); }
  });

  fastify.get('/api/reports/v2-provinces', async (_req, reply) => {
    return reply.send({ total: getV2MergedCatalog().length, catalog: getV2MergedCatalog() });
  });

  fastify.get('/api/reports/v2-excel', async (_req, reply) => {
    try {
      const data = await fetchV2MergedStats();
      const { filename, buffer } = await exportV2MergedStatsToExcel(data);
      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').header('Content-Disposition', `attachment; filename="${filename}"`);
      return reply.send(buffer);
    } catch (err) { return reply.status(500).send({ error: (err as Error).message }); }
  });

  fastify.get<{ Params: { tin: string } }>('/api/record/:tin', async (req, reply) => {
    const tin = req.params?.tin;
    if (!tin) return reply.status(400).send({ error: 'Mã số thuế không hợp lệ' });
    const record = await getRecordDetail(tin);
    if (!record) return reply.status(404).send({ error: 'Không tìm thấy mã số thuế' });
    return reply.send(record);
  });
};
