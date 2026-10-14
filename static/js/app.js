/**
 * app.js - Khởi tạo Vue 3 App, quản lý Master state, VDDS Theme và luồng SSE.
 */

const { createApp, ref, computed, onMounted } = Vue;

const app = createApp({
    components: {
        'crawler-tab': window.CrawlerTab, 'console-log': window.ConsoleLog,
        'filter-tab': window.FilterTab, 'config-tab': window.ConfigTab,
        'search-tab': window.SearchTab, 'health-report-tab': window.HealthReportTab,
        'crawled-report-tab': window.CrawledReportTab,
        'tax-detail-modal': window.TaxDetailModal, 'enrichment-tab': window.EnrichmentTab,
        'bocao-tab': window.BocaoTab, 'bocao-solr-modal': window.BocaoSolrModal,
        'bocao-reconcile-tab': window.BocaoReconcileTab, 'graphify-tab': window.GraphifyTab,
        'ai-component-badge': window.AiComponentBadge,
    },
    setup() {
        const activeTab = ref('scan');
        const healthReport = ref({ summary: {}, provinces: [] });
        const healthLoading = ref(false);
        const sseConnected = ref(false);
        const theme = ref(localStorage.getItem('gdt_theme') || 'light');
        const isSidebarCollapsed = ref(false);
        const formatNumber = (n) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

        const master = ref({
            total_queried: 0, total_found: 0, total_speed: 0, total_db_records: 0, running_count: 0
        });

        const provinceConfigs = ref({});
        const serverProvinces = ref({});
        const provinceStatus = ref({});
        const logs = ref([]);
        const autoScroll = ref(true);
        const systemConfig = ref({ max_global_rps: 32 });
        const maxConcurrentProvinces = ref(3);

        const toggleTheme = () => {
            theme.value = theme.value === 'dark' ? 'light' : 'dark';
            localStorage.setItem('gdt_theme', theme.value);
            document.documentElement.setAttribute('data-theme', theme.value);
        };

        const toggleSidebar = () => { isSidebarCollapsed.value = !isSidebarCollapsed.value; };

        const getProvStatus = (key) => {
            return (provinceStatus.value && provinceStatus.value[key]) || {
                running: false, paused: false, queried: 0, found: 0, speed: 0,
                last_tin: '', last_scanned_at: '', uptime: '00:00:00', db_count: 0
            };
        };

        const loadSystemConfig = async () => {
            try {
                const res = await ApiClient.getSystemConfig();
                if (res) systemConfig.value = res;
            } catch (e) { console.error('Lỗi tải system config:', e); }
        };

        const saveGlobalRps = async () => {
            const val = Math.max(0.5, Number(systemConfig.value.max_global_rps) || 8);
            systemConfig.value.max_global_rps = val;
            await ApiClient.updateSystemConfig({ max_global_rps: val });
        };

        const changeGlobalRps = async (delta) => {
            const next = Math.max(0.5, (Number(systemConfig.value.max_global_rps) || 8) + delta);
            systemConfig.value.max_global_rps = next;
            await ApiClient.updateSystemConfig({ max_global_rps: next });
        };

        const loadProvinces = async (retries = 15, delayMs = 1500) => {
            try {
                const cfgData = await ApiClient.getProvincesConfig();
                serverProvinces.value = cfgData.provinces || {};
                for (const key in serverProvinces.value) {
                    if (!provinceConfigs.value[key]) {
                        provinceConfigs.value[key] = {
                            scan_mode: 'bidirectional', gap: 5000, num_workers: 3,
                            seed_tin: serverProvinces.value[key].activation_tin
                        };
                    }
                }
                await ApiClient.getProvincesLive();
            } catch (e) {
                if (retries > 0) setTimeout(() => loadProvinces(retries - 1, delayMs), delayMs);
            }
        };

        const setupSSE = () => {
            const es = new EventSource('/api/stream');
            es.onopen = () => { sseConnected.value = true; };
            es.onerror = () => { sseConnected.value = false; };
            es.onmessage = (evt) => {
                try {
                    const payload = JSON.parse(evt.data);
                    if (payload.master) master.value = payload.master;
                    if (payload.provinces) provinceStatus.value = payload.provinces;
                    if (payload.logs) logs.value = payload.logs;
                } catch (err) { console.error('SSE parse error:', err); }
            };
        };

        const startProv = async (key) => {
            const cfg = provinceConfigs.value[key] || {};
            let seed = cfg.seed_tin;
            if (cfg.scan_mode === 'newest' && getProvStatus(key).tin_max) {
                seed = getProvStatus(key).tin_max;
            }
            await ApiClient.startCrawler({
                province_key: key, scan_mode: cfg.scan_mode || 'bidirectional',
                seed_tin: seed, gap: cfg.gap || 5000, num_workers: cfg.num_workers || 3
            });
        };

        const pauseProv = async (key) => { await ApiClient.pauseCrawler(key); };
        const stopProv = async (key) => { await ApiClient.stopCrawler(key); };

        const startAllProvinces = async () => {
            const reqList = Object.entries(provinceConfigs.value).map(([key, cfg]) => ({
                province_key: key, scan_mode: cfg.scan_mode || 'bidirectional',
                seed_tin: (cfg.scan_mode === 'newest' && getProvStatus(key).tin_max) ? getProvStatus(key).tin_max : cfg.seed_tin,
                gap: cfg.gap || 5000, num_workers: cfg.num_workers || 3
            }));
            await ApiClient.startAllCrawlers(reqList);
        };

        const startAllNewestProvinces = async () => {
            for (const key in provinceConfigs.value) {
                const status = getProvStatus(key);
                if (status.tin_max) {
                    provinceConfigs.value[key].seed_tin = status.tin_max;
                    provinceConfigs.value[key].scan_mode = 'newest';
                    provinceConfigs.value[key].gap = 20;
                    provinceConfigs.value[key].num_workers = 2;
                }
            }
            await ApiClient.startAllNewestCrawlers({
                gap: 20, num_workers: 2,
                max_concurrent_provinces: Number(maxConcurrentProvinces.value) || 3
            });
        };

        const stopAllProvinces = async () => { await ApiClient.stopAllCrawlers(); };
        const clearLogs = () => { logs.value = []; };

        const loadHealthReport = async (days = 3) => {
            healthLoading.value = true;
            try {
                const data = await ApiClient.getCrawlerHealthReport(days);
                if (data) healthReport.value = data;
            } catch (e) { console.error('Lỗi tải báo cáo sức khỏe:', e); }
            finally { healthLoading.value = false; }
        };

        const startProvNewest = async (key) => {
            const status = getProvStatus(key);
            const provCfg = serverProvinces.value[key] || {};
            const seed = status.tin_max || provCfg.activation_tin;
            await ApiClient.startCrawler({
                province_key: key, scan_mode: 'newest',
                seed_tin: seed, gap: 20, num_workers: 2
            });
        };

        const { inspectorMode, toggleInspector } = window.AiInspectorStore;
        const inspectorActive = computed(() => inspectorMode.value);

        onMounted(() => {
            document.documentElement.setAttribute('data-theme', theme.value);
            loadSystemConfig();
            loadProvinces();
            loadHealthReport(3);
            setupSSE();
        });

        return {
            activeTab, sseConnected, master, formatNumber, theme, toggleTheme,
            isSidebarCollapsed, toggleSidebar,
            provinceConfigs, serverProvinces, provinceStatus, logs, autoScroll,
            systemConfig, changeGlobalRps, saveGlobalRps, maxConcurrentProvinces,
            startProv, pauseProv, stopProv, startAllProvinces, startAllNewestProvinces, stopAllProvinces,
            clearLogs, loadProvinces,
            healthReport, healthLoading, loadHealthReport, startProvNewest,
            inspectorActive, toggleInspector,
        };
    }
});

app.mount('#app');
