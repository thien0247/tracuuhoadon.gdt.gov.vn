// @id 01M4W0SRCH0000000000000004
// @related 01M4W0SRCH0000000000000005, 01M4W0H00K0000000000000004, 01M4W0APJC0000000000000001
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/api/client';
import { useTablePageSize } from '@/hooks/useTablePageSize';
import MultiSelect from '@/components/common/MultiSelect';
import FilterTable from './FilterTable';

interface OptionItem { code: string; name: string }
interface FilterTabProps {
  provinceConfigs?: Record<string, unknown>;
  onSelectTin?: (tin: string) => void;
}

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

export default function FilterTab({ onSelectTin }: FilterTabProps) {
  const { pageSize, setPageSize } = useTablePageSize('gdt_filter_table_page_size', 50, 'pageSize');
  const [modelMode, setModelMode] = useState<'v2' | 'v3'>('v2');
  const [filterV2Prov, setFilterV2Prov] = useState<string[]>([]);
  const [filterV2Comm, setFilterV2Comm] = useState<string[]>([]);
  const [filterV2Tax, setFilterV2Tax] = useState<string[]>([]);
  const [filterV3Prov, setFilterV3Prov] = useState<string[]>([]);
  const [filterV3Dist, setFilterV3Dist] = useState<string[]>([]);
  const [filterV3Comm, setFilterV3Comm] = useState<string[]>([]);
  const [filterV3Tax, setFilterV3Tax] = useState<string[]>([]);
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');
  const [filterRows, setFilterRows] = useState<(string | number | null)[][]>([]);
  const [filterCount, setFilterCount] = useState<number | null>(null);
  const [filtering, setFiltering] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [provsV2, setProvsV2] = useState<OptionItem[]>([]);
  const [commsV2, setCommsV2] = useState<OptionItem[]>([]);
  const [taxsV2, setTaxsV2] = useState<OptionItem[]>([]);
  const [provsV3, setProvsV3] = useState<OptionItem[]>([]);
  const [distsV3, setDistsV3] = useState<OptionItem[]>([]);
  const [commsV3, setCommsV3] = useState<OptionItem[]>([]);
  const [taxsV3, setTaxsV3] = useState<OptionItem[]>([]);

  const loadOptionsV2 = useCallback(async (provCode = '') => {
    setLoadingOptions(true);
    try {
      const res = (await ApiClient.getFilterOptions({ model: 'v2', province_code: provCode })) as unknown as {
        provinces?: OptionItem[]; communes?: OptionItem[]; taxOffices?: OptionItem[];
      };
      if (!provCode) setProvsV2(res.provinces || []);
      setCommsV2(res.communes || []);
      setTaxsV2(res.taxOffices || []);
    } catch { setCommsV2([]); setTaxsV2([]); }
    finally { setLoadingOptions(false); }
  }, []);

  const loadOptionsV3 = useCallback(async (provCode = '') => {
    setLoadingOptions(true);
    try {
      const res = (await ApiClient.getFilterOptions({ model: 'v3', province_code: provCode })) as unknown as {
        provinces?: OptionItem[]; districts?: OptionItem[]; taxOffices?: OptionItem[];
      };
      if (!provCode) setProvsV3(res.provinces || []);
      setDistsV3(res.districts || []); setCommsV3([]); setTaxsV3(res.taxOffices || []);
    } catch { setDistsV3([]); setCommsV3([]); setTaxsV3([]); }
    finally { setLoadingOptions(false); }
  }, []);

  const loadCommunesV3 = useCallback(async (provCode = '', distCode = '') => {
    if (!distCode) { setCommsV3([]); return; }
    try {
      const res = (await ApiClient.getFilterOptions({ model: 'v3', province_code: provCode, district_code: distCode })) as unknown as { communes?: OptionItem[] };
      setCommsV3(res.communes || []);
    } catch { setCommsV3([]); }
  }, []);

  const runFilter = useCallback(async (overrides?: {
    mode?: 'v2' | 'v3'; limit?: number;
    v2p?: string[]; v2c?: string[]; v2t?: string[];
    v3p?: string[]; v3d?: string[]; v3c?: string[]; v3t?: string[];
  }) => {
    const mode = overrides?.mode ?? modelMode;
    const lim = overrides?.limit ?? pageSize;
    setFiltering(true);
    try {
      const payload: Record<string, unknown> = {
        from_date: filterFromDate, to_date: filterToDate, model_mode: mode, limit: lim
      };
      if (mode === 'v2') {
        payload.v2_province_codes = overrides?.v2p ?? filterV2Prov;
        payload.v2_commune_codes = overrides?.v2c ?? filterV2Comm;
        payload.v2_tax_office_codes = overrides?.v2t ?? filterV2Tax;
      } else {
        payload.v3_province_codes = overrides?.v3p ?? filterV3Prov;
        payload.v3_district_codes = overrides?.v3d ?? filterV3Dist;
        payload.v3_commune_names = overrides?.v3c ?? filterV3Comm;
        payload.pay_taxo_ids = overrides?.v3t ?? filterV3Tax;
      }
      const data = await ApiClient.filterRecords(payload);
      setFilterRows(data.rows || []);
      setFilterCount(data.count || 0);
    } catch (e: unknown) { alert('Lỗi lọc: ' + String(e)); }
    finally { setFiltering(false); }
  }, [modelMode, pageSize, filterFromDate, filterToDate, filterV2Prov, filterV2Comm, filterV2Tax, filterV3Prov, filterV3Dist, filterV3Comm, filterV3Tax]);

  useEffect(() => {
    void loadOptionsV2('');
    void loadOptionsV3('');
    void runFilter();
  }, []);

  const onExport = (format: 'csv' | 'xlsx') => {
    setShowExportMenu(false);
    const provs = modelMode === 'v2' ? filterV2Prov : filterV3Prov;
    const comms = modelMode === 'v2' ? filterV2Comm : filterV3Comm;
    const taxs = modelMode === 'v2' ? filterV2Tax : filterV3Tax;
    const args = [provs, filterFromDate, filterToDate, comms, taxs] as const;
    window.open(format === 'xlsx' ? ApiClient.getExportXlsxUrl(...args) : ApiClient.getExportUrl(...args), '_blank');
  };

  return (
    <div className="space-y-2.5">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-3.5 shadow-sm border border-slate-300 dark:border-slate-700 space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔍</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Bộ Lọc Doanh Nghiệp Đa Cấp</span>
            <div className="inline-flex rounded bg-slate-100 dark:bg-slate-700 p-0.5 text-xs font-semibold ml-2">
              <button onClick={() => { setModelMode('v2'); void runFilter({ mode: 'v2' }); }} className={`px-2 py-0.5 rounded transition flex items-center gap-1 text-[11px] ${modelMode === 'v2' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}><span>🏛️</span><span>Mô hình 2 Cấp</span></button>
              <button onClick={() => { setModelMode('v3'); void runFilter({ mode: 'v3' }); }} className={`px-2 py-0.5 rounded transition flex items-center gap-1 text-[11px] ${modelMode === 'v3' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-300'}`}><span>🏢</span><span>Mô hình 3 Cấp</span></button>
            </div>
          </div>
          <button onClick={() => { setFilterV2Prov([]); setFilterV2Comm([]); setFilterV2Tax([]); setFilterV3Prov([]); setFilterV3Dist([]); setFilterV3Comm([]); setFilterV3Tax([]); setFilterFromDate(''); setFilterToDate(''); void loadOptionsV2(''); void loadOptionsV3(''); void runFilter({ v2p: [], v2c: [], v2t: [], v3p: [], v3d: [], v3c: [], v3t: [] }); }} className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 font-medium transition">↻ Đặt lại</button>
        </div>

        {modelMode === 'v2' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-indigo-50/40 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/40">
            <div><label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">1. Tỉnh / Thành phố Mới (V2):</label><MultiSelect value={filterV2Prov} options={provsV2} placeholder="Chọn tỉnh mới (35 tỉnh)..." onChange={(v) => { setFilterV2Prov(v); setFilterV2Comm([]); setFilterV2Tax([]); void loadOptionsV2(v[0] || ''); void runFilter({ v2p: v, v2c: [], v2t: [] }); }} /></div>
            <div><label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">2. Xã Mới (V2 - Đã Bỏ Huyện):</label><MultiSelect value={filterV2Comm} options={commsV2} placeholder="Chọn xã mới..." disabled={loadingOptions} loading={loadingOptions} onChange={(v) => { setFilterV2Comm(v); void runFilter({ v2c: v }); }} /></div>
            <div><label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">3. Mạng Lưới Thuế Cơ Sở (V2):</label><MultiSelect value={filterV2Tax} options={taxsV2} placeholder="Chọn thuế cơ sở..." disabled={loadingOptions} loading={loadingOptions} onChange={(v) => { setFilterV2Tax(v); void runFilter({ v2t: v }); }} /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 bg-emerald-50/40 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100/60 dark:border-emerald-900/40">
            <div><label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">1. Tỉnh / TP Cũ (V3):</label><MultiSelect value={filterV3Prov} options={provsV3} placeholder="Chọn tỉnh cũ (64 tỉnh)..." onChange={(v) => { setFilterV3Prov(v); setFilterV3Dist([]); setFilterV3Comm([]); setFilterV3Tax([]); void loadOptionsV3(v[0] || ''); void runFilter({ v3p: v, v3d: [], v3c: [], v3t: [] }); }} /></div>
            <div><label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">2. Quận / Huyện (V3):</label><MultiSelect value={filterV3Dist} options={distsV3} placeholder="Chọn quận/huyện..." disabled={loadingOptions} loading={loadingOptions} onChange={(v) => { setFilterV3Dist(v); setFilterV3Comm([]); void loadCommunesV3(filterV3Prov[0] || '', v[0] || ''); void runFilter({ v3d: v, v3c: [] }); }} /></div>
            <div><label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">3. Xã / Phường Cũ (V3):</label><MultiSelect value={filterV3Comm} options={commsV3} placeholder="Chọn xã/phường..." disabled={loadingOptions || !filterV3Dist.length} loading={loadingOptions} onChange={(v) => { setFilterV3Comm(v); void runFilter({ v3c: v }); }} /></div>
            <div><label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">4. Cơ Quan Thuế GDT:</label><MultiSelect value={filterV3Tax} options={taxsV3} placeholder="Chọn Chi cục / Cục Thuế..." disabled={loadingOptions} loading={loadingOptions} onChange={(v) => { setFilterV3Tax(v); void runFilter({ v3t: v }); }} /></div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-0.5">
          <div><label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Từ ngày ĐKKD:</label><input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100" /></div>
          <div><label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Đến ngày ĐKKD:</label><input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100" /></div>
          <div className="flex items-end gap-1.5 col-span-3">
            <button onClick={() => void runFilter()} disabled={filtering} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded shadow-sm transition text-xs disabled:opacity-50">{filtering ? 'Đang lọc...' : '🔍 Lọc Dữ Liệu'}</button>
            <div className="relative">
              <button onClick={() => setShowExportMenu((p) => !p)} disabled={filterRows.length === 0} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2.5 rounded shadow-sm transition text-xs disabled:opacity-50 flex items-center gap-1"><span>💾</span><span>Xuất File ▾</span></button>
              {showExportMenu && (
                <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 text-xs">
                  <button onClick={() => onExport('csv')} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"><span>📄</span> Xuất CSV Toàn Bộ</button>
                  <button onClick={() => onExport('xlsx')} className="w-full text-left px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2"><span>📊</span> Xuất Excel XLSX</button>
                </div>
              )}
            </div>
          </div>
        </div>
        {filterCount !== null && (
          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 pt-1 flex items-center justify-between flex-wrap gap-2">
            <div>Tìm thấy <span className="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{formatNumber(filterCount)}</span> kết quả. <span className="text-slate-400 font-normal">(Xem trước {pageSize} dòng • Kèm cột SĐT & V2/V3)</span></div>
            <div className={`text-[11px] font-medium ${modelMode === 'v2' ? 'text-indigo-700 dark:text-indigo-300' : 'text-emerald-700 dark:text-emerald-300'}`}>Chế độ: {modelMode === 'v2' ? '🏛️ Mô hình 2 Cấp (Mới HTKK V2)' : '🏢 Mô hình 3 Cấp (Cũ HTKK V3)'}</div>
          </div>
        )}
      </div>
      <FilterTable rows={filterRows} loading={filtering} pageSize={pageSize} onChangePageSize={(sz) => { setPageSize(sz); void runFilter({ limit: sz }); }} onSelectTin={onSelectTin} />
    </div>
  );
}
