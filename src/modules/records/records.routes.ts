// @id 01M4V0HMKVZHSS62XMK5WXBH1P
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/records/records.routes.ts
 * Next.js Native Route Handler tra cứu, lọc, xuất dữ liệu và báo cáo thống kê đa chiều (HTKK V2 & V3).
 */

import { NextRequest, NextResponse } from 'next/server';
import { filterRecords, searchRecords, getRecordDetail, getFilterOptions, getFilterOptionsV2, getFilterOptionsV3 } from './records.service.js';
import { exportCsvData, exportXlsxData } from './records.export.js';
import { fetchCrawlerHealthReport } from './records.health.js';
import { fetchCrawlStats, syncCrawlDailyStats } from './records.report.js';
import { fetchV2MergedStats, getV2MergedCatalog } from './records.v2report.js';
import { exportCrawlStatsToExcel, exportV2MergedStatsToExcel, exportHealthToExcel } from './records.report-export.js';
import type { FilterRequestDto, SearchRequestDto, CrawlStatsQueryDto } from './records.types.js';

function splitParam(val?: string | string[] | null): string[] {
  if (!val) return [];
  const arr = Array.isArray(val) ? val : [val];
  return arr.flatMap((s) => s.split(',')).map((s) => s.trim()).filter(Boolean);
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function handleRecordsRoutes(
  req: NextRequest,
  pathname: string,
  method: string,
): Promise<NextResponse | null> {
  const sp = req.nextUrl.searchParams;

  if (pathname === '/api/records/filter-options' && method === 'GET') {
    const model = sp.get('model') || undefined;
    const provinceCode = sp.get('province_code') || undefined;
    const districtCode = sp.get('district_code') || undefined;
    const provinceKey = sp.get('province_key') || undefined;
    if (model === 'v2') return NextResponse.json(await getFilterOptionsV2(provinceCode));
    if (model === 'v3') return NextResponse.json(await getFilterOptionsV3(provinceCode, districtCode));
    return NextResponse.json(await getFilterOptions(provinceKey || provinceCode || ''));
  }

  if (pathname === '/api/filter' && method === 'POST') {
    try {
      const body = (await req.json().catch(() => ({}))) as FilterRequestDto;
      return NextResponse.json(await filterRecords(body));
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
  }

  if (pathname === '/api/search' && method === 'POST') {
    try {
      const body = (await req.json().catch(() => ({ query: '' }))) as SearchRequestDto;
      return NextResponse.json(await searchRecords(body));
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
  }

  if (pathname === '/api/export' && method === 'GET') {
    try {
      const { filename, csvContent } = await exportCsvData(
        splitParam(sp.getAll('province_key')), sp.get('from_date'), sp.get('to_date'),
        splitParam(sp.getAll('commune_name')), splitParam(sp.getAll('tax_office_name')),
      );
      return new NextResponse(csvContent, {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` },
      });
    } catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 400 }); }
  }

  if (pathname === '/api/export-xlsx' && method === 'GET') {
    try {
      const { filename, buffer } = await exportXlsxData(
        splitParam(sp.getAll('province_key')), sp.get('from_date'), sp.get('to_date'),
        splitParam(sp.getAll('commune_name')), splitParam(sp.getAll('tax_office_name')),
      );
      return new NextResponse(new Uint8Array(buffer), {
        headers: { 'Content-Type': XLSX_MIME, 'Content-Disposition': `attachment; filename="${filename}"` },
      });
    } catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 400 }); }
  }

  if (pathname === '/api/reports/crawler-health' && method === 'GET') {
    const days = parseInt(sp.get('days') || '3', 10);
    return NextResponse.json(await fetchCrawlerHealthReport(days > 0 ? days : 3));
  }

  if (pathname === '/api/reports/health-excel' && method === 'GET') {
    const days = parseInt(sp.get('days') || '3', 10);
    const data = await fetchCrawlerHealthReport(days > 0 ? days : 3);
    const { filename, buffer } = await exportHealthToExcel(data.provinces);
    return new NextResponse(new Uint8Array(buffer), {
      headers: { 'Content-Type': XLSX_MIME, 'Content-Disposition': `attachment; filename="${filename}"` },
    });
  }

  if ((pathname === '/api/reports/crawl-stats' || pathname === '/api/reports/crawl-stats-excel') && method === 'GET') {
    try {
      const q: CrawlStatsQueryDto = {
        period: (sp.get('period') as CrawlStatsQueryDto['period']) || undefined,
        time_field: (sp.get('time_field') as CrawlStatsQueryDto['time_field']) || undefined,
        province_key: sp.get('province_key') || undefined,
        from_date: sp.get('from_date') || undefined,
        to_date: sp.get('to_date') || undefined,
      };
      const data = await fetchCrawlStats(q);
      if (pathname === '/api/reports/crawl-stats') return NextResponse.json(data);
      const { filename, buffer } = await exportCrawlStatsToExcel(data);
      return new NextResponse(new Uint8Array(buffer), {
        headers: { 'Content-Type': XLSX_MIME, 'Content-Disposition': `attachment; filename="${filename}"` },
      });
    } catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 500 }); }
  }

  if (pathname === '/api/reports/sync-stats' && method === 'POST') {
    try { return NextResponse.json({ success: true, ...(await syncCrawlDailyStats()) }); }
    catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 500 }); }
  }

  if (pathname === '/api/reports/v2-merged-stats' && method === 'GET') {
    try { return NextResponse.json(await fetchV2MergedStats()); }
    catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 500 }); }
  }

  if (pathname === '/api/reports/v2-provinces' && method === 'GET') {
    return NextResponse.json({ total: getV2MergedCatalog().length, catalog: getV2MergedCatalog() });
  }

  if (pathname === '/api/reports/v2-excel' && method === 'GET') {
    try {
      const data = await fetchV2MergedStats();
      const { filename, buffer } = await exportV2MergedStatsToExcel(data);
      return new NextResponse(new Uint8Array(buffer), {
        headers: { 'Content-Type': XLSX_MIME, 'Content-Disposition': `attachment; filename="${filename}"` },
      });
    } catch (err) { return NextResponse.json({ error: (err as Error).message }, { status: 500 }); }
  }

  const mRecord = pathname.match(/^\/api\/record\/([^/]+)$/);
  if (mRecord && method === 'GET') {
    const tin = decodeURIComponent(mRecord[1]);
    const record = await getRecordDetail(tin);
    if (!record) return NextResponse.json({ error: 'Không tìm thấy mã số thuế' }, { status: 404 });
    return NextResponse.json(record);
  }

  return null;
}
