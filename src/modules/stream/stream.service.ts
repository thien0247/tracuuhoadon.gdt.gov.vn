// @id 01M4V0HMM6NFVWR8VH4WMGCJ35
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/stream/stream.service.ts
 * Tính toán số liệu thống kê thời gian thực và tổng hợp payload SSE.
 */

import { query, pool } from '../../db/index.js';
import { getProvincesCache } from '../provinces/index.js';
import { getWorkerStatus, getRecentLogs } from '../crawler/index.js';

export interface DbProvinceStat {
  db_count: number;
  tin_min: string;
  tin_max: string;
  last_tin?: string;
  last_scanned_at?: string;
}

export const dbStatsCache: Record<string, DbProvinceStat> = {};
let dbStatsInterval: NodeJS.Timeout | null = null;

let isRefreshing = false;

export async function refreshDbStats(): Promise<void> {
  if (pool.ended || isRefreshing) return;
  isRefreshing = true;
  try {
    const sql = `
      SELECT SUBSTRING(tin, 1, 2) AS pref,
             COUNT(*) AS cnt,
             MIN(tin) AS min_tin,
             MAX(tin) AS max_tin
      FROM tax_records
      WHERE LENGTH(tin) = 10
      GROUP BY SUBSTRING(tin, 1, 2)
    `;
    const [res, progRes] = await Promise.all([
      query<{ pref: string; cnt: string; min_tin: string; max_tin: string }>(sql),
      query<{ prefix: string; last_tin: string; updated_at: string }>(
        'SELECT prefix, last_tin, updated_at FROM scan_progress WHERE last_tin IS NOT NULL'
      )
    ]);

    const progMap = new Map<string, { last_tin: string; updated_at: string }>();
    for (const r of progRes.rows) {
      progMap.set(r.prefix, { last_tin: r.last_tin, updated_at: r.updated_at });
    }

    const cache = getProvincesCache();
    for (const [provName, provCfg] of Object.entries(cache)) {
      const row = res.rows.find((r) => r.pref === provCfg.prefix);
      const prog = progMap.get(provCfg.prefix);
      dbStatsCache[provName] = {
        db_count: row ? (parseInt(row.cnt, 10) || 0) : 0,
        tin_min: row?.min_tin || '',
        tin_max: row?.max_tin || '',
        last_tin: prog?.last_tin || '',
        last_scanned_at: prog?.updated_at || ''
      };
    }
  } catch (err) {
    if (!pool.ended) {
      console.error('[Stream Service] Lỗi cập nhật db stats worker:', (err as Error).message);
    }
  } finally {
    isRefreshing = false;
  }
}

export function startDbStatsWorker(): void {
  if (dbStatsInterval) return;
  void refreshDbStats();
  dbStatsInterval = setInterval(() => {
    void refreshDbStats();
  }, 60000);
  dbStatsInterval.unref(); // Không chặn tiến trình Node khi thoát
}

export function stopDbStatsWorker(): void {
  if (dbStatsInterval) {
    clearInterval(dbStatsInterval);
    dbStatsInterval = null;
  }
}

export async function buildStreamPayload(): Promise<string> {
  const cache = getProvincesCache();
  const workerStatus = await getWorkerStatus();

  let masterQueried = 0;
  let masterFound = 0;
  let runningCount = 0;
  const provData: Record<string, Record<string, unknown>> = {};

  const engines = workerStatus?.engines || {};

  for (const [provName] of Object.entries(cache)) {
    const eng = engines[provName];
    const isRunning = Boolean(eng?.is_running);
    const isPaused = Boolean(eng?.is_paused);
    const queried = eng?.total_queried || 0;
    const found = eng?.total_found || 0;

    if (isRunning) runningCount += 1;
    masterQueried += queried;
    masterFound += found;

    const dbStat = dbStatsCache[provName] || { db_count: 0, tin_min: '', tin_max: '' };
    const curLastTin = (eng?.last_tin as string) || dbStat.last_tin || '';
    const curLastScanned = (eng?.last_scanned_at as string) || dbStat.last_scanned_at || '';

    provData[provName] = {
      running: isRunning,
      paused: isPaused,
      queried,
      found,
      speed: (eng?.speed as number) || 0.0,
      last_tin: curLastTin,
      last_scanned_at: curLastScanned,
      uptime: (eng?.uptime as string) || '00:00:00',
      db_count: dbStat.db_count,
      tin_min: dbStat.tin_min,
      tin_max: dbStat.tin_max,
      scan_mode: (eng?.scan_mode as string) || 'newest',
      num_workers: (eng?.num_workers as number) || 2
    };
  }

  const totalDbRecords = Object.values(dbStatsCache).reduce((sum, s) => sum + s.db_count, 0);
  const workerLogs = workerStatus?.logs || [];
  const mergedLogs = [...getRecentLogs(), ...workerLogs].slice(-50);

  const payload = {
    master: {
      total_queried: masterQueried,
      total_found: masterFound,
      total_speed: 0.0,
      total_db_records: totalDbRecords,
      running_count: runningCount
    },
    provinces: provData,
    logs: mergedLogs
  };

  return JSON.stringify(payload);
}
