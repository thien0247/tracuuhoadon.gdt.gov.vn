// @id 01M4W0BCA00000000000000001
// @related 01M4W0BCA00000000000000005, 01M4W0APJC0000000000000001

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/api/client';
import { BocaoAutoCrawl } from './BocaoAutoCrawl';

interface BocaoItem { id?: number; pub_time?: string; tin: string; company_name?: string; province_name?: string; announcement_type?: string }

interface BocaoTabProps {
  onSelectTin: (tin: string) => void;
  onOpenSolr: (q: string) => void;
}

export const BocaoTab: React.FC<BocaoTabProps> = ({ onSelectTin, onOpenSolr }) => {
  const [records, setRecords] = useState<BocaoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(false);
  const [crawling, setCrawling] = useState(false);
  const [crawlMessage, setCrawlMessage] = useState('');
  const [maxPages, setMaxPages] = useState(5);
  const [errorText, setErrorText] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [stats, setStats] = useState<{ total_records?: number; latest_pub_time?: string }>({ total_records: 0 });

  const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');
  const totalPages = Math.ceil(total / limit) || 1;

  const loadStats = useCallback(async () => {
    try {
      const res = await ApiClient.getBocaoStats();
      if (res) setStats(res as { total_records?: number; latest_pub_time?: string });
    } catch { /* ignore */ }
  }, []);

  const loadRecords = useCallback(async (p = 1) => {
    setPage(p); setLoading(true); setErrorText('');
    try {
      const res = await ApiClient.getBocaoRecords({
        page: String(p), limit: String(limit),
        keyword: filterKeyword, type: filterType, province: filterProvince
      });
      setRecords((res.records || []) as BocaoItem[]); setTotal(res.total || 0);
    } catch (e: unknown) {
      setErrorText('Lỗi nạp dữ liệu bố cáo: ' + ((e as Error).message || String(e)));
    } finally { setLoading(false); }
  }, [filterKeyword, filterType, filterProvince]);

  const handleCrawl = async (isAll = false) => {
    setCrawling(true); setCrawlMessage('');
    try {
      const res = (isAll ? await ApiClient.crawlAllBocao(maxPages || 5) : await ApiClient.crawlBocao()) as { success?: boolean; pages_crawled?: number; total_found?: number; new_inserted?: number; error?: string };
      if (res.success) {
        setCrawlMessage(isAll ? `✅ Cào toàn bộ: ${res.pages_crawled} trang, ${res.total_found} tin (Mới: ${res.new_inserted}).` : `✅ Cào trang 1: ${res.total_found} tin (Mới: ${res.new_inserted}).`);
        await loadStats(); await loadRecords(1);
      } else { setCrawlMessage(`⚠️ Lỗi: ${res.error || 'Thất bại'}`); }
    } catch (e: unknown) { setCrawlMessage(`❌ Lỗi: ${String(e)}`); }
    finally { setCrawling(false); }
  };

  useEffect(() => { loadStats(); loadRecords(1); }, [loadStats, loadRecords]);

  const getTypeBadgeClass = (t?: string) => {
    if (!t) return 'bg-slate-100 text-slate-700';
    if (t.includes('Đăng ký mới')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (t.includes('thay đổi')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (t.includes('Giải thể') || t.includes('Thu hồi')) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📰</span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Cổng Bố Cáo Đăng Ký Doanh Nghiệp (DKKD)</h2>
              <p className="text-[11px] text-slate-500">Giám sát và cào tự động thông tin đăng ký doanh nghiệp mới nhất toàn quốc</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Tổng lưu trữ: <b className="text-indigo-600 font-mono">{formatNumber(stats.total_records)}</b> bản ghi</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500">Mới nhất: <b className="text-slate-700 font-mono">{stats.latest_pub_time ? String(stats.latest_pub_time).substring(0, 10) : 'Chưa có'}</b></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">🚀 Cào Bố Cáo Thủ Công</span>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span>Số trang:</span>
                <input type="number" value={maxPages} onChange={(e) => setMaxPages(Number(e.target.value))} min={1} max={50} className="w-12 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-center" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleCrawl(false)} disabled={crawling} className="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1">
                {crawling && <span className="animate-spin">⏳</span>}<span>Cào Trang 1</span>
              </button>
              <button onClick={() => handleCrawl(true)} disabled={crawling} className="flex-1 py-1.5 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1">
                {crawling && <span className="animate-spin">⏳</span>}<span>Cào {maxPages} Trang</span>
              </button>
            </div>
            {crawlMessage && <div className={`text-xs font-semibold ${crawlMessage.startsWith('✅') ? 'text-emerald-600' : 'text-rose-600'}`}>{crawlMessage}</div>}
          </div>
          <BocaoAutoCrawl onCrawled={() => { loadStats(); loadRecords(1); }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1">
          <input value={filterKeyword} onChange={(e) => setFilterKeyword(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && loadRecords(1)} placeholder="Tìm MST hoặc Tên DN..." className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100">
            <option value="">-- Tất cả Loại Công Bố --</option>
            <option value="Đăng ký mới">Đăng ký mới</option><option value="Đăng ký thay đổi">Đăng ký thay đổi</option>
            <option value="Thông báo thay đổi">Thông báo thay đổi</option><option value="Giải thể">Giải thể</option><option value="Vi phạm">Vi phạm / Thu hồi</option>
          </select>
          <input value={filterProvince} onChange={(e) => setFilterProvince(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && loadRecords(1)} placeholder="Lọc theo Tỉnh/TP..." className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100" />
          <button onClick={() => loadRecords(1)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow-sm transition">🔍 Lọc Dữ Liệu</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr><th className="p-2.5">Thời Gian Công Bố</th><th className="p-2.5">Mã Số Doanh Nghiệp</th><th className="p-2.5">Tên Doanh Nghiệp</th><th className="p-2.5">Địa Điểm</th><th className="p-2.5">Loại Công Bố</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-[11px]">
              {loading ? <tr><td colSpan={5} className="p-6 text-center text-slate-400 italic">Đang nạp dữ liệu bố cáo...</td></tr> : errorText ? <tr><td colSpan={5} className="p-6 text-center text-rose-500 font-semibold">{errorText}</td></tr> : records.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-slate-400 italic">Không tìm thấy bản ghi bố cáo nào.</td></tr> : records.map((r, idx) => (
                <tr key={r.id ?? idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="p-2.5 font-mono text-slate-600 dark:text-slate-400 text-[10px] whitespace-nowrap">{r.pub_time ? String(r.pub_time).substring(0, 19).replace('T', ' ') : '---'}</td>
                  <td className="p-2.5 font-mono font-bold">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => onSelectTin(r.tin)} className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"><span>{r.tin}</span><span className="text-[10px]">👁️</span></button>
                      <button onClick={() => onOpenSolr(r.tin)} className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">DKKD</button>
                    </div>
                  </td>
                  <td className="p-2.5 font-semibold text-slate-900 dark:text-slate-100 max-w-sm truncate" title={r.company_name}>{r.company_name}</td>
                  <td className="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{r.province_name || '---'}</td>
                  <td className="p-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTypeBadgeClass(r.announcement_type)}`}>{r.announcement_type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Hiển thị <b>{records.length}</b> / {formatNumber(total)} bản ghi (Trang {page} / {totalPages})</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => loadRecords(page - 1)} disabled={page <= 1} className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40">◀ Trước</button>
              <button onClick={() => loadRecords(page + 1)} disabled={page >= totalPages} className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40">Sau ▶</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
