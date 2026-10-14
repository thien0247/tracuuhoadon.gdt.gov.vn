// @id 01M4W0APPR0000000000000002
// @related 01M4W0APPR0000000000000001, 01M4W0AYT00000000000000001, 01M4W0AYT00000000000000002, 01M4W0AYT00000000000000003, 01M4W0AYT00000000000000004, 01M4W0SRCH0000000000000002, 01M4W0SRCH0000000000000004, 01M4W0CRWA0000000000000001

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppSidebar from '@/components/layout/AppSidebar';
import AppFooter from '@/components/layout/AppFooter';
import MasterMetrics from '@/components/layout/MasterMetrics';
import ServicesTab from '@/components/services/ServicesTab';
import CrawlerTab from '@/components/crawler/CrawlerTab';
import ConsoleLog from '@/components/crawler/ConsoleLog';
import { CrawledReport } from '@/components/reports/CrawledReport';
import { HealthReport, type ReportData } from '@/components/reports/HealthReport';
import ConfigTab from '@/components/config/ConfigTab';
import { BocaoTab } from '@/components/bocao/BocaoTab';
import { BocaoReconcile } from '@/components/bocao/BocaoReconcile';
import SearchTab from '@/components/search/SearchTab';
import FilterTab from '@/components/search/FilterTab';
import EnrichmentTab from '@/components/enrichment/EnrichmentTab';
import GraphifyTab from '@/components/graphify/GraphifyTab';
import TaxDetailModal from '@/components/search/TaxDetailModal';
import { BocaoSolrModal } from '@/components/bocao/BocaoSolrModal';
import AiInspector from '@/components/common/AiInspector';
import { useSSE } from '@/hooks/useSSE';
import { useCrawlerControl } from '@/hooks/useCrawlerControl';
import { ApiClient } from '@/api/client';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('scan');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthReport, setHealthReport] = useState<ReportData>({
    summary: { total: 0, healthy: 0, warning: 0, stalled: 0 },
    provinces: [],
  });
  const [selectedTin, setSelectedTin] = useState<string | null>(null);
  const [solrQuery, setSolrQuery] = useState<string | null>(null);

  const { master, provinceStatus, logs, connectSSE, clearLogs } = useSSE();
  const {
    provinceConfigs, updateProvinceConfig, serverProvinces, systemConfig,
    maxConcurrentProvinces, setMaxConcurrentProvinces,
    loadSystemConfig, saveGlobalRps, changeGlobalRps, loadProvinces,
    startProv, pauseProv, stopProv, startAllProvinces, startAllNewestProvinces, stopAllProvinces,
  } = useCrawlerControl();

  const loadHealthReport = useCallback(async (days = 3) => {
    setHealthLoading(true);
    try {
      const data = await ApiClient.getCrawlerHealthReport(days);
      if (data) setHealthReport(data as unknown as ReportData);
    } catch { /* ignore */ }
    finally { setHealthLoading(false); }
  }, []);

  const startProvNewest = useCallback(async (key: string) => {
    const status = provinceStatus[key];
    const provCfg = serverProvinces[key] || {};
    const seed = status?.tin_max || provCfg.activation_tin || '';
    await ApiClient.startCrawler({
      province_key: key, scan_mode: 'newest', seed_tin: seed, gap: 20, num_workers: 2,
    });
  }, [provinceStatus, serverProvinces]);

  const openTaxDetail = useCallback((tin: string) => { setSelectedTin(tin); }, []);
  const openDkkdSearch = useCallback((query: string) => { setSolrQuery(query); }, []);

  const switchTab = useCallback((t: string) => {
    setActiveTab(t);
    setMobileMenuOpen(false);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('tab') !== t) {
        url.searchParams.set('tab', t);
        window.history.replaceState({}, '', url.toString());
      }
    } catch { /* ignore */ }
  }, []);

  const handleToggleSidebar = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setMobileMenuOpen((v) => !v);
    } else {
      setIsSidebarCollapsed((v) => !v);
    }
  }, []);

  useEffect(() => {
    const win = window as unknown as {
      openTaxDetail?: (tin: string) => void;
      openDkkdSearch?: (q: string) => void;
      chrome?: { webview?: { addEventListener: (t: string, h: (e: { data: string }) => void) => void } };
    };
    win.openTaxDetail = openTaxDetail;
    win.openDkkdSearch = openDkkdSearch;

    const handleSwitchTab = ((e: CustomEvent<string>) => {
      if (e.detail) switchTab(e.detail);
    }) as EventListener;
    window.addEventListener('switch-tab', handleSwitchTab);

    win.chrome?.webview?.addEventListener('message', (e) => {
      if (typeof e.data === 'string' && e.data.startsWith('switch-tab:')) {
        const target = e.data.split(':')[1];
        if (target) switchTab(target);
      }
    });

    try {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam) setActiveTab(tabParam);
      else {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', 'scan');
        window.history.replaceState({}, '', url.toString());
      }
    } catch { /* ignore */ }

    void loadSystemConfig();
    void loadProvinces();
    void loadHealthReport(3);
    connectSSE();

    return () => window.removeEventListener('switch-tab', handleSwitchTab);
  }, [openTaxDetail, openDkkdSearch, switchTab, loadSystemConfig, loadProvinces, loadHealthReport, connectSSE]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-secondary)] text-[var(--text-primary)]">
      <AppHeader onToggleSidebar={handleToggleSidebar} onSwitchTab={switchTab} />

      <div className="flex flex-1 min-h-[calc(100vh-86px)] relative">
        <AppSidebar
          collapsed={isSidebarCollapsed} mobileOpen={mobileMenuOpen} activeTab={activeTab}
          maxConcurrent={maxConcurrentProvinces} stalledCount={healthReport.summary?.stalled}
          onChangeActiveTab={switchTab} onCloseMobile={() => setMobileMenuOpen(false)}
          onToggleMobile={() => setMobileMenuOpen((v) => !v)}
          onChangeMaxConcurrent={setMaxConcurrentProvinces}
          onStartNewest={startAllNewestProvinces} onStartAll={startAllProvinces} onStopAll={stopAllProvinces}
        />

        <main className="flex-1 min-w-0 p-2.5 sm:p-3 md:p-4 pb-16 md:pb-4 space-y-3 overflow-x-hidden">
          <MasterMetrics
            master={master} maxRps={Number(systemConfig.max_global_rps) || 32}
            onChangeRps={changeGlobalRps} onUpdateRps={(v) => { void saveGlobalRps(v); }}
          />

          <div className={activeTab === 'services' ? '' : 'hidden'}><ServicesTab /></div>

          <div className={activeTab === 'scan' ? 'space-y-5' : 'hidden'}>
            <CrawlerTab
              provinceConfigs={provinceConfigs} provinceStatus={provinceStatus}
              onUpdateProvConfig={updateProvinceConfig}
              onStartProv={startProv} onPauseProv={pauseProv} onStopProv={stopProv}
            />
            <ConsoleLog logs={logs} autoScroll={autoScroll} onChangeAutoScroll={setAutoScroll} onClearLogs={clearLogs} />
          </div>

          <div className={activeTab === 'crawled_report' ? '' : 'hidden'}><CrawledReport provinceConfigs={serverProvinces} /></div>
          <div className={activeTab === 'health_report' ? '' : 'hidden'}>
            <HealthReport reportData={healthReport} loading={healthLoading} onRefresh={loadHealthReport} onScanProvince={startProvNewest} onSelectTin={openTaxDetail} />
          </div>
          <div className={activeTab === 'config' ? '' : 'hidden'}><ConfigTab serverProvinces={serverProvinces} onProvinceUpdated={() => { void loadProvinces(); }} /></div>
          <div className={activeTab === 'bocao' ? '' : 'hidden'}><BocaoTab onSelectTin={openTaxDetail} onOpenSolr={openDkkdSearch} /></div>
          <div className={activeTab === 'bocao_reconcile' ? '' : 'hidden'}><BocaoReconcile onViewDetail={openTaxDetail} onOpenSolr={openDkkdSearch} /></div>
          <div className={activeTab === 'search' ? '' : 'hidden'}><SearchTab provinceConfigs={serverProvinces} onSelectTin={openTaxDetail} /></div>
          <div className={activeTab === 'filter' ? '' : 'hidden'}><FilterTab provinceConfigs={serverProvinces} onSelectTin={openTaxDetail} /></div>
          <div className={activeTab === 'enrichment' ? '' : 'hidden'}><EnrichmentTab /></div>
          <div className={activeTab === 'graphify' ? '' : 'hidden'}><GraphifyTab /></div>
        </main>
      </div>

      <AppFooter />
      <TaxDetailModal targetTin={selectedTin} onClose={() => setSelectedTin(null)} />
      <BocaoSolrModal isOpen={solrQuery !== null} initialQuery={solrQuery || ''} onClose={() => setSolrQuery(null)} onViewTaxDetail={openTaxDetail} />
      <AiInspector />
    </div>
  );
}
