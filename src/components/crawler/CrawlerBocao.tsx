// @id 01M4W0CRWA0000000000000005
// @related 01M4W0APJC0000000000000001, 01M4W0CRWA0000000000000001
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ApiClient } from '@/api/client';

interface CrawlerBocaoProps {
  visible: boolean;
  onClose: () => void;
  onSyncComplete: () => void;
}

export default function CrawlerBocao({ visible, onClose, onSyncComplete }: CrawlerBocaoProps) {
  const [stats, setStats] = useState<{ total_bocao?: number; matched_count?: number; unmatched_count?: number; retry_later_count?: number; match_rate?: number }>({});
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'direct' | 'gap_fill'>('direct');
  const [batchSize, setBatchSize] = useState(60);
  const [gap, setGap] = useState(20);
  const [maxConcurrent, setMaxConcurrent] = useState(2);
  const [logs, setLogs] = useState<Array<{ t: string; msg: string; type: string }>>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addLog = useCallback((msg: string, type = 'info') => {
    const t = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    setLogs((prev) => [{ t, msg, type }, ...prev.slice(0, 24)]);
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await ApiClient.getBocaoReconcileStats();
      if (res) setStats(res);
    } catch (e: unknown) {
      addLog('Không thể tải thống kê: ' + String(e), 'error');
    }
  }, [addLog]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => {
    if (visible) void loadStats();
    else stopPoll();
    return () => stopPoll();
  }, [visible, loadStats, stopPoll]);

  if (!visible) return null;

  const startScan = async () => {
    if (scanning) return;
    setScanning(true);
    if (scanMode === 'direct') {
      addLog(`⚡ Bắt đầu quét trực tiếp ${batchSize} MST từ Bố Cáo...`, 'info');
      try {
        const res = (await ApiClient.syncMissingBocao(batchSize)) as { message?: string; synced_now?: number; retry_later?: number };
        addLog(res.message || `Quét xong: nạp mới ${res.synced_now || 0}, hẹn lại ${res.retry_later || 0}`, 'success');
        await loadStats();
        onSyncComplete();
      } catch (e: unknown) {
        addLog('❌ Lỗi: ' + String(e), 'error');
      } finally { setScanning(false); }
    } else {
      addLog(`🚀 Bắt đầu Gap-Fill (gap=${gap}, song song=${maxConcurrent} tỉnh)...`, 'info');
      try {
        const res = (await ApiClient.startBocaoGapFillScan({ gap, max_concurrent: maxConcurrent })) as { status?: string; queued?: number };
        if (res.status === 'nothing_to_scan') {
          addLog('ℹ️ Toàn bộ MST Bố Cáo đã có trong Thuế.', 'info');
          setScanning(false);
        } else {
          addLog(`⚡ Đã xếp ${res.queued} tỉnh vào Rolling Queue Pool.`, 'success');
          pollRef.current = setInterval(async () => {
            try {
              const q = await (await fetch('/api/crawler/queue_status')).json();
              if (!q.is_running && q.pending_count === 0) {
                stopPoll();
                setScanning(false);
                addLog('✅ Hàng đợi quét đã hoàn thành.', 'success');
                await loadStats();
                onSyncComplete();
              }
            } catch { /* ignore */ }
          }, 3000);
        }
      } catch (e: unknown) {
        addLog('❌ Lỗi: ' + String(e), 'error');
        setScanning(false);
      }
    }
  };

  const stopScan = async () => {
    stopPoll();
    try { await ApiClient.stopAllCrawlers(); } catch { /* ignore */ }
    setScanning(false);
    addLog('⏹ Đã gửi lệnh dừng tiến trình.', 'warning');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-lg w-full p-4 sm:p-5 space-y-3.5 text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📰</span>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Quét Bổ Sung Theo Bố Cáo ĐKKD</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tra cứu Mã Số Doanh Nghiệp công bố mới nhưng chưa có trong CSDL Thuế</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-lg w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700"><div className="text-[10px] uppercase font-bold text-slate-400">Tổng Bố Cáo</div><div className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-mono">{stats.total_bocao || 0}</div></div>
          <div className="bg-blue-50 dark:bg-blue-950/40 p-2 rounded-xl border border-blue-200 dark:border-blue-900"><div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Chờ Quét Bù</div><div className="text-base font-extrabold text-blue-700 dark:text-blue-300 font-mono">{(stats.retry_later_count || 0) + (stats.unmatched_count || 0)}</div></div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200 dark:border-emerald-900"><div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Tỷ Lệ Đã Có</div><div className="text-base font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">{stats.match_rate || 0}%</div></div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">Chế Độ Quét</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button type="button" onClick={() => setScanMode('direct')} disabled={scanning} className={`p-2 rounded-xl border text-left transition flex flex-col gap-0.5 ${scanMode === 'direct' ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <span className="font-bold">🎯 Quét Trực Tiếp MST</span><span className="text-[10px] text-slate-500">Tra cứu danh sách cụ thể từng MST</span>
            </button>
            <button type="button" onClick={() => setScanMode('gap_fill')} disabled={scanning} className={`p-2 rounded-xl border text-left transition flex flex-col gap-0.5 ${scanMode === 'gap_fill' ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-semibold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <span className="font-bold">🔄 Quét Cuốn Chiếu</span><span className="text-[10px] text-slate-500">Rolling Queue Pool đa tỉnh thành</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          {scanMode === 'direct' ? (
            <>
              <span className="text-slate-600 dark:text-slate-300 font-medium">Số MST quét:</span>
              <input type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} min={10} max={200} step={10} disabled={scanning} className="w-16 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-center font-bold font-mono" />
              <span className="text-[10px] text-slate-400">(Tối đa 200 MST/lần)</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1"><span className="text-slate-600 dark:text-slate-300">Gap:</span><input type="number" value={gap} onChange={(e) => setGap(Number(e.target.value))} min={5} max={100} disabled={scanning} className="w-14 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-1 py-1 text-center font-bold font-mono" /></div>
              <div className="flex items-center gap-1 ml-auto"><span className="text-slate-600 dark:text-slate-300">Song song:</span><select value={maxConcurrent} onChange={(e) => setMaxConcurrent(Number(e.target.value))} disabled={scanning} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-indigo-600"><option value={1}>1 tỉnh</option><option value={2}>2 tỉnh</option><option value={3}>3 tỉnh</option></select></div>
            </>
          )}
        </div>

        {logs.length > 0 && (
          <div className="bg-slate-900 rounded-xl p-2.5 text-[10px] font-mono text-slate-300 max-h-24 overflow-y-auto space-y-1">
            {logs.map((l, idx) => (
              <div key={idx} className="flex gap-1.5 leading-tight">
                <span className="text-slate-500 shrink-0">[{l.t}]</span>
                <span className={l.type === 'error' ? 'text-rose-400' : l.type === 'success' ? 'text-emerald-400' : l.type === 'warning' ? 'text-amber-400' : 'text-slate-200'}>{l.msg}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
          <button onClick={onClose} className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold transition">Đóng</button>
          {!scanning ? (
            <button onClick={() => void startScan()} className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"><span>⚡ Bắt Đầu Quét</span></button>
          ) : (
            <button onClick={() => void stopScan()} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"><span className="animate-spin">⏳</span><span>Dừng Quét</span></button>
          )}
        </div>
      </div>
    </div>
  );
}
