// @id 01M4W0CRWA0000000000000002
// @related 01M4W0CRWA0000000000000001, 01M4W0TYPE0000000000000001
'use client';
import React from 'react';
import type { ProvinceConfig } from '@/types';
import type { ProvinceItem } from './CrawlerTab';

interface CrawlerGridProps {
  provinces: ProvinceItem[];
  onUpdateProvConfig?: (key: string, patch: Partial<ProvinceConfig>) => void;
  onStartProv: (key: string) => void;
  onPauseProv: (key: string) => void;
  onStopProv: (key: string) => void;
  onOpenMaxTin: (key: string) => void;
}

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

export default function CrawlerGrid({
  provinces, onUpdateProvConfig, onStartProv, onPauseProv, onStopProv, onOpenMaxTin
}: CrawlerGridProps) {
  const selectTinMax = (item: ProvinceItem) => {
    if (item.status.tin_max && !item.status.running) {
      onUpdateProvConfig?.(item.key, {
        seed_tin: item.status.tin_max, scan_mode: 'newest', gap: 100, num_workers: 1
      });
    }
  };

  const startNewest = (item: ProvinceItem) => {
    selectTinMax(item);
    onStartProv(item.key);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {provinces.map((item) => (
        <div
          key={item.key}
          className={`bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border transition-all space-y-4 flex flex-col justify-between ${
            item.status.running ? 'border-emerald-300 ring-2 ring-emerald-100 dark:ring-emerald-950' : 'border-slate-200 dark:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{item.key}</h2>
              <p className="text-xs text-slate-400 font-mono">DB: {formatNumber(item.status.db_count)} bản ghi</p>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              item.status.running
                ? item.status.paused ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${item.status.running ? (item.status.paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-slate-400'}`} />
              {item.status.running ? (item.status.paused ? 'Tạm dừng' : 'Đang chạy') : 'Đã dừng'}
            </span>
          </div>

          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">Chế độ quét:</label>
              <select
                value={item.prov.scan_mode || 'bidirectional'}
                onChange={(e) => onUpdateProvConfig?.(item.key, { scan_mode: e.target.value as ProvinceConfig['scan_mode'] })}
                disabled={item.status.running}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              >
                <option value="bidirectional">▶ 2 Chiều Song Song</option>
                <option value="edges">▶ Mở Rộng Biên DB (Max/Min)</option>
                <option value="newest">▶ Quét Mới Nhất (Tăng từ Max)</option>
                <option value="gap_fill">🧩 Quét Lấp Lỗ Hổng (Gap-Fill)</option>
                <option value="down_from_min">▼ Quét Xuống từ Min</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Seed TIN:</label>
                <input
                  type="text"
                  value={item.prov.seed_tin || ''}
                  onChange={(e) => onUpdateProvConfig?.(item.key, { seed_tin: e.target.value })}
                  disabled={item.status.running}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 dark:text-slate-100 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Gap rỗng:</label>
                <input
                  type="number"
                  value={item.prov.gap ?? 5000}
                  onChange={(e) => onUpdateProvConfig?.(item.key, { gap: Number(e.target.value) })}
                  disabled={item.status.running}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Số luồng (Workers):</label>
              <select
                value={item.prov.num_workers ?? 3}
                onChange={(e) => onUpdateProvConfig?.(item.key, { num_workers: Number(e.target.value) })}
                disabled={item.status.running}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-100 disabled:opacity-60"
              >
                <option value={5}>5 luồng / chiều (10 tổng)</option>
                <option value={4}>4 luồng / chiều (8 tổng)</option>
                <option value={3}>3 luồng / chiều (6 tổng)</option>
                <option value={2}>2 luồng / chiều (4 tổng)</option>
                <option value={1}>1 luồng / chiều (2 tổng)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700"><span className="text-slate-400">Đã Quét:</span><span className="font-bold text-slate-800 dark:text-slate-200 float-right font-mono">{formatNumber(item.status.queried)}</span></div>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700"><span className="text-slate-400">Tìm Thấy:</span><span className="font-bold text-emerald-600 float-right font-mono">{formatNumber(item.status.found)}</span></div>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700"><span className="text-slate-400">Tốc Độ:</span><span className="font-bold text-indigo-600 dark:text-indigo-400 float-right font-mono">{item.status.speed || 0} req/s</span></div>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-700"><span className="text-slate-400">Thời Gian:</span><span className="font-bold text-slate-700 dark:text-slate-300 float-right font-mono">{item.status.uptime || '00:00:00'}</span></div>
          </div>

          {(item.status.tin_min || item.status.tin_max) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-100 dark:border-blue-900"><span className="text-blue-400 font-semibold block text-[10px] uppercase tracking-wide mb-0.5">TIN Min</span><span className="font-bold text-blue-700 dark:text-blue-300 font-mono text-[11px]">{item.status.tin_min || '—'}</span></div>
              <div className="bg-purple-50 dark:bg-purple-950/40 p-2 rounded-lg border border-purple-100 dark:border-purple-900">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-purple-400 font-semibold text-[10px] uppercase tracking-wide">TIN Max</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => onOpenMaxTin(item.key)} title="Cập nhật lại Max TIN thủ công" className="text-[10px] hover:bg-purple-200/60 dark:hover:bg-purple-800 text-purple-700 dark:text-purple-200 px-1 rounded">✏️ Sửa</button>
                    <span onClick={() => selectTinMax(item)} title="Dùng làm Seed" className="text-[9px] bg-purple-200/60 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-1 rounded cursor-pointer">↗</span>
                  </div>
                </div>
                <span className="font-bold text-purple-700 dark:text-purple-300 font-mono text-[11px] block truncate">{item.status.tin_max || '—'}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button onClick={() => onStartProv(item.key)} disabled={item.status.running && !item.status.paused} className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white shadow-sm transition-all disabled:opacity-40 ${item.status.running ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-500'}`}>▶ Start</button>
            <button onClick={() => startNewest(item)} disabled={item.status.running && !item.status.paused} title="Quét MST mới tăng dần từ TIN Max" className="py-2 px-2.5 rounded-xl font-bold text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 shadow-sm transition-all disabled:opacity-40 flex items-center gap-1">⚡ Max</button>
            <button onClick={() => onPauseProv(item.key)} disabled={!item.status.running} className={`py-2 px-3 rounded-xl font-bold text-xs text-white shadow-sm transition-all disabled:opacity-40 ${item.status.paused ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-500 hover:bg-amber-400'}`}>{item.status.paused ? '▶ Resume' : '⏸ Pause'}</button>
            <button onClick={() => onStopProv(item.key)} disabled={!item.status.running} className="py-2 px-3 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-all disabled:opacity-40">⏹ Stop</button>
          </div>
        </div>
      ))}
    </div>
  );
}
