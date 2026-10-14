// @id 01M4W0RPRT0000000000000005
// @related 01M4W0RPRT0000000000000001, 01M4W0RPRT0000000000000003

'use client';

import React from 'react';

interface CrawledFilterBarProps {
  viewMode: 'traditional' | 'v2_merged';
  timeField: string;
  period: string;
  selectedProvince: string;
  datePreset: string;
  chartType: 'bar' | 'line';
  loading: boolean;
  syncing: boolean;
  provinceList: Array<{ key: string; name: string; prefix?: string }>;
  onChangeViewMode: (v: 'traditional' | 'v2_merged') => void;
  onChangeTimeField: (v: string) => void;
  onChangePeriod: (v: string) => void;
  onChangeSelectedProvince: (v: string) => void;
  onChangeDatePreset: (v: string) => void;
  onChangeChartType: (v: 'bar' | 'line') => void;
  onSyncStats: () => void;
  onRefresh: () => void;
  onExportExcel: () => void;
}

export const CrawledFilterBar: React.FC<CrawledFilterBarProps> = ({
  viewMode, timeField, period, selectedProvince, datePreset, chartType, loading, syncing, provinceList,
  onChangeViewMode, onChangeTimeField, onChangePeriod, onChangeSelectedProvince, onChangeDatePreset,
  onChangeChartType, onSyncStats, onRefresh, onExportExcel,
}) => {
  return (
    <div className="card-glass p-3 rounded-xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)] text-xs font-bold">
          <button onClick={() => onChangeViewMode('traditional')} className={`px-2.5 py-1 rounded transition ${viewMode === 'traditional' ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'}`}>🏛️ 62 Tỉnh Thành</button>
          <button onClick={() => onChangeViewMode('v2_merged')} className={`px-2.5 py-1 rounded transition ${viewMode === 'v2_merged' ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'}`}>🔄 34 Tỉnh Sáp Nhập</button>
        </div>

        {viewMode === 'traditional' && (
          <>
            <div className="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold">
              <button onClick={() => onChangeTimeField('scraped_at')} className={`px-2 py-1 rounded transition ${timeField === 'scraped_at' ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'}`}>🕒 Ngày Quét</button>
              <button onClick={() => onChangeTimeField('regi_date')} className={`px-2 py-1 rounded transition ${timeField === 'regi_date' ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'}`}>🏢 Ngày ĐKKD</button>
            </div>
            <div className="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold">
              {[{ k: 'day', l: '📅 Ngày' }, { k: 'month', l: '📆 Tháng' }, { k: 'year', l: '🗓️ Năm' }].map((p) => (
                <button key={p.k} onClick={() => onChangePeriod(p.k)} className={`px-2.5 py-1 rounded transition ${period === p.k ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'}`}>{p.l}</button>
              ))}
            </div>
            <select value={selectedProvince} onChange={(e) => onChangeSelectedProvince(e.target.value)}
              className="text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1 font-medium text-[var(--text-primary)]">
              <option value="all">🌐 Toàn Quốc (62 Tỉnh)</option>
              {provinceList.map((pr) => <option key={pr.key} value={pr.key}>({pr.prefix}) {pr.name}</option>)}
            </select>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {viewMode === 'traditional' && (
          <>
            <div className="flex items-center space-x-1">
              {[{ k: '7d', l: '7d' }, { k: '30d', l: '30d' }, { k: '90d', l: '90d' }, { k: 'all', l: 'All' }].map((ps) => (
                <button key={ps.k} onClick={() => onChangeDatePreset(ps.k)} className={`px-2 py-1 text-xs font-medium rounded-lg transition ${datePreset === ps.k ? 'bg-[var(--vnpt-blue)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]'}`}>{ps.l}</button>
              ))}
            </div>
            <div className="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)] text-xs">
              <button onClick={() => onChangeChartType('bar')} className={`px-2 py-0.5 rounded ${chartType === 'bar' ? 'bg-[var(--vnpt-blue)] text-white' : 'text-[var(--text-secondary)]'}`}>📊</button>
              <button onClick={() => onChangeChartType('line')} className={`px-2 py-0.5 rounded ${chartType === 'line' ? 'bg-[var(--vnpt-blue)] text-white' : 'text-[var(--text-secondary)]'}`}>📈</button>
            </div>
            <button onClick={onExportExcel} className="px-2 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition flex items-center gap-1 shadow-sm">
              <span>📥 Excel</span>
            </button>
            <button onClick={onSyncStats} disabled={syncing} className="px-2 py-1 text-xs font-semibold bg-emerald-700 text-white rounded-lg flex items-center gap-1 transition">
              <span className={syncing ? 'animate-spin' : ''}>⚡</span><span>Đồng Bộ</span>
            </button>
          </>
        )}
        <button onClick={onRefresh} disabled={loading} className="px-2.5 py-1 text-xs font-semibold bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:opacity-90 flex items-center gap-1 transition">
          <span className={loading ? 'animate-spin' : ''}>🔄</span><span>Tải Lại</span>
        </button>
      </div>
    </div>
  );
};
