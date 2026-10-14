<!-- @id 01M4V0HMM8BWZX4545PGAYZXBT -->
<!-- @related 01M4V0HMN6W2PBXHV9JWYJ86MW, 01M4V0HMN7RQJAYSHAG59PF1JQ, 01M4V0HMN5YJ7RWCSREJ4CSTM9, 01M4V0HMN8CRGK8ASNXFFBPNMN, 01M4V0HMNP498R2TP9DW4E42CC -->
<template>
  <div class="min-h-screen flex flex-col bg-[var(--bg-secondary)] text-[var(--text-primary)]">
    <!-- VDDS Header -->
    <AppHeader @toggle-sidebar="isSidebarCollapsed = !isSidebarCollapsed" @switch-tab="activeTab = $event" />

    <!-- Main Layout -->
    <div class="flex flex-1 min-h-[calc(100vh-86px)]">
      <!-- Collapsible Sidebar -->
      <AppSidebar :collapsed="isSidebarCollapsed" :active-tab="activeTab"
                  :max-concurrent="maxConcurrentProvinces" :stalled-count="healthReport.summary?.stalled"
                  @update:active-tab="activeTab = $event" @update:max-concurrent="maxConcurrentProvinces = $event"
                  @start-newest="startAllNewestProvinces" @start-all="startAllProvinces" @stop-all="stopAllProvinces" />

      <!-- Main Content Area -->
      <main class="flex-1 p-3 md:p-4 space-y-3 overflow-x-hidden">
        <!-- Master Metrics Topbar -->
        <MasterMetrics :master="master" :max-rps="Number(systemConfig.max_global_rps) || 32"
                       @change-rps="changeGlobalRps" @update-rps="systemConfig.max_global_rps = $event; saveGlobalRps()" />

        <!-- Tab Views -->
        <ServicesTab v-show="activeTab === 'services'" />

        <div v-show="activeTab === 'scan'" class="space-y-5">
          <CrawlerTab :province-configs="provinceConfigs" :province-status="provinceStatus"
                      @start-prov="startProv" @pause-prov="pauseProv" @stop-prov="stopProv" />
          <ConsoleLog :logs="logs" v-model:auto-scroll="autoScroll" @clear-logs="clearLogs" />
        </div>

        <CrawledReport v-show="activeTab === 'crawled_report'" :province-configs="provinceConfigs" />
        <HealthReport v-show="activeTab === 'health_report'" :report-data="healthReport" :loading="healthLoading"
                      @refresh="loadHealthReport" @scan-province="startProvNewest" />
        <ConfigTab v-show="activeTab === 'config'" :server-provinces="serverProvinces" @province-updated="loadProvinces" />
        <BocaoTab v-show="activeTab === 'bocao'" />
        <BocaoReconcile v-show="activeTab === 'bocao_reconcile'" @view-detail="openTaxDetail" @open-solr="openDkkdSearch" />
        <SearchTab v-show="activeTab === 'search'" :province-configs="provinceConfigs" @select-tin="openTaxDetail" />
        <FilterTab v-show="activeTab === 'filter'" :province-configs="provinceConfigs" @select-tin="openTaxDetail" />
        <EnrichmentTab v-show="activeTab === 'enrichment'" />
        <GraphifyTab v-show="activeTab === 'graphify'" />
      </main>
    </div>

    <!-- VDDS Footer -->
    <AppFooter />

    <!-- Modals & AI Inspector -->
    <TaxDetailModal ref="taxDetailModalRef" />
    <BocaoSolrModal ref="solrModalRef" @view-tax-detail="openTaxDetail" />
    <AiInspector />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import AppHeader from './components/layout/AppHeader.vue';
