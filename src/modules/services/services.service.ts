// @id 01M4V0HMM0SCCVHMH98X4HVYRA
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/services/services.service.ts
 * Nghiệp vụ giám sát trạng thái và điều khiển các dịch vụ liên quan.
 */

import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import util from 'node:util';
import { env } from '../../config/env.js';
import { query } from '../../db/index.js';
import {
  getScheduleStatus, triggerScheduleNewest, triggerScheduleGapFill,
  setScheduleGapFillMode, stopAllCrawlers, startAllNewest
} from '../crawler/index.js';
import {
  SERVICE_PARAMS_MAP, type ServiceDetail, type ServicesOverviewResponse,
  type ServiceControlDto, type ServiceControlResult, type ServiceStatus
} from './services.types.js';

const execAsync = util.promisify(exec);

export class ServicesService {
  public static async isPortOpen(port: number, timeoutMs = 400): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeoutMs);
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('timeout', () => { socket.destroy(); resolve(false); });
      socket.once('error', () => { socket.destroy(); resolve(false); });
      socket.connect(port, '127.0.0.1');
    });
  }

  public static async getWindowsServiceInfo(): Promise<{ status: ServiceStatus; statusText: string; pid: number | null }> {
    try {
      const { stdout } = await execAsync('sc.exe queryex GDTTaxCrawler');
      const isRunning = stdout.includes('RUNNING');
      const isStopped = stdout.includes('STOPPED');
      let pid: number | null = null;
      const pidMatch = stdout.match(/PID\s*:\s*(\d+)/i);
      if (pidMatch && pidMatch[1]) pid = parseInt(pidMatch[1], 10);
      return {
        status: isRunning ? 'running' : (isStopped ? 'stopped' : 'offline'),
        statusText: isRunning ? `Đang chạy (PID ${pid ?? 'N/A'})` : (isStopped ? 'Đã dừng' : 'Chưa cài đặt'),
        pid: pid && pid > 0 ? pid : null
      };
    } catch {
      return { status: 'offline', statusText: 'Chưa cài đặt dịch vụ', pid: null };
    }
  }

  public static async getOverview(): Promise<ServicesOverviewResponse> {
    const [winSvc, p8123, p8124, dbRes, schedRes] = await Promise.all([
      this.getWindowsServiceInfo(),
      this.isPortOpen(8123),
      this.isPortOpen(8124),
      this.checkDatabase(),
      getScheduleStatus().catch(() => null)
    ]);

    const now = new Date().toISOString();
    const services: ServiceDetail[] = [
      {
        id: 'gdt_windows_service', name: 'Windows Service GDTTaxCrawler', category: 'windows_service',
        status: winSvc.status, statusText: winSvc.statusText, description: 'Dịch vụ nền hệ thống Windows Service (NSSM Host)',
        pid: winSvc.pid, supportedActions: ['start', 'stop', 'restart'], lastCheckedAt: now
      },
      {
        id: 'fastify_web', name: 'Fastify Web API Gateway', category: 'web_api',
        status: p8123 ? 'online' : 'offline', statusText: p8123 ? 'ONLINE (Cổng 8123)' : 'OFFLINE',
        description: 'Máy chủ Web Dashboard & REST API TypeScript Fastify v4',
        port: 8123, pid: process.pid, supportedActions: ['restart'], lastCheckedAt: now
      },
      {
        id: 'python_worker', name: 'Python AI Worker & CAPTCHA', category: 'ai_worker',
        status: p8124 ? 'online' : 'offline', statusText: p8124 ? 'ONLINE (Cổng 8124)' : 'OFFLINE',
        description: 'Tiến trình giải AI CAPTCHA & Cầu nối Scraper curl_cffi',
        port: 8124, supportedActions: ['start', 'stop', 'restart'],
        parameters: SERVICE_PARAMS_MAP.python_worker, lastCheckedAt: now
      },
      {
        id: 'postgresql_db', name: 'Cơ Sở Dữ Liệu PostgreSQL', category: 'database',
        status: dbRes.status, statusText: dbRes.statusText, description: 'Hệ quản trị CSDL PostgreSQL 16 (1.1M+ bản ghi NNT)',
        port: parseInt(env.dbDsn.match(/:(\d+)\//)?.[1] || '5433', 10), details: { latencyMs: dbRes.latencyMs },
        supportedActions: ['test_connection'], parameters: SERVICE_PARAMS_MAP.postgresql_db, lastCheckedAt: now
      },
      {
        id: 'crawler_scheduler', name: 'Lập Lịch Quét Tự Động (Scheduler)', category: 'scheduler',
        status: schedRes ? 'online' : 'offline', statusText: schedRes ? 'Đang hoạt động' : 'Chưa kích hoạt',
        description: 'Tiến trình tự động Quét Đỉnh (mỗi 6h) & Fill Lỗ Hổng 500 (mỗi 12h)',
        details: schedRes as Record<string, unknown>, supportedActions: ['start', 'stop', 'trigger'],
        parameters: SERVICE_PARAMS_MAP.crawler_scheduler, lastCheckedAt: now
      }
    ];

    const runningCount = services.filter((s) => s.status === 'running' || s.status === 'online' || s.status === 'connected').length;
    return { total: services.length, runningCount, stoppedCount: services.length - runningCount, services, systemTime: now };
  }

  private static async checkDatabase(): Promise<{ status: ServiceStatus; statusText: string; latencyMs: number }> {
    const start = Date.now();
    try {
      await query('SELECT 1');
      const latency = Date.now() - start;
      return { status: 'connected', statusText: `Hoạt động tốt (${latency}ms)`, latencyMs: latency };
    } catch (err) {
      return { status: 'disconnected', statusText: `Lỗi kết nối: ${(err as Error).message}`, latencyMs: -1 };
    }
  }

  public static async executeControl(dto: ServiceControlDto): Promise<ServiceControlResult> {
    const { service_id, action, params } = dto;
    const now = new Date().toISOString();

    if (service_id === 'gdt_windows_service') {
      const batPath = path.resolve(process.cwd(), 'service.bat');
      if (!fs.existsSync(batPath)) throw new Error('Không tìm thấy tệp service.bat');
      const cmd = action === 'start' ? 'start' : (action === 'stop' ? 'stop' : 'restart');
      const { stdout, stderr } = await execAsync(`cmd.exe /c "${batPath}" ${cmd}`, { cwd: process.cwd(), timeout: 15000 });
      return { success: true, message: `Thực hiện ${action} Windows Service thành công`, service_id, action, output: stdout || stderr, timestamp: now };
    }

    if (service_id === 'postgresql_db' && action === 'test_connection') {
      const qType = params?.query_type;
      if (qType === 'count') {
        const { rows } = await query<{ count: string }>('SELECT count(*) FROM tax_records');
        const num = Number(rows[0]?.count ?? 0).toLocaleString('vi-VN');
        return { success: true, message: `Tổng cộng ${num} bản ghi NNT trong DB`, service_id, action, timestamp: now };
      }
      if (qType === 'connections') {
        const { rows } = await query<{ count: string }>('SELECT count(*) FROM pg_stat_activity');
        return { success: true, message: `Đang có ${rows[0]?.count ?? 1} kết nối tới PostgreSQL`, service_id, action, timestamp: now };
      }
      const res = await this.checkDatabase();
      return { success: res.status === 'connected', message: res.statusText, service_id, action, timestamp: now };
    }

    if (service_id === 'crawler_scheduler') {
      if (action === 'trigger') {
        const mode = params?.mode || 'both';
        if (typeof params?.reset_on_existing === 'boolean') {
          await setScheduleGapFillMode(params.reset_on_existing as boolean).catch(() => null);
        }
        if (mode === 'newest') await triggerScheduleNewest();
        else if (mode === 'gap_fill_500') await triggerScheduleGapFill();
        else { await triggerScheduleNewest(); await triggerScheduleGapFill(); }
        return { success: true, message: `Đã kích hoạt lịch quét (${mode})`, service_id, action, timestamp: now };
      }
      if (action === 'start' && params) {
        await startAllNewest({
          max_concurrent_provinces: Number(params.max_concurrent_provinces || 3),
          gap: Number(params.gap || 20),
          num_workers: Number(params.num_workers || 1)
        });
        return { success: true, message: `Đã bật quét với max_concurrent=${params.max_concurrent_provinces || 3}`, service_id, action, timestamp: now };
      }
    }

    if (service_id === 'python_worker' && action === 'stop') {
      await stopAllCrawlers();
      return { success: true, message: 'Đã gửi lệnh dừng toàn bộ worker crawler', service_id, action, timestamp: now };
    }

    if (action === 'restart' || action === 'reset') {
      const batPath = path.resolve(process.cwd(), 'service.bat');
      exec(`cmd.exe /c "${batPath}" restart`, { cwd: process.cwd() });
      return { success: true, message: 'Đang khởi động lại dịch vụ hệ thống...', service_id, action, timestamp: now };
    }

    return { success: true, message: `Đã tiếp nhận thao tác ${action} trên ${service_id}`, service_id, action, timestamp: now };
  }
}
