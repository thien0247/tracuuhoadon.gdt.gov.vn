// @id 01M4V0HMKSY4WCNXSND8ER981Y
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V47G4VGKW5RT15HK4K74BH
/**
 * src/modules/records/records.health.ts
 * Báo cáo kiểm tra sức khỏe crawler, độ trễ và tỷ lệ độ đặc dải số (Density Ratio) 62 tỉnh thành.
 */

import { query } from '../../db/index.js';
import { getProvincesCache } from '../provinces/index.js';

export interface ProvinceHealthItem {
  province: string;
  prefix: string;
  tin_max: string;
  max_regi_date: string;
  days_diff: number | null;
  new_records_in_range: number;
  total_records: number;
  density_rate: number;
  status: 'healthy' | 'warning' | 'stalled';
}

export async function fetchCrawlerHealthReport(days = 3): Promise<{
  summary: { total: number; healthy: number; warning: number; stalled: number };
  provinces: ProvinceHealthItem[];
}> {
  const summary = { total: 0, healthy: 0, warning: 0, stalled: 0 };
  const report: ProvinceHealthItem[] = [];

  const sqlRecent = `
    SELECT SUBSTRING(tin, 1, 2) AS pref,
           COUNT(*) FILTER (WHERE regi_date >= CURRENT_DATE - ($1 * INTERVAL '1 day')) AS cnt,
           MAX(regi_date)::text AS max_d
    FROM tax_records
    WHERE regi_date >= CURRENT_DATE - INTERVAL '60 days'
    GROUP BY SUBSTRING(tin, 1, 2)
  `;

  const sqlTinInfo = `
    SELECT p.prefix, t.tin, t.regi_date::text
    FROM provinces p
    LEFT JOIN LATERAL (
      SELECT tin, regi_date FROM tax_records
      WHERE tin >= p.prefix || '00000000' AND tin < p.prefix || '90000000'
      ORDER BY tin DESC LIMIT 1
    ) t ON true
  `;

  const sqlTotals = `SELECT province_prefix, SUM(total_records)::text AS tot FROM regi_stats_daily GROUP BY 1`;

  const [resRecent, resTinInfo, resTotals] = await Promise.all([
    query<{ pref: string; cnt: string; max_d: string | null }>(sqlRecent, [days]),
    query<{ prefix: string; tin: string | null; regi_date: string | null }>(sqlTinInfo),
    query<{ province_prefix: string; tot: string }>(sqlTotals)
  ]);

  const recentMap: Record<string, { cnt: number; max_d: string | null }> = {};
  for (const r of resRecent.rows) recentMap[r.pref] = { cnt: parseInt(r.cnt, 10) || 0, max_d: r.max_d };

  const tinInfoMap: Record<string, { tin: string | null; regi_date: string | null }> = {};
  for (const r of resTinInfo.rows) tinInfoMap[r.prefix] = { tin: r.tin, regi_date: r.regi_date };

  const totalsMap: Record<string, number> = {};
  for (const r of resTotals.rows) totalsMap[r.province_prefix] = parseInt(r.tot, 10) || 0;

  const cache = getProvincesCache();
  const now = new Date();

  for (const [provName, provCfg] of Object.entries(cache)) {
    const pref = provCfg.prefix;
    const rec = recentMap[pref] || { cnt: 0, max_d: null };
    const tInfo = tinInfoMap[pref] || { tin: null, regi_date: null };
    const tinMax = tInfo.tin || provCfg.activation_tin || '';
    const maxD = rec.max_d || tInfo.regi_date;
    const totalRecords = totalsMap[pref] || 0;

    let daysDiff: number | null = null;
    let status: 'healthy' | 'warning' | 'stalled' = 'stalled';

    if (maxD) {
      const dVal = new Date(maxD);
      daysDiff = Math.floor((now.getTime() - dVal.getTime()) / (1000 * 3600 * 24));
      if (daysDiff <= days && rec.cnt > 0) status = 'healthy';
      else if (daysDiff <= 7) status = 'warning';
    }

    let densityRate = 0;
    if (tinMax && /^\d{10}$/.test(tinMax)) {
      const minNum = parseInt(provCfg.activation_tin || `${pref}00100000`, 10) || parseInt(`${pref}00100000`, 10);
      const maxNum = parseInt(tinMax, 10);
      const span = Math.max(maxNum - minNum + 1, 1);
      densityRate = totalRecords > 0 ? Math.min(100, Math.round((totalRecords / span) * 1000) / 10) : 0;
    }

    summary.total += 1;
    if (status === 'healthy') summary.healthy += 1;
    else if (status === 'warning') summary.warning += 1;
    else summary.stalled += 1;

    report.push({
      province: provName, prefix: pref, tin_max: tinMax, max_regi_date: maxD || 'Chưa có',
      days_diff: daysDiff, new_records_in_range: rec.cnt, total_records: totalRecords,
      density_rate: densityRate, status
    });
  }

  return { summary, provinces: report };
}
