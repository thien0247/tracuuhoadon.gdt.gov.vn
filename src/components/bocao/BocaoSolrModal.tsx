// @id 01M4W0BCA00000000000000004
// @related 01M4W0CMMN0000000000000001, 01M4W0APJC0000000000000001

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AiBadge } from '../common/AiBadge';
import { ApiClient } from '@/api/client';

interface BocaoSolrModalProps {
  isOpen: boolean;
  initialQuery?: string;
  onClose: () => void;
  onViewTaxDetail: (tin: string) => void;
}

export const BocaoSolrModal: React.FC<BocaoSolrModalProps> = ({ isOpen, initialQuery = '', onClose, onViewTaxDetail }) => {
  const [loading, setLoading] = useState(false);
  const [searchField, setSearchField] = useState('');
  const [results, setResults] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copyMsg, setCopyMsg] = useState('');
  const [expandedRaw, setExpandedRaw] = useState<Record<number, boolean>>({});

  const doSearch = useCallback(async (queryStr?: string) => {
    const q = (queryStr ?? searchField).trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const res = await ApiClient.searchDkkdOnline(q) as { success?: boolean; enterprises?: Record<string, string>[]; error?: string };
      if (res && res.success) {
        setResults(res.enterprises || []);
      } else {
        setError(res?.error || 'Không thể tra cứu DKKD');
        setResults([]);
      }
    } catch (err: unknown) {
      setError('Lỗi kết nối: ' + (err instanceof Error ? err.message : String(err)));
      setResults([]);
    } finally { setLoading(false); }
  }, [searchField]);

  useEffect(() => {
    if (isOpen) {
      const q = String(initialQuery || '').trim();
      setSearchField(q);
      setError(null);
      setExpandedRaw({});
      if (q) { doSearch(q); }
      else { setResults([]); setHasSearched(false); }
    }
  }, [isOpen, initialQuery, doSearch]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const copyText = async (txt: string, label = '') => {
    if (!txt) return;
    try {
      await navigator.clipboard.writeText(txt);
      setCopyMsg(`✓ Đã chép ${label || txt}!`);
      setTimeout(() => setCopyMsg(''), 2000);
    } catch { setCopyMsg('Lỗi copy!'); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <AiBadge name="BocaoSolrModal" file="src/components/bocao/BocaoSolrModal.tsx" module="Bố Cáo ĐKKD" desc="Modal tra cứu doanh nghiệp DKKD Solr" className="w-full max-w-3xl">
        <div className="bg-white dark:bg-slate-900 w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
          <div className="px-5 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2.5">
              <span className="text-xl">🔍</span>
              <div>
                <h3 className="text-sm font-bold">Tra Cứu Doanh Nghiệp Trực Tuyến (DKKD Solr)</h3>
                <p className="text-[11px] text-indigo-200">Truy vấn realtime từ Cổng Đăng ký kinh doanh quốc gia</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-300 hover:text-white text-lg font-bold">✕</button>
          </div>

          <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
            <div className="flex gap-2">
              <input value={searchField} onChange={(e) => setSearchField(e.target.value)} onKeyUp={(e) => e.key === 'Enter' && doSearch()} placeholder="Nhập Mã số thuế hoặc Tên doanh nghiệp..." className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500" />
              <button onClick={() => doSearch()} disabled={loading || !searchField.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5">
                {loading && <span className="animate-spin">⏳</span>}<span>{loading ? 'Đang tìm...' : 'Tra Cứu'}</span>
              </button>
            </div>

            {copyMsg && <div className="text-emerald-600 font-semibold text-center">{copyMsg}</div>}
            {error && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">{error}</div>}
            {loading ? <div className="py-10 text-center text-slate-400 italic">Đang truy vấn Cổng ĐKKD...</div> : hasSearched && results.length === 0 && !error && <div className="py-8 text-center text-slate-400 italic">Không tìm thấy doanh nghiệp phù hợp với từ khóa &quot;{searchField}&quot;.</div>}

            {results.map((item, idx) => (
              <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 hover:border-indigo-300 transition">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{item.Name || 'Chưa có tên'}</h4>
                    {item.Name_F && <div className="text-[11px] text-slate-500 italic">{item.Name_F}</div>}
                    {item.Short_Name && <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">Tên viết tắt: {item.Short_Name}</div>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">DKKD Solr</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">{item.Status || 'Đang hoạt động'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                  <div><span className="text-slate-500">Mã Số Thuế:</span> <b className="font-mono text-indigo-600 font-bold ml-1">{item.Enterprise_Gdt_Code || '---'}</b></div>
                  <div><span className="text-slate-500">Mã ĐKKD:</span> <b className="font-mono text-slate-800 dark:text-slate-200 font-bold ml-1">{item.Enterprise_Code || '---'}</b></div>
                  <div><span className="text-slate-500">ID Solr:</span> <b className="font-mono text-slate-600 dark:text-slate-400 ml-1">{item.Id || '---'}</b></div>
                  <div className="col-span-2 sm:col-span-3"><span className="text-slate-500">Người đại diện:</span> <b className="text-slate-800 dark:text-slate-200 ml-1">{item.Legal_First_Name || '---'}</b></div>
                  <div className="col-span-2 sm:col-span-3"><span className="text-slate-500">Mã địa bàn:</span> <span className="font-mono text-slate-700 dark:text-slate-300 ml-1">Tỉnh: {item.City_Id || '-'} | Huyện: {item.District_Id || '-'} | Xã: {item.Ward_Id || '-'}</span></div>
                  <div className="col-span-2 sm:col-span-3"><span className="text-slate-500">Địa chỉ trụ sở:</span> <span className="text-slate-800 dark:text-slate-200 ml-1 font-medium">{item.Ho_Address || '---'}</span></div>
                </div>

                {expandedRaw[idx] && (
                  <div className="mt-2 p-2.5 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto max-h-48 border border-slate-700">
                    <pre>{JSON.stringify(item, null, 2)}</pre>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setExpandedRaw((prev) => ({ ...prev, [idx]: !prev[idx] }))} className="px-2 py-1 text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 text-slate-700 dark:text-slate-200">
                      {expandedRaw[idx] ? '▲ Ẩn JSON' : '{ } JSON Gốc'}
                    </button>
                    <button onClick={() => copyText(JSON.stringify(item, null, 2), 'JSON')} className="px-2 py-1 text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 text-slate-700 dark:text-slate-200">📋 Chép JSON</button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.Enterprise_Gdt_Code && <button onClick={() => copyText(item.Enterprise_Gdt_Code, 'MST')} className="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 text-slate-700 dark:text-slate-200">📋 Chép MST</button>}
                    {item.Enterprise_Gdt_Code && <button onClick={() => onViewTaxDetail(item.Enterprise_Gdt_Code)} className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition">👁️ Xem Chi Tiết GDT</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
            <button onClick={onClose} className="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition">Đóng</button>
          </div>
        </div>
      </AiBadge>
    </div>
  );
};
