// @id 01M4V0HMK9Q2667Q03NKBRESAT
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/enrichment/enrichment.service.ts
 * Nghiệp vụ làm giàu dữ liệu NNT: tích hợp API Xinvoice & Quản lý tiến trình chuẩn xác.
 */

import { query } from '../../db/index.js';
import { getProvincesCache } from '../provinces/index.js';
import { EnrichmentJobManager } from './enrichment.job.js';
import type {
  XinvoiceTaxPayerResponse,
  EnrichedRecordResult,
  ProvinceEnrichmentStatus,
  NationalEnrichmentSummaryResponse,
  ProvinceEnrichmentSummaryDto,
  SyncJobProgress
} from './enrichment.types.js';

export class EnrichmentService {
  private static readonly XINVOICE_URL = 'https://api.xinvoice.vn/gdt-api/tax-payer';

  public static async fetchXinvoice(tin: string): Promise<XinvoiceTaxPayerResponse | null> {
    const cleanTin = tin.trim();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (process.env.XINVOICE_CLIENT_ID) headers['client-id'] = process.env.XINVOICE_CLIENT_ID;
    if (process.env.XINVOICE_API_KEY) headers['api-key'] = process.env.XINVOICE_API_KEY;
    try {
      const res = await fetch(`${this.XINVOICE_URL}/${cleanTin}`, { headers });
      return res.status === 200 ? ((await res.json()) as XinvoiceTaxPayerResponse) : null;
    } catch { return null; }
  }

  public static async enrichSingleRecord(tin: string): Promise<EnrichedRecordResult | null> {
    const cleanTin = tin.trim();
    const cur = await query('SELECT tin, norm_name FROM tax_records WHERE tin = $1', [cleanTin]);
    if (!cur.rows.length) return null;
    const r = cur.rows[0];

    const xin = await this.fetchXinvoice(cleanTin);
    const exists = xin && (xin.taxID || xin.tin) && (xin.orgType || xin.address || xin.taxDepartment || xin.name);
    if (exists) {
      await query(
        'UPDATE tax_records SET org_type = $1, address = $2, tax_department = $3, enriched_at = NOW() WHERE tin = $4',
        [xin.orgType || null, xin.address || null, xin.taxDepartment || null, cleanTin]
      );
      return {
        tin: cleanTin, norm_name: xin.name || r.norm_name,
        org_type: xin.orgType || null, address: xin.address || null,
        tax_department: xin.taxDepartment || null, enriched_at: new Date().toISOString(),
        source: 'xinvoice_api'
      };
    }

    await query('UPDATE tax_records SET enriched_at = NOW() WHERE tin = $1', [cleanTin]);
    return {
      tin: cleanTin, norm_name: r.norm_name, org_type: null,
      address: null, tax_department: null, enriched_at: new Date().toISOString(),
      source: 'database'
    };
  }

  public static async resetUnverifiedRecords(prefix?: string): Promise<{ affectedRows: number }> {
    const sql = prefix
      ? 'UPDATE tax_records SET org_type = NULL, address = NULL, tax_department = NULL, enriched_at = NULL WHERE tin LIKE $1'
      : 'UPDATE tax_records SET org_type = NULL, address = NULL, tax_department = NULL, enriched_at = NULL';
    const res = await query(sql, prefix ? [`${prefix}%`] : []);
    return { affectedRows: res.rowCount || 0 };
  }

  public static async getNationalSummary(): Promise<NationalEnrichmentSummaryResponse> {
    const sql = `
      SELECT SUBSTRING(tin FROM 1 FOR 2) AS prefix, COUNT(*)::int AS total,
             COUNT(*) FILTER (WHERE org_type IS NOT NULL)::int AS enriched
      FROM tax_records GROUP BY SUBSTRING(tin FROM 1 FOR 2) ORDER BY prefix ASC
    `;
    const res = await query<{ prefix: string; total: number; enriched: number }>(sql);
    const cache = getProvincesCache();
    const prefixToName = new Map<string, string>();
    for (const name in cache) prefixToName.set(cache[name].prefix, name);

    let sumTotal = 0, sumEnriched = 0;
    const provinces: ProvinceEnrichmentSummaryDto[] = res.rows.map((r) => {
      sumTotal += r.total; sumEnriched += r.enriched;
      const rate = r.total > 0 ? Math.round((r.enriched / r.total) * 1000) / 10 : 0;
      const job = EnrichmentJobManager.getJobProgress(r.prefix);
      return {
        provinceName: prefixToName.get(r.prefix) || `Tỉnh (${r.prefix})`, prefix: r.prefix,
        totalRecords: r.total, enrichedCount: r.enriched,
        pendingCount: Math.max(0, r.total - r.enriched),
        completionRate: rate, isRunning: !!(job && job.isRunning)
      };
    });

    const natRate = sumTotal > 0 ? Math.round((sumEnriched / sumTotal) * 1000) / 10 : 0;
    return {
      summary: {
        totalRecords: sumTotal, enrichedCount: sumEnriched,
        pendingCount: Math.max(0, sumTotal - sumEnriched), completionRate: natRate
      },
      provinces, updatedAt: new Date().toISOString()
    };
  }

  public static async getProvinceStatus(prefix: string, provinceKey: string): Promise<ProvinceEnrichmentStatus> {
    const pat = `${prefix}%`;
    const [tot, enr] = await Promise.all([
      query('SELECT COUNT(*)::int AS count FROM tax_records WHERE tin LIKE $1', [pat]),
      query('SELECT COUNT(*)::int AS count FROM tax_records WHERE tin LIKE $1 AND org_type IS NOT NULL', [pat])
    ]);
    const total = Number(tot.rows[0]?.count) || 0, enriched = Number(enr.rows[0]?.count) || 0;
    const job = EnrichmentJobManager.getJobProgress(prefix);
    return {
      provinceKey, prefix, totalRecords: total, enrichedCount: enriched,
      pendingCount: Math.max(0, total - enriched), isRunning: !!(job && job.isRunning),
      updatedAt: new Date().toISOString()
    };
  }

  public static startProvinceOnlineQueue(prefix: string, provinceName: string): boolean {
    return EnrichmentJobManager.startJob(prefix, provinceName);
  }

  public static stopProvinceOnlineQueue(prefix: string): boolean {
    return EnrichmentJobManager.stopJob(prefix);
  }

  public static getJobProgress(prefix: string): SyncJobProgress | null {
    return EnrichmentJobManager.getJobProgress(prefix);
  }

  public static getAllJobs(): SyncJobProgress[] {
    return EnrichmentJobManager.getAllJobs();
  }
}
