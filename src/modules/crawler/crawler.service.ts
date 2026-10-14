// @id 01M4V0HMK3RV0QN0BG0ARS6W7Q
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/crawler/crawler.service.ts
 * IPC Client giao tiếp với Python Crawler Worker (Port 8124), tích hợp Watchdog tự phục hồi.
 */

import { spawn } from 'node:child_process';
import { env } from '../../config/index.js';
import type {
  StartCrawlerDto,
  StartAllNewestDto,
  WorkerBridgeStatusResponse
} from './crawler.types.js';

const localLogs: string[] = [];
let lastStatusCache: WorkerBridgeStatusResponse | null = null;
let lastStatusFetchTime = 0;
let lastErrorLogTime = 0;
let lastRespawnAttempt = 0;

function getWorkerBaseUrl(): string {
  return `http://127.0.0.1:${env.workerPort}`;
}

export function appendLocalLog(msg: string): void {
  const timeStr = new Date().toTimeString().slice(0, 8);
  const formatted = `[${timeStr}] ${msg}`;
  localLogs.push(formatted);
  console.log(`[Crawler Log] ${formatted}`);
  if (localLogs.length > 300) localLogs.shift();
}

export function getRecentLogs(): string[] {
  return localLogs.slice(-50);
}

function tryWatchdogRespawnWorker(): void {
  const now = Date.now();
  if (now - lastRespawnAttempt < 25000) return;
  lastRespawnAttempt = now;
  try {
    appendLocalLog(`[Watchdog] Phát hiện Worker ${env.workerPort} mất kết nối -> Tự động khởi chạy lại worker_bridge.py...`);
    const child = spawn('python', ['worker_bridge.py'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();
  } catch (err) {
    appendLocalLog(`[Watchdog] Không thể tự khởi động worker_bridge.py: ${(err as Error).message}`);
  }
}

export async function sendWorkerCommand<T = Record<string, unknown>>(
  endpoint: string,
  method = 'POST',
  body?: unknown,
  silent = false
): Promise<T> {
  const url = `${getWorkerBaseUrl()}${endpoint}`;
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Worker HTTP ${res.status}: ${errText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    const errorMsg = (err as Error).message;
    tryWatchdogRespawnWorker();
    if (!silent) {
      appendLocalLog(`[Worker Bridge] Lỗi kết nối Python worker (${url}): ${errorMsg}`);
    } else {
      const now = Date.now();
      if (now - lastErrorLogTime > 15000) {
        lastErrorLogTime = now;
        appendLocalLog(`[Worker Bridge] Đang chờ Python worker khởi động (Port ${env.workerPort})...`);
      }
    }
    throw err;
  }
}

export async function startCrawler(dto: StartCrawlerDto): Promise<Record<string, unknown>> {
  appendLocalLog(`Yêu cầu khởi động quét [${dto.province_key}]...`);
  return sendWorkerCommand('/worker/start', 'POST', dto);
}

export async function startAllNewest(dto: StartAllNewestDto): Promise<Record<string, unknown>> {
  appendLocalLog(`Yêu cầu quét mới nhất cho ${dto.selected_provinces?.length || 0} tỉnh...`);
  return sendWorkerCommand('/worker/start_all', 'POST', dto);
}

export async function stopCrawler(provinceKey: string): Promise<Record<string, unknown>> {
  appendLocalLog(`Dừng crawler [${provinceKey}]...`);
  return sendWorkerCommand('/worker/stop', 'POST', { province_key: provinceKey });
}

export async function pauseCrawler(provinceKey: string): Promise<Record<string, unknown>> {
  appendLocalLog(`Tạm dừng crawler [${provinceKey}]...`);
  return sendWorkerCommand('/worker/pause', 'POST', { province_key: provinceKey });
}

export async function resumeCrawler(provinceKey: string): Promise<Record<string, unknown>> {
  appendLocalLog(`Tiếp tục crawler [${provinceKey}]...`);
  return sendWorkerCommand('/worker/resume', 'POST', { province_key: provinceKey });
}

export async function stopAllCrawlers(): Promise<Record<string, unknown>> {
  appendLocalLog('Dừng toàn bộ các tiến trình crawler...');
  return sendWorkerCommand('/worker/stop_all', 'POST');
}

export async function getWorkerStatus(): Promise<WorkerBridgeStatusResponse | null> {
  const now = Date.now();
  if (lastStatusCache && now - lastStatusFetchTime < 1000) return lastStatusCache;
  try {
    const res = await sendWorkerCommand<WorkerBridgeStatusResponse>('/worker/status', 'GET', undefined, true);
    lastStatusCache = res;
    lastStatusFetchTime = now;
    return res;
  } catch {
    return null;
  }
}

export async function getQueueStatus(): Promise<Record<string, unknown>> {
  try {
    return await sendWorkerCommand<Record<string, unknown>>('/worker/queue_status', 'GET', undefined, true);
  } catch {
    return { is_running: false, pending: 0, active: [] };
  }
}

export async function getScheduleStatus(): Promise<Record<string, unknown>> {
  return sendWorkerCommand('/worker/schedule/status', 'GET', undefined, true);
}

export async function toggleScheduleNewest(enable?: boolean): Promise<Record<string, unknown>> {
  return sendWorkerCommand('/worker/schedule/toggle_newest', 'POST', { enable });
}

export async function toggleScheduleGapFill(enable?: boolean): Promise<Record<string, unknown>> {
  return sendWorkerCommand('/worker/schedule/toggle_gap_fill', 'POST', { enable });
}

export async function triggerScheduleNewest(): Promise<Record<string, unknown>> {
  appendLocalLog('Kích hoạt quét Đỉnh mới nhất theo lịch...');
  return sendWorkerCommand('/worker/schedule/trigger_newest', 'POST');
}

export async function triggerScheduleGapFill(): Promise<Record<string, unknown>> {
  appendLocalLog('Kích hoạt quét Fill Lỗ Hổng 500 MST theo lịch (62 tỉnh)...');
  return sendWorkerCommand('/worker/schedule/trigger_gap_fill', 'POST');
}

export async function setScheduleGapFillMode(resetOnExisting: boolean): Promise<Record<string, unknown>> {
  return sendWorkerCommand('/worker/schedule/gap_fill_mode', 'POST', { reset_on_existing: resetOnExisting });
}

export async function configureScheduleBocao(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return sendWorkerCommand('/worker/schedule/configure_bocao', 'POST', payload);
}

export async function triggerScheduleBocao(): Promise<Record<string, unknown>> {
  appendLocalLog('Kích hoạt chu trình Cào Bố Cáo + Đồng Bộ Thuế...');
  return sendWorkerCommand('/worker/schedule/trigger_bocao', 'POST');
}
