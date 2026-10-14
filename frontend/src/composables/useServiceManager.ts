// @id 01M4V0HMNVM4S634MN7VYTNK44
// @related 01M4V0HMP0BNNZ0SW67AWG4GN2, 01M4V0HMMAGER9D326B643B5RY, 01M4V0HMN7FE4FE1E8F43DFEAA, 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ
import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { ManagedService, ServiceLogMessage, BridgeIncomingMessage, BridgeOutgoingMessage, SystemDiagnosticsResponse } from '../types/service';
import { ApiClient } from '../api/client';
import { generateUlid } from '../utils/ulid';

const DEFAULT_SERVICES: ManagedService[] = [
  { id: 'gdt_windows_service', name: 'Windows Service GDTTaxCrawler', description: 'Host tiến trình dịch vụ nền NSSM', port: 0, status: 'stopped', supportedActions: ['start', 'stop', 'restart'] },
  { id: 'fastify_web', name: 'Fastify Web API Gateway', description: 'Máy chủ Web & REST API TypeScript (Port 8123)', port: 8123, status: 'stopped', url: 'http://127.0.0.1:8123/', supportedActions: ['restart'] },
  { id: 'python_worker', name: 'Python AI Worker & CAPTCHA', description: 'Tiến trình giải AI CAPTCHA & Scraper curl_cffi (Port 8124)', port: 8124, status: 'stopped', url: 'http://127.0.0.1:8124/worker/status', supportedActions: ['start', 'stop', 'restart'] },
  { id: 'postgresql_db', name: 'Cơ Sở Dữ Liệu PostgreSQL', description: 'PostgreSQL 16 lưu trữ 7M+ bản ghi NNT (Port 5433)', port: 5433, status: 'stopped', isOptional: true, supportedActions: ['test_connection'] },
  { id: 'crawler_scheduler', name: 'Lập Lịch Quét Tự Động (Scheduler)', description: 'Tự động Quét Đỉnh (mỗi 6h) & Fill Lỗ Hổng 500 (mỗi 12h)', port: 0, status: 'stopped', isOptional: true, supportedActions: ['start', 'stop', 'trigger'] }
];

