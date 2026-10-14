// @id 01M4W0SRCH0000000000000002
// @related 01M4W0SRCH0000000000000003, 01M4W0H00K0000000000000004, 01M4W0APJC0000000000000001
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/api/client';
import { useTablePageSize } from '@/hooks/useTablePageSize';
import SearchTable from './SearchTable';

interface SearchTabProps {
  provinceConfigs?: Record<string, unknown>;
  onSelectTin?: (tin: string) => void;
}

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

export default function SearchTab({ provinceConfigs = {}, onSelectTin }: SearchTabProps) {
  const { pageSize, setPageSize } = useTablePageSize('gdt_search_table_page_size', 50, 'pageSize');
  const [searchTin, setSearchTin] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchProvKey, setSearchProvKey] = useState('');
  const [searchRows, setSearchRows] = useState<(string | number | null)[][]>([]);
  const [searchCount, setSearchCount] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);

  const executeSearch = useCallback(async (qVal: string, provVal: string, limitVal: number) => {
    const q = qVal.trim();
    if (!q) {
      alert('Vui lòng nhập Mã Số Thuế hoặc Tên Công Ty để tìm kiếm.');
      return;
    }
    setSearching(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('q', q);
      if (provVal) url.searchParams.set('prov', provVal);
      else url.searchParams.delete('prov');
      url.searchParams.set('pageSize', String(limitVal));
      window.history.replaceState({}, '', url.toString());

      const data = (await ApiClient.searchRecords({
        query: q,
        province_key: provVal || null,
        limit: limitVal
      })) as { rows?: (string | number | null)[][]; count?: number };
      setSearchRows(data.rows || []);
      setSearchCount(data.count || 0);
    } catch (e: unknown) {
      alert('Lỗi tìm kiếm: ' + String(e));
    } finally {
      setSearching(false);
    }
  }, []);

  const onSearch = () => {
    void executeSearch(searchTin.trim() || searchName.trim(), searchProvKey, pageSize);
  };

  const onPageSizeChange = (sz: number) => {
    setPageSize(sz);
    const q = searchTin.trim() || searchName.trim();
    if (q) void executeSearch(q, searchProvKey, sz);
  };

  const clearSearch = () => {
    setSearchTin('');
    setSearchName('');
    setSearchProvKey('');
    setSearchRows([]);
    setSearchCount(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('q');
      url.searchParams.delete('prov');
      window.history.replaceState({}, '', url.toString());
    } catch { /* ignore */ }
  };

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get('q');
      const prov = sp.get('prov') || '';
      if (q) {
        if (/^\d+$/.test(q)) setSearchTin(q);
        else setSearchName(q);
        if (prov) setSearchProvKey(prov);
        void executeSearch(q, prov, pageSize);
      }
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="space-y-2.5">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-3.5 shadow-sm border border-slate-300 dark:border-slate-700 space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <span>🔎</span><span>Tra Cứu Doanh Nghiệp (Ma Trận Dữ Liệu Resizable)</span>
          </h2>
          <span className="text-[11px] text-slate-400">Tra cứu tức thì • Kéo rê chỉnh cột • Tự động lưu cache</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Mã số thuế:</label>
            <input
              type="text"
              value={searchTin}
              onChange={(e) => setSearchTin(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
              placeholder="VD: 0316341824"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 font-mono focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Tên công ty:</label>
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
              placeholder="VD: CÔNG TY TNHH..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Lọc theo tỉnh thành:</label>
            <select
              value={searchProvKey}
              onChange={(e) => setSearchProvKey(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">-- Tất cả tỉnh thành --</option>
              {Object.keys(provinceConfigs).map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-1.5">
            <button
              onClick={onSearch}
              disabled={searching}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded shadow-sm transition text-xs disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <span>{searching ? '⏳' : '🔍'}</span><span>{searching ? 'Đang tìm...' : 'Tra Cứu'}</span>
            </button>
            <button onClick={clearSearch} className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-1 px-2.5 rounded transition text-xs">
              ✖
            </button>
          </div>
        </div>

        {searchCount !== null && (
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 pt-0.5 flex items-center justify-between">
            <div>
              Tìm thấy <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{formatNumber(searchCount)}</span> kết quả trong CSDL.{' '}
              <span className="text-slate-400 font-normal">(Nạp ma trận {pageSize} dòng • Tự động lưu cache & URL)</span>
            </div>
          </div>
        )}
      </div>

      <SearchTable
        rows={searchRows}
        count={searchCount}
        loading={searching}
        pageSize={pageSize}
        onChangePageSize={onPageSizeChange}
        onSelectTin={onSelectTin}
      />
    </div>
  );
}
