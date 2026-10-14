// @id 01M4W0BCA00000000000000003
// @related 01M4W0APJC0000000000000001, 01M4W0BCA00000000000000002

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ApiClient } from '@/api/client';

interface ScanResult { status?: string; total_provinces?: number; max_concurrent?: number; gap?: number; queued?: number }
interface QueueStatus { is_running?: boolean; pending_count?: number }

interface BocaoScanPanelProps {
  onScanDone?: () => void;
}

export const BocaoScanPanel: React.FC<BocaoScanPanelProps> = ({ onScanDone }) => {
  const [scanning, setScanning] = useState(false);
  const [gap, setGap] = useState(20);
  const [workers, setWorkers] = useState(1);
  const [maxConcurrent, setMaxConcurrent] = useState(2);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [logs, setLogs] = useState<Array<{ t: string; msg: string; type: string }>>([]);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((msg: string, type = 'info') => {
    const t = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    setLogs((prev) => [{ t, msg, type }, ...prev].slice(0, 30));
  }, []);

  const stopPoll = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPoll(), [stopPoll]);

  const pollQueue = useCallback(async () => {
    try {
      const s = await (await fetch('/api/crawler/queue_status')).json() as QueueStatus;
      setQueueStatus(s);
      if (!s.is_running && (s.pending_count ?? 0) === 0) {
        stopPoll();
        setScanning(false);
        addLog('✅ Hàng đợi quét đã hoàn thành.', 'success');
        onScanDone?.();
      }
    } catch { /* ignore */ }
  }, [stopPoll, addLog, onScanDone]);

  const startScan = async () => {
    if (scanning) return;
    setScanning(true);
    setResult(null);
    addLog(`Đang khởi động Gap-Fill Scan (gap=${gap}, workers=${workers}, concurrent=${maxConcurrent})...`);
    try {
      const res = await ApiClient.startBocaoGapFillScan({
        gap, num_workers: workers, max_concurrent: maxConcurrent
      }) as ScanResult;
      setResult(res);
      if (res.status === 'nothing_to_scan') {
        addLog('ℹ️ Không có MST Bố Cáo nào cần quét bổ sung.', 'info');
        setScanning(false);
      } else {
        addLog(`⚡ Đã xếp hàng ${res.queued} tỉnh vào Rolling Queue.`, 'success');
        pollTimerRef.current = setInterval(pollQueue, 3000);
      }
    } catch (e: unknown) {
      addLog(`❌ Lỗi khởi động scan: ${(e as Error).message || String(e)}`, 'error');
      setScanning(false);
    }
  };

  const stopScan = async () => {
    stopPoll();
    try { await ApiClient.stopAllCrawlers(); } catch { /* ignore */ }
    setScanning(false);
    addLog('⏹ Đã yêu cầu dừng tất cả crawler.', 'warning');
  };

  return (
    <div className="bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-200 dark:border-indigo-800/60 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-100 dark:border-indigo-800/40 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <div>
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">Quét Bổ Sung MST Vào Thuế GDT</h3>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400">Dùng Gap-Fill Scan để tra từng MST Bố Cáo chưa có trong tax_records</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!scanning ? (
            <button onClick={startScan} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-sm transition flex items-center gap-1.5">
              <span>⚡</span><span>Bắt Đầu Quét Bổ Sung</span>
            </button>
          ) : (
            <button onClick={stopScan} className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-sm transition flex items-center gap-1.5">
              <span className="animate-spin">⏳</span><span>Đang Quét — Dừng</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 text-xs">
        <div>
          <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5 uppercase">Gap (MST/lần)</label>
          <input type="number" value={gap} onChange={(e) => setGap(Number(e.target.value))} min={5} max={200} disabled={scanning} className="w-20 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100 disabled:opacity-50" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5 uppercase">Workers/Tỉnh</label>
          <select value={workers} onChange={(e) => setWorkers(Number(e.target.value))} disabled={scanning} className="w-20 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100 disabled:opacity-50">
            <option value={1}>1</option><option value={2}>2</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5 uppercase">Tỉnh Song Song</label>
          <select value={maxConcurrent} onChange={(e) => setMaxConcurrent(Number(e.target.value))} disabled={scanning} className="w-20 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100 disabled:opacity-50">
            <option value={1}>1</option><option value={2}>2 ★</option><option value={3}>3</option>
          </select>
        </div>
        {queueStatus && (
          <div className="ml-auto flex items-center gap-2 text-[11px]">
            <span className={`px-2 py-0.5 rounded-full font-bold ${queueStatus.is_running ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              {queueStatus.is_running ? '🟢 Đang Quét' : '⚪ Idle'}
            </span>
            <span className="text-slate-500 dark:text-slate-400">Hàng đợi: <b>{queueStatus.pending_count || 0}</b> tỉnh</span>
          </div>
        )}
      </div>

      {result && (
        <div className={`p-2.5 rounded-xl text-xs font-medium ${result.status === 'scan_queued' ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
          {result.status === 'scan_queued' ? (
            <span>✅ Đã xếp hàng <b>{result.total_provinces}</b> tỉnh có MST chưa khớp vào Rolling Queue (max <b>{result.max_concurrent}</b> tỉnh song song, gap=<b>{result.gap}</b>).</span>
          ) : (
            <span>ℹ️ Không có MST Bố Cáo nào cần quét bổ sung.</span>
          )}
        </div>
      )}

      {logs.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Nhật Ký Hoạt Động</span>
            <button onClick={() => setLogs([])} className="text-[10px] text-slate-400 hover:text-red-500 transition">Xóa</button>
          </div>
          <div className="max-h-28 overflow-y-auto space-y-0.5">
            {logs.map((l, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px]">
                <span className="text-slate-400 font-mono shrink-0">{l.t}</span>
                <span className={l.type === 'error' ? 'text-red-600 dark:text-red-400' : l.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : l.type === 'warning' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
