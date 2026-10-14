// @id 01M4W0CRWA0000000000000003
// @related 01M4W0CRWA0000000000000001, 01M4W0TYPE0000000000000001
'use client';
import React from 'react';
import type { ProvinceConfig } from '@/types';
import type { ProvinceItem } from './CrawlerTab';

interface CrawlerListProps {
  provinces: ProvinceItem[];
  onUpdateProvConfig?: (key: string, patch: Partial<ProvinceConfig>) => void;
  onStartProv: (key: string) => void;
  onPauseProv: (key: string) => void;
  onStopProv: (key: string) => void;
  onOpenMaxTin: (key: string) => void;
}

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

const formatDate = (dt: string) => {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt.slice(0, 16).replace('T', ' ');
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return dt;
  }
};

export default function CrawlerList({
  provinces, onUpdateProvConfig, onStartProv, onPauseProv, onStopProv, onOpenMaxTin
}: CrawlerListProps) {
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
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden">
      <div className="overflow-auto max-h-[65vh]">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200 border-collapse border-spacing-0">
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b-2 border-slate-300 dark:border-slate-600 text-[11px] select-none">
            <tr>
              <th className="w-9 px-2 py-1.5 text-center bg-slate-200/80 dark:bg-slate-700/80 text-slate-500 border-r border-slate-300 dark:border-slate-600">#</th>
              <th className="px-2.5 py-1.5 border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">Tỉnh Thành & DB</th>
              <th className="px-2 py-1.5 border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">Trạng Thái</th>
              <th className="px-2.5 py-1.5 border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">Chế Độ & Seed TIN</th>
              <th className="px-2.5 py-1.5 border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">Luồng & Gap</th>
              <th className="px-2.5 py-1.5 border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">Tiến Độ Quét</th>
              <th className="px-2.5 py-1.5 border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">Lịch Sử Scan</th>
              <th className="px-2.5 py-1.5 border-r border-slate-300 dark:border-slate-600 whitespace-nowrap">Biên TIN (Min / Max)</th>
              <th className="px-2.5 py-1.5 text-right whitespace-nowrap">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="text-[11px]">
            {provinces.map((item, idx) => (
              <tr
                key={item.key}
                className={`hover:bg-sky-50/60 dark:hover:bg-indigo-950/30 transition-colors ${
                  item.status.running ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : idx % 2 === 1 ? 'bg-slate-50/40 dark:bg-slate-900/20' : ''
                }`}
              >
                <td className="px-1.5 py-1 text-center bg-slate-100/60 dark:bg-slate-800/60 font-mono text-[10px] text-slate-400 border-r border-b border-slate-200 dark:border-slate-700/80 select-none">
                  {idx + 1}
                </td>

                <td className="px-2.5 py-1.5 whitespace-nowrap border-r border-b border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">{item.key}</span>
                    <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-100 dark:border-indigo-900">
                      {formatNumber(item.status.db_count)}
                    </span>
                  </div>
                </td>

                <td className="px-2 py-1.5 whitespace-nowrap border-r border-b border-slate-200 dark:border-slate-700/80">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                    item.status.running
                      ? item.status.paused ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.status.running ? (item.status.paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-slate-400'}`} />
                    <span>{item.status.running ? (item.status.paused ? 'Tạm dừng' : 'Đang quét') : 'Đã dừng'}</span>
                  </span>
                </td>

                <td className="px-2 py-1 whitespace-nowrap border-r border-b border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-1">
                    <select
                      value={item.prov.scan_mode || 'bidirectional'}
                      onChange={(e) => onUpdateProvConfig?.(item.key, { scan_mode: e.target.value as ProvinceConfig['scan_mode'] })}
                      disabled={item.status.running}
                      className="w-32 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-slate-800 dark:text-slate-100 font-medium"
                    >
                      <option value="bidirectional">▶ 2 Chiều</option>
                      <option value="newest">⚡ TIN Max</option>
                      <option value="gap_fill">🧩 Gap-Fill</option>
                      <option value="forward">Tịnh Tiến (+)</option>
                      <option value="backward">Tịnh Tiến (-)</option>
                    </select>
                    <input
                      type="text"
                      value={item.prov.seed_tin || ''}
                      onChange={(e) => onUpdateProvConfig?.(item.key, { seed_tin: e.target.value })}
                      disabled={item.status.running}
                      placeholder="Seed TIN..."
                      className="w-28 font-mono text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-200"
                    />
                  </div>
                </td>

                <td className="px-2 py-1 whitespace-nowrap border-r border-b border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-1">
                    <select
                      value={item.prov.num_workers ?? 3}
                      onChange={(e) => onUpdateProvConfig?.(item.key, { num_workers: Number(e.target.value) })}
                      disabled={item.status.running}
                      className="w-20 text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1 py-0.5 text-slate-800 dark:text-slate-100 font-medium"
                    >
                      <option value={1}>1L (2)</option>
                      <option value={2}>2L (4)</option>
                      <option value={3}>3L (6)</option>
                      <option value={4}>4L (8)</option>
                    </select>
                    <input
                      type="number"
                      value={item.prov.gap ?? 5000}
                      onChange={(e) => onUpdateProvConfig?.(item.key, { gap: Number(e.target.value) })}
                      disabled={item.status.running}
                      title="Gap dừng"
                      className="w-16 font-mono text-[11px] bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-200"
                    />
                  </div>
                </td>

                <td className="px-2.5 py-1 whitespace-nowrap font-mono text-[10px] border-r border-b border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <span>Quét: <b className="text-slate-800 dark:text-slate-100">{formatNumber(item.status.queried)}</b></span>
                    <span>•</span>
                    <span>Tìm: <b className="text-emerald-600">{formatNumber(item.status.found)}</b></span>
                  </div>
                  <div className="text-slate-400">{item.status.speed || 0} req/s · {item.status.uptime || '00:00:00'}</div>
                </td>

                <td className="px-2.5 py-1 whitespace-nowrap font-mono text-[10px] border-r border-b border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-1.5">
                    {item.status.last_tin ? (
                      <span className={`font-bold px-1.5 py-0.2 rounded border text-[10px] ${item.status.running ? 'text-emerald-700 bg-emerald-50 border-emerald-300 animate-pulse' : 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'}`}>
                        {item.status.last_tin}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Chưa quét</span>
                    )}
                    {item.status.last_scanned_at && <span className="text-slate-400">{formatDate(item.status.last_scanned_at)}</span>}
                  </div>
                </td>

                <td className="px-2.5 py-1 whitespace-nowrap font-mono text-[10px] border-r border-b border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center gap-1.5">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold" title="TIN Min">↓{item.status.tin_min || '—'}</span>
                    <span className="text-slate-300">|</span>
                    <span onClick={() => selectTinMax(item)} title="Nhấp để dùng TIN Max làm Seed" className="text-purple-700 dark:text-purple-400 font-bold cursor-pointer hover:underline">
                      ↑{item.status.tin_max || '—'}
                    </span>
                    <button onClick={() => onOpenMaxTin(item.key)} title="Cập nhật Max TIN thủ công" className="px-1 hover:bg-purple-100 dark:hover:bg-purple-900 rounded text-purple-600 dark:text-purple-300 transition">✏️</button>
                  </div>
                </td>

                <td className="px-2 py-1 whitespace-nowrap text-right border-b border-slate-200 dark:border-slate-700/80 space-x-1">
                  <button onClick={() => onStartProv(item.key)} disabled={item.status.running && !item.status.paused} className={`py-0.5 px-2 rounded font-bold text-[10px] text-white transition-all disabled:opacity-40 ${item.status.running ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-500'}`}>▶ Start</button>
                  <button onClick={() => startNewest(item)} disabled={item.status.running && !item.status.paused} title="Quét MST mới tăng dần từ TIN Max" className="py-0.5 px-1.5 rounded font-bold text-[10px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 border border-purple-200 dark:border-purple-800 transition-all disabled:opacity-40">⚡ Max</button>
                  <button onClick={() => onPauseProv(item.key)} disabled={!item.status.running} className={`py-0.5 px-1.5 rounded font-bold text-[10px] text-white transition-all disabled:opacity-40 ${item.status.paused ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-500 hover:bg-amber-400'}`}>{item.status.paused ? '▶' : '⏸'}</button>
                  <button onClick={() => onStopProv(item.key)} disabled={!item.status.running} className="py-0.5 px-1.5 rounded font-bold text-[10px] text-white bg-rose-600 hover:bg-rose-500 transition-all disabled:opacity-40">⏹</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
