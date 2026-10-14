// @id 01M4V0HMK2V308VQKSFW10XZ8F
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/crawler/crawler.routes.ts
 * Next.js Native Route Handler điều khiển tiến trình crawler đa tỉnh.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  startCrawler,
  startAllNewest,
  stopCrawler,
  pauseCrawler,
  resumeCrawler,
  stopAllCrawlers,
  getQueueStatus,
  getScheduleStatus,
  toggleScheduleNewest,
  toggleScheduleGapFill,
  triggerScheduleNewest,
  triggerScheduleGapFill,
  setScheduleGapFillMode,
} from './crawler.service.js';
import type { StartCrawlerDto, StartAllNewestDto, ProvinceControlDto } from './crawler.types.js';

export async function handleCrawlerRoutes(
  req: NextRequest,
  pathname: string,
  method: string,
): Promise<NextResponse | null> {
  if (!pathname.startsWith('/api/crawler/')) return null;

  try {
    if (pathname === '/api/crawler/queue_status' && method === 'GET') {
      return NextResponse.json(await getQueueStatus());
    }
    if (pathname === '/api/crawler/schedule/status' && method === 'GET') {
      return NextResponse.json(await getScheduleStatus());
    }

    if (method !== 'POST') return null;
    const body = await req.json().catch(() => ({}));

    if (pathname === '/api/crawler/start') {
      return NextResponse.json(await startCrawler(body as StartCrawlerDto));
    }
    if (pathname === '/api/crawler/start_all_newest' || pathname === '/api/crawler/start_all') {
      return NextResponse.json(await startAllNewest(body as StartAllNewestDto));
    }
    if (pathname === '/api/crawler/stop') {
      const provKey = (body as ProvinceControlDto)?.province_key;
      if (!provKey) return NextResponse.json({ error: 'Thiếu province_key' }, { status: 400 });
      return NextResponse.json(await stopCrawler(provKey));
    }
    if (pathname === '/api/crawler/pause') {
      const provKey = (body as ProvinceControlDto)?.province_key;
      if (!provKey) return NextResponse.json({ error: 'Thiếu province_key' }, { status: 400 });
      return NextResponse.json(await pauseCrawler(provKey));
    }
    if (pathname === '/api/crawler/resume') {
      const provKey = (body as ProvinceControlDto)?.province_key;
      if (!provKey) return NextResponse.json({ error: 'Thiếu province_key' }, { status: 400 });
      return NextResponse.json(await resumeCrawler(provKey));
    }
    if (pathname === '/api/crawler/stop_all') {
      return NextResponse.json(await stopAllCrawlers());
    }
    if (pathname === '/api/crawler/schedule/toggle_newest') {
      return NextResponse.json(await toggleScheduleNewest((body as { enable?: boolean })?.enable));
    }
    if (pathname === '/api/crawler/schedule/toggle_gap_fill') {
      return NextResponse.json(await toggleScheduleGapFill((body as { enable?: boolean })?.enable));
    }
    if (pathname === '/api/crawler/schedule/trigger_newest') {
      return NextResponse.json(await triggerScheduleNewest());
    }
    if (pathname === '/api/crawler/schedule/trigger_gap_fill' || pathname === '/api/crawler/gap_fill_500/start_all') {
      return NextResponse.json(await triggerScheduleGapFill());
    }
    if (pathname === '/api/crawler/schedule/gap_fill_mode') {
      return NextResponse.json(await setScheduleGapFillMode((body as { reset_on_existing?: boolean })?.reset_on_existing ?? true));
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return null;
}
