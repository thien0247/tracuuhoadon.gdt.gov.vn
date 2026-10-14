// @id 01M4W0SVCS0000000000000002
// @related 01M4W0SVCS0000000000000001, 01M4W0TYPE0000000000000002
'use client';
import React from 'react';
import type { SystemDiagnosticsResponse } from '@/types/service';

interface ServiceDiagnosticsModalProps {
  show: boolean;
  diagnostics: SystemDiagnosticsResponse | null;
  loading: boolean;
  onClose: () => void;
  onAutoHeal: () => void;
  onRefresh: () => void;
}

const getStatusBadge = (status: string) => {
  if (status === 'healthy') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (status === 'warning') return 'bg-amber-100 text-amber-800 border-amber-300';
  return 'bg-rose-100 text-rose-800 border-rose-300';
};

export default function ServiceDiagnosticsModal({
  show, diagnostics, loading, onClose, onAutoHeal, onRefresh
}: ServiceDiagnosticsModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🩺</span>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Chẩn Đoán & Tự Sửa Lỗi Hệ Thống</h3>
              <p className="text-xs text-slate-500">Phát hiện xung đột port, đo độ trễ CSDL và tự giải phóng tiến trình treo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 text-lg leading-none cursor-pointer">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading && !diagnostics && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-medium">Đang kiểm tra toàn diện các dịch vụ & cổng kết nối...</span>
            </div>
          )}

          {diagnostics && (
            <div className="space-y-4">
              <div className={`p-3 rounded-lg border flex items-center justify-between ${diagnostics.healthy ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{diagnostics.healthy ? '✅' : '⚠️'}</span>
                  <span className="text-xs font-semibold">
                    {diagnostics.healthy ? 'Hệ thống vận hành tối ưu' : 'Phát hiện một số cảnh báo cần lưu ý'} (RAM: {diagnostics.memoryUsageMb} MB)
                  </span>
                </div>
                <span className="text-[11px] opacity-75 font-mono">{diagnostics.systemTime}</span>
              </div>

              <div className="space-y-2">
                {diagnostics.diagnostics.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start justify-between">
                    <div className="space-y-0.5 max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.name}</span>
                        {item.latencyMs !== undefined && (
                          <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded font-mono">{item.latencyMs} ms</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{item.value}</p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold ${getStatusBadge(item.status)}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button onClick={onRefresh} disabled={loading} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 disabled:opacity-50 cursor-pointer">
            🔄 Quét Lại
          </button>
          <div className="flex items-center space-x-2">
            <button onClick={onAutoHeal} disabled={loading} className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer">
              <span>⚡ Tự Động Khắc Phục</span>
            </button>
            <button onClick={onClose} className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg cursor-pointer">
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