export function useServiceManager() {
  const services = ref<ManagedService[]>([...DEFAULT_SERVICES]);
  const logs = ref<ServiceLogMessage[]>([]);
  const isNative = ref<boolean>(false);
  const actionLoading = ref<boolean>(false);
  const lastSyncedAt = ref<string>('--:--:--');
  const diagnostics = ref<SystemDiagnosticsResponse | null>(null);
  const diagLoading = ref<boolean>(false);
  const notice = ref<{ text: string; isError: boolean } | null>(null);
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let actionGuardTimer: ReturnType<typeof setTimeout> | null = null;

  const runningCount = computed(() => services.value.filter(s => ['running', 'online', 'connected'].includes(s.status)).length);
  const totalCount = computed(() => services.value.length);

  const sendMessage = (msg: BridgeOutgoingMessage) => {
    const webview = (window as unknown as { chrome?: { webview?: { postMessage: (d: unknown) => void } } }).chrome?.webview;
    if (webview) webview.postMessage(JSON.stringify(msg));
    else addLocalLog('SYSTEM', `[Web Fallback] Gửi lệnh ${msg.action} (${msg.serviceId || 'all'})`, 'info');
  };

  const addLocalLog = (service: string, message: string, level: ServiceLogMessage['level'] = 'info') => {
    logs.value.push({ id: generateUlid(), timestamp: new Date().toLocaleTimeString('vi-VN', { hour12: false }), service, message, level });
    if (logs.value.length > 500) logs.value.shift();
  };

  const markSynced = () => { lastSyncedAt.value = new Date().toLocaleTimeString('vi-VN', { hour12: false }); };

  const mergeServices = (incoming: ManagedService[]) => {
    services.value = incoming.map(s => {
      const prev = services.value.find(p => p.id === s.id) || DEFAULT_SERVICES.find(d => d.id === s.id);
      return { ...prev, ...s, supportedActions: s.supportedActions || prev?.supportedActions || ['start', 'stop', 'restart'], parameters: s.parameters || prev?.parameters };
    });
    markSynced();
  };

  const handleNativeMessage = (event: MessageEvent) => {
    try {
      const data: BridgeIncomingMessage = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data.type === 'STATUS_UPDATE' && Array.isArray(data.services)) {
        mergeServices(data.services);
      } else if (data.type === 'SERVICE_RELOADED') {
        const sId = data.serviceId || 'all';
        addLocalLog('SYSTEM', `Dịch vụ [${sId}] đã hoàn tất nạp lại.`, 'success');
        window.dispatchEvent(new CustomEvent('service-reloaded', { detail: { serviceId: sId } }));
      } else if (data.type === 'LOG' && data.log) {
        logs.value.push(data.log);
        if (logs.value.length > 500) logs.value.shift();
      } else if (data.type === 'LOG_HISTORY' && Array.isArray(data.logs)) {
        logs.value = data.logs;
      }
    } catch (err) {
      console.error('Lỗi giải mã tin nhắn WebView2:', err);
    }
  };

  const pollWebFallback = async () => {
    try {
      const res = await ApiClient.getServicesStatus();
      if (res && Array.isArray(res.services)) mergeServices(res.services);
    } catch { }
  };

  const startService = async (id: string, params?: Record<string, unknown>) => {
    const target = services.value.find(s => s.id === id);
    if (target) target.status = 'starting';
    if (isNative.value && !params) sendMessage({ action: 'START_SERVICE', serviceId: id });
    else await executeApiAction(id, 'start', params);
  };
  const stopService = async (id: string) => {
    if (isNative.value) sendMessage({ action: 'STOP_SERVICE', serviceId: id });
    else await executeApiAction(id, 'stop');
  };
  const restartService = async (id: string, params?: Record<string, unknown>) => {
    const target = services.value.find(s => s.id === id);
    if (target) target.status = 'starting';
    if (isNative.value && !params) sendMessage({ action: 'RESTART_SERVICE', serviceId: id });
    else await executeApiAction(id, 'restart', params);
  };
  const startAll = () => {
    services.value.forEach(s => { if (!s.isOptional) s.status = 'starting'; });
    sendMessage({ action: 'START_ALL' });
  };
  const stopAll = () => sendMessage({ action: 'STOP_ALL' });
  const openUrl = (url: string) => { if (isNative.value) sendMessage({ action: 'OPEN_URL', url }); else window.open(url, '_blank'); };
  const clearLogs = () => { logs.value = []; sendMessage({ action: 'CLEAR_LOGS' }); };
  const reloadPage = () => { if (isNative.value) sendMessage({ action: 'RELOAD_PAGE' }); else window.location.reload(); };

  const executeApiAction = async (serviceId: string, action: string, params?: Record<string, unknown>) => {
    actionLoading.value = true;
    if (actionGuardTimer) clearTimeout(actionGuardTimer);
    actionGuardTimer = setTimeout(() => {
      if (actionLoading.value) {
        actionLoading.value = false;
        notice.value = { text: 'Thao tác đang tiếp tục xử lý nền (Safe Guard)', isError: false };
      }
    }, 8000);

    try {
      const res = await ApiClient.controlService(serviceId, action, params);
      notice.value = { text: res.message || `Đã gửi thao tác ${action}`, isError: !res.success };
      addLocalLog('API', res.message || `Thao tác ${action} trên ${serviceId}`, res.success ? 'success' : 'error');
      setTimeout(pollWebFallback, 1200);
    } catch (e) {
      notice.value = { text: `Lỗi: ${(e as Error).message}`, isError: true };
      addLocalLog('API', `Lỗi: ${(e as Error).message}`, 'error');
    } finally {
      if (actionGuardTimer) clearTimeout(actionGuardTimer);
      actionLoading.value = false;
    }
  };

  const fetchDiagnostics = async () => {
    diagLoading.value = true;
    try {
      diagnostics.value = await ApiClient.getDiagnostics();
    } catch (e) {
      addLocalLog('DIAG', `Lỗi chẩn đoán: ${(e as Error).message}`, 'error');
    } finally {
      diagLoading.value = false;
    }
  };

  const triggerAutoHeal = async () => {
    diagLoading.value = true;
    try {
      const res = await ApiClient.autoHealServices();
      notice.value = { text: res.message, isError: !res.success };
      addLocalLog('AUTO_HEAL', res.message, res.success ? 'success' : 'error');
      await fetchDiagnostics();
      await pollWebFallback();
      return res;
    } finally {
      diagLoading.value = false;
    }
  };

  onMounted(() => {
    const chromeObj = (window as unknown as { chrome?: { webview?: EventTarget & { postMessage: (d: unknown) => void } } }).chrome;
    if (chromeObj?.webview) {
      isNative.value = true;
      chromeObj.webview.addEventListener('message', handleNativeMessage as EventListener);
      sendMessage({ action: 'INIT' });
    } else {
      isNative.value = false;
      addLocalLog('SYSTEM', 'Hoạt động ở chế độ Web Fallback', 'info');
    }
    pollWebFallback();
    pollTimer = setInterval(pollWebFallback, 2500);
  });
  onUnmounted(() => {
    const chromeObj = (window as unknown as { chrome?: { webview?: EventTarget } }).chrome;
    if (chromeObj?.webview) chromeObj.webview.removeEventListener('message', handleNativeMessage as EventListener);
    if (pollTimer) clearInterval(pollTimer);
    if (actionGuardTimer) clearTimeout(actionGuardTimer);
  });

  return {
    services, logs, isNative, runningCount, totalCount, actionLoading, notice, lastSyncedAt,
    diagnostics, diagLoading, fetchDiagnostics, triggerAutoHeal,
    startService, stopService, restartService, startAll, stopAll, openUrl, clearLogs, addLocalLog,
    reloadPage, executeApiAction, refreshServices: pollWebFallback
  };
}
