/**
 * tests/test_ts_server.ts
 * Kiểm thử tự động toàn diện tầng Pure Next.js 14 App Router API Dispatcher và kết nối PostgreSQL.
 */

import { NextRequest } from 'next/server';
import { dispatchApiRequest } from '../src/app.js';
import { loadProvinces } from '../src/modules/provinces/index.js';
import { closePool } from '../src/db/index.js';
import { stopDbStatsWorker } from '../src/modules/stream/index.js';

async function inject(opts: { method: string; url: string; payload?: unknown }): Promise<{ statusCode: number; body: string }> {
  const req = new NextRequest(`http://127.0.0.1:8123${opts.url}`, {
    method: opts.method,
    headers: opts.payload ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.payload ? JSON.stringify(opts.payload) : undefined,
  });
  const res = await dispatchApiRequest(req);
  return { statusCode: res.status, body: await res.text() };
}

async function runTests(): Promise<void> {
  console.log('=== BẮT ĐẦU KIỂM THỬ TOÀN DIỆN PURE NEXT.JS 14 SERVER ===');
  await loadProvinces();

  try {
    // 1. Kiểm tra GET /api/health
    const resHome = await inject({ method: 'GET', url: '/api/health' });
    console.log(`[Test 1] GET /api/health -> Status: ${resHome.statusCode}`);
    if (resHome.statusCode !== 200) throw new Error('GET /api/health failed');

    // 2. Kiểm tra GET /api/configs/provinces
    const resProv = await inject({ method: 'GET', url: '/api/configs/provinces' });
    const provData = JSON.parse(resProv.body);
    const provCount = Object.keys(provData.provinces || {}).length;
    console.log(`[Test 2] GET /api/configs/provinces -> Status: ${resProv.statusCode}, Tỉnh thành: ${provCount}`);
    if (resProv.statusCode !== 200 || provCount === 0) throw new Error('GET /api/configs/provinces failed');

    // 3. Kiểm tra GET /api/provinces (Live status)
    const resLive = await inject({ method: 'GET', url: '/api/provinces' });
    console.log(`[Test 3] GET /api/provinces -> Status: ${resLive.statusCode}`);
    if (resLive.statusCode !== 200) throw new Error('GET /api/provinces failed');

    // 4. Kiểm tra GET /api/provinces/stats
    const resStats = await inject({ method: 'GET', url: '/api/provinces/stats' });
    console.log(`[Test 4] GET /api/provinces/stats -> Status: ${resStats.statusCode}`);
    if (resStats.statusCode !== 200) throw new Error('GET /api/provinces/stats failed');

    // 5. Kiểm tra POST /api/search
    const resSearch = await inject({
      method: 'POST',
      url: '/api/search',
      payload: { tin: '600184' },
    });
    const searchData = JSON.parse(resSearch.body);
    console.log(`[Test 5] POST /api/search (600184) -> Status: ${resSearch.statusCode}, Kết quả: ${searchData.count}`);
    if (resSearch.statusCode !== 200) throw new Error('POST /api/search failed');

    // 6. Kiểm tra POST /api/filter
    const resFilter = await inject({
      method: 'POST',
      url: '/api/filter',
      payload: { province_key: 'Hồ Chí Minh (03)' },
    });
    const filterData = JSON.parse(resFilter.body);
    console.log(`[Test 6] POST /api/filter -> Status: ${resFilter.statusCode}, Kết quả: ${filterData.count}`);
    if (resFilter.statusCode !== 200) throw new Error('POST /api/filter failed');

    // 7. Kiểm tra GET /api/reports/crawler-health
    const resHealth = await inject({ method: 'GET', url: '/api/reports/crawler-health?days=3' });
    const healthData = JSON.parse(resHealth.body);
    console.log(
      `[Test 7] GET /api/reports/crawler-health -> Status: ${resHealth.statusCode}, Tổng: ${healthData.summary?.total}, Healthy: ${healthData.summary?.healthy}`,
    );
    if (resHealth.statusCode !== 200) throw new Error('GET /api/reports/crawler-health failed');

    // 8. Kiểm tra GET /api/config/system
    const resSys = await inject({ method: 'GET', url: '/api/config/system' });
    console.log(`[Test 8] GET /api/config/system -> Status: ${resSys.statusCode}`);
    if (resSys.statusCode !== 200) throw new Error('GET /api/config/system failed');

    // 9. Kiểm tra GET /api/record/4900127704
    const resRecord = await inject({ method: 'GET', url: '/api/record/4900127704' });
    const recData = JSON.parse(resRecord.body);
    console.log(`[Test 9] GET /api/record/4900127704 -> Status: ${resRecord.statusCode}, Tên: ${recData.norm_name}`);
    if (resRecord.statusCode !== 200) throw new Error('GET /api/record/4900127704 failed');

    // 10. Kiểm tra GET /api/crawler/queue_status
    const resQueue = await inject({ method: 'GET', url: '/api/crawler/queue_status' });
    console.log(`[Test 10] GET /api/crawler/queue_status -> Status: ${resQueue.statusCode}`);
    if (resQueue.statusCode !== 200) throw new Error('GET /api/crawler/queue_status failed');

    // 11. Kiểm tra POST /api/system/reset
    const resReset = await inject({ method: 'POST', url: '/api/system/reset' });
    console.log(`[Test 11] POST /api/system/reset -> Status: ${resReset.statusCode}`);
    if (resReset.statusCode !== 200) throw new Error('POST /api/system/reset failed');

    // 12. Kiểm tra GET /api/reports/crawl-stats
    const resCrawlStats = await inject({ method: 'GET', url: '/api/reports/crawl-stats?period=day' });
    const statsData = JSON.parse(resCrawlStats.body);
    console.log(
      `[Test 12] GET /api/reports/crawl-stats -> Status: ${resCrawlStats.statusCode}, Tổng: ${statsData.summary?.total_records}, Mốc: ${statsData.timeline?.length}`,
    );
    if (resCrawlStats.statusCode !== 200 || !statsData.timeline) throw new Error('GET /api/reports/crawl-stats failed');

    // 13. Kiểm tra GET /api/services/status
    const resSvc = await inject({ method: 'GET', url: '/api/services/status' });
    const svcData = JSON.parse(resSvc.body);
    console.log(`[Test 13] GET /api/services/status -> Status: ${resSvc.statusCode}, Tổng services: ${svcData.total}`);
    if (resSvc.statusCode !== 200 || !svcData.services) throw new Error('GET /api/services/status failed');

    // 14. Kiểm tra POST /api/services/control (test_connection PostgreSQL)
    const resDbTest = await inject({
      method: 'POST',
      url: '/api/services/control',
      payload: { service_id: 'postgresql_db', action: 'test_connection' },
    });
    const dbTestData = JSON.parse(resDbTest.body);
    console.log(`[Test 14] POST /api/services/control -> Status: ${resDbTest.statusCode}, Success: ${dbTestData.success}`);
    if (resDbTest.statusCode !== 200 || !dbTestData.success) throw new Error('POST /api/services/control failed');

    // 15. Kiểm tra POST /api/services/control với tham số parameters (query_type: count)
    const resDbCount = await inject({
      method: 'POST',
      url: '/api/services/control',
      payload: { service_id: 'postgresql_db', action: 'test_connection', params: { query_type: 'count' } },
    });
    const dbCountData = JSON.parse(resDbCount.body);
    console.log(`[Test 15] POST /api/services/control (params) -> Status: ${resDbCount.statusCode}, Message: ${dbCountData.message}`);
    if (resDbCount.statusCode !== 200 || !dbCountData.message.includes('bản ghi NNT')) throw new Error('POST /api/services/control with params failed');

    console.log('\n>>> 100% CÁC BƯỚC KIỂM THỬ PURE NEXT.JS 14 SERVER ĐỀU THÀNH CÔNG! <<<\n');
  } finally {
    stopDbStatsWorker();
    await closePool();
  }
}

runTests().catch((err) => {
  console.error('❌ Kiểm thử Next.js Server thất bại:', err);
  process.exit(1);
});
