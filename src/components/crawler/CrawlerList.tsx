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
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700 text-[11px]">
            <tr>
              <th className="p-3.5">Tỉnh Thành</th>
              <th className="p-3.5">Trạng Thái</th>
              <th className="p-3.5">Chế Độ & Seed TIN</th>
              <th className="p-3.5">Luồng / Gap</th>
              <th className="p-3.5">Tiến Độ Quét</th>
              <th className="p-3.5">Lịch Sử Scan</th>
              <th className="p-3.5">TIN Min / Max</th>
              <th className="p-3.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {provinces.map((item) => (
              <tr key={item.key} className={`hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${item.status.running ? 'bg-emerald-50/20 dark:bg-emerald-950/20' : ''}`}>
                <td className="p-3.5 whitespace-nowrap">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.key}</div>
                  <div className="text-[11px] text-slate-400 font-mono">DB: {formatNumber(item.status.db_count)} bản ghi</div>
                </td>

                <td className="p-3.5 whitespace-nowrap">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5 ${
                    item.status.running
                      ? item.status.paused ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.status.running ? (item.status.paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-slate-400'}`} />
                    <span>{item.status.running ? (item.status.paused ? 'Tạm Dừng' : 'Đang Quét') : 'Đã dừng'}</span>
                  </span>
                </td>

                <td className="p-3.5 whitespace-nowrap space-y-1.5">
                  <select
                    value={item.prov.scan_mode || 'bidirectional'}
                    onChange={(e) => onUpdateProvConfig?.(item.key, { scan_mode: e.target.value as ProvinceConfig['scan_mode'] })}
                    disabled={item.status.running}
                    className="w-40 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-1 text-slate-800 dark:text-slate-100 font-medium"
                  >
                    <option value="bidirectional">▶ 2 Chiều Song Song</option>
                    <option value="newest">⚡ Quét Mới Nhất (TIN Max)</option>
                    <option value="gap_fill">🧩 Quét Lấp Lỗ Hổng (Gap-Fill)</option>
                    <option value="forward">Tịnh Tiến Lên (+)</option>
                    <option value="backward">Tịnh Tiến Lùi (-)</option>
                  </select>
                  <input
                    type="text"
                    value={item.prov.seed_tin || ''}
                    onChange={(e) => onUpdateProvConfig?.(item.key, { seed_tin: e.target.value })}
                    disabled={item.status.running}
                    className="w-40 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-1 text-slate-700 dark:text-slate-200 block"
                  />
                </td>

                <td className="p-3.5 whitespace-nowrap space-y-1.5">
                  <select
                    value={item.prov.num_workers ?? 3}
                    onChange={(e) => onUpdateProvConfig?.(item.key, { num_workers: Number(e.target.value) })}
                    disabled={item.status.running}
                    className="w-32 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-1 text-slate-800 dark:text-slate-100 font-medium"
                  >
                    <option value={1}>1 luồng (2)</option>
                    <option value={2}>2 luồng (4)</option>
                    <option value={3}>3 luồng (6)</option>
                    <option value={4}>4 luồng (8)</option>
                  </select>
                  <input
                    type="number"
                    value={item.prov.gap ?? 5000}
                    onChange={(e) => onUpdateProvConfig?.(item.key, { gap: Number(e.target.value) })}
                    disabled={item.status.running}
                    className="w-32 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-1 text-slate-700 dark:text-slate-200 block"
                  />
                </td>

                <td className="p-3.5 whitespace-nowrap font-mono text-[11px] space-y-0.5">
                  <div>Quét: <b className="text-slate-800 dark:text-slate-100">{formatNumber(item.status.queried)}</b></div>
                  <div>Tìm: <b className="text-emerald-600">{formatNumber(item.status.found)}</b></div>
                  <div className="text-[10px] text-slate-400">{item.status.speed || 0} req/s · {item.status.uptime || '00:00:00'}</div>
                </td>

                <td className="p-3.5 whitespace-nowrap font-mono text-[11px] space-y-0.5">
                  {item.status.last_tin ? (
                    <div><span className={`font-bold px-1.5 py-0.5 rounded border text-[11px] ${item.status.running ? 'text-emerald-700 bg-emerald-50 border-emerald-300 animate-pulse' : 'text-indigo-700 bg-indigo-50 border-indigo-200'}`}>{item.status.last_tin}</span></div>
                  ) : (
                    <div className="text-slate-400 italic">Chưa quét</div>
                  )}
                  {item.status.last_scanned_at && <div className="text-[10px] text-slate-400">🕒 {formatDate(item.status.last_scanned_at)}</div>}
                </td>

                <td className="p-3.5 whitespace-nowrap font-mono text-[11px] space-y-0.5">
                  <div className="text-blue-600 dark:text-blue-400 font-semibold">Min: {item.status.tin_min || '—'}</div>
                  <div className="flex items-center gap-1.5">
                    <span onClick={() => selectTinMax(item)} title="Nhấp để chuyển sang Quét Mới Nhất" className="text-purple-700 dark:text-purple-400 font-semibold cursor-pointer hover:underline">Max: {item.status.tin_max || '—'} ↗</span>
                    <button onClick={() => onOpenMaxTin(item.key)} title="Cập nhật lại Max TIN thủ công" className="p-0.5 hover:bg-purple-100 dark:hover:bg-purple-900 rounded text-purple-600 dark:text-purple-300 transition">✏️</button>
                  </div>
                </td>

                <td className="p-3.5 whitespace-nowrap text-right space-x-1">
                  <button onClick={() => onStartProv(item.key)} disabled={item.status.running && !item.status.paused} className={`py-1 px-2.5 rounded-lg font-bold text-[11px] text-white transition-all disabled:opacity-40 ${item.status.running ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-500'}`}>▶ Start</button>
                  <button onClick={() => startNewest(item)} disabled={item.status.running && !item.status.paused} title="Quét MST mới tăng dần từ TIN Max" className="py-1 px-2 rounded-lg font-bold text-[11px] text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all disabled:opacity-40">⚡ Max</button>
                  <button onClick={() => onPauseProv(item.key)} disabled={!item.status.running} className={`py-1 px-2 rounded-lg font-bold text-[11px] text-white transition-all disabled:opacity-40 ${item.status.paused ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-500 hover:bg-amber-400'}`}>{item.status.paused ? '▶' : '⏸'}</button>
                  <button onClick={() => onStopProv(item.key)} disabled={!item.status.running} className="py-1 px-2 rounded-lg font-bold text-[11px] text-white bg-rose-600 hover:bg-rose-500 transition-all disabled:opacity-40">⏹</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
