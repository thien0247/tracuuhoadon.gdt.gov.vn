// @id 01M4V0HMKMKJ8KJM7W9Y8ZC1AW
// @related 01M4V0FH0C5JKJFSR38G6JSD62, 01M4V0FGZJ7X5P2WVWRKXB1XSB, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/provinces/provinces.routes.ts
 * Next.js Native Route Handler quản lý tỉnh thành, thông số hệ thống và reset.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  loadProvinces,
  getProvincesCache,
  createProvince,
  deleteProvince,
  updateProvinceTargets,
  fetchProvinceStats,
  detectProvinceMaxTin,
  updateProvinceMaxTin,
  syncAllProvincesMaxTin,
} from './provinces.service.js';
import type { CreateProvinceDto, UpdateTargetsDto, UpdateMaxTinDto } from './provinces.types.js';
import { env, saveSystemConfig, type SystemConfig } from '../../config/index.js';
import { getWorkerStatus, stopAllCrawlers } from '../crawler/index.js';
import { dbStatsCache } from '../stream/index.js';

export async function handleProvincesRoutes(
  req: NextRequest,
  pathname: string,
  method: string,
): Promise<NextResponse | null> {
  if (pathname === '/api/configs/provinces' && method === 'GET') {
    await loadProvinces();
    return NextResponse.json({ provinces: getProvincesCache() });
  }

  if (pathname === '/api/configs/provinces' && method === 'POST') {
    const body = (await req.json().catch(() => ({}))) as Partial<CreateProvinceDto>;
    if (!body.name || !body.prefix || !body.activation_tin) {
      return NextResponse.json({ error: 'Thiếu thông tin tỉnh thành bắt buộc' }, { status: 400 });
    }
    await createProvince({ name: body.name, prefix: body.prefix, activation_tin: body.activation_tin });
    return NextResponse.json({ success: true });
  }

  const mDel = pathname.match(/^\/api\/configs\/provinces\/([^/]+)$/);
  if (mDel && method === 'DELETE') {
    const pid = parseInt(mDel[1], 10);
    if (isNaN(pid)) return NextResponse.json({ error: 'ID tỉnh thành không hợp lệ' }, { status: 400 });
    await deleteProvince(pid);
    return NextResponse.json({ success: true });
  }

  const mTargets = pathname.match(/^\/api\/configs\/provinces\/([^/]+)\/targets$/);
  if (mTargets && method === 'POST') {
    const pid = parseInt(mTargets[1], 10);
    if (isNaN(pid)) return NextResponse.json({ error: 'ID tỉnh thành không hợp lệ' }, { status: 400 });
    const body = (await req.json().catch(() => ({}))) as UpdateTargetsDto;
    await updateProvinceTargets(pid, body);
    return NextResponse.json({ success: true });
  }

  if (pathname === '/api/provinces' && method === 'GET') {
    const cache = getProvincesCache();
    const workerStatus = await getWorkerStatus();
    const engines = workerStatus?.engines || {};
    const res: Record<string, unknown> = {};
    for (const [name, cfg] of Object.entries(cache)) {
      const eng = engines[name];
      const count = dbStatsCache[name]?.db_count || 0;
      res[name] = {
        prefix: cfg.prefix,
        activation_tin: cfg.activation_tin,
        count,
        running: eng ? Boolean(eng.is_running) : false,
        paused: eng ? Boolean(eng.is_paused) : false,
      };
    }
    return NextResponse.json({ provinces: res });
  }

  if (pathname === '/api/provinces/stats' && method === 'GET') {
    return NextResponse.json(await fetchProvinceStats());
  }

  if (pathname === '/api/provinces/sync-all-max-tin' && method === 'POST') {
    const res = await syncAllProvincesMaxTin();
    return NextResponse.json({ success: true, ...res });
  }

  const mDetect = pathname.match(/^\/api\/provinces\/([^/]+)\/max-tin-detect$/);
  if (mDetect && method === 'GET') {
    try {
      return NextResponse.json(await detectProvinceMaxTin(decodeURIComponent(mDetect[1])));
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
  }

  const mMaxTin = pathname.match(/^\/api\/provinces\/([^/]+)\/max-tin$/);
  if (mMaxTin && method === 'POST') {
    try {
      const body = (await req.json().catch(() => ({ max_tin: '' }))) as UpdateMaxTinDto;
      return NextResponse.json(await updateProvinceMaxTin(decodeURIComponent(mMaxTin[1]), body));
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
  }

  if ((pathname === '/api/config/system' || pathname === '/api/configs/system') && method === 'GET') {
    return NextResponse.json({
      max_global_rps: env.maxGlobalRps,
      max_concurrent_requests: env.maxConcurrentRequests,
      stagger_delay_seconds: env.staggerDelaySeconds,
      waf_cooldown_seconds: env.wafCooldownSeconds,
    });
  }

  if ((pathname === '/api/config/system' || pathname === '/api/configs/system') && method === 'POST') {
    const body = (await req.json().catch(() => ({}))) as Partial<SystemConfig>;
    const saved = saveSystemConfig(body);
    return NextResponse.json({
      success: true,
      config: {
        max_global_rps: saved.maxGlobalRps,
        max_concurrent_requests: saved.maxConcurrentRequests,
        stagger_delay_seconds: saved.staggerDelaySeconds,
        waf_cooldown_seconds: saved.wafCooldownSeconds,
      },
    });
  }

  if (pathname === '/api/system/reset' && method === 'POST') {
    await stopAllCrawlers().catch(() => null);
    await loadProvinces();
    return NextResponse.json({ message: 'Đã reset bộ nhớ và dừng toàn bộ tiến trình thành công.' });
  }

  return null;
}
