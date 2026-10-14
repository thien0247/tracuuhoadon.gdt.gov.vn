// @id 01M4W0CRWA0000000000000007
// @related 01M4W0APJC0000000000000002, 01M4W0CRWA0000000000000001
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ProvincesApi, type ProvinceMaxTinDetectResult } from '@/api/provinces';
import type { ProvinceConfig } from '@/types';

interface UpdateMaxTinModalProps {
  visible: boolean;
  initialProvinceKey?: string;
  provinceConfigs: Record<string, ProvinceConfig>;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function UpdateMaxTinModal({
  visible, initialProvinceKey, provinceConfigs, onClose, onUpdated
}: UpdateMaxTinModalProps) {
  const [selectedProvKey, setSelectedProvKey] = useState('');
  const [detectInfo, setDetectInfo] = useState<ProvinceMaxTinDetectResult | null>(null);
  const [inputMaxTin, setInputMaxTin] = useState('');
  const [updateScanProgress, setUpdateScanProgress] = useState(true);
  const [updateActivationTin, setUpdateActivationTin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);

  const loadDetect = useCallback(async (key: string) => {
    if (!key) return;
    setLoading(true); setMsg('');
    try {
      const info = await ProvincesApi.detectMaxTin(key);
      setDetectInfo(info);
      setInputMaxTin(info.suggested_max_tin || '');
    } catch (e) { setMsg((e as Error).message); setIsErr(true); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (visible) {
      const initKey = initialProvinceKey || Object.keys(provinceConfigs)[0] || '';
      setSelectedProvKey(initKey);
      void loadDetect(initKey);
    }
  }, [visible, initialProvinceKey, provinceConfigs, loadDetect]);

  if (!visible) return null;

  const currentPrefix = (selectedProvKey && provinceConfigs[selectedProvKey]?.prefix) || detectInfo?.prefix || '';
  const tinClean = inputMaxTin.trim();
  const isValidInput = tinClean.length === 10 && /^\d+$/.test(tinClean) && tinClean.startsWith(currentPrefix);

  const statCards = [
    { t: '🏛️ CSDL Thuế', v: detectInfo?.db_tax_max, bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900', tc: 'text-blue-600 dark:text-blue-300', vc: 'text-blue-900 dark:text-blue-100' },
    { t: '📰 Bố Cáo ĐKKD', v: detectInfo?.db_bocao_max, bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900', tc: 'text-purple-600 dark:text-purple-300', vc: 'text-purple-900 dark:text-purple-100' },
    { t: '🕒 Đã Quét Gần Nhất', v: detectInfo?.last_scanned_tin, bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900', tc: 'text-emerald-600 dark:text-emerald-300', vc: 'text-emerald-900 dark:text-emerald-100' },
    { t: '⚙️ Mã Khởi Tạo', v: detectInfo?.activation_tin, bg: 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600', tc: 'text-slate-500 dark:text-slate-300', vc: 'text-slate-800 dark:text-slate-100' }
  ];

  const onSave = async () => {
    if (!isValidInput) return;
    setSaving(true); setMsg('');
    try {
      await ProvincesApi.updateMaxTin(selectedProvKey, {
        max_tin: tinClean,
        update_scan_progress: updateScanProgress,
        update_activation_tin: updateActivationTin
      });
      setMsg(`Đã cập nhật thành công Max TIN cho ${selectedProvKey}!`);
      setIsErr(false);
      onUpdated?.();
      setTimeout(() => onClose(), 1200);
    } catch (e) { setMsg((e as Error).message); setIsErr(true); }
    finally { setSaving(false); }
  };

  const onSyncAll = async () => {
    setSyncing(true);
    try {
      const res = await ProvincesApi.syncAllMaxTin();
      setMsg(`Đã đồng bộ thành công ${res.synced_count} tỉnh thành từ CSDL!`);
      setIsErr(false);
      onUpdated?.();
    } catch (e) { setMsg((e as Error).message); setIsErr(true); }
    finally { setSyncing(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">🎯</span>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider">Cập Nhật Max TIN Thủ Công</h3>
              <p className="text-[10px] text-slate-300">Đối soát 4 chiều và điều chỉnh đỉnh quét cho crawler</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition">✕</button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-700 dark:text-slate-200">
          <div className="space-y-1">
            <label className="block font-bold text-slate-800 dark:text-slate-100">Chọn tỉnh thành:</label>
            <select value={selectedProvKey} onChange={(e) => { setSelectedProvKey(e.target.value); void loadDetect(e.target.value); }} disabled={loading} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold">
              {Object.entries(provinceConfigs).map(([key, cfg]) => (
                <option key={key} value={key}>({cfg.prefix || key.slice(-3, -1)}) {key}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            {statCards.map((c) => (
              <div key={c.t} className={`p-2.5 rounded-xl border ${c.bg}`}>
                <div className={`text-[10px] font-sans font-bold ${c.tc}`}>{c.t}</div>
                <div className={`font-bold mt-0.5 truncate ${c.vc}`}>{c.v || '—'}</div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-100">Max TIN mới (10 số):</label>
              {detectInfo?.suggested_max_tin && (
                <button onClick={() => setInputMaxTin(detectInfo.suggested_max_tin || '')} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                  ⚡ Điền đỉnh cao nhất: {detectInfo.suggested_max_tin}
                </button>
              )}
            </div>
            <input type="text" value={inputMaxTin} onChange={(e) => setInputMaxTin(e.target.value)} maxLength={10} placeholder="VD: 0318999999" className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl px-3 py-2 text-sm font-mono font-bold ${isValidInput ? 'border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400' : 'border-rose-500 text-rose-600'}`} />
            {!isValidInput && inputMaxTin && <p className="text-[10px] text-rose-500">MST phải có đúng 10 chữ số và bắt đầu bằng ({currentPrefix}).</p>}
          </div>

          <div className="space-y-1.5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" checked={updateScanProgress} onChange={(e) => setUpdateScanProgress(e.target.checked)} className="rounded text-indigo-600" /><span>Cập nhật vào Tiến trình quét (<code className="text-[10px] font-mono">scan_progress.last_tin</code>)</span></label>
            <label className="flex items-center gap-2 cursor-pointer text-xs"><input type="checkbox" checked={updateActivationTin} onChange={(e) => setUpdateActivationTin(e.target.checked)} className="rounded text-indigo-600" /><span>Cập nhật vào Mã khởi tạo tỉnh (<code className="text-[10px] font-mono">provinces.activation_tin</code>)</span></label>
          </div>

          {msg && <div className={`p-2.5 rounded-xl font-bold text-xs ${isErr ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{msg}</div>}
        </div>

        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <button onClick={() => void onSyncAll()} disabled={syncing} className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100 transition flex items-center gap-1.5"><span className={syncing ? 'animate-spin' : ''}>🔄</span><span>Đồng Bộ 62 Tỉnh</span></button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 transition">Đóng</button>
            <button onClick={() => void onSave()} disabled={saving || !isValidInput} className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu Cập Nhật'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
