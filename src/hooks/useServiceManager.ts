// @id 01M4W0H00K0000000000000005
// @related 01M4W0TYPE0000000000000002, 01M4W0APJC0000000000000001, 01M4V1TS000000000000000001
'use client';
/**
 * src/hooks/useServiceManager.ts
 * React Hook quản lý điều khiển dịch vụ nền (Windows Service, Fastify, Python AI Worker, PostgreSQL) & Diagnostics.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import type { ManagedService, ServiceLogMessage, BridgeIncomingMessage, BridgeOutgoingMessage, SystemDiagnosticsResponse } from '../types/service';
import { ApiClient } from '../api/client';
import { generateUlid } from '../utils/ulid';

const DEFAULT_SERVICES: ManagedService[] = [
  { id: 'gdt_windows_service', name: 'Windows Service GDTTaxCrawler', description: 'Host tiến trình dịch vụ nền NSSM', port: 0, status: 'stopped', supportedActions: ['start', 'stop', 'restart'] },
  { id: 'fastify_web', name: 'Next.js & Fastify Web Gateway', description: 'Máy chủ Web & REST API TypeScript (Port 8123)', port: 8123, status: 'stopped', url: 'http://127.0.0.1:8123/', supportedActions: ['restart'] },
  { id: 'python_worker', name: 'Python AI Worker & CAPTCHA', description: 'Tiến trình giải AI CAPTCHA & Scraper curl_cffi (Port 8124)', port: 8124, status: 'stopped', url: 'http://127.0.0.1:8124/worker/status', supportedActions: ['start', 'stop', 'restart'] },
  { id: 'postgresql_db', name: 'Cơ Sở Dữ Liệu PostgreSQL', description: 'PostgreSQL 16 lưu trữ 7M+ bản ghi NNT (Port 5433)', port: 5433, status: 'stopped', isOptional: true, supportedActions: ['test_connection'] },
  { id: 'crawler_scheduler', name: 'Lập Lịch Quét Tự Động (Scheduler)', description: 'Tự động Quét Đỉnh (mỗi 6h) & Fill Lỗ Hổng 500 (mỗi 12h)', port: 0, status: 'stopped', isOptional: true, supportedActions: ['start', 'stop', 'trigger'] }
];

export function useServiceManager() {
  const [services, setServices] = useState<ManagedService[]>([...DEFAULT_SERVICES]);
  const [logs, setLogs] = useState<ServiceLogMessage[]>([]);
  const [isNative, setIsNative] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('--:--:--');
  const [diagnostics, setDiagnostics] = useState<SystemDiagnosticsResponse | null>(null);
  const [diagLoading, setDiagLoading] = useState<boolean>(false);
  const [notice, setNotice] = useState<{ text: string; isError: boolean } | null>(null);
  const actionGuardRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runningCount = services.filter((s) => ['running', 'online', 'connected'].includes(s.status)).length;
  const totalCount = services.length;

  const addLocalLog = useCallback((service: string, message: string, level: ServiceLogMessage['level'] = 'info') => {
    setLogs((prev) => {
      const next = [...prev, { id: generateUlid(), timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }), service, message, level }];
      return next.length > 500 ? next.slice(next.length - 500) : next;
    });
  }, []);

  const sendMessage = useCallback((msg: BridgeOutgoingMessage) => {
    const webview = (window as unknown as { chrome?: { webview?: { postMessage: (d: unknown) => void } } }).chrome?.webview;
    if (webview) webview.postMessage(JSON.stringify(msg));
    else addLocalLog('SYSTEM', `[Web Fallback] Gửi lệnh ${msg.action} (${msg.serviceId || 'all'})`, 'info');
  }, [addLocalLog]);

  const mergeServices = useCallback((incoming: ManagedService[]) => {
    setServices((prev) => incoming.map((s) => {
      const old = prev.find((p) => p.id === s.id) || DEFAULT_SERVICES.find((d) => d.id === s.id);
      return { ...old, ...s, supportedActions: s.supportedActions || old?.supportedActions || ['start', 'stop', 'restart'], parameters: s.parameters || old?.parameters };
    }));
    setLastSyncedAt(new Date().toLocaleTimeString('vi-VN', { hour12: false }));
  }, []);

  const pollWebFallback = useCallback(async () => {
    try {
      const res = await ApiClient.getServicesStatus();
      if (res && Array.isArray(res.services)) mergeServices(res.services);
    } catch { /* ignore */ }
  }, [mergeServices]);

  const executeApiAction = useCallback(async (serviceId: string, action: string, params?: Record<string, unknown>) => {
    setActionLoading(true);
    if (actionGuardRef.current) clearTimeout(actionGuardRef.current);
    actionGuardRef.current = setTimeout(() => {
      setActionLoading(false);
      setNotice({ text: 'Thao tác đang tiếp tục xử lý nền (Safe Guard)', isError: false });
    }, 8000);

    try {
      const res = await ApiClient.controlService(serviceId, action, params);
      setNotice({ text: res.message || `Đã gửi thao tác ${action}`, isError: !res.success });
      addLocalLog('API', res.message || `Thao tác ${action} trên ${serviceId}`, res.success ? 'success' : 'error');
      setTimeout(() => { void pollWebFallback(); }, 1200);
    } catch (e) {
      setNotice({ text: `Lỗi: ${(e as Error).message}`, isError: true });
      addLocalLog('API', `Lỗi: ${(e as Error).message}`, 'error');
    } finally {
      if (actionGuardRef.current) clearTimeout(actionGuardRef.current);
      setActionLoading(false);
    }
  }, [addLocalLog, pollWebFallback]);

  const startService = useCallback(async (id: string, params?: Record<string, unknown>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'starting' } : s)));
    if (isNative && !params) sendMessage({ action: 'START_SERVICE', serviceId: id });
    else await executeApiAction(id, 'start', params);
  }, [isNative, sendMessage, executeApiAction]);

  const stopService = useCallback(async (id: string) => {
    if (isNative) sendMessage({ action: 'STOP_SERVICE', serviceId: id });
    else await executeApiAction(id, 'stop');
  }, [isNative, sendMessage, executeApiAction]);

  const restartService = useCallback(async (id: string, params?: Record<string, unknown>) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'starting' } : s)));
    if (isNative && !params) sendMessage({ action: 'RESTART_SERVICE', serviceId: id });
    else await executeApiAction(id, 'restart', params);
  }, [isNative, sendMessage, executeApiAction]);

  const fetchDiagnostics = useCallback(async () => {
    setDiagLoading(true);
    try { setDiagnostics(await ApiClient.getDiagnostics()); }
    catch (e) { addLocalLog('DIAG', `Lỗi chẩn đoán: ${(e as Error).message}`, 'error'); }
    finally { setDiagLoading(false); }
  }, [addLocalLog]);

  const triggerAutoHeal = useCallback(async () => {
    setDiagLoading(true);
    try {
      const res = await ApiClient.autoHealServices();
      setNotice({ text: res.message, isError: !res.success });
      addLocalLog('AUTO_HEAL', res.message, res.success ? 'success' : 'error');
      await fetchDiagnostics();
      await pollWebFallback();
      return res;
    } finally { setDiagLoading(false); }
  }, [addLocalLog, fetchDiagnostics, pollWebFallback]);

  useEffect(() => {
    const handleNativeMessage = (event: MessageEvent) => {
      try {
        const data: BridgeIncomingMessage = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.type === 'STATUS_UPDATE' && Array.isArray(data.services)) mergeServices(data.services);
        else if (data.type === 'LOG' && data.log) setLogs((p) => [...p.slice(-499), data.log!]);
        else if (data.type === 'LOG_HISTORY' && Array.isArray(data.logs)) setLogs(data.logs);
      } catch { /* ignore */ }
    };
    const chromeObj = (window as unknown as { chrome?: { webview?: EventTarget & { postMessage: (d: unknown) => void } } }).chrome;
    if (chromeObj?.webview) {
      setIsNative(true);
      chromeObj.webview.addEventListener('message', handleNativeMessage as EventListener);
      sendMessage({ action: 'INIT' });
    } else {
      setIsNative(false);
    }
    void pollWebFallback();
    const timer = setInterval(() => { void pollWebFallback(); }, 2500);
    return () => {
      if (chromeObj?.webview) chromeObj.webview.removeEventListener('message', handleNativeMessage as EventListener);
      clearInterval(timer);
    };
  }, [mergeServices, pollWebFallback, sendMessage]);

  return {
    services, logs, isNative, runningCount, totalCount, actionLoading, notice, setNotice, lastSyncedAt,
    diagnostics, diagLoading, fetchDiagnostics, triggerAutoHeal,
    startService, stopService, restartService,
    startAll: () => sendMessage({ action: 'START_ALL' }),
    stopAll: () => sendMessage({ action: 'STOP_ALL' }),
    openUrl: (url: string) => (isNative ? sendMessage({ action: 'OPEN_URL', url }) : window.open(url, '_blank')),
    clearLogs: () => { setLogs([]); sendMessage({ action: 'CLEAR_LOGS' }); },
    addLocalLog,
    reloadPage: () => (isNative ? sendMessage({ action: 'RELOAD_PAGE' }) : window.location.reload()),
    executeApiAction,
    refreshServices: pollWebFallback
  };
}
