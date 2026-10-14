// @id 01M4V0HMKZ342AVKBY8R7T82E8
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/services/services.routes.ts
 * Next.js Native Route Handler điều khiển và giám sát các dịch vụ liên quan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ServicesService } from './services.service.js';
import { ServicesDiagService } from './services.diag.js';
import type { ServiceControlDto } from './services.types.js';

export async function handleServicesRoutes(
  req: NextRequest,
  pathname: string,
  method: string,
): Promise<NextResponse | null> {
  try {
    if (pathname === '/api/services/diagnostics' && method === 'GET') {
      return NextResponse.json(await ServicesDiagService.runSystemDiagnostics());
    }

    if (pathname === '/api/services/auto_heal' && method === 'POST') {
      return NextResponse.json(await ServicesDiagService.executeAutoHeal());
    }

    if (pathname === '/api/services/status' && method === 'GET') {
      return NextResponse.json(await ServicesService.getOverview());
    }

    if (pathname === '/api/services/control' && method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as ServiceControlDto;
      if (!body.service_id || !body.action) {
        return NextResponse.json({ error: 'Thiếu trường service_id hoặc action hợp lệ' }, { status: 400 });
      }
      return NextResponse.json(await ServicesService.executeControl(body));
    }

    if ((pathname === '/api/services/restart_all' || pathname === '/api/system/restart') && method === 'POST') {
      return NextResponse.json(
        await ServicesService.executeControl({ service_id: 'gdt_windows_service', action: 'restart' }),
      );
    }
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return null;
}
