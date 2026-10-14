// @id 01M4V0HMMAGER9D326B643B5RY
// @related 01M4V0HMNZYFQF5C97DPYG8AR4, 01M4V0HMP0BNNZ0SW67AWG4GN2, 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA
/**
 * api/client.ts - Type-safe HTTP Client giao tiếp với Fastify API Gateway.
 */
import type {
  FilterResult, FilterOptions, HealthReport, CrawledStatsReport,
  SystemConfig, TaxDetailRecord, BocaoRecord, EnrichmentJob,
  EnrichmentSummary, EnrichmentProvince
} from '../types';
import type { ManagedService, SystemDiagnosticsResponse } from '../types/service';

export const ApiClient = {
  // ─── Tỉnh thành & Crawler ───
  async getProvincesConfig(): Promise<{ provinces: Record<string, { activation_tin?: string; name?: string }> }> {
    return (await fetch('/api/configs/provinces')).json();
  },
  async getProvincesLive(): Promise<unknown> { return (await fetch('/api/provinces')).json(); },
  async addProvince(d: { name: string; prefix: string; activation_tin: string }) {
    return fetch('/api/configs/provinces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
  },
  async deleteProvince(id: number | string) { return fetch(`/api/configs/provinces/${id}`, { method: 'DELETE' }); },
  async startCrawler(payload: { province_key: string; scan_mode: string; seed_tin: string; gap: number; num_workers: number }) {
    return (await fetch('/api/crawler/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
  },
  async pauseCrawler(k: string) { return (await fetch('/api/crawler/pause', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ province_key: k }) })).json(); },
  async stopCrawler(k: string) { return (await fetch('/api/crawler/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ province_key: k }) })).json(); },
  async startAllCrawlers(payload: unknown[]) { return (await fetch('/api/crawler/start_all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json(); },
  async startAllNewestCrawlers(payload: { gap: number; num_workers: number; max_concurrent_provinces: number }) {
    return (await fetch('/api/crawler/start_all_newest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
  },
  async stopAllCrawlers() { return (await fetch('/api/crawler/stop_all', { method: 'POST' })).json(); },

  // ─── Lịch Quét Tự Động (Schedule) ───
  async getScheduleStatus() { return (await fetch('/api/crawler/schedule/status')).json(); },
  async toggleScheduleNewest(enable: boolean) {
    return (await fetch('/api/crawler/schedule/toggle_newest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enable }) })).json();
  },
  async toggleScheduleGapFill(enable: boolean) {
    return (await fetch('/api/crawler/schedule/toggle_gap_fill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enable }) })).json();
  },
  async triggerScheduleNewest() { return (await fetch('/api/crawler/schedule/trigger_newest', { method: 'POST' })).json(); },
  async triggerScheduleGapFill() { return (await fetch('/api/crawler/schedule/trigger_gap_fill', { method: 'POST' })).json(); },
  async setScheduleGapFillMode(resetOnExisting: boolean) {
    return (await fetch('/api/crawler/schedule/gap_fill_mode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reset_on_existing: resetOnExisting }) })).json();
  },

  // ─── Báo cáo Sức khỏe & Thống kê ───
  async getCrawlerHealthReport(days = 3): Promise<HealthReport> { return (await fetch(`/api/reports/crawler-health?days=${days}`)).json(); },
  async getCrawlStatsReport(period = 'day'): Promise<CrawledStatsReport> { return (await fetch(`/api/reports/crawl-stats?period=${encodeURIComponent(period)}`)).json(); },

  // ─── Tra cứu & Lọc MST ───
  async searchRecords(payload: { query: string; province_key?: string | null; limit?: number }) {
    return (await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
  },
  async getFilterOptions(params?: string | Record<string, string>): Promise<FilterOptions> {
    const q = typeof params === 'string' ? `province_key=${encodeURIComponent(params)}` : new URLSearchParams(params || {}).toString();
    return (await fetch(`/api/records/filter-options?${q}`)).json();
  },
  async filterRecords(payload: Record<string, unknown>): Promise<FilterResult> {
    return (await fetch('/api/filter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
  },
  async getRecordDetail(tin: string): Promise<TaxDetailRecord> { return (await fetch(`/api/record/${encodeURIComponent(tin)}`)).json(); },
  async getTaxDetail(tin: string): Promise<TaxDetailRecord> { return this.getRecordDetail(tin); },
  async enrichRecord(tin: string) { return (await fetch(`/api/enrichment/${encodeURIComponent(tin)}`)).json(); },

  // ─── Bố Cáo ĐKKD ───
  async getBocaoRecords(params: Record<string, string> = {}): Promise<{ total?: number; records?: BocaoRecord[] }> {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && String(v).trim()) q.append(k, String(v).trim());
    const path = `/api/bocao/records${q.toString() ? '?' + q.toString() : ''}`;
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      if (typeof window !== 'undefined' && window.location.hostname === 'app.local') {
        const fb = await fetch(`http://127.0.0.1:8123${path}`);
        if (fb.ok) return await fb.json();
      }
      throw new Error('Không thể nạp dữ liệu từ máy chủ Fastify (Port 8123)');
    }
  },
  async getBocaoStats(): Promise<Record<string, unknown>> {
    try {
      const res = await fetch('/api/bocao/stats');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      if (typeof window !== 'undefined' && window.location.hostname === 'app.local') {
        const fb = await fetch('http://127.0.0.1:8123/api/bocao/stats');
        if (fb.ok) return await fb.json();
      }
      return { total_records: 0 };
    }
  },
  async crawlBocao() { return (await fetch('/api/bocao/crawl', { method: 'POST' })).json(); },
  async crawlAllBocao(maxPages = 5) {
    return (await fetch('/api/bocao/crawl-all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ max_pages: maxPages }) })).json();
  },
  async searchDkkdOnline(searchField: string) {
    return (await fetch('/api/bocao/dkkd-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ search_field: searchField }) })).json();
  },
  async getBocaoReconcile(params: Record<string, string> = {}) {
    return (await fetch(`/api/bocao/reconcile?${new URLSearchParams(params).toString()}`)).json();
  },
  async getBocaoReconcileStats() { return (await fetch('/api/bocao/reconcile/stats')).json(); },
  async syncMissingBocao(batchSize = 60) {
    return (await fetch('/api/bocao/reconcile/sync-missing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ batch_size: batchSize }) })).json();
  },
  async startBocaoGapFillScan(payload: Record<string, unknown> = {}) {
    return (await fetch('/api/bocao/reconcile/scan-missing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
  },

  // ─── Làm Giàu Dữ Liệu (Enrichment) ───
  async getEnrichmentSummary(): Promise<{ summary: EnrichmentSummary; provinces: EnrichmentProvince[] }> {
    return (await fetch('/api/enrichment/summary')).json();
  },
  async getEnrichmentJobs(): Promise<{ jobs: EnrichmentJob[] }> {
    return (await fetch('/api/enrichment/jobs')).json();
  },
  async resetUnverifiedEnrichment(prefix?: string | null) {
    return (await fetch('/api/enrichment/reset-unverified', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(prefix ? { prefix } : {}) })).json();
  },
  async startProvinceOnlineSync(prefix: string) {
    return (await fetch(`/api/enrichment/province/${encodeURIComponent(prefix)}/start`, { method: 'POST' })).json();
  },
  async stopProvinceOnlineSync(prefix: string) {
    return (await fetch(`/api/enrichment/province/${encodeURIComponent(prefix)}/stop`, { method: 'POST' })).json();
  },

  // ─── Cấu hình hệ thống & Quản trị ───
  async getSystemConfig(): Promise<SystemConfig> { return (await fetch('/api/config/system')).json(); },
  async updateSystemConfig(payload: Partial<SystemConfig>) {
    return (await fetch('/api/config/system', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).json();
  },
  async resetSystem() { return (await fetch('/api/system/reset', { method: 'POST' })).json(); },
  async restartServer() { return (await fetch('/api/system/restart', { method: 'POST' })).json(); },
  async getServicesStatus(): Promise<{ total: number; runningCount: number; stoppedCount: number; services: ManagedService[]; systemTime: string }> {
    return (await fetch('/api/services/status')).json();
  },
  async controlService(serviceId: string, action: string, params?: Record<string, unknown>) {
    return (await fetch('/api/services/control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service_id: serviceId, action, params }) })).json();
  },
  async restartAllServices() { return (await fetch('/api/services/restart_all', { method: 'POST' })).json(); },
  async getDiagnostics(): Promise<SystemDiagnosticsResponse> {
    return (await fetch('/api/services/diagnostics')).json();
  },
  async autoHealServices(): Promise<{ success: boolean; message: string; results: unknown[] }> {
    return (await fetch('/api/services/auto_heal', { method: 'POST' })).json();
  },

  // ─── Graphify ───
  async getGraphifyStats() { return (await fetch('/api/graphify/stats')).json(); },
  async getGraphifyReport(): Promise<string> { return (await fetch('/api/graphify/report')).text(); },
  async refreshGraphify() { return (await fetch('/api/graphify/refresh', { method: 'POST' })).json(); },

  // ─── Xuất file CSV / XLSX ───
  getExportUrl(p: string[], f: string, t: string, c: string[] = [], o: string[] = []): string {
    return this._buildExportUrl('/api/export', p, f, t, c, o);
  },
  getExportXlsxUrl(p: string[], f: string, t: string, c: string[] = [], o: string[] = []): string {
    return this._buildExportUrl('/api/export-xlsx', p, f, t, c, o);
  },
  _buildExportUrl(base: string, p: string[], f: string, t: string, c: string[], o: string[]): string {
    const q = new URLSearchParams();
    for (const k of (Array.isArray(p) ? p : (p ? [p] : []))) q.append('province_key', k);
    if (f) q.set('from_date', f);
    if (t) q.set('to_date', t);
    for (const item of (Array.isArray(c) ? c : (c ? [c] : []))) q.append('commune_name', item);
    for (const item of (Array.isArray(o) ? o : (o ? [o] : []))) q.append('tax_office_name', item);
    return `${base}?${q.toString()}`;
  }
};
