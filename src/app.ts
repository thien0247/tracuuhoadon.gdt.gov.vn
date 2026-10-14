// @id 01M4V0HMJMKZ2T6WCWR7Q0PEW5
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/app.ts
 * Factory khởi tạo và cấu hình ứng dụng Fastify, đăng ký middleware và routes.
 */

import path from 'node:path';
import fs from 'node:fs';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';

import { provincesRoutes } from './modules/provinces/index.js';
import { recordsRoutes } from './modules/records/index.js';
import { crawlerRoutes } from './modules/crawler/index.js';
import { streamRoutes } from './modules/stream/index.js';
import { enrichmentRoutes } from './modules/enrichment/index.js';
import { htkkRoutes } from './modules/htkk/index.js';
import { bocaoRoutes } from './modules/bocao/index.js';
import { servicesRoutes } from './modules/services/index.js';

export async function createApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: false,
    bodyLimit: 10 * 1024 * 1024 // 10MB
  });

  // Hook ghi log request có đo thời gian thực thi (trừ /api/stream lặp liên tục)
  fastify.addHook('onRequest', async (req) => {
    (req.raw as unknown as { _startTime: number })._startTime = Date.now();
  });

  fastify.addHook('onResponse', async (req, reply) => {
    if (req.url === '/api/stream') return;
    const start = (req.raw as unknown as { _startTime?: number })._startTime || Date.now();
    const duration = Date.now() - start;
    const status = reply.statusCode;
    const statusLabel = status < 400 ? '✅' : '⚠️';
    console.log(`[HTTP ${statusLabel}] ${req.method} ${req.url} - ${status} (${duration}ms)`);
  });

  // Đăng ký CORS
  await fastify.register(cors, {
    origin: true
  });

  const staticDir = path.resolve(process.cwd(), 'static');
  if (fs.existsSync(staticDir)) {
    await fastify.register(fastifyStatic, {
      root: staticDir,
      prefix: '/static/'
    });
  }

  // Phục vụ assets từ Next.js App Router build (.next/static) và Vite fallback
  const nextStaticDir = path.resolve(process.cwd(), '.next', 'static');
  if (fs.existsSync(nextStaticDir)) {
    await fastify.register(fastifyStatic, { root: nextStaticDir, prefix: '/_next/static/', decorateReply: false });
  }
  const distAssetsDir = path.resolve(process.cwd(), 'frontend', 'dist', 'assets');
  if (fs.existsSync(distAssetsDir)) {
    await fastify.register(fastifyStatic, { root: distAssetsDir, prefix: '/assets/', decorateReply: false });
  }

  // Phục vụ giao diện Web Dashboard chính (ưu tiên Next.js App Router .next/server/app/index.html)
  fastify.get('/', async (req, reply) => {
    const isLegacy = (req.query as Record<string, string>)?.legacy === '1';
    const nextIndexPath = path.resolve(process.cwd(), '.next', 'server', 'app', 'index.html');
    const distIndexPath = path.resolve(process.cwd(), 'frontend', 'dist', 'index.html');
    const legacyIndexPath = path.resolve(process.cwd(), 'templates', 'index.html');

    const targetPath = isLegacy ? legacyIndexPath : (fs.existsSync(nextIndexPath) ? nextIndexPath : (fs.existsSync(distIndexPath) ? distIndexPath : legacyIndexPath));
    if (fs.existsSync(targetPath)) {
      reply.type('text/html; charset=utf-8');
      return reply.send(fs.createReadStream(targetPath));
    }
    return reply.send('<h3>GDT Tax Crawler Dashboard UI</h3>');
  });

  fastify.get('/legacy', async (_req, reply) => {
    const legacyIndexPath = path.resolve(process.cwd(), 'templates', 'index.html');
    if (fs.existsSync(legacyIndexPath)) {
      reply.type('text/html; charset=utf-8');
      return reply.send(fs.createReadStream(legacyIndexPath));
    }
    return reply.status(404).send('Legacy index.html not found');
  });

  // Đảm bảo phục vụ trực tiếp các file HTML graphify-out
  fastify.get('/graphify-out/:file', async (req, reply) => {
    const { file } = req.params as { file: string };
    const filePath = path.resolve(process.cwd(), 'graphify-out', file);
    if (fs.existsSync(filePath)) {
      if (file.endsWith('.html')) reply.type('text/html; charset=utf-8');
      else if (file.endsWith('.json')) reply.type('application/json; charset=utf-8');
      return reply.send(fs.createReadStream(filePath));
    }
    reply.status(404);
    return { message: `Route GET:/graphify-out/${file} not found`, error: 'Not Found', statusCode: 404 };
  });

  // API endpoints phục vụ thống kê và báo cáo Graphify
  fastify.get('/api/graphify/stats', async (_req, reply) => {
    const analysisFile = path.resolve(process.cwd(), 'graphify-out', '.graphify_analysis.json');
    const graphFile = path.resolve(process.cwd(), 'graphify-out', 'graph.json');
    if (!fs.existsSync(analysisFile) || !fs.existsSync(graphFile)) {
      return { status: 'not_extracted', nodes: 0, edges: 0, communities: 0 };
    }
    try {
      const gData = JSON.parse(fs.readFileSync(graphFile, 'utf-8'));
      const aData = JSON.parse(fs.readFileSync(analysisFile, 'utf-8'));
      return {
        status: 'ready',
        nodes: (gData.nodes || []).length,
        edges: (gData.links || gData.edges || []).length,
        communities: Object.keys(aData.communities || {}).length,
        god_nodes: (aData.gods || []).slice(0, 10),
        surprises: (aData.surprises || []).slice(0, 5)
      };
    } catch (err: unknown) {
      reply.status(500);
      return { status: 'error', message: err instanceof Error ? err.message : String(err) };
    }
  });

  fastify.get('/api/graphify/report', async (_req, reply) => {
    const reportFile = path.resolve(process.cwd(), 'graphify-out', 'GRAPH_REPORT.md');
    if (!fs.existsSync(reportFile)) {
      reply.type('text/plain; charset=utf-8');
      return '# GRAPH_REPORT.md chưa được tạo. Hãy chạy quét đồ thị trước.';
    }
    reply.type('text/plain; charset=utf-8');
    return fs.readFileSync(reportFile, 'utf-8');
  });

  // Health check endpoint cho Desktop GUI và giám sát hệ thống
  fastify.get('/health', async () => ({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() }));
  fastify.get('/api/system/health', async () => ({ status: 'ok', uptime: Math.round(process.uptime()), timestamp: new Date().toISOString() }));

  // Đăng ký các module routes phân tầng
  await fastify.register(provincesRoutes);
  await fastify.register(recordsRoutes);
  await fastify.register(crawlerRoutes);
  await fastify.register(streamRoutes);
  await fastify.register(enrichmentRoutes);
  await fastify.register(htkkRoutes);
  await fastify.register(bocaoRoutes);
  await fastify.register(servicesRoutes);

  return fastify;
}
