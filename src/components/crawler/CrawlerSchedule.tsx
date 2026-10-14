// @id 01M4W0CRWA0000000000000004
// @related 01M4W0APJC0000000000000001, 01M4W0CRWA0000000000000001
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/api/client';

const fmtCd = (sec: number) => {
  if (!sec || sec <= 0) return '--:--:--';
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export default function CrawlerSchedule() {
  const [status, setStatus] = useState({
    is_executing: false,
    newest: { enabled: false, interval_hours: 6, last_run: '', countdown_sec: 0 },
    gap_fill_500: { enabled: true, interval_hours: 12, last_run: '', countdown_sec: 0, reset_on_existing: true }
  });
  const [actionNotice, setActionNotice] = useState('');
  const [isTriggering, setIsTriggering] = useState(false);

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice((cur) => (cur === msg ? '' : cur)), 4500);
  };

  const fetchStatus = useCallback(async () => {
    try {
      const res = await ApiClient.getScheduleStatus();
      if (res && res.newest && res.gap_fill_500) setStatus(res);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const timer = setInterval(() => {
      setStatus((prev) => ({
        ...prev,
        newest: { ...prev.newest, countdown_sec: Math.max(0, prev.newest.countdown_sec - 1) },
        gap_fill_500: { ...prev.gap_fill_500, countdown_sec: Math.max(0, prev.gap_fill_500.countdown_sec - 1) }
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const toggleNewest = async () => {
    await ApiClient.toggleScheduleNewest(!status.newest.enabled);
    await fetchStatus();
  };

  const toggleGapFill = async () => {
    await ApiClient.toggleScheduleGapFill(!status.gap_fill_500.enabled);
    await fetchStatus();
  };

  const triggerNewest = async () => {
    setIsTriggering(true);
    try {
      await ApiClient.triggerScheduleNewest();
      showNotice('⚡ Đã kích hoạt đợt quét Đỉnh mới nhất cho 62 tỉnh!');
      await fetchStatus();
    } catch (e: unknown) {
      showNotice('❌ Lỗi kích hoạt: ' + String(e));
    } finally { setIsTriggering(false); }
  };

  const triggerGapFill = async () => {
    setIsTriggering(true);
    try {
      await ApiClient.triggerScheduleGapFill();
      showNotice('⚡ Đã kích hoạt quét 500 lỗ hổng cho 62 tỉnh thành!');
      await fetchStatus();
    } catch (e: unknown) {
      showNotice('❌ Lỗi kích hoạt: ' + String(e));
    } finally { setIsTriggering(false); }
  };

  const setGapFillMode = async (resetOnExisting: boolean) => {
    try {
      await ApiClient.setScheduleGapFillMode(resetOnExisting);
      showNotice(resetOnExisting ? '⚙️ Option 1: Reset khi gặp mã trong DB (Vét cạn sâu)' : '⚙️ Option 2: Chỉ reset khi có mã mới nạp DB (Nghiêm ngặt)');
      await fetchStatus();
    } catch (e: unknown) {
      showNotice('❌ Lỗi đổi chế độ: ' + String(e));
    }
  };

  return (
    <div className="space-y-2">
      {actionNotice && (
        <div className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-between transition">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice('')} className="text-white/80 hover:text-white ml-2">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <div className="bg-white dark:bg-slate-800 rounded-xl px-3 py-2.5 shadow-sm border border-indigo-100 dark:border-indigo-900/60 flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-lg shrink-0 leading-none mt-0.5">🗓️</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Auto Quét Đỉnh Mới Nhất</h2>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${status.newest.enabled ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    {status.newest.enabled ? '● Mỗi 6h' : '○ Đã tắt'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                  Đếm ngược: <b className="text-indigo-600 dark:text-indigo-400">{fmtCd(status.newest.countdown_sec)}</b> • Cuối: {status.newest.last_run || 'Chưa chạy'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => void toggleNewest()} className={`px-2 py-1 text-[11px] font-bold rounded-lg transition shadow-sm ${status.newest.enabled ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100'}`}>
                {status.newest.enabled ? '⏹ Tắt 6h' : '▶ Bật 6h'}
              </button>
              <button onClick={() => void triggerNewest()} disabled={status.is_executing || isTriggering} className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-lg shadow-sm transition disabled:opacity-50">
                {isTriggering ? '⏳...' : '⚡ Quét Đỉnh'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 rounded-xl px-3 py-2.5 shadow-sm border border-amber-200 dark:border-amber-800/60 flex flex-col justify-between gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-lg shrink-0 leading-none mt-0.5">🕳️</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="text-[11px] font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wide">Auto Fill Lỗ Hổng 500 MST</h2>
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${status.gap_fill_500.enabled ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    {status.gap_fill_500.enabled ? '● Mỗi 12h' : '○ Đã tắt'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 font-mono mt-0.5 truncate">
                  Đếm ngược: <b className="text-amber-700 dark:text-amber-400">{fmtCd(status.gap_fill_500.countdown_sec)}</b> • Cuối: {status.gap_fill_500.last_run || 'Chưa chạy'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => void toggleGapFill()} className={`px-2 py-1 text-[11px] font-bold rounded-lg transition shadow-sm ${status.gap_fill_500.enabled ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200'}`}>
                {status.gap_fill_500.enabled ? '⏹ Tắt 12h' : '▶ Bật 12h'}
              </button>
              <button onClick={() => void triggerGapFill()} disabled={status.is_executing || isTriggering} className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-purple-600 hover:opacity-90 text-white text-[11px] font-bold rounded-lg shadow-sm transition disabled:opacity-50">
                {isTriggering ? '⏳...' : '⚡ Quét 500'}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 pt-0.5 border-t border-amber-200/50 dark:border-amber-800/40">
            <span className="text-[9px] font-bold text-amber-950 dark:text-amber-300 uppercase">Dừng 500:</span>
            <button onClick={() => void setGapFillMode(true)} type="button" className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition border ${status.gap_fill_500.reset_on_existing !== false ? 'bg-amber-600 text-white border-amber-700' : 'bg-white/80 dark:bg-slate-800 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700'}`}>
              Opt 1: Reset khi gặp mã DB
            </button>
            <button onClick={() => void setGapFillMode(false)} type="button" className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition border ${status.gap_fill_500.reset_on_existing === false ? 'bg-purple-600 text-white border-purple-700' : 'bg-white/80 dark:bg-slate-800 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700'}`}>
              Opt 2: Chỉ reset khi mã mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
