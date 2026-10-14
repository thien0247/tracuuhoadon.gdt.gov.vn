// @id 01M4V0HMJWCK2J48D609JNWFV9
// @related 01M4V0FH0DTKQEFJ3JJ6ZCZSCN, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/bocao/bocao.routes.ts
 * Next.js Native Route Handler cho Module Bố Cáo Điện Tử.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BocaoService } from './bocao.service.js';
import { BocaoReconcileService } from './bocao-reconcile.service.js';
import type { BocaoFilterQuery, BocaoReconcileQuery } from './bocao.types.js';

export async function handleBocaoRoutes(
  req: NextRequest,
  pathname: string,
  method: string,
): Promise<NextResponse | null> {
  if (!pathname.startsWith('/api/bocao/')) return null;
  const sp = req.nextUrl.searchParams;

  try {
    if (pathname === '/api/bocao/records' && method === 'GET') {
      const q: BocaoFilterQuery = {
        page: Number(sp.get('page')) || undefined,
        limit: Number(sp.get('limit')) || undefined,
        type: sp.get('type') || undefined,
        keyword: sp.get('keyword') || undefined,
        province: sp.get('province') || undefined,
      };
      return NextResponse.json(await BocaoService.getRecords(q));
    }

    if (pathname === '/api/bocao/stats' && method === 'GET') {
      return NextResponse.json(await BocaoService.getStats());
    }

    if (pathname === '/api/bocao/crawl' && method === 'POST') {
      return NextResponse.json(await BocaoService.triggerCrawl());
    }

    if (pathname === '/api/bocao/crawl-all' && method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as { max_pages?: number };
      const maxPages = Number(body.max_pages) || 5;
      return NextResponse.json(await BocaoService.triggerCrawlAll(maxPages));
    }

    if (pathname === '/api/bocao/dkkd-search' && method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as { search_field?: string };
      const sf = String(body.search_field || '').trim();
      if (!sf) return NextResponse.json({ error: 'search_field không được để trống' }, { status: 400 });
      return NextResponse.json(await BocaoService.searchDkkdOnline(sf));
    }

    if (pathname === '/api/bocao/reconcile' && method === 'GET') {
      const q: BocaoReconcileQuery = {
        page: Number(sp.get('page')) || undefined,
        limit: Number(sp.get('limit')) || undefined,
        status: (sp.get('status') as BocaoReconcileQuery['status']) || undefined,
        keyword: sp.get('keyword') || undefined,
        province: sp.get('province') || undefined,
      };
      return NextResponse.json(await BocaoReconcileService.getReconcileRecords(q));
    }

    if (pathname === '/api/bocao/reconcile/stats' && method === 'GET') {
      return NextResponse.json(await BocaoReconcileService.getReconcileStats());
    }

    if (pathname === '/api/bocao/reconcile/sync-missing' && method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as { batch_size?: number };
      const batchSize = Math.max(1, Math.min(200, Number(body.batch_size) || 60));
      return NextResponse.json(await BocaoReconcileService.triggerSyncMissing(batchSize));
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'Lỗi xử lý Bố Cáo', details: msg }, { status: 500 });
  }

  return null;
}
