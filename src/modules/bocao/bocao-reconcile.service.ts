// @id 01M4V0HMJVKYTH2AG210MC4JCE
// @related 01M4V0FH0DTKQEFJ3JJ6ZCZSCN, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/bocao/bocao-reconcile.service.ts
 * Nghiệp vụ đối soát Mã số doanh nghiệp giữa bocao_records và tax_records.
 */

import { query } from '../../db/index.js';
import type {
  BocaoReconcileRecord, BocaoReconcileQuery,
  BocaoReconcileListResponse, BocaoReconcileStats
} from './bocao.types.js';

export class BocaoReconcileService {
  /**
   * Truy vấn danh sách đối soát bố cáo với CSDL tax_records.
   */
  static async getReconcileRecords(filter: BocaoReconcileQuery): Promise<BocaoReconcileListResponse> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(filter.limit) || 25));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filter.status === 'matched') {
      conditions.push('t.tin IS NOT NULL');
    } else if (filter.status === 'unmatched') {
      conditions.push('t.tin IS NULL');
    } else if (filter.status === 'retry_later') {
      conditions.push("t.tin IS NULL AND b.sync_status = 'retry_later'");
    }

    if (filter.province && filter.province.trim()) {
      params.push(`%${filter.province.trim()}%`);
      conditions.push(`b.province_name ILIKE $${params.length}`);
    }

    if (filter.keyword && filter.keyword.trim()) {
      const kw = `%${filter.keyword.trim()}%`;
      params.push(kw);
      const kwIdx = params.length;
      conditions.push(`(b.tin ILIKE $${kwIdx} OR b.company_name ILIKE $${kwIdx} OR t.norm_name ILIKE $${kwIdx})`);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS total
      FROM bocao_records b
      LEFT JOIN tax_records t ON b.tin = t.tin
      ${whereSql}
    `;
    const countRes = await query<{ total: string }>(countSql, params);
    const total = Number(countRes.rows[0]?.total || 0);

    params.push(limit);
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const selectSql = `
      SELECT 
        b.id,
        b.tin,
        b.company_name AS bocao_company_name,
        b.province_name AS bocao_province,
        b.announcement_type,
        b.pub_time::text AS pub_time,
        b.sync_status,
        b.sync_attempts,
        b.last_synced_at::text AS last_synced_at,
        (t.tin IS NOT NULL) AS in_tax_records,
        t.norm_name AS tax_company_name,
        COALESCE(t.address, t.tran_addr) AS tax_address,
        t.status_name AS tax_status,
        COALESCE(t.tax_department, t.pay_taxo_name) AS tax_department
      FROM bocao_records b
      LEFT JOIN tax_records t ON b.tin = t.tin
      ${whereSql}
      ORDER BY b.pub_time DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const rowsRes = await query<BocaoReconcileRecord>(selectSql, params);

    return {
      total,
      page,
      limit,
      records: rowsRes.rows
    };
  }

  /**
   * Thống kê tổng quan tỷ lệ đối soát giữa Bố Cáo và DB Thuế.
   */
  static async getReconcileStats(): Promise<BocaoReconcileStats> {
    const sql = `
      SELECT 
        COUNT(*) AS total_bocao,
        COUNT(t.tin) AS matched_count,
        (COUNT(*) - COUNT(t.tin)) AS unmatched_count,
        COUNT(*) FILTER (WHERE t.tin IS NULL AND b.sync_status = 'retry_later') AS retry_later_count,
        CASE 
          WHEN COUNT(*) > 0 THEN ROUND((COUNT(t.tin)::numeric / COUNT(*) * 100), 2)
          ELSE 0 
        END AS match_rate
      FROM bocao_records b
      LEFT JOIN tax_records t ON b.tin = t.tin
    `;
    const res = await query<{
      total_bocao: string;
      matched_count: string;
      unmatched_count: string;
      retry_later_count: string;
      match_rate: string;
    }>(sql);

    const r = res.rows[0];
    return {
      total_bocao: Number(r?.total_bocao || 0),
      matched_count: Number(r?.matched_count || 0),
      unmatched_count: Number(r?.unmatched_count || 0),
      retry_later_count: Number(r?.retry_later_count || 0),
      match_rate: Number(r?.match_rate || 0)
    };
  }

  /**
   * Kích hoạt worker quét bù các MST chưa có trong Thuế (Bocao Radar).
   */
  static async triggerSyncMissing(batchSize: number = 60): Promise<unknown> {
    const res = await fetch('http://127.0.0.1:8124/worker/bocao/sync_missing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_size: batchSize })
    });
    if (!res.ok) {
      throw new Error(`Worker bridge error: ${res.statusText}`);
    }
    return await res.json();
  }
}