import AppSidebar from './components/layout/AppSidebar.vue';
import AppFooter from './components/layout/AppFooter.vue';
import MasterMetrics from './components/layout/MasterMetrics.vue';
import ServicesTab from './components/services/ServicesTab.vue';
import CrawlerTab from './components/crawler/CrawlerTab.vue';
import ConsoleLog from './components/crawler/ConsoleLog.vue';
import CrawledReport from './components/reports/CrawledReport.vue';
import HealthReport from './components/reports/HealthReport.vue';
import ConfigTab from './components/config/ConfigTab.vue';
import BocaoTab from './components/bocao/BocaoTab.vue';
import BocaoReconcile from './components/bocao/BocaoReconcile.vue';
import SearchTab from './components/search/SearchTab.vue';
import FilterTab from './components/search/FilterTab.vue';
import EnrichmentTab from './components/enrichment/EnrichmentTab.vue';
import GraphifyTab from './components/graphify/GraphifyTab.vue';
import TaxDetailModal from './components/search/TaxDetailModal.vue';
import BocaoSolrModal from './components/bocao/BocaoSolrModal.vue';
import AiInspector from './components/common/AiInspector.vue';
import { useSSE } from './composables/useSSE';
import { useCrawlerControl } from './composables/useCrawlerControl';
import { ApiClient } from './api/client';
import type { HealthReport as HealthReportType } from './types';

const activeTab = ref('scan');
const isSidebarCollapsed = ref(false);
const autoScroll = ref(true);
const healthLoading = ref(false);
const healthReport = ref<HealthReportType>({
  summary: { total: 0, healthy: 0, warning: 0, stalled: 0 },
  provinces: []
});

const taxDetailModalRef = ref<{ open: (tin: string) => void; close: () => void } | null>(null);
const solrModalRef = ref<{ open: (query?: string) => void; close: () => void } | null>(null);

const { master, provinceStatus, logs, connectSSE, clearLogs } = useSSE();
const {
  provinceConfigs, serverProvinces, systemConfig, maxConcurrentProvinces,
  loadSystemConfig, saveGlobalRps, changeGlobalRps, loadProvinces,
  startProv, pauseProv, stopProv, startAllProvinces, startAllNewestProvinces, stopAllProvinces
} = useCrawlerControl();

const loadHealthReport = async (days = 3) => {
  healthLoading.value = true;
  try {
    const data = await ApiClient.getCrawlerHealthReport(days);
    if (data) healthReport.value = data;
  } catch (e) { console.error('Lỗi tải health report:', e); }
  finally { healthLoading.value = false; }
};

const startProvNewest = async (key: string) => {
  const status = provinceStatus.value[key];
  const provCfg = serverProvinces.value[key] || {};
  const seed = status?.tin_max || provCfg.activation_tin || '';
  await ApiClient.startCrawler({
    province_key: key, scan_mode: 'newest', seed_tin: seed, gap: 20, num_workers: 2
  });
};

const openTaxDetail = (tin: string) => {
  if (taxDetailModalRef.value && typeof taxDetailModalRef.value.open === 'function') {
    taxDetailModalRef.value.open(tin);
  }
};

const openDkkdSearch = (query: string) => {
  if (solrModalRef.value && typeof solrModalRef.value.open === 'function') {
    solrModalRef.value.open(query);
  }
};

onMounted(() => {
  (window as unknown as { openTaxDetail?: (tin: string) => void }).openTaxDetail = openTaxDetail;
  (window as unknown as { openDkkdSearch?: (q: string) => void }).openDkkdSearch = openDkkdSearch;
  window.addEventListener('switch-tab', ((e: CustomEvent<string>) => {
    if (e.detail) activeTab.value = e.detail;
  }) as EventListener);
  const w = window as unknown as { chrome?: { webview?: { addEventListener: (t: string, h: (e: { data: string }) => void) => void } } };
  w.chrome?.webview?.addEventListener('message', (e) => {
    if (typeof e.data === 'string' && e.data.startsWith('switch-tab:')) {
      const target = e.data.split(':')[1];
      if (target) activeTab.value = target;
    }
  });
  watch(activeTab, (t) => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== t) {
        url.searchParams.set('tab', t);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  });

  try {
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam) activeTab.value = tabParam;
    else {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab.value);
      window.history.replaceState({}, '', url.toString());
    }
  } catch {}

  loadSystemConfig();
  loadProvinces();
  loadHealthReport(3);
  connectSSE();
});
</script>
