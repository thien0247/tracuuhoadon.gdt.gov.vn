// @id 01M4V0HMKT18F1B47H0XK719NY
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/records/records.report.ts
 * Nghiệp vụ tổng hợp báo cáo sản lượng MST crawl theo ngày, tháng, năm từ bảng chuyên biệt crawl_stats_daily.
 */

import { query } from '../../db/index.js';
import { getProvincesCache } from '../provinces/index.js';
import type {
  CrawlStatsQueryDto,
  CrawlStatsResponse,
  CrawlStatsSummary,
  CrawlStatsTimelineItem,
  CrawlStatsTopProvince
} from './records.types.js';

interface PeriodFormatConfig {
  trunc: string;
  toChar: string;
  formatLabel: (raw: string) => string;
}

const PERIOD_FORMATS: Record<string, PeriodFormatConfig> = {
  day: {
    trunc: 'day',
    toChar: 'YYYY-MM-DD',
    formatLabel: (raw: string) => {
      const p = raw.split('-');
      return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : raw;
    }
  },
  month: {
    trunc: 'month',
    toChar: 'YYYY-MM',
    formatLabel: (raw: string) => {
      const p = raw.split('-');
      return p.length === 2 ? `${p[1]}/${p[0]}` : raw;
    }
  },
  year: { trunc: 'year', toChar: 'YYYY', formatLabel: (raw: string) => raw }
};

function resolveProvincePrefix(provinceKey?: string | null): string | null {
  if (!provinceKey || provinceKey === 'all') return null;
  const cache = getProvincesCache();
  for (const [name, cfg] of Object.entries(cache)) {
    const key = name.toLowerCase().replace(/\s+/g, '_');
    if (cfg.prefix === provinceKey || key === provinceKey.toLowerCase() || name.toLowerCase() === provinceKey.toLowerCase()) {
      return cfg.prefix;
    }
  }
  return /^\d{2}$/.test(provinceKey) ? provinceKey : null;
}

export async function syncCrawlDailyStats(): Promise<{ synced_rows: number; total_records: number }> {
  await query(`
    INSERT INTO crawl_stats_daily (stat_date, province_prefix, total_crawled, updated_at)
    SELECT DATE(COALESCE(scraped_at, created_at)) AS stat_date, SUBSTRING(tin FROM 1 FOR 2) AS province_prefix,
           COUNT(*)::int AS total_crawled, CURRENT_TIMESTAMP
    FROM tax_records WHERE COALESCE(scraped_at, created_at) IS NOT NULL GROUP BY 1, 2
    ON CONFLICT (stat_date, province_prefix) DO UPDATE SET total_crawled = EXCLUDED.total_crawled, updated_at = CURRENT_TIMESTAMP;
    INSERT INTO regi_stats_daily (stat_date, province_prefix, total_records, updated_at)
    SELECT DATE(regi_date) AS stat_date, SUBSTRING(tin FROM 1 FOR 2) AS province_prefix,
           COUNT(*)::int AS total_records, CURRENT_TIMESTAMP
    FROM tax_records WHERE regi_date IS NOT NULL GROUP BY 1, 2
    ON CONFLICT (stat_date, province_prefix) DO UPDATE SET total_records = EXCLUDED.total_records, updated_at = CURRENT_TIMESTAMP;
  `);
  const res = await query<{ cnt: string; tot: string }>('SELECT COUNT(*) AS cnt, SUM(total_crawled) AS tot FROM crawl_stats_daily');
  return { synced_rows: parseInt(res.rows[0]?.cnt || '0', 10), total_records: parseInt(res.rows[0]?.tot || '0', 10) };
}

export async function fetchCrawlStats(dto: CrawlStatsQueryDto = {}): Promise<CrawlStatsResponse> {
  const period = (dto.period && PERIOD_FORMATS[dto.period]) ? dto.period : 'day';
  const timeField = dto.time_field === 'regi_date' ? 'regi_date' : 'scraped_at';
  const targetTable = timeField === 'regi_date' ? 'regi_stats_daily' : 'crawl_stats_daily';
  const countCol = timeField === 'regi_date' ? 'total_records' : 'total_crawled';
  const fmt = PERIOD_FORMATS[period];
  const prefix = resolveProvincePrefix(dto.province_key);

  const whereParts: string[] = ['1=1'];
  const params: unknown[] = [];
  if (prefix) { params.push(prefix); whereParts.push(`province_prefix = $${params.length}`); }
  if (dto.from_date) { params.push(dto.from_date); whereParts.push(`stat_date >= $${params.length}::date`); }
  if (dto.to_date) { params.push(dto.to_date); whereParts.push(`stat_date <= $${params.length}::date`); }

  const whereClause = whereParts.join(' AND ');
  const dateCol = period === 'day' ? 'stat_date' : `DATE_TRUNC('${fmt.trunc}', stat_date)`;
  const timelineSql = `SELECT TO_CHAR(${dateCol}, '${fmt.toChar}') AS period_key, SUM(${countCol})::int AS count FROM ${targetTable} WHERE ${whereClause} GROUP BY 1 ORDER BY 1 ASC`;
  const timelineRes = await query<{ period_key: string; count: number }>(timelineSql, params);

  const timeline: CrawlStatsTimelineItem[] = timelineRes.rows.map(r => ({
    period: r.period_key, label: fmt.formatLabel(r.period_key), count: r.count
  }));

  let totalRecords = 0, peakCount = 0;
  let peakPeriod: string | null = null;
  for (const item of timeline) {
    totalRecords += item.count;
    if (item.count > peakCount) { peakCount = item.count; peakPeriod = item.period; }
  }

  const summary: CrawlStatsSummary = {
    total_records: totalRecords,
    peak_period: peakPeriod ? fmt.formatLabel(peakPeriod) : null,
    peak_count: peakCount,
    avg_per_period: timeline.length > 0 ? Math.round(totalRecords / timeline.length) : 0,
    period_count: timeline.length
  };

  const topWhereParts = whereParts.filter(p => !p.startsWith('province_prefix'));
  const topSql = `SELECT province_prefix AS prefix, SUM(${countCol})::int AS count FROM ${targetTable} WHERE ${topWhereParts.join(' AND ')} GROUP BY 1 ORDER BY 2 DESC LIMIT 10`;
  const topRes = await query<{ prefix: string; count: number }>(topSql, params.filter((_, i) => !prefix || i > 0));

  const cache = getProvincesCache();
  const prefixMap = new Map<string, { name: string; key: string }>();
  for (const [name, cfg] of Object.entries(cache)) {
    prefixMap.set(cfg.prefix, { name, key: name.toLowerCase().replace(/\s+/g, '_') });
  }

  const topProvinces: CrawlStatsTopProvince[] = topRes.rows.map(r => {
    const info = prefixMap.get(r.prefix);
    const pct = totalRecords > 0 ? Math.round((r.count / totalRecords) * 1000) / 10 : 0;
    return {
      prefix: r.prefix, province_name: info?.name || `Tỉnh ${r.prefix}`,
      province_key: info?.key || r.prefix, count: r.count, percentage: pct
    };
  });

  return { period, time_field: timeField, province_key: dto.province_key || 'all', summary, timeline, top_provinces: topProvinces };
}
