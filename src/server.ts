// @id 01M4V0HMJN5XF70K85TX6W42AF
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/server.ts
 * Entrypoint khởi chạy TypeScript Fastify Backend cho GDT Tax Crawler.
 */

import { createApp } from './app.js';
import { env } from './config/index.js';
import { loadProvinces } from './modules/provinces/index.js';
import { closePool } from './db/index.js';

async function start(): Promise<void> {
  try {
    // Nạp trước danh mục tỉnh thành từ PostgreSQL
    await loadProvinces();
    console.log('[Server TS] Đã nạp danh mục tỉnh thành từ CSDL.');

    const app = await createApp();
    const address = await app.listen({ host: env.host, port: env.port });
    console.log(`[Server TS] GDT Tax Crawler Dashboard running at: ${address}`);

    const shutdown = async (signal: string) => {
      console.log(`[Server TS] Nhận tín hiệu ${signal}, đang đóng server...`);
      await app.close();
      await closePool();
      process.exit(0);
    };

    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
  } catch (err) {
    console.error('[Server TS] Lỗi khởi động:', err);
    process.exit(1);
  }
}

void start();
