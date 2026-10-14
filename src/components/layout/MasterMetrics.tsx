// @id 01M4W0AYT00000000000000004
// @related 01M4W0TYPE0000000000000001, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
import React from 'react';
import type { MasterMetrics as MasterMetricsType } from '@/types';

interface MasterMetricsProps {
  master: MasterMetricsType;
  maxRps: number;
  onChangeRps: (delta: number) => void;
  onUpdateRps: (val: number) => void;
}

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

export default function MasterMetrics({ master, maxRps, onChangeRps, onUpdateRps }: MasterMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      <div className="card-glass px-2.5 py-2 rounded-xl border border-[var(--border-color)] flex flex-col justify-between col-span-2 md:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Tốc Độ Quét</span>
          <span className="text-[9px] font-bold text-[var(--vnpt-blue)] bg-blue-50 dark:bg-blue-950 px-1.5 py-0.2 rounded">Max: {maxRps} rps</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <div className="text-base sm:text-lg font-extrabold text-[var(--vnpt-blue)] font-mono tabular-nums leading-tight">
            {master.total_speed || 0} <span className="text-[10px] font-normal text-[var(--text-muted)]">req/s</span>
          </div>
          <div className="flex items-center bg-[var(--bg-secondary)] rounded-lg p-0.5 border border-[var(--border-color)]">
            <button onClick={() => onChangeRps(-2)} className="w-5 h-5 flex items-center justify-center font-bold hover:bg-[var(--bg-card)] rounded text-xs">-</button>
            <input
              type="number"
              value={maxRps}
              onChange={(e) => onUpdateRps(Number(e.target.value))}
              className="w-8 text-center text-xs font-bold font-mono bg-transparent border-0 p-0 text-[var(--text-primary)] focus:ring-0"
            />
            <button onClick={() => onChangeRps(2)} className="w-5 h-5 flex items-center justify-center font-bold hover:bg-[var(--bg-card)] rounded text-xs">+</button>
          </div>
        </div>
      </div>
      <div className="card-glass px-2.5 py-2 rounded-xl border border-[var(--border-color)] flex flex-col justify-between">
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Đang Chạy</span>
        <div className="text-base sm:text-lg font-extrabold text-emerald-600 mt-0.5 font-mono tabular-nums leading-tight">
          {master.running_count || 0} <span className="text-[10px] font-normal text-[var(--text-muted)]">tỉnh</span>
        </div>
      </div>
      <div className="card-glass px-2.5 py-2 rounded-xl border border-[var(--border-color)] flex flex-col justify-between">
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Tổng Đã Quét</span>
        <div className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] mt-0.5 font-mono tabular-nums truncate leading-tight">{formatNumber(master.total_queried)}</div>
      </div>
      <div className="card-glass px-2.5 py-2 rounded-xl border border-[var(--border-color)] flex flex-col justify-between">
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Tổng Tìm Thấy</span>
        <div className="text-base sm:text-lg font-extrabold text-emerald-600 mt-0.5 font-mono tabular-nums truncate leading-tight">{formatNumber(master.total_found)}</div>
      </div>
      <div className="card-glass px-2.5 py-2 rounded-xl border border-[var(--border-color)] flex flex-col justify-between">
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Dữ Liệu DB</span>
        <div className="text-base sm:text-lg font-extrabold text-purple-600 mt-0.5 font-mono tabular-nums truncate leading-tight">{formatNumber(master.total_db_records)}</div>
      </div>
    </div>
  );
}
