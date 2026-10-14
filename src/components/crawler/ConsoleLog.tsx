// @id 01M4W0CRWA0000000000000006
// @related 01M4W0H00K0000000000000001, 01M4W0CRWA0000000000000001
'use client';
import React, { useEffect, useRef } from 'react';

interface ConsoleLogProps {
  logs?: string[];
  autoScroll?: boolean;
  onChangeAutoScroll?: (val: boolean) => void;
  onClearLogs?: () => void;
}

const getLogClass = (log: string) => {
  if (log.includes('FOUND')) return 'text-emerald-400 font-semibold';
  if (log.includes('WARNING')) return 'text-amber-300';
  if (log.includes('ERROR')) return 'text-rose-400';
  return 'text-slate-300';
};

export default function ConsoleLog({ logs = [], autoScroll = true, onChangeAutoScroll, onClearLogs }: ConsoleLogProps) {
  const logContainerRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = React.useState(true);

  useEffect(() => {
    if (autoScroll && expanded && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs.length, autoScroll, expanded]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-200 dark:border-slate-700 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 hover:text-indigo-600 transition"
        >
          <span>📋 Nhật Ký Đa Tỉnh Real-time ({logs.length})</span>
          <span className="text-[10px] text-slate-400">{expanded ? '▼ Thu gọn' : '▶ Mở rộng'}</span>
        </button>
        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => onChangeAutoScroll?.(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Tự động cuộn
          </label>
          <button
            onClick={onClearLogs}
            className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 px-2.5 py-0.5 rounded-lg transition-all"
          >
            Xóa Log
          </button>
        </div>
      </div>

      {expanded && (
        <div ref={logContainerRef} className="bg-slate-900 text-slate-100 font-mono text-[11px] p-3 rounded-lg h-44 overflow-y-auto space-y-0.5 shadow-inner">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic">Chưa có dữ liệu log...</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className={getLogClass(log)}>
                {log}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
