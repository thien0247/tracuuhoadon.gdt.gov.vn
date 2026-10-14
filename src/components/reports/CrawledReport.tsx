// @id 01M4W0RPRT0000000000000001
// @related 01M4W0RPRT0000000000000003, 01M4W0RPRT0000000000000004, 01M4W0RPRT0000000000000005, 01M4W0RPRT0000000000000006, 01M4W0RPRT0000000000000007, 01M4W0RPRT0000000000000011, 01M4W0RPRT0000000000000012

'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CrawledKpis } from './crawled/CrawledKpis';
import { CrawledFilterBar } from './crawled/CrawledFilterBar';
import { CrawledSvgChart } from './crawled/CrawledSvgChart';
import { CrawledDataTable } from './crawled/CrawledDataTable';
import { CrawledTopProvinces } from './crawled/CrawledTopProvinces';
import { V2MergedKpis } from './v2/V2MergedKpis';
import { V2MergedTable, type V2Item } from './v2/V2MergedTable';

interface StatsData {
  summary: { total_records: number; peak_period: string | null; peak_count: number; avg_per_period: number; period_count: number };
  timeline: Array<{ period: string; count: number; label: string }>;
  top_provinces: Array<{ prefix: string; province_name: string; count: number; percentage: number }>;
}

interface CrawledReportProps {
  provinceConfigs?: Record<string, { prefix?: string }>;
}

export const CrawledReport: React.FC<CrawledReportProps> = ({ provinceConfigs }) => {
  const [viewMode, setViewMode] = useState<'traditional' | 'v2_merged'>('traditional');
  const [period, setPeriod] = useState('day');
  const [timeField, setTimeField] = useState('scraped_at');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [datePreset, setDatePreset] = useState('30d');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [stats, setStats] = useState<StatsData>({
    summary: { total_records: 0, peak_period: null, peak_count: 0, avg_per_period: 0, period_count: 0 },
    timeline: [], top_provinces: [],
  });
  const [v2Data, setV2Data] = useState<{ total_provinces: number; total_national_mst: number; provinces: V2Item[] }>({
    total_provinces: 34, total_national_mst: 0, provinces: [],
  });

  const provinceList = useMemo(() =>
    Object.entries(provinceConfigs || {})
      .map(([name, cfg]) => ({ key: name.toLowerCase().replace(/\s+/g, '_'), name, prefix: cfg.prefix }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  [provinceConfigs]);

  const todayCount = useMemo(() =>
    stats?.timeline?.find((t) => t.period === new Date().toISOString().split('T')[0])?.count || 0,
  [stats]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      let fromDate = '';
      const days = { '7d': 7, '30d': 30, '90d': 90 }[datePreset as '7d' | '30d' | '90d'];
      if (days) { const d = new Date(); d.setDate(d.getDate() - days); fromDate = d.toISOString().split('T')[0]; }
      const q = new URLSearchParams({ period, time_field: timeField, province_key: selectedProvince, ...(fromDate ? { from_date: fromDate } : {}) });
      const res = await fetch(`/api/reports/crawl-stats?${q.toString()}`);
      if (res.ok) setStats(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [period, timeField, selectedProvince, datePreset]);

  const fetchV2Stats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/v2-merged-stats');
      if (res.ok) setV2Data(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  const syncStats = async () => {
    setSyncing(true);
    try { const res = await fetch('/api/reports/sync-stats', { method: 'POST' }); if (res.ok) await fetchStats(); }
    catch { /* ignore */ } finally { setSyncing(false); }
  };

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchV2Stats(); }, [fetchV2Stats]);

  const chartData = useMemo(() => {
    const list = stats?.timeline || [];
    if (!list.length) return { points: [], maxVal: 1, linePath: '' };
    const maxVal = Math.max(...list.map((t) => t.count), 1);
    const w = 760, h = 180, padX = 25, padY = 25;
    const step = (w - padX * 2) / Math.max(list.length, 1);
    const points = list.map((item, idx) => ({
      ...item, x: padX + idx * step + step / 2, y: h - padY - Math.max((item.count / maxVal) * (h - padY * 2), 3),
      barH: Math.max((item.count / maxVal) * (h - padY * 2), 3), width: Math.max(Math.min(step * 0.75, 28), 6),
      shortLabel: item.label.length >= 5 ? item.label.slice(0, 5) : item.label,
    }));
    return { points, maxVal, linePath: points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') };
  }, [stats]);

  const exportCsv = () => {
    const tot = stats.summary.total_records || 1, rows = [['Ngày / Mốc', 'Số Lượng MST', 'Tỷ Lệ (%)']];
    stats.timeline.forEach((t) => rows.push([t.label, String(t.count), ((t.count / tot) * 100).toFixed(2)]));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' }));
    a.download = `san_luong_mst_${timeField}_${period}_${selectedProvince}.csv`;
    a.click();
  };

  const exportExcel = () => {
    const q = new URLSearchParams({ period, time_field: timeField, province_key: selectedProvince });
    window.open(`/api/reports/crawl-stats-excel?${q.toString()}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <CrawledFilterBar
        viewMode={viewMode} timeField={timeField} period={period} selectedProvince={selectedProvince}
        datePreset={datePreset} chartType={chartType} loading={loading} syncing={syncing} provinceList={provinceList}
        onChangeViewMode={setViewMode} onChangeTimeField={setTimeField} onChangePeriod={setPeriod}
        onChangeSelectedProvince={setSelectedProvince} onChangeDatePreset={setDatePreset} onChangeChartType={setChartType}
        onSyncStats={syncStats} onRefresh={() => (viewMode === 'traditional' ? fetchStats() : fetchV2Stats())} onExportExcel={exportExcel}
      />

      {viewMode === 'traditional' ? (
        <>
          <CrawledKpis
            timeField={timeField} totalRecords={stats.summary.total_records} todayCount={todayCount}
            peakPeriod={stats.summary.peak_period} peakCount={stats.summary.peak_count}
            avgPerPeriod={stats.summary.avg_per_period} periodCount={stats.summary.period_count}
          />
          <CrawledSvgChart timeField={timeField} chartType={chartType} chartData={chartData} />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-8">
              <CrawledDataTable timeField={timeField} timeline={stats.timeline} totalRecords={stats.summary.total_records} maxVal={chartData.maxVal} onExportCsv={exportCsv} />
            </div>
            <div className="lg:col-span-4">
              <CrawledTopProvinces topProvinces={stats.top_provinces} />
            </div>
          </div>
        </>
      ) : (
        <>
          <V2MergedKpis
            totalProvinces={v2Data.total_provinces} totalMst={v2Data.total_national_mst}
            topProvinceName={v2Data.provinces[0]?.v2_name || ''} topProvinceMst={v2Data.provinces[0]?.total_mst || 0}
          />
          <V2MergedTable provinces={v2Data.provinces} />
        </>
      )}
    </div>
  );
};
