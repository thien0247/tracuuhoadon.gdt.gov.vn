// @id 01M4V0HMM3Y812JHKB628MNV99
// @related 01M4V0HMM0SCCVHMH98X4HVYRA, 01M4V0HMKZ342AVKBY8R7T82E8, 01M4V0HMM2C5JTH5BMNH4HARSY
/**
 * src/modules/services/services.diag.ts
 * Nghiệp vụ chẩn đoán sức khỏe hệ thống chuyên sâu và tự phục hồi (Auto-Heal).
 */

import net from 'node:net';
import path from 'node:path';
import { exec } from 'node:child_process';
import util from 'node:util';
import { query } from '../../db/index.js';
import { env } from '../../config/env.js';
import type { SystemDiagnosticsResponse, DiagnosticItem, ServiceControlResult } from './services.types.js';

const execAsync = util.promisify(exec);

export class ServicesDiagService {
  private static async pingTcpPort(port: number, timeoutMs = 350): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(timeoutMs);
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('timeout', () => { socket.destroy(); resolve(false); });
      socket.once('error', () => { socket.destroy(); resolve(false); });
      socket.connect(port, '127.0.0.1');
    });
  }

  public static async runSystemDiagnostics(): Promise<SystemDiagnosticsResponse> {
    const dbPort = parseInt(env.dbDsn.match(/:(\d+)\//)?.[1] || '5433', 10);
    const startDb = Date.now();
    let dbOk = false;
    let dbLatency = -1;

    try {
      await query('SELECT 1');
      dbLatency = Date.now() - startDb;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const [p8123, p8124, pDb] = await Promise.all([
      this.pingTcpPort(8123),
      this.pingTcpPort(8124),
      this.pingTcpPort(dbPort)
    ]);

    const memRss = Math.round(process.memoryUsage().rss / (1024 * 1024));
    const uptime = Math.round(process.uptime());

    const diagnostics: DiagnosticItem[] = [
      {
        id: 'fastify_gateway',
        name: 'Fastify Web Gateway (Port 8123)',
        status: p8123 ? 'healthy' : 'critical',
        value: p8123 ? `Đang lắng nghe (PID ${process.pid})` : 'Cổng không phản hồi'
      },
      {
        id: 'python_worker',
        name: 'Python AI Worker & CAPTCHA (Port 8124)',
        status: p8124 ? 'healthy' : 'warning',
        value: p8124 ? 'Đang lắng nghe (Uvicorn Ready)' : 'Chưa kết nối hoặc đang khởi động'
      },
      {
        id: 'postgresql_db',
        name: `PostgreSQL Database (Port ${dbPort})`,
        status: dbOk ? 'healthy' : 'critical',
        value: dbOk ? `Sẵn sàng (${dbLatency}ms latency)` : 'Mất kết nối CSDL',
        latencyMs: dbLatency
      },
      {
        id: 'system_memory',
        name: 'Tiêu Thụ Bộ Nhớ Node.js (RSS)',
        status: memRss < 600 ? 'healthy' : (memRss < 1000 ? 'warning' : 'critical'),
        value: `${memRss} MB RAM (Uptime: ${uptime}s)`
      }
    ];

    const healthy = dbOk && p8123 && p8124;
    return {
      healthy,
      systemTime: new Date().toISOString(),
      uptimeSeconds: uptime,
      memoryUsageMb: memRss,
      diagnostics
    };
  }

  public static async executeAutoHeal(): Promise<ServiceControlResult> {
    const batPath = path.resolve(process.cwd(), 'service.bat');
    const now = new Date().toISOString();
    try {
      exec(`cmd.exe /c "${batPath}" restart`, { cwd: process.cwd() });
      return {
        success: true,
        message: 'Đã kích hoạt quy trình Tự Phục Hồi (Auto-Heal): Đang giải phóng port và khởi động lại dịch vụ...',
        service_id: 'auto_heal',
        action: 'restart',
        timestamp: now
      };
    } catch (err) {
      return {
        success: false,
        message: `Lỗi kích hoạt Auto-Heal: ${(err as Error).message}`,
        service_id: 'auto_heal',
        action: 'restart',
        timestamp: now
      };
    }
  }
}
