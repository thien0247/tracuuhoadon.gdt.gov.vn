// @id 01M4V0HMJYNV5AZ6R4AR5N80HF
// @related 01M4V0FH0DTKQEFJ3JJ6ZCZSCN, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/bocao/bocao.service.ts
 * Nghiệp vụ truy vấn, thống kê và kích hoạt cào Bố Cáo Điện Tử từ CSDL PostgreSQL.
 */

import { query } from '../../db/index.js';
import { loadSystemConfig } from '../../config/index.js';
import type {
  BocaoRecord, BocaoFilterQuery, BocaoListResponse,
  BocaoStatsResponse, BocaoCrawlResponse, BocaoCrawlAllResponse, DkkdSearchResponse
} from './bocao.types.js';

export class BocaoService {
  /**
   * Truy vấn danh sách bố cáo với phân trang và bộ lọc linh hoạt.
   */
  static async getRecords(filter: BocaoFilterQuery): Promise<BocaoListResponse> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(filter.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.province && filter.province.trim()) {
      params.push(`%${filter.province.trim()}%`);
      conditions.push(`province_name ILIKE $${params.length}`);
    }

    if (filter.type && filter.type.trim()) {
      params.push(`%${filter.type.trim()}%`);
      conditions.push(`announcement_type ILIKE $${params.length}`);
    }

    if (filter.keyword && filter.keyword.trim()) {
      const kw = `%${filter.keyword.trim()}%`;
      params.push(kw);
      const kwIdx = params.length;
      conditions.push(`(tin ILIKE $${kwIdx} OR company_name ILIKE $${kwIdx})`);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(`SELECT COUNT(*) AS total FROM bocao_records ${whereSql}`, params);
    const total = Number(countRes.rows[0]?.total || 0);

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const rowsRes = await query<BocaoRecord>(
      `SELECT id, tin, company_name, province_name, announcement_type,
              pub_time::text, crawled_at::text, raw_data
       FROM bocao_records
       ${whereSql}
       ORDER BY pub_time DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );

    return {
      total,
      page,
      limit,
      records: rowsRes.rows
    };
  }

  /**
   * Báo cáo thống kê tổng thể dữ liệu Bố Cáo Điện Tử.
   */
  static async getStats(): Promise<BocaoStatsResponse> {
    const totalRes = await query<{ total: string; latest: string | null }>(
      'SELECT COUNT(*) AS total, MAX(pub_time)::text AS latest FROM bocao_records'
    );
    const total = Number(totalRes.rows[0]?.total || 0);
    const latestPub = totalRes.rows[0]?.latest || null;

    const typesRes = await query<{ announcement_type: string; count: number }>(`
      SELECT announcement_type, COUNT(*)::int AS count
      FROM bocao_records
      GROUP BY announcement_type
      ORDER BY count DESC
      LIMIT 10
    `);

    const provsRes = await query<{ province_name: string; count: number }>(`
      SELECT COALESCE(province_name, 'Chưa xác định') AS province_name, COUNT(*)::int AS count
      FROM bocao_records
      GROUP BY province_name
      ORDER BY count DESC
      LIMIT 15
    `);

    return {
      total_records: total,
      types_breakdown: typesRes.rows,
      provinces_breakdown: provsRes.rows,
      latest_pub_time: latestPub
    };
  }

  /**
   * Kích hoạt cào trang hiện tại từ Python Worker IPC bridge.
   */
  static async triggerCrawl(): Promise<BocaoCrawlResponse> {
    const sysCfg = loadSystemConfig();
    const workerUrl = `http://127.0.0.1:${sysCfg.workerPort}/worker/bocao/crawl`;
    try {
      const res = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (!res.ok) {
        return { success: false, error: `Worker phản hồi HTTP ${res.status}` };
      }
      const data = await res.json() as BocaoCrawlResponse;
      return data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: `Lỗi kết nối Worker IPC: ${msg}` };
    }
  }

  /**
   * Kích hoạt cào toàn bộ các trang bố cáo từ Python Worker IPC bridge.
   */
  static async triggerCrawlAll(maxPages: number = 5): Promise<BocaoCrawlAllResponse> {
    const sysCfg = loadSystemConfig();
    const workerUrl = `http://127.0.0.1:${sysCfg.workerPort}/worker/bocao/crawl_all`;
    try {
      const res = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_pages: maxPages })
      });
      if (!res.ok) {
        return { success: false, error: `Worker phản hồi HTTP ${res.status}` };
      }
      return await res.json() as BocaoCrawlAllResponse;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: `Lỗi kết nối Worker IPC: ${msg}` };
    }
  }

  /**
   * Tra cứu dữ liệu doanh nghiệp trực tuyến qua DKKD Solr API.
   */
  static async searchDkkdOnline(searchField: string): Promise<DkkdSearchResponse> {
    const sysCfg = loadSystemConfig();
    const workerUrl = `http://127.0.0.1:${sysCfg.workerPort}/worker/bocao/get_search`;
    try {
      const res = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ search_field: searchField })
      });
      if (!res.ok) {
        return { success: false, error: `Worker phản hồi HTTP ${res.status}` };
      }
      return await res.json() as DkkdSearchResponse;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, error: `Lỗi kết nối Worker IPC: ${msg}` };
    }
  }
}

