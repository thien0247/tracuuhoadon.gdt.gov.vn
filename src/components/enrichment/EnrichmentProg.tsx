// @id 01M4W0ENRC0000000000000002
// @related 01M4W0ENRC0000000000000001, 01M4W0TYPE0000000000000001
'use client';
import React from 'react';
import type { EnrichmentJob } from '@/types';

interface EnrichmentProgProps {
  job: EnrichmentJob;
  onStop: (prefix: string) => void;
}

const formatTime = (secs: number) => {
  if (!secs || isNaN(secs) || secs <= 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

export default function EnrichmentProg({ job, onStop }: EnrichmentProgProps) {
  return (
    <div className="card-glass rounded-2xl border-2 border-indigo-500/30 p-4 shadow-lg bg-gradient-to-br from-[var(--bg-card)] to-indigo-500/5 space-y-3.5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            {job.isRunning && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${job.isRunning ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
          </span>
          <div>
            <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-1.5">
              <span>Đồng Bộ Trực Tuyến API:</span>
              <span className="text-indigo-600 dark:text-indigo-400">{job.provinceName} ({job.prefix})</span>
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] truncate max-w-md font-mono mt-0.5">{job.lastMessage || 'Đang xử lý...'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${job.isRunning ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300' : 'bg-slate-100 text-slate-700'}`}>
            {job.isRunning ? 'Đang chạy' : 'Đã dừng'}
          </span>
          {job.isRunning && (
            <button onClick={() => onStop(job.prefix)} className="py-1 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1">
              <span>⏹</span><span>Dừng Đồng Bộ</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-[var(--text-secondary)]">
          <span>Tiến độ hoàn thành: <span className="text-indigo-600 font-mono">{job.progressPercent}%</span></span>
          <span className="font-mono tabular-nums">{formatNumber(job.processedCount)} / {formatNumber(job.totalToProcess)} MST</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-300 shadow-sm" style={{ width: `${Math.max(1, job.progressPercent)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
        <div className="bg-[var(--bg-primary)]/80 p-2.5 rounded-xl border border-emerald-500/30">
          <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Thành Công (API Tồn Tại)</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-emerald-600 font-mono tabular-nums">{formatNumber(job.successCount)}</span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 font-mono">{job.successRate}%</span>
          </div>
        </div>
        <div className="bg-[var(--bg-primary)]/80 p-2.5 rounded-xl border border-rose-500/30">
          <div className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">Thất Bại / Không Tìm Thấy</div>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-xl font-extrabold text-rose-600 font-mono tabular-nums">{formatNumber(job.failedCount)}</span>
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 font-mono">{job.failureRate}%</span>
          </div>
        </div>
        <div className="bg-[var(--bg-primary)]/80 p-2.5 rounded-xl border border-indigo-500/30">
          <div className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Thời Gian Đã Chạy</div>
          <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums mt-1">{formatTime(job.elapsedSeconds)}</div>
        </div>
        <div className="bg-[var(--bg-primary)]/80 p-2.5 rounded-xl border border-sky-500/30">
          <div className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">Ước Tính Còn Lại (ETA)</div>
          <div className="text-xl font-extrabold text-sky-600 dark:text-sky-400 font-mono tabular-nums mt-1">{formatTime(job.estimatedSecondsRemaining)}</div>
        </div>
      </div>
    </div>
  );
}
