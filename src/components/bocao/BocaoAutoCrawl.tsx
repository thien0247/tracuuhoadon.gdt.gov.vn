// @id 01M4W0BCA00000000000000005
// @related 01M4W0APJC0000000000000001, 01M4W0BCA00000000000000001

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ApiClient } from '@/api/client';

interface LogItem { time: string; msg: string; type: string }

interface BocaoAutoCrawlProps {
  onCrawled?: (res: unknown) => void;
}

export const BocaoAutoCrawl: React.FC<BocaoAutoCrawlProps> = ({ onCrawled }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [intervalHours, setIntervalHours] = useState(2);
  const [maxPages, setMaxPages] = useState(5);
  const [crawlingNow, setCrawlingNow] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [lastRunTime, setLastRunTime] = useState('');
  const [nextRunCountdown, setNextRunCountdown] = useState('--:--:--');
  const [logs, setLogs] = useState<LogItem[]>([]);
  const crawlingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsRunning(localStorage.getItem('bocao_auto_running') === 'true');
      setIntervalHours(Number(localStorage.getItem('bocao_auto_interval')) || 2);
      setMaxPages(Number(localStorage.getItem('bocao_auto_pages')) || 5);
      setLastRunTime(localStorage.getItem('bocao_auto_last_run') || '');
      try { setLogs(JSON.parse(localStorage.getItem('bocao_auto_logs') || '[]')); } catch { setLogs([]); }
    }
  }, []);

  const addLog = useCallback((msg: string, type = 'info') => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    setLogs((prev) => {
      const next = [{ time, msg, type }, ...prev].slice(0, 50);
      if (typeof window !== 'undefined') localStorage.setItem('bocao_auto_logs', JSON.stringify(next));
      return next;
    });
  }, []);

  const executeCrawl = useCallback(async (isManual = false) => {
    if (crawlingRef.current) return;
    crawlingRef.current = true;
    setCrawlingNow(true);
    addLog(`Bắt đầu ${isManual ? 'cào thủ công' : 'tự động cào'} ${maxPages} trang...`, 'info');
    try {
      const res = await ApiClient.crawlAllBocao(maxPages) as { success?: boolean; pages_crawled?: number; total_found?: number; new_inserted?: number; error?: string };
      if (res.success) {
        addLog(`Thành công: Cào ${res.pages_crawled} trang, ${res.total_found} tin (Mới: ${res.new_inserted}).`, 'success');
        onCrawled?.(res);
      } else {
        addLog(`Thất bại: ${res.error || 'Không rõ nguyên nhân'}`, 'error');
      }
    } catch (e: unknown) {
      addLog(`Lỗi kết nối: ${(e as Error).message || String(e)}`, 'error');
    } finally {
      crawlingRef.current = false;
      setCrawlingNow(false);
      const nowStr = new Date().toLocaleString('vi-VN');
      setLastRunTime(nowStr);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bocao_auto_last_run', nowStr);
        localStorage.setItem('bocao_auto_next_ts', String(Date.now() + intervalHours * 3600 * 1000));
      }
    }
  }, [maxPages, intervalHours, addLog, onCrawled]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isRunning) { setNextRunCountdown('--:--:--'); return; }
      const nextTs = Number(localStorage.getItem('bocao_auto_next_ts') || '0');
      const now = Date.now();
      if (!nextTs || nextTs <= now) { executeCrawl(false); return; }
      const diffSec = Math.max(0, Math.floor((nextTs - now) / 1000));
      const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
      const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
      const s = String(diffSec % 60).padStart(2, '0');
      setNextRunCountdown(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, executeCrawl]);

  const toggleAutoCrawl = () => {
    const next = !isRunning;
    setIsRunning(next);
    localStorage.setItem('bocao_auto_running', String(next));
    if (next) {
      localStorage.setItem('bocao_auto_next_ts', String(Date.now() + intervalHours * 3600 * 1000));
      addLog(`Đã kích hoạt Auto Crawl mỗi ${intervalHours}h (${maxPages} trang/lần).`, 'info');
    } else {
      addLog('Đã tạm dừng Auto Crawl.', 'warning');
    }
  };

  const onIntervalChange = (val: number) => {
    setIntervalHours(val);
    localStorage.setItem('bocao_auto_interval', String(val));
    if (isRunning) {
      localStorage.setItem('bocao_auto_next_ts', String(Date.now() + val * 3600 * 1000));
      addLog(`Đổi chu kỳ Auto Crawl thành mỗi ${val}h.`, 'info');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">⏰</span>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Tự Động Cào Bố Cáo Định Kỳ</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${isRunning ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200'}`}>
                {isRunning ? (crawlingNow ? '⏳ Đang cào dữ liệu...' : '● Đang chạy') : '○ Đã tạm dừng'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Lập lịch tự động cào tin mới từ Cổng Bố cáo Quốc gia</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={toggleAutoCrawl} className={`text-xs font-bold py-1.5 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5 ${isRunning ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
            <span>{isRunning ? '⏹ Tắt Auto' : '▶ Bật Auto Crawl'}</span>
          </button>
          <button onClick={() => executeCrawl(true)} disabled={crawlingNow} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1">
            <span>{crawlingNow ? '⏳' : '⚡'} Cào Ngay</span>
          </button>
          <button onClick={() => setShowLogs(!showLogs)} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-600 transition">
            📋 Nhật ký ({logs.length})
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-300 font-medium">Chu kỳ:</span>
          <select value={intervalHours} onChange={(e) => onIntervalChange(Number(e.target.value))} disabled={crawlingNow} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-400">
            <option value={0.5}>30 phút</option><option value={1}>1 giờ</option><option value={2}>2 giờ</option><option value={4}>4 giờ</option><option value={6}>6 giờ</option><option value={12}>12 giờ</option>
          </select>
        </div>
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-slate-600 dark:text-slate-300 font-medium">Số trang:</span>
          <select value={maxPages} onChange={(e) => { const v = Number(e.target.value); setMaxPages(v); localStorage.setItem('bocao_auto_pages', String(v)); }} disabled={crawlingNow} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200">
            <option value={3}>3 trang</option><option value={5}>5 trang</option><option value={10}>10 trang</option><option value={20}>20 trang</option>
          </select>
        </div>
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Lần cào kế tiếp</div>
          <div className={`text-sm font-black font-mono ${isRunning ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>{isRunning ? nextRunCountdown : 'Chưa kích hoạt'}</div>
        </div>
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Lần cào gần nhất</div>
          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono truncate">{lastRunTime || 'Chưa có lượt chạy'}</div>
        </div>
      </div>
      {showLogs && (
        <div className="bg-slate-900 rounded-xl p-3 text-xs text-slate-200 space-y-2 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[11px] text-slate-400">
            <span className="font-bold">Nhật ký hoạt động Auto Crawl</span>
            <button onClick={() => { setLogs([]); localStorage.removeItem('bocao_auto_logs'); }} className="text-rose-400 hover:text-rose-300 transition">🧹 Xóa nhật ký</button>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px]">
            {logs.length === 0 ? <div className="text-slate-500 italic py-2 text-center">Chưa có lịch sử chạy.</div> : logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-slate-500 shrink-0">[{log.time}]</span>
                <span className={log.type === 'success' ? 'text-emerald-400' : log.type === 'error' ? 'text-rose-400' : log.type === 'warning' ? 'text-amber-400' : 'text-sky-300'}>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
