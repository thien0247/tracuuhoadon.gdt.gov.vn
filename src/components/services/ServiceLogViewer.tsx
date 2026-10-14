// @id 01M4W0SVCS0000000000000003
// @related 01M4W0SVCS0000000000000001, 01M4W0TYPE0000000000000002
'use client';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { ServiceLogMessage } from '@/types/service';

interface ServiceLogViewerProps {
  logs: ServiceLogMessage[];
  onClear: () => void;
}

const getLevelColor = (level: ServiceLogMessage['level']) => {
  switch (level) {
    case 'error': return 'text-rose-400';
    case 'warn': return 'text-amber-400';
    case 'success': return 'text-emerald-400';
    default: return 'text-slate-300';
  }
};

export default function ServiceLogViewer({ logs, onClear }: ServiceLogViewerProps) {
  const [selectedService, setSelectedService] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const filteredLogs = useMemo(() => {
    if (selectedService === 'ALL') return logs;
    return logs.filter((l) => l.service.toUpperCase().includes(selectedService));
  }, [logs, selectedService]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs.length, autoScroll]);

  const handleCopy = async () => {
    const text = filteredLogs.map((l) => `[${l.timestamp}] [${l.service}] ${l.message}`).join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col h-72">
      <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold font-mono">
          <span className="text-emerald-400">💻</span>
          <span>Live System Console</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
            {filteredLogs.length} dòng
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="bg-slate-800 text-slate-300 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-hidden">
            <option value="ALL">Tất cả dịch vụ</option>
            <option value="SYSTEM">System</option>
            <option value="WEBVIEW">WebView</option>
            <option value="SERVICE">Service</option>
            <option value="PROXY">Proxy</option>
            <option value="API">API Gateway</option>
          </select>

          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
            <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} className="rounded bg-slate-800 border-slate-700 text-blue-500 w-3.5 h-3.5" />
            <span>Tự cuộn</span>
          </label>

          <button onClick={() => void handleCopy()} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition" title="Sao chép nhật ký">
            <span>{copied ? '✅' : '📋'}</span>
          </button>

          <button onClick={onClear} className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition" title="Xóa nhật ký">
            <span>🗑️</span>
          </button>
        </div>
      </div>

      <div ref={logContainerRef} className="flex-1 overflow-y-auto p-3.5 space-y-1 font-mono text-[11px] leading-relaxed selection:bg-blue-600 selection:text-white">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 italic py-8 text-center">Chưa có dữ liệu nhật ký hệ thống...</div>
        ) : (
          filteredLogs.map((item) => (
            <div key={item.id} className="flex items-start gap-2 hover:bg-slate-800/40 px-1.5 py-0.5 rounded transition">
              <span className="text-slate-500 shrink-0 select-none">[{item.timestamp}]</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-sky-400 shrink-0">{item.service}</span>
              <span className={`${getLevelColor(item.level)} break-all whitespace-pre-wrap`}>{item.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
