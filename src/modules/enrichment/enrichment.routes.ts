// @id 01M4V0HMK8GCYJGZZW1JBSEZ37
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/enrichment/enrichment.routes.ts
 * Next.js Native Route Handler cho Module Làm Giàu & Bổ Sung Dữ Liệu Thuế (Enrichment).
 */

import { NextRequest, NextResponse } from 'next/server';
import { EnrichmentService } from './enrichment.service.js';
import { getProvincesCache } from '../provinces/index.js';

function resolveProvinceInfo(key: string): { prefix: string; name: string } {
  const clean = decodeURIComponent(key).trim();
  const cache = getProvincesCache();
  for (const name in cache) {
    if (cache[name].prefix === clean) return { prefix: clean, name };
    if (name.toLowerCase().includes(clean.toLowerCase()) || clean.toLowerCase().includes(name.toLowerCase())) {
      return { prefix: cache[name].prefix, name };
    }
  }
  return { prefix: clean, name: `Tỉnh (${clean})` };
}

export async function handleEnrichmentRoutes(
  req: NextRequest,
  pathname: string,
  method: string,
): Promise<NextResponse | null> {
  if (!pathname.startsWith('/api/enrichment/')) return null;

  if (pathname === '/api/enrichment/summary' && method === 'GET') {
    return NextResponse.json(await EnrichmentService.getNationalSummary());
  }

  if (pathname === '/api/enrichment/jobs' && method === 'GET') {
    return NextResponse.json({ jobs: EnrichmentService.getAllJobs() });
  }

  const mJob = pathname.match(/^\/api\/enrichment\/jobs\/([^/]+)$/);
  if (mJob && method === 'GET') {
    const { prefix } = resolveProvinceInfo(mJob[1]);
    return NextResponse.json({ prefix, job: EnrichmentService.getJobProgress(prefix) });
  }

  if (pathname === '/api/enrichment/reset-unverified' && method === 'POST') {
    const body = (await req.json().catch(() => ({}))) as { prefix?: string };
    const result = await EnrichmentService.resetUnverifiedRecords(body.prefix);
    return NextResponse.json({
      message: `Đã dọn dẹp ${result.affectedRows} bản ghi về trạng thái chờ đồng bộ chuẩn từ API`,
      ...result,
    });
  }

  const mProvStatus = pathname.match(/^\/api\/enrichment\/province\/([^/]+)\/status$/);
  if (mProvStatus && method === 'GET') {
    const { prefix, name } = resolveProvinceInfo(mProvStatus[1]);
    const status = await EnrichmentService.getProvinceStatus(prefix, mProvStatus[1]);
    return NextResponse.json({ ...status, provinceName: name });
  }

  const mProvStart = pathname.match(/^\/api\/enrichment\/province\/([^/]+)\/start$/);
  if (mProvStart && method === 'POST') {
    const { prefix, name } = resolveProvinceInfo(mProvStart[1]);
    const started = EnrichmentService.startProvinceOnlineQueue(prefix, name);
    return NextResponse.json({
      provinceKey: mProvStart[1], prefix, provinceName: name, started,
      message: started ? 'Đã khởi động tiến trình đồng bộ nền API' : 'Tiến trình đang chạy sẵn cho tỉnh này',
    });
  }

  const mProvStop = pathname.match(/^\/api\/enrichment\/province\/([^/]+)\/stop$/);
  if (mProvStop && method === 'POST') {
    const { prefix, name } = resolveProvinceInfo(mProvStop[1]);
    const stopped = EnrichmentService.stopProvinceOnlineQueue(prefix);
    return NextResponse.json({ provinceKey: mProvStop[1], prefix, provinceName: name, stopped });
  }

  const mTin = pathname.match(/^\/api\/enrichment\/([^/]+)$/);
  if (mTin && method === 'GET') {
    const tin = decodeURIComponent(mTin[1]);
    if (!tin) return NextResponse.json({ error: 'Mã số thuế không được để trống' }, { status: 400 });
    const result = await EnrichmentService.enrichSingleRecord(tin);
    if (!result) return NextResponse.json({ error: 'Không tìm thấy dữ liệu cho MST này' }, { status: 404 });
    return NextResponse.json(result);
  }

  return null;
}
