// @id 01M4V0HMJTWQRKN2H4W9FPQS7W
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/db/pool.ts
 * Quản lý PostgreSQL Connection Pool với cơ chế ghi log chi tiết và tối ưu I/O.
 */

import pg from 'pg';
import { env } from '../config/index.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.dbDsn,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('connect', () => {
  // Có thể bật debug nếu cần giám sát pool client
});

pool.on('error', (err) => {
  console.error('[Database Pool] Lỗi bất ngờ trên client rảnh rỗi:', err);
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  const client = await pool.connect();
  try {
    const res = await client.query<T>(text, params);
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`[Database Slow Query] (${duration}ms): ${text.replace(/\s+/g, ' ').slice(0, 100)}...`);
    }
    return res;
  } catch (err) {
    const duration = Date.now() - start;
    console.error(`[Database Query Error] (${duration}ms): ${(err as Error).message}\nSQL: ${text.slice(0, 150)}`);
    throw err;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  console.log('[Database Pool] Đang đóng toàn bộ kết nối PostgreSQL...');
  await pool.end();
  console.log('[Database Pool] Đã đóng thành công.');
}
