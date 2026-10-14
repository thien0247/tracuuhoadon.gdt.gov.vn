// @id 01M4W0CRWA0000000000000001
// @related 01M4W0CRWA0000000000000002, 01M4W0CRWA0000000000000003, 01M4W0CRWA0000000000000004, 01M4W0CRWA0000000000000005, 01M4W0CRWA0000000000000007
'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ApiClient } from '@/api/client';
import type { ProvinceConfig, ProvinceStatus } from '@/types';
import CrawlerSchedule from './CrawlerSchedule';
import CrawlerGrid from './CrawlerGrid';
import CrawlerList from './CrawlerList';
import CrawlerBocao from './CrawlerBocao';
import UpdateMaxTinModal from './UpdateMaxTinModal';

export interface ProvinceItem {
  key: string;
  prov: ProvinceConfig;
  status: ProvinceStatus;
}

interface CrawlerTabProps {
  provinceConfigs: Record<string, ProvinceConfig>;
  provinceStatus: Record<string, ProvinceStatus>;
  onUpdateProvConfig?: (key: string, patch: Partial<ProvinceConfig>) => void;
  onStartProv: (key: string) => void;
  onPauseProv: (key: string) => void;
  onStopProv: (key: string) => void;
}

export default function CrawlerTab({
  provinceConfigs, provinceStatus, onUpdateProvConfig, onStartProv, onPauseProv, onStopProv
}: CrawlerTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'paused' | 'stopped'>('all');
  const [sortBy, setSortBy] = useState('default');
  const [showBocaoModal, setShowBocaoModal] = useState(false);
  const [bocaoPendingCount, setBocaoPendingCount] = useState(0);
  const [showMaxTinModal, setShowMaxTinModal] = useState(false);
  const [targetMaxTinProvKey, setTargetMaxTinProvKey] = useState('');

  const openMaxTinModal = (key = '') => {
    setTargetMaxTinProvKey(key);
    setShowMaxTinModal(true);
  };

  const getProvStatus = useCallback((key: string): ProvinceStatus => (provinceStatus && provinceStatus[key]) || {
    running: false, paused: false, queried: 0, found: 0, speed: 0,
    last_tin: '', last_scanned_at: '', uptime: '00:00:00', db_count: 0
  }, [provinceStatus]);

  const totalProvinces = Object.keys(provinceConfigs || {}).length;

  const filteredProvinces = useMemo<ProvinceItem[]>(() => {
    const list: ProvinceItem[] = [];
    const kw = searchKeyword.trim().toLowerCase();
    for (const key in provinceConfigs) {
      const prov = provinceConfigs[key];
      const status = getProvStatus(key);
      if (kw && !key.toLowerCase().includes(kw)) continue;
      if (statusFilter === 'running' && (!status.running || status.paused)) continue;
      if (statusFilter === 'paused' && (!status.running || !status.paused)) continue;
      if (statusFilter === 'stopped' && status.running) continue;
      list.push({ key, prov, status });
    }
    if (sortBy === 'scan_recent') list.sort((a, b) => (b.status.last_scanned_at || '').localeCompare(a.status.last_scanned_at || ''));
    else if (sortBy === 'speed_desc') list.sort((a, b) => (b.status.speed || 0) - (a.status.speed || 0));
    else if (sortBy === 'db_desc') list.sort((a, b) => (b.status.db_count || 0) - (a.status.db_count || 0));
    else if (sortBy === 'found_desc') list.sort((a, b) => (b.status.found || 0) - (a.status.found || 0));
    else if (sortBy === 'name_asc') list.sort((a, b) => a.key.localeCompare(b.key, 'vi'));
    return list;
  }, [provinceConfigs, getProvStatus, searchKeyword, statusFilter, sortBy]);

  const loadBocaoCount = useCallback(async () => {
    try {
      const s = (await ApiClient.getBocaoReconcileStats()) as { retry_later_count?: number; unmatched_count?: number };
      setBocaoPendingCount((s.retry_later_count || 0) + (s.unmatched_count || 0));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { void loadBocaoCount(); }, [loadBocaoCount]);

  return (
    <div className="space-y-4">
      <CrawlerSchedule />

      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-52">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">🔍</span>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="Tìm tỉnh thành, prefix..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            />
            {searchKeyword && <button onClick={() => setSearchKeyword('')} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs">✕</button>}
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <option value="all">⚡ Tất cả trạng thái</option>
            <option value="running">🟢 Đang chạy</option>
            <option value="paused">🟡 Tạm dừng</option>
            <option value="stopped">⚪ Đã dừng</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <option value="default">↕ Sắp xếp mặc định</option>
            <option value="scan_recent">🕒 Quét gần đây nhất</option>
            <option value="speed_desc">🚀 Tốc độ cao nhất</option>
            <option value="db_desc">📊 DB nhiều nhất</option>
            <option value="found_desc">✨ Tìm thấy nhiều nhất</option>
            <option value="name_asc">🔤 Tên tỉnh A-Z</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 w-full md:w-auto">
          <button onClick={() => openMaxTinModal('')} title="Đối soát và cập nhật lại Max TIN thủ công cho từng tỉnh hoặc toàn quốc" className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0">
            <span>🎯</span><span>Cập Nhật Max TIN</span>
          </button>

          <button onClick={() => setShowBocaoModal(true)} title="Crawl bổ sung MST theo danh sách Mã Số Doanh Nghiệp Bố Cáo ĐKKD" className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0">
            <span>📰</span><span>Crawl Bố Cáo</span>
            {bocaoPendingCount > 0 && <span className="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-mono">{bocaoPendingCount}</span>}
          </button>

          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{filteredProvinces.length}</span>/{totalProvinces} tỉnh
          </span>

          <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>⊞ Lưới</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}>☰ Bảng</button>
          </div>
        </div>
      </div>

      {filteredProvinces.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="text-3xl">🔍</div>
          <p className="text-slate-700 dark:text-slate-200 font-semibold text-sm">Không tìm thấy tỉnh thành nào phù hợp với bộ lọc.</p>
          <button onClick={() => { setSearchKeyword(''); setStatusFilter('all'); setSortBy('default'); }} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-bold text-xs rounded-xl transition">🔄 Đặt lại bộ lọc</button>
        </div>
      ) : viewMode === 'grid' ? (
        <CrawlerGrid provinces={filteredProvinces} onUpdateProvConfig={onUpdateProvConfig} onStartProv={onStartProv} onPauseProv={onPauseProv} onStopProv={onStopProv} onOpenMaxTin={openMaxTinModal} />
      ) : (
        <CrawlerList provinces={filteredProvinces} onUpdateProvConfig={onUpdateProvConfig} onStartProv={onStartProv} onPauseProv={onPauseProv} onStopProv={onStopProv} onOpenMaxTin={openMaxTinModal} />
      )}

      <CrawlerBocao visible={showBocaoModal} onClose={() => setShowBocaoModal(false)} onSyncComplete={loadBocaoCount} />
      <UpdateMaxTinModal visible={showMaxTinModal} initialProvinceKey={targetMaxTinProvKey} provinceConfigs={provinceConfigs} onClose={() => setShowMaxTinModal(false)} />
    </div>
  );
}
