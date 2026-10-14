// @id 01M4W0BCA00000000000000005
// @related 01M4W0APJC0000000000000001, 01M4W0BCA00000000000000001

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/api/client';

interface LogItem { time: string; msg: string; type: string }

interface BocaoSchedState {
  enabled: boolean;
  running: boolean;
  interval_hours: number;
  max_pages: number;
  auto_reconcile: boolean;
  last_run: string;
  countdown_sec: number;
  logs: LogItem[];
}

interface BocaoAutoCrawlProps {
  onCrawled?: (res: unknown) => void;
}

const fmtCd = (sec: number) => {
  if (!sec || sec <= 0) return '--:--:--';
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export const BocaoAutoCrawl: React.FC<BocaoAutoCrawlProps> = ({ onCrawled }) => {
  const [sched, setSched] = useState<BocaoSchedState>({
    enabled: true, running: false, interval_hours: 2, max_pages: 5,
    auto_reconcile: true, last_run: '', countdown_sec: 0, logs: []
  });
  const [showLogs, setShowLogs] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await ApiClient.getScheduleStatus();
      if (res?.bocao) setSched(res.bocao as BocaoSchedState);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const tick = setInterval(() => {
      setSched((prev) => ({ ...prev, countdown_sec: Math.max(0, prev.countdown_sec - 1) }));
    }, 1000);
    const sync = setInterval(() => { void fetchStatus(); }, 8000);
    return () => { clearInterval(tick); clearInterval(sync); };
  }, [fetchStatus]);

  const updateConfig = async (patch: Record<string, unknown>) => {
    try {
      const res = await ApiClient.configureScheduleBocao(patch);
      if (res) setSched(res as BocaoSchedState);
    } catch { /* ignore */ }
  };

  const triggerManual = async () => {
    if (sched.running) return;
    setSched((prev) => ({ ...prev, running: true }));
    try {
      await ApiClient.triggerScheduleBocao();
      setTimeout(() => { void fetchStatus(); onCrawled?.({}); }, 2500);
    } catch {
      setSched((prev) => ({ ...prev, running: false }));
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">⏰</span>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
              <span>Tự Động Cào Bố Cáo & Đồng Bộ Thuế 24/7 (Server Service)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sched.enabled ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200'}`}>
                {sched.running ? '⏳ Đang cào & đồng bộ...' : (sched.enabled ? `● Chạy ngầm mỗi ${sched.interval_hours}h` : '○ Đã tạm dừng')}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Vận hành bền vững trên Windows Service 24/7 (không cần mở trình duyệt), tự động nạp MST mới sang CSDL Thuế
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => void updateConfig({ enabled: !sched.enabled })} className={`text-xs font-bold py-1.5 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5 ${sched.enabled ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
            <span>{sched.enabled ? '⏹ Tắt Auto' : '▶ Bật Auto 24/7'}</span>
          </button>
          <button onClick={() => void triggerManual()} disabled={sched.running} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1">
            <span>{sched.running ? '⏳' : '⚡'} Cào & Đồng Bộ Ngay</span>
          </button>
          <button onClick={() => setShowLogs(!showLogs)} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-600 transition">
            📋 Nhật ký ({sched.logs?.length || 0})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1 text-xs">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-300 font-medium">Chu kỳ:</span>
          <select value={sched.interval_hours} onChange={(e) => void updateConfig({ interval_hours: Number(e.target.value) })} disabled={sched.running} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-400">
            <option value={0.5}>30 phút</option><option value={1}>1 giờ</option><option value={2}>2 giờ</option><option value={4}>4 giờ</option><option value={6}>6 giờ</option><option value={12}>12 giờ</option>
          </select>
        </div>
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-300 font-medium">Số trang:</span>
          <select value={sched.max_pages} onChange={(e) => void updateConfig({ max_pages: Number(e.target.value) })} disabled={sched.running} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200">
            <option value={3}>3 trang</option><option value={5}>5 trang</option><option value={10}>10 trang</option><option value={20}>20 trang</option>
          </select>
        </div>
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-300 font-medium">Nạp Thuế:</span>
          <button type="button" onClick={() => void updateConfig({ auto_reconcile: !sched.auto_reconcile })} className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${sched.auto_reconcile ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {sched.auto_reconcile ? '✓ Tự động' : 'Tắt'}
          </button>
        </div>
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Lần cào kế tiếp</div>
          <div className={`text-sm font-black font-mono ${sched.enabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{sched.enabled ? fmtCd(sched.countdown_sec) : 'Chưa kích hoạt'}</div>
        </div>
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Lần cào gần nhất</div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono truncate">{sched.last_run || 'Chưa có lượt chạy'}</div>
        </div>
      </div>

      {showLogs && (
        <div className="bg-slate-900 rounded-xl p-3 text-xs text-slate-200 space-y-2 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[11px] text-slate-400">
            <span className="font-bold">Nhật ký Auto Crawl Bố Cáo (Server 24/7)</span>
            <button onClick={() => void updateConfig({ clear_logs: true })} className="text-rose-400 hover:text-rose-300 transition">🧹 Xóa nhật ký</button>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px]">
            {!sched.logs || sched.logs.length === 0 ? <div className="text-slate-500 italic py-2 text-center">Chưa có lịch sử chạy.</div> : sched.logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-slate-500 shrink-0">[{log.time}]</span>
                <span className={log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-rose-400' : 'text-sky-300'}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
