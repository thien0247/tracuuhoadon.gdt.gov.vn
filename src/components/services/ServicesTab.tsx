// @id 01M4W0SVCS0000000000000001
// @related 01M4W0H00K0000000000000005, 01M4W0SVCS0000000000000002, 01M4W0SVCS0000000000000003, 01M4W0SVCS0000000000000004
'use client';
import React, { useState } from 'react';
import { useServiceManager } from '@/hooks/useServiceManager';
import ServiceLogViewer from './ServiceLogViewer';
import ServiceParamModal, { type ModalServiceItem } from './ServiceParamModal';
import ServiceDiagnosticsModal from './ServiceDiagnosticsModal';
import type { ManagedService } from '@/types/service';

const getIcon = (id: string) => ({ gdt_windows_service: '⚙️', fastify_web: '🌐', python_worker: '🤖', postgresql_db: '🐘', crawler_scheduler: '⏰' }[id] || '📦');
const isServiceActive = (svc: ManagedService) => ['running', 'online', 'connected'].includes(svc.status);
const getStatusBadge = (status: string) => ({
  running: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  online: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  connected: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  stopped: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  offline: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  disconnected: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  error: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  starting: 'bg-amber-100 text-amber-700'
}[status] || 'bg-amber-100 text-amber-700');

const hasAction = (svc: ManagedService, act: string) => svc.supportedActions?.includes(act) ?? ['start', 'stop', 'restart'].includes(act);

