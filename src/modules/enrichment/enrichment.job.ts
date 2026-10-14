// @id 01M4V0HMK7SMHBBCN09PBNT6T3
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/enrichment/enrichment.job.ts
 * Quản lý vòng đời & tiến trình thời gian thực của các Job đồng bộ API Xinvoice.
 */

import { query } from '../../db/index.js';
import { EnrichmentService } from './enrichment.service.js';
import type { SyncJobProgress } from './enrichment.types.js';

interface SyncJobState {
  prefix: string;
  provinceName: string;
  stopRequested: boolean;
  isRunning: boolean;
  status: 'idle' | 'running' | 'stopping' | 'completed' | 'error';
  totalToProcess: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  startTimestamp: number;
  currentTin?: string;
  lastMessage?: string;
}

const activeJobs = new Map<string, SyncJobState>();

export class EnrichmentJobManager {
  public static getJobProgress(prefix: string): SyncJobProgress | null {
    const job = activeJobs.get(prefix);
    if (!job) return null;
    return this.buildProgressDto(job);
  }

  public static getAllJobs(): SyncJobProgress[] {
    return Array.from(activeJobs.values()).map((j) => this.buildProgressDto(j));
  }

  public static startJob(prefix: string, provinceName: string): boolean {
    const existing = activeJobs.get(prefix);
    if (existing && existing.isRunning) return false;

    const job: SyncJobState = {
      prefix, provinceName, stopRequested: false, isRunning: true, status: 'running',
      totalToProcess: 0, processedCount: 0, successCount: 0, failedCount: 0,
      startTimestamp: Date.now(), lastMessage: 'Đang khởi động tiến trình...'
    };
    activeJobs.set(prefix, job);

    (async () => {
      try {
        const [totRes, enrRes] = await Promise.all([
          query<{ cnt: number }>('SELECT COALESCE(SUM(total_records), 0)::int AS cnt FROM regi_stats_daily WHERE province_prefix = $1', [prefix]),
          query<{ cnt: number }>('SELECT COUNT(*)::int AS cnt FROM tax_records WHERE SUBSTRING(tin FROM 1 FOR 2) = $1 AND org_type IS NOT NULL', [prefix])
        ]);
        job.totalToProcess = Math.max(0, Number(totRes.rows[0]?.cnt || 0) - Number(enrRes.rows[0]?.cnt || 0));

        if (job.totalToProcess === 0) {
          job.status = 'completed';
          job.isRunning = false;
          job.lastMessage = 'Tất cả bản ghi của tỉnh đã được kiểm tra đồng bộ';
          return;
        }

        let cursorTin = `${prefix}00000000`;
        const maxTinBound = `${prefix}99999999`;
        while (!job.stopRequested) {
          const fetchRes = await query<{ tin: string }>(
            'SELECT tin FROM tax_records WHERE tin >= $1 AND tin <= $2 AND enriched_at IS NULL ORDER BY tin ASC LIMIT 20',
            [cursorTin, maxTinBound]
          );
          if (!fetchRes.rows.length) break;
          cursorTin = fetchRes.rows[fetchRes.rows.length - 1].tin;

          for (const row of fetchRes.rows) {
            if (job.stopRequested) break;
            job.currentTin = row.tin;
            job.lastMessage = `Đang tra cứu API Xinvoice: ${row.tin}`;

            try {
              const xin = await EnrichmentService.fetchXinvoice(row.tin);
              const exists = xin && (xin.taxID || xin.tin) && (xin.orgType || xin.address || xin.taxDepartment || xin.name);
              if (exists) {
                await query(
                  'UPDATE tax_records SET org_type = $1, address = $2, tax_department = $3, enriched_at = NOW() WHERE tin = $4',
                  [xin.orgType || null, xin.address || null, xin.taxDepartment || null, row.tin]
                );
                job.successCount++;
                job.lastMessage = `✅ Cập nhật thành công: ${row.tin}`;
              } else {
                await query('UPDATE tax_records SET enriched_at = NOW() WHERE tin = $1', [row.tin]);
                job.failedCount++;
                job.lastMessage = `⚠️ NNT không tồn tại trên API: ${row.tin}`;
              }
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : String(err);
              job.failedCount++;
              job.lastMessage = `❌ Lỗi kết nối API: ${msg}`;
            }

            job.processedCount++;
            await new Promise((r) => setTimeout(r, 3200));
          }
        }
        job.status = job.stopRequested ? 'stopping' : 'completed';
        job.lastMessage = job.stopRequested ? 'Tiến trình đã được dừng bởi người dùng' : 'Đã hoàn tất đồng bộ toàn bộ tỉnh';
      } catch (e: unknown) {
        job.status = 'error';
        job.lastMessage = `Lỗi hệ thống: ${e instanceof Error ? e.message : String(e)}`;
      } finally {
        job.isRunning = false;
        job.currentTin = undefined;
      }
    })().catch((err) => {
      job.status = 'error';
      job.isRunning = false;
      job.lastMessage = `Lỗi ngoại lệ: ${String(err)}`;
    });

    return true;
  }

  public static stopJob(prefix: string): boolean {
    const job = activeJobs.get(prefix);
    if (!job || !job.isRunning) return false;
    job.stopRequested = true;
    job.status = 'stopping';
    job.lastMessage = 'Đang dừng tiến trình...';
    return true;
  }

  private static buildProgressDto(job: SyncJobState): SyncJobProgress {
    const elapsedSeconds = Math.max(0, Math.round((Date.now() - job.startTimestamp) / 1000));
    const processed = job.processedCount;
    const total = job.totalToProcess;
    const progressPercent = total > 0 ? Math.round((processed / total) * 1000) / 10 : 0;
    const successRate = processed > 0 ? Math.round((job.successCount / processed) * 1000) / 10 : 0;
    const failureRate = processed > 0 ? Math.round((job.failedCount / processed) * 1000) / 10 : 0;
    const avgSecPerItem = processed > 0 ? elapsedSeconds / processed : 3.2;
    const remainingItems = Math.max(0, total - processed);
    const estimatedSecondsRemaining = Math.round(remainingItems * avgSecPerItem);

    return {
      prefix: job.prefix, provinceName: job.provinceName, isRunning: job.isRunning,
      status: job.status, totalToProcess: total, processedCount: processed,
      successCount: job.successCount, failedCount: job.failedCount, elapsedSeconds,
      estimatedSecondsRemaining, successRate, failureRate, progressPercent,
      currentTin: job.currentTin, lastMessage: job.lastMessage,
      startTime: new Date(job.startTimestamp).toISOString(), updatedAt: new Date().toISOString()
    };
  }
}
