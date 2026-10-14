// @id 01M4V0HMJN5XF70K85TX6W42AF
// @related 01M4V0HMJMKZ2T6WCWR7Q0PEW5, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/server.ts
 * Entrypoint khởi chạy Pure Next.js 14 App Router HTTP Server cho GDT Tax Crawler (Port 8123).
 */

import http from 'node:http';
import next from 'next';
import { env } from './config/index.js';
import { loadProvinces } from './modules/provinces/index.js';
import { startDbStatsWorker, stopDbStatsWorker } from './modules/stream/index.js';
import { closePool } from './db/index.js';

async function start(): Promise<void> {
  try {
    await loadProvinces();
    startDbStatsWorker();
    console.log('[Next.js Server] Đã nạp danh mục 62 tỉnh thành từ PostgreSQL.');

    const nextApp = next({
      dev: false,
      dir: process.cwd(),
      hostname: env.host,
      port: env.port,
    });
    const handle = nextApp.getRequestHandler();
    await nextApp.prepare();

    const server = http.createServer((req, res) => {
      void handle(req, res);
    });

    server.listen(env.port, env.host, () => {
      console.log(`[Next.js Server] GDT Tax Crawler Dashboard running at: http://${env.host}:${env.port}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`[Next.js Server] Nhận tín hiệu ${signal}, đang đóng server...`);
      stopDbStatsWorker();
      server.close();
      await closePool();
      process.exit(0);
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (err) {
    console.error('[Next.js Server] Lỗi khởi động:', err);
    process.exit(1);
  }
}

void start();
