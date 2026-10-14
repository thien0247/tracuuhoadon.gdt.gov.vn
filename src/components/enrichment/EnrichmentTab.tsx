// @id 01M4W0ENRC0000000000000001
// @related 01M4W0ENRC0000000000000002, 01M4W0APJC0000000000000001, 01M4W0TYPE0000000000000001
'use client';
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import EnrichmentProg from './EnrichmentProg';
import { ApiClient } from '@/api/client';
import type { EnrichmentJob, EnrichmentProvince, EnrichmentSummary } from '@/types';

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

export default function EnrichmentTab() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'incomplete' | 'completed'>('all');
  const [summary, setSummary] = useState<EnrichmentSummary>({ totalRecords: 0, enrichedCount: 0, pendingCount: 0, completionRate: 0 });
  const [provinces, setProvinces] = useState<EnrichmentProvince[]>([]);
  const [activeJob, setActiveJob] = useState<EnrichmentJob | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getEnrichmentSummary();
      if (data?.summary) setSummary(data.summary);
      if (data?.provinces) setProvinces(data.provinces);
    } catch (e) { console.error('Lỗi tải thống kê:', e); }
    finally { setLoading(false); }
  }, []);

  const checkJobs = useCallback(async () => {
    try {
      const res = await ApiClient.getEnrichmentJobs();
      const running = res?.jobs?.find((j) => j.isRunning);
      setActiveJob(running || (res?.jobs?.length ? res.jobs[res.jobs.length - 1] : null));
      if (running && !pollRef.current) {
        pollRef.current = setInterval(() => { void checkJobs(); }, 1500);
      } else if (!running && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
        await loadSummary();
      }
    } catch (e) { console.error('Lỗi kiểm tra jobs:', e); }
  }, [loadSummary]);

  useEffect(() => {
    void loadSummary().then(() => checkJobs());
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadSummary, checkJobs]);

  const filteredProvinces = useMemo(() => {
    let list = provinces.slice();
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter((p) => p.provinceName.toLowerCase().includes(q) || p.prefix.includes(q));
    if (filterMode === 'incomplete') list = list.filter((p) => p.completionRate < 100);
    if (filterMode === 'completed') list = list.filter((p) => p.completionRate >= 100);
    return list;
  }, [provinces, searchQuery, filterMode]);

  const resetUnverified = async (prefix: string | null = null) => {
    const msg = prefix ? `Reset tỉnh ${prefix}?` : 'Reset toàn bộ dữ liệu suy đoán để sync chuẩn từ API?';
    if (!confirm(msg)) return;
    try {
      const res = (await ApiClient.resetUnverifiedEnrichment(prefix)) as { message: string };
      alert(res?.message || 'Đã reset hoàn tất!');
      await loadSummary();
    } catch (e: unknown) { alert('Lỗi: ' + String(e)); }
  };

  const startOnline = async (p: EnrichmentProvince) => {
    try {
      await ApiClient.startProvinceOnlineSync(p.prefix);
      setProvinces((prev) => prev.map((item) => (item.prefix === p.prefix ? { ...item, isRunning: true } : item)));
      await checkJobs();
    } catch (e: unknown) { alert('Lỗi: ' + String(e)); }
  };

  const stopOnline = async (prefix: string) => {
    try { await ApiClient.stopProvinceOnlineSync(prefix); await checkJobs(); }
    catch (e: unknown) { alert('Lỗi: ' + String(e)); }
  };

  return (
    <div className="space-y-4">
      {activeJob && <EnrichmentProg job={activeJob} onStop={(pfx) => void stopOnline(pfx)} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-glass p-3 rounded-xl border border-[var(--border-color)]"><div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Tổng Bản Ghi DB</div><div className="text-2xl font-extrabold text-[var(--vnpt-blue)] mt-1 font-mono tabular-nums">{formatNumber(summary.totalRecords)}</div></div>
        <div className="card-glass p-3 rounded-xl border border-[var(--border-color)]"><div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Đã Xác Thực API</div><div className="text-2xl font-extrabold text-emerald-600 mt-1 font-mono tabular-nums">{formatNumber(summary.enrichedCount)}</div></div>
        <div className="card-glass p-3 rounded-xl border border-[var(--border-color)]"><div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Chờ Xác Thực</div><div className="text-2xl font-extrabold text-amber-600 mt-1 font-mono tabular-nums">{formatNumber(summary.pendingCount)}</div></div>
        <div className="card-glass p-3 rounded-xl border border-[var(--border-color)]"><div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Tỷ Lệ Hoàn Thành</div><div className="text-2xl font-extrabold text-purple-600 mt-1 font-mono tabular-nums">{summary.completionRate}%</div></div>
      </div>

      <div className="card-glass p-2.5 rounded-xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} type="text" placeholder="Tìm tên tỉnh, tiền tố..." className="px-2.5 py-1.5 pl-7 text-xs border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] w-44" />
            <span className="absolute left-2 top-1.5 text-xs text-[var(--text-muted)]">🔍</span>
          </div>
          <div className="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg text-xs font-medium border border-[var(--border-color)]">
            <button onClick={() => setFilterMode('all')} className={`px-2.5 py-1 rounded-md transition ${filterMode === 'all' ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}>Tất Cả</button>
            <button onClick={() => setFilterMode('incomplete')} className={`px-2.5 py-1 rounded-md transition ${filterMode === 'incomplete' ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}>Chưa Xong (&lt;100%)</button>
            <button onClick={() => setFilterMode('completed')} className={`px-2.5 py-1 rounded-md transition ${filterMode === 'completed' ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)]'}`}>Hoàn Thành (100%)</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void resetUnverified(null)} title="Làm sạch dữ liệu suy đoán không chuẩn xác để đồng bộ chuẩn từ API" className="py-1.5 px-3 rounded-xl border border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1"><span>🧹</span><span>Làm Sạch Dữ Liệu Cũ</span></button>
          <button onClick={() => void loadSummary()} disabled={loading} className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-xs font-semibold transition"><span className={loading ? 'animate-spin' : ''}>🔄</span></button>
        </div>
      </div>

      <div className="card-glass rounded-xl border border-[var(--border-color)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--text-primary)]">
            <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] uppercase font-bold border-b border-[var(--border-color)] text-[11px]">
              <tr><th className="p-3">Tỉnh / Thành</th><th className="p-3 text-center">Tiền Tố</th><th className="p-3 text-right">Tổng MST</th><th className="p-3 text-right">Đã Xác Thực</th><th className="p-3 text-right">Còn Thiếu</th><th className="p-3">Tiến Độ API</th><th className="p-3 text-center">Trạng Thái</th><th className="p-3 text-right">Thao Tác</th></tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredProvinces.map((p) => (
                <tr key={p.prefix} className="hover:bg-[var(--bg-card-hover)] transition-colors">
                  <td className="p-3 font-bold text-sm">{p.provinceName}</td>
                  <td className="p-3 text-center font-mono font-bold text-[var(--vnpt-blue)]">{p.prefix}</td>
                  <td className="p-3 text-right font-mono tabular-nums">{formatNumber(p.totalRecords)}</td>
                  <td className="p-3 text-right font-mono tabular-nums text-emerald-600 font-semibold">{formatNumber(p.enrichedCount)}</td>
                  <td className="p-3 text-right font-mono tabular-nums text-amber-600 font-semibold">{formatNumber(p.pendingCount)}</td>
                  <td className="p-3 w-44">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${p.completionRate >= 100 ? 'bg-emerald-500' : p.completionRate > 0 ? 'bg-indigo-500' : 'bg-slate-400'}`} style={{ width: `${p.completionRate}%` }} />
                      </div>
                      <span className="font-mono text-[11px] font-bold w-12 text-right">{p.completionRate}%</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {p.isRunning ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 animate-pulse">Đang Sync API</span> : p.completionRate >= 100 ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Hoàn thành</span> : <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Chờ sync</span>}
                  </td>
                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                    {!p.isRunning ? <button onClick={() => void startOnline(p)} className="py-1 px-2.5 rounded-lg font-bold text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition">🔄 Sync API</button> : <button onClick={() => void stopOnline(p.prefix)} className="py-1 px-2.5 rounded-lg font-bold text-[11px] bg-rose-600 hover:bg-rose-500 text-white transition">⏹ Dừng</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
