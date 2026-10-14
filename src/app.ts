// @id 01M4V0HMJMKZ2T6WCWR7Q0PEW5
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/app.ts
 * Pure Next.js 14 App Router API Dispatcher (0% Fastify dependency).
 * Điều phối toàn bộ REST API & SSE endpoints trực tiếp qua NextRequest / NextResponse.
 */

import path from 'node:path';
import fs from 'node:fs';
import { NextRequest, NextResponse } from 'next/server';

import { handleProvincesRoutes, loadProvinces, getProvincesCache } from './modules/provinces/index.js';
import { handleRecordsRoutes } from './modules/records/index.js';
import { handleCrawlerRoutes } from './modules/crawler/index.js';
import { handleStreamRoutes } from './modules/stream/index.js';
import { handleEnrichmentRoutes } from './modules/enrichment/index.js';
import { handleHtkkRoutes } from './modules/htkk/index.js';
import { handleBocaoRoutes } from './modules/bocao/index.js';
import { handleServicesRoutes } from './modules/services/index.js';

let initialized = false;

async function ensureInitialized(): Promise<void> {
  if (!initialized || Object.keys(getProvincesCache()).length === 0) {
    initialized = true;
    await loadProvinces().catch(() => null);
  }
}

function handleGraphifyApi(pathname: string, method: string): NextResponse | null {
  if (pathname === '/api/graphify/stats' && method === 'GET') {
    const analysisFile = path.resolve(process.cwd(), 'graphify-out', '.graphify_analysis.json');
    const graphFile = path.resolve(process.cwd(), 'graphify-out', 'graph.json');
    if (!fs.existsSync(analysisFile) || !fs.existsSync(graphFile)) {
      return NextResponse.json({ status: 'not_extracted', nodes: 0, edges: 0, communities: 0 });
    }
    try {
      const gData = JSON.parse(fs.readFileSync(graphFile, 'utf-8'));
      const aData = JSON.parse(fs.readFileSync(analysisFile, 'utf-8'));
      return NextResponse.json({
        status: 'ready',
        nodes: (gData.nodes || []).length,
        edges: (gData.links || gData.edges || []).length,
        communities: Object.keys(aData.communities || {}).length,
        god_nodes: (aData.gods || []).slice(0, 10),
        surprises: (aData.surprises || []).slice(0, 5),
      });
    } catch (err: unknown) {
      return NextResponse.json(
        { status: 'error', message: err instanceof Error ? err.message : String(err) },
        { status: 500 },
      );
    }
  }

  if (pathname === '/api/graphify/report' && method === 'GET') {
    const reportFile = path.resolve(process.cwd(), 'graphify-out', 'GRAPH_REPORT.md');
    const content = fs.existsSync(reportFile)
      ? fs.readFileSync(reportFile, 'utf-8')
      : '# GRAPH_REPORT.md chưa được tạo. Hãy chạy quét đồ thị trước.';
    return new NextResponse(content, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  return null;
}

export async function dispatchApiRequest(req: NextRequest): Promise<NextResponse> {
  const start = Date.now();
  const pathname = req.nextUrl.pathname;
  const method = req.method.toUpperCase();

  await ensureInitialized();

  let response: NextResponse | null = null;

  if ((pathname === '/api/system/health' || pathname === '/api/health') && method === 'GET') {
    response = NextResponse.json({
      status: 'ok',
      engine: 'Pure Next.js 14 App Router',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  }

  if (!response) response = handleStreamRoutes(req, pathname, method);
  if (!response) response = handleGraphifyApi(pathname, method);
  if (!response) response = await handleProvincesRoutes(req, pathname, method);
  if (!response) response = await handleRecordsRoutes(req, pathname, method);
  if (!response) response = await handleCrawlerRoutes(req, pathname, method);
  if (!response) response = await handleEnrichmentRoutes(req, pathname, method);
  if (!response) response = await handleHtkkRoutes(req, pathname, method);
  if (!response) response = await handleBocaoRoutes(req, pathname, method);
  if (!response) response = await handleServicesRoutes(req, pathname, method);

  if (!response) {
    response = NextResponse.json(
      { message: `Route ${method}:${pathname} not found`, error: 'Not Found', statusCode: 404 },
      { status: 404 },
    );
  }

  if (pathname !== '/api/stream') {
    const duration = Date.now() - start;
    const status = response.status;
    const statusLabel = status < 400 ? '✅' : '⚠️';
    console.log(`[HTTP ${statusLabel}] ${method} ${pathname}${req.nextUrl.search} - ${status} (${duration}ms)`);
  }

  return response;
}
