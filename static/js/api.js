/**
 * api.js - Tầng dịch vụ mạng giao tiếp với RESTful API của Fastify backend.
 */

const ApiClient = {
    // ─── Cấu hình tỉnh thành ───
    async getProvincesConfig() { return (await fetch('/api/configs/provinces')).json(); },
    async addProvince(provData) {
        return fetch('/api/configs/provinces', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(provData) });
    },
    async deleteProvince(id) { return fetch(`/api/configs/provinces/${id}`, { method: 'DELETE' }); },
    async getProvincesLive() { return (await fetch('/api/provinces')).json(); },

    // ─── Điều khiển Crawler ───
    async startCrawler(payload) {
        return fetch('/api/crawler/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    },
    async pauseCrawler(province_key) {
        return fetch('/api/crawler/pause', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ province_key }) });
    },
    async stopCrawler(province_key) {
        return fetch('/api/crawler/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ province_key }) });
    },
    async startAllCrawlers(reqList) {
        return fetch('/api/crawler/start_all', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reqList) });
    },
    async startAllNewestCrawlers(payload = { gap: 20, num_workers: 2, max_concurrent_provinces: 3 }) {
        return fetch('/api/crawler/start_all_newest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    },
    async getQueueStatus() { return (await fetch('/api/crawler/queue_status')).json(); },
    async stopAllCrawlers() { return fetch('/api/crawler/stop_all', { method: 'POST' }); },
    async getScheduleStatus() { return (await fetch('/api/crawler/schedule/status')).json(); },
    async toggleScheduleNewest(enable = null) { return (await fetch('/api/crawler/schedule/toggle_newest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enable }) })).json(); },
    async toggleScheduleGapFill(enable = null) { return (await fetch('/api/crawler/schedule/toggle_gap_fill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enable }) })).json(); },
    async triggerScheduleNewest() { return (await fetch('/api/crawler/schedule/trigger_newest', { method: 'POST' })).json(); },
    async triggerScheduleGapFill() { return (await fetch('/api/crawler/schedule/trigger_gap_fill', { method: 'POST' })).json(); },
    async setScheduleGapFillMode(resetOnExisting) { return (await fetch('/api/crawler/schedule/gap_fill_mode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reset_on_existing: resetOnExisting }) })).json(); },

    // ─── Tra cứu & Lọc ───
    async filterRecords(payload) {
        const res = await fetch('/api/filter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        return await res.json();
    },
    async searchRecords(payload) {
        const res = await fetch('/api/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        return await res.json();
    },
    async getFilterOptions(params = {}) {
        const q = typeof params === 'string' ? `province_key=${encodeURIComponent(params)}` : new URLSearchParams(params).toString();
        const res = await fetch(`/api/records/filter-options?${q}`);
        return await res.json();
    },
    getExportUrl(provKeys, fromDate, toDate, communeNames = [], taxOfficeNames = []) {
        return this._buildExportUrl('/api/export', provKeys, fromDate, toDate, communeNames, taxOfficeNames);
    },
    getExportXlsxUrl(provKeys, fromDate, toDate, communeNames = [], taxOfficeNames = []) {
        return this._buildExportUrl('/api/export-xlsx', provKeys, fromDate, toDate, communeNames, taxOfficeNames);
    },
    _buildExportUrl(base, provKeys, fromDate, toDate, communeNames, taxOfficeNames) {
        const arr = (v) => Array.isArray(v) ? v : (v ? [v] : []);
        const params = new URLSearchParams();
        for (const k of arr(provKeys)) params.append('province_key', k);
        if (fromDate) params.set('from_date', fromDate);
        if (toDate) params.set('to_date', toDate);
        for (const c of arr(communeNames)) params.append('commune_name', c);
        for (const t of arr(taxOfficeNames)) params.append('tax_office_name', t);
        return `${base}?${params.toString()}`;
    },

    // ─── Cấu hình hệ thống & Tốc độ toàn cục ───
    async getSystemConfig() { return (await fetch('/api/config/system')).json(); },
    async updateSystemConfig(payload) {
        const res = await fetch('/api/config/system', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        return await res.json();
    },

    // ─── Báo cáo sức khỏe Crawler & TIN Max ───
    async getCrawlerHealthReport(days = 3) {
        return (await fetch(`/api/reports/crawler-health?days=${days}`)).json();
    },

    // ─── Quản trị & Reset Server ───
    async resetSystem() { return (await fetch('/api/system/reset', { method: 'POST' })).json(); },
    async restartServer() { return (await fetch('/api/system/restart', { method: 'POST' })).json(); },

    // ─── Tra cứu Chi tiết Người nộp thuế ───
    async getTaxDetail(tin) {
        const res = await fetch(`/api/record/${encodeURIComponent(tin)}`);
        return await res.json();
    },
    async getRecordDetail(tin) { return this.getTaxDetail(tin); },
    async enrichRecord(tin) {
        const res = await fetch(`/api/enrichment/${encodeURIComponent(tin)}`);
        return await res.json();
    },

    // ─── Enrichment ───
    async getEnrichmentStats() { return (await fetch('/api/enrichment/stats')).json(); },
    async triggerProvinceEnrichment(provinceKey, batchSize = 500) {
        const res = await fetch('/api/enrichment/trigger', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ province_key: provinceKey, batch_size: batchSize })
        });
        return await res.json();
    },
    async triggerAllEnrichment(batchSize = 200) {
        const res = await fetch('/api/enrichment/trigger-all', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batch_size: batchSize })
        });
        return await res.json();
    },
    async getEnrichmentSummary() { return (await fetch('/api/enrichment/summary')).json(); },
    async getEnrichmentJobs() { return (await fetch('/api/enrichment/jobs')).json(); },
    async getEnrichmentJobStatus(provinceKey) {
        return (await fetch(`/api/enrichment/jobs/${encodeURIComponent(provinceKey)}`)).json();
    },
    async resetUnverifiedEnrichment(prefix = null) {
        const res = await fetch('/api/enrichment/reset-unverified', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prefix ? { prefix } : {})
        });
        return await res.json();
    },
    async startProvinceOnlineSync(provinceKey) {
        return (await fetch(`/api/enrichment/province/${encodeURIComponent(provinceKey)}/start`, { method: 'POST' })).json();
    },
    async stopProvinceOnlineSync(provinceKey) {
        return (await fetch(`/api/enrichment/province/${encodeURIComponent(provinceKey)}/stop`, { method: 'POST' })).json();
    },

    // ─── Bố Cáo Điện Tử (DKKD) ───
    async getBocaoRecords(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return (await fetch(`/api/bocao/records?${qs}`)).json();
    },
    async getBocaoStats() { return (await fetch('/api/bocao/stats')).json(); },
    async crawlBocao() { return (await fetch('/api/bocao/crawl', { method: 'POST' })).json(); },
    async crawlAllBocao(maxPages = 5) {
        const res = await fetch('/api/bocao/crawl-all', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ max_pages: maxPages })
        });
        return await res.json();
    },
    async searchDkkdOnline(searchField) {
        const res = await fetch('/api/bocao/dkkd-search', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ search_field: searchField })
        });
        return await res.json();
    },
    async getBocaoReconcile(params = {}) {
        const qs = new URLSearchParams(params).toString();
        return (await fetch(`/api/bocao/reconcile?${qs}`)).json();
    },
    async getBocaoReconcileStats() { return (await fetch('/api/bocao/reconcile/stats')).json(); },
    async syncMissingBocao(batchSize = 60) {
        const res = await fetch('/api/bocao/reconcile/sync-missing', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batch_size: batchSize })
        });
        return await res.json();
    },
    async startBocaoGapFillScan(payload = {}) {
        const res = await fetch('/api/bocao/reconcile/scan-missing', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await res.json();
    }
};

window.ApiClient = ApiClient;