export default function ServicesTab() {
  const {
    services, logs, isNative, runningCount, totalCount, actionLoading, notice, setNotice, lastSyncedAt,
    diagnostics, diagLoading, fetchDiagnostics, triggerAutoHeal,
    startService, stopService, restartService, startAll, stopAll, openUrl, clearLogs,
    executeApiAction, refreshServices
  } = useServiceManager();

  const [showModal, setShowModal] = useState(false);
  const [showDiagModal, setShowDiagModal] = useState(false);
  const [activeParamSvc, setActiveParamSvc] = useState<ModalServiceItem | null>(null);

  const openDiagModal = async () => {
    setShowDiagModal(true);
    await fetchDiagnostics();
  };

  const openParamModal = (svc: ManagedService) => {
    setActiveParamSvc(svc as unknown as ModalServiceItem);
    setShowModal(true);
  };

  const handleParamSubmit = async (action: string, params: Record<string, unknown>) => {
    if (!activeParamSvc) return;
    const id = activeParamSvc.id;
    setShowModal(false);
    if (action === 'start') await startService(id, params);
    else if (action === 'restart') await restartService(id, params);
    else await executeApiAction(id, action, params);
  };

  return (
    <div className="space-y-4">
      <div className="bg-[var(--bg-card)] rounded-2xl p-4 shadow-xs border border-[var(--border-color)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛠️</span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">Trung Tâm Điều Khiển Dịch Vụ</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${isNative ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isNative ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              {isNative ? 'C# WebView2 Native IPC' : 'Web Fallback Mode'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Giám sát và điều phối Start, Stop, Reset 5 tiến trình cốt lõi hệ thống</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đồng bộ: {lastSyncedAt}</span>
          </span>
          <button onClick={() => void openDiagModal()} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition flex items-center gap-1 cursor-pointer"><span>🩺</span><span>Chẩn Đoán</span></button>
          <button onClick={() => void refreshServices()} disabled={actionLoading} className="px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-xs font-bold rounded-xl transition flex items-center gap-1 border border-[var(--border-color)]"><span>↻</span><span>Làm Mới</span></button>
          <button onClick={startAll} disabled={actionLoading} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1"><span>▶</span><span>Bật Hết</span></button>
          <button onClick={stopAll} disabled={actionLoading} className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1"><span>⏹</span><span>Tắt Hết</span></button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card-glass p-3 rounded-xl border border-[var(--border-color)] flex items-center justify-between"><span className="text-xs font-semibold text-[var(--text-muted)]">Tổng Dịch Vụ</span><span className="text-lg font-black text-[var(--text-primary)] font-mono">{totalCount}</span></div>
        <div className="card-glass p-3 rounded-xl border border-[var(--border-color)] flex items-center justify-between"><span className="text-xs font-semibold text-emerald-600">Đang Chạy (Online)</span><span className="text-lg font-black text-emerald-600 font-mono">{runningCount}</span></div>
        <div className="card-glass p-3 rounded-xl border border-[var(--border-color)] flex items-center justify-between"><span className="text-xs font-semibold text-rose-600">Đã Dừng (Offline)</span><span className="text-lg font-black text-rose-600 font-mono">{totalCount - runningCount}</span></div>
        <div className="card-glass p-3 rounded-xl border border-[var(--border-color)] flex items-center justify-between"><span className="text-xs font-semibold text-purple-600">Chế Độ Kết Nối</span><span className={`text-xs font-bold ${isNative ? 'text-emerald-500' : 'text-blue-500'}`}>{isNative ? 'IPC NATIVE' : 'HTTP REST'}</span></div>
      </div>

      {notice && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between transition ${notice.isError ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
          <span>{notice.text}</span><button onClick={() => setNotice(null)}>✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((svc) => (
          <div key={svc.id} className="card-glass p-4 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between space-y-3 hover:shadow-md transition">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><span className="text-xl">{getIcon(svc.id)}</span><h3 className="text-xs font-bold text-[var(--text-primary)]">{svc.name}</h3></div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono ${getStatusBadge(svc.status)}`}>{svc.status.toUpperCase()}</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">{svc.description}</p>
              <div className="mt-2.5 pt-2 border-t border-[var(--border-color)] text-[11px] space-y-1 text-[var(--text-secondary)] font-mono">
                {Boolean(svc.port) && <div className="flex justify-between"><span>Cổng TCP:</span><span className="font-bold text-[var(--vnpt-blue)]">{svc.port}</span></div>}
                {Boolean(svc.pid) && <div className="flex justify-between"><span>Tiến trình PID:</span><span className="font-bold text-purple-600">{svc.pid}</span></div>}
                {svc.statusText && <div className="flex justify-between"><span>Chi tiết:</span><span className="truncate max-w-[140px]" title={svc.statusText}>{svc.statusText}</span></div>}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
              <div className="flex items-center gap-1.5">
                {hasAction(svc, 'start') && <button onClick={() => void startService(svc.id)} disabled={isServiceActive(svc) || actionLoading || svc.status === 'starting'} className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-30">▶ Start</button>}
                {hasAction(svc, 'stop') && <button onClick={() => void stopService(svc.id)} disabled={!isServiceActive(svc) || actionLoading || svc.status === 'starting'} className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-30">⏹ Stop</button>}
                {hasAction(svc, 'restart') && <button onClick={() => void restartService(svc.id)} disabled={actionLoading} className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-30">🔄 Reset</button>}
                {hasAction(svc, 'test_connection') && <button onClick={() => void executeApiAction(svc.id, 'test_connection')} disabled={actionLoading} className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition">🩺 Ping</button>}
                {hasAction(svc, 'trigger') && <button onClick={() => void executeApiAction(svc.id, 'trigger')} disabled={actionLoading} className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition">⚡ Chạy</button>}
                {svc.url && <button onClick={() => openUrl(svc.url!)} className="px-2 py-1.5 bg-blue-50 text-[var(--vnpt-blue)] rounded-lg text-xs font-bold border border-blue-200" title="Mở Web">🌐</button>}
              </div>
              {svc.parameters && svc.parameters.length > 0 && (
                <button onClick={() => openParamModal(svc)} className="w-full py-1 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-lg text-[11px] font-bold text-[var(--vnpt-blue)] transition flex items-center justify-center gap-1">
                  <span>⚙️</span><span>Tùy biến tham số kích hoạt...</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ServiceLogViewer logs={logs} onClear={clearLogs} />
      <ServiceParamModal show={showModal} service={activeParamSvc} loading={actionLoading} onClose={() => setShowModal(false)} onSubmit={(act, p) => void handleParamSubmit(act, p)} />
      <ServiceDiagnosticsModal show={showDiagModal} diagnostics={diagnostics} loading={diagLoading} onClose={() => setShowDiagModal(false)} onAutoHeal={() => void triggerAutoHeal()} onRefresh={() => void fetchDiagnostics()} />
    </div>
  );
}
