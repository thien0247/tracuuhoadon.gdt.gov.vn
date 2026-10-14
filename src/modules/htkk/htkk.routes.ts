// @id 01M4V0HMKEPGGZD0CQX0RQQJ5E
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/htkk/htkk.routes.ts
 * Next.js Native Route Handler cho Danh mục Địa bàn Hành chính & Cơ quan thuế HTKK.
 */

import { NextRequest, NextResponse } from 'next/server';
import { HtkkService } from './htkk.service.js';

export async function handleHtkkRoutes(
  req: NextRequest,
  pathname: string,
  method: string,
): Promise<NextResponse | null> {
  if (!pathname.startsWith('/api/htkk/') || method !== 'GET') return null;

  if (pathname === '/api/htkk/stats') {
    return NextResponse.json(await HtkkService.getStats());
  }

  if (pathname === '/api/htkk/v3/provinces') {
    const provinces = await HtkkService.getProvincesV3();
    return NextResponse.json({ total: provinces.length, provinces });
  }

  const mV3Dist = pathname.match(/^\/api\/htkk\/v3\/districts\/([^/]+)$/);
  if (mV3Dist) {
    const provinceCode = decodeURIComponent(mV3Dist[1]);
    const districts = await HtkkService.getDistrictsV3(provinceCode);
    return NextResponse.json({ provinceCode, total: districts.length, districts });
  }

  const mV3Comm = pathname.match(/^\/api\/htkk\/v3\/communes\/([^/]+)$/);
  if (mV3Comm) {
    const districtCode = decodeURIComponent(mV3Comm[1]);
    const communes = await HtkkService.getCommunesV3(districtCode);
    return NextResponse.json({ districtCode, total: communes.length, communes });
  }

  if (pathname === '/api/htkk/v2/provinces') {
    const provinces = await HtkkService.getProvincesV2();
    return NextResponse.json({ total: provinces.length, provinces });
  }

  const mV2Comm = pathname.match(/^\/api\/htkk\/v2\/communes\/([^/]+)$/);
  if (mV2Comm) {
    const provinceCode = decodeURIComponent(mV2Comm[1]);
    const communes = await HtkkService.getCommunesV2(provinceCode);
    return NextResponse.json({ provinceCode, total: communes.length, communes });
  }

  if (pathname === '/api/htkk/tax-offices') {
    const provinceCode = req.nextUrl.searchParams.get('provinceCode') || undefined;
    const offices = await HtkkService.getTaxOffices(provinceCode);
    return NextResponse.json({ total: offices.length, offices });
  }

  const mMapping = pathname.match(/^\/api\/htkk\/mapping\/([^/]+)$/);
  if (mMapping) {
    const mapping = await HtkkService.getMappingByCommune(decodeURIComponent(mMapping[1]));
    if (!mapping) return NextResponse.json({ error: 'Không tìm thấy ánh xạ cho mã địa bàn này' }, { status: 404 });
    return NextResponse.json(mapping);
  }

  const mTaxRec = pathname.match(/^\/api\/htkk\/tax-record\/([^/]+)$/);
  if (mTaxRec) {
    const mapping = await HtkkService.resolveTaxpayerMapping(decodeURIComponent(mTaxRec[1]));
    if (!mapping) return NextResponse.json({ error: 'Không tìm thấy MST hoặc không thể ánh xạ' }, { status: 404 });
    return NextResponse.json(mapping);
  }

  return null;
}
