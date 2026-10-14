// @id 01M4W0BCA00000000000000002
// @related 01M4W0CMMN0000000000000001, 01M4W0BCA00000000000000003, 01M4W0APJC0000000000000001, 01M4W0TYPE0000000000000001

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AiBadge } from '../common/AiBadge';
import { BocaoScanPanel } from './BocaoScanPanel';
import { ApiClient } from '@/api/client';
import type { BocaoRecord } from '@/types';

interface BocaoReconcileProps {
  onViewDetail: (tin: string) => void;
  onOpenSolr: (tin: string) => void;
}

export const BocaoReconcile: React.FC<BocaoReconcileProps> = ({ onViewDetail, onOpenSolr }) => {
  const [records, setRecords] = useState<BocaoRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [stats, setStats] = useState({ total_bocao: 0, matched_count: 0, unmatched_count: 0, retry_later_count: 0, match_rate: 0 });

  const fmtNum = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');
  const totalPages = Math.ceil(total / limit) || 1;
  const cards = [
    { t: 'Tổng Bố Cáo ĐKKD', v: fmtNum(stats.total_bocao), bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700', tc: 'text-slate-500', vc: 'text-slate-900 dark:text-white' },
    { t: 'Đã Có Trong Thuế GDT', v: fmtNum(stats.matched_count), bg: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', tc: 'text-emerald-700 dark:text-emerald-400', vc: 'text-emerald-700 dark:text-emerald-400' },
    { t: 'Chờ GDT Sync', v: fmtNum(stats.retry_later_count || stats.unmatched_count), bg: 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', tc: 'text-blue-700 dark:text-blue-400', vc: 'text-blue-700 dark:text-blue-400' },
    { t: 'Tỷ Lệ Bao Phủ', v: `${stats.match_rate}%`, bg: 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800', tc: 'text-purple-700 dark:text-purple-400', vc: 'text-purple-700 dark:text-purple-400' },
  ];

  const loadStats = useCallback(async () => {
    try {
      const res = await ApiClient.getBocaoReconcileStats() as typeof stats;
      if (res) setStats(res);
    } catch { /* ignore */ }
  }, []);

  const loadRecords = useCallback(async (p = 1, st = filterStatus) => {
    setPage(p); setLoading(true);
    try {
      const res = await ApiClient.getBocaoReconcile({
        page: String(p), limit: String(limit), status: st, keyword: filterKeyword, province: filterProvince
      }) as { records: BocaoRecord[]; total: number };
      setRecords(res.records || []); setTotal(res.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [filterStatus, filterKeyword, filterProvince]);

  const setStatusFilter = (st: string) => { setFilterStatus(st); loadRecords(1, st); };

  const syncMissing = async () => {
    setSyncing(true);
    try {
      const res = await ApiClient.syncMissingBocao(60) as { message?: string };
      alert(res?.message || 'Đã hoàn thành quét bù!');
      await loadStats(); await loadRecords(page);
    } catch (e: unknown) { alert('Lỗi quét bù: ' + (e instanceof Error ? e.message : String(e))); }
    finally { setSyncing(false); }
  };

  useEffect(() => { loadStats(); loadRecords(1); }, [loadStats, loadRecords]);

  return (
    <AiBadge name="BocaoReconcile" file="src/components/bocao/BocaoReconcile.tsx" module="Bố Cáo ĐKKD" desc="Đối soát Mã số doanh nghiệp Bố Cáo với CSDL Thuế">
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚖️</span>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Đối Soát Mã Số Doanh Nghiệp (Bố Cáo ĐKKD vs CSDL Thuế GDT)</h2>
                <p className="text-[11px] text-slate-500">Phát hiện doanh nghiệp mới công bố nhưng chưa có trong hệ thống CSDL Thuế (1.1M+ bản ghi)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={syncMissing} disabled={syncing || stats.unmatched_count === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50">
                <span>{syncing ? '⏳' : '⚡'}</span><span>Quét Bù Vào Thuế ({stats.unmatched_count})</span>
              </button>
              <button onClick={() => { loadRecords(1); loadStats(); }} className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 transition">↻ Làm Mới</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
            {cards.map((c) => (
              <div key={c.t} className={`p-3 rounded-xl border ${c.bg}`}>
                <div className={`text-[10px] uppercase font-bold ${c.tc}`}>{c.t}</div>
                <div className={`text-lg font-black font-mono ${c.vc}`}>{c.v}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button onClick={() => setStatusFilter('all')} className={`px-2.5 py-1 rounded-lg transition ${filterStatus === 'all' ? 'bg-white dark:bg-slate-700 shadow-xs font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>Tất Cả ({fmtNum(stats.total_bocao)})</button>
              <button onClick={() => setStatusFilter('retry_later')} className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${filterStatus === 'retry_later' ? 'bg-blue-600 text-white font-bold' : 'text-blue-700 dark:text-blue-400'}`}>⏳ Chờ GDT sync ({fmtNum(stats.retry_later_count || stats.unmatched_count)})</button>
              <button onClick={() => setStatusFilter('unmatched')} className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${filterStatus === 'unmatched' ? 'bg-amber-500 text-white font-bold' : 'text-amber-700 dark:text-amber-400'}`}>⚠️ Chưa Có ({fmtNum(stats.unmatched_count)})</button>
              <button onClick={() => setStatusFilter('matched')} className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${filterStatus === 'matched' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-700 dark:text-emerald-400'}`}>✅ Đã Khớp ({fmtNum(stats.matched_count)})</button>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && loadRecords(1)} placeholder="Tìm MST hoặc Tên..." className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200" />
              <input value={filterProvince} onChange={(e) => setFilterProvince(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && loadRecords(1)} placeholder="Tỉnh/TP..." className="w-28 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200" />
              <button onClick={() => loadRecords(1)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded-lg text-xs shadow-sm transition">🔍 Lọc</button>
            </div>
          </div>
        </div>

        <BocaoScanPanel onScanDone={() => { loadStats(); loadRecords(1); }} />

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700 text-[10px]">
                <tr><th className="p-2.5">Mã Số Doanh Nghiệp</th><th className="p-2.5">Nguồn Bố Cáo ĐKKD</th><th className="p-2.5">CSDL Thuế GDT (tax_records)</th><th className="p-2.5 text-center">Thao Tác</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                {loading ? <tr><td colSpan={4} className="p-6 text-center text-slate-400 italic">Đang nạp đối soát...</td></tr> : records.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-slate-400 italic">Không có bản ghi phù hợp.</td></tr> : records.map((r) => (
                  <tr key={r.tin} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 whitespace-nowrap align-top">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">{r.tin}</div>
                      <div className="mt-1">
                        {r.in_tax_records ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">✅ Đã có trong Thuế</span> : r.sync_status === 'retry_later' ? <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">⏳ Chờ GDT sync</span> : <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">⚠️ Chưa có trong Thuế</span>}
                      </div>
                    </td>
                    <td className="p-2.5 align-top max-w-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{r.bocao_company_name}</div>
                      <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">{r.announcement_type}</div>
                      <div className="text-[10px] text-slate-500">{r.bocao_province || 'Chưa rõ tỉnh'}</div>
                    </td>
                    <td className="p-2.5 align-top max-w-xs">
                      {r.in_tax_records ? (
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{r.tax_company_name || 'Đã ghi nhận MST'}</div>
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">{r.tax_status || 'Hoạt động'}</div>
                          <div className="text-[10px] text-slate-500 truncate">{r.tax_address || '---'}</div>
                        </div>
                      ) : <div className="text-amber-600 italic font-medium">Doanh nghiệp mới — Chưa có bản ghi trong DB Thuế GDT.</div>}
                    </td>
                    <td className="p-2.5 align-top text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => onOpenSolr(r.tin)} className="px-2 py-1 text-[10px] font-bold rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200">🔍 DKKD</button>
                        <button onClick={() => onViewDetail(r.tin)} className="px-2 py-1 text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-900 text-white">👁️ GDT</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
              <span className="text-slate-500">Hiển thị <b>{records.length}</b> / {fmtNum(total)} bản ghi (Trang {page} / {totalPages})</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => loadRecords(page - 1)} disabled={page <= 1} className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-40">◀ Trước</button>
                <button onClick={() => loadRecords(page + 1)} disabled={page >= totalPages} className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-40">Sau ▶</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AiBadge>
  );
};
