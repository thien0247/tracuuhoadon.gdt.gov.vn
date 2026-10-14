// @id 01M4V0HMNWVM2K7TD8J9CYHS8V
// @related 01M4V0HMNZYFQF5C97DPYG8AR4, 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * composables/useSSE.ts - Quản lý kết nối thời gian thực Server-Sent Events (/api/stream).
 */
import { ref } from 'vue';
import type { MasterMetrics, ProvinceStatus } from '../types';

const sseConnected = ref(false);
const master = ref<MasterMetrics>({
  total_queried: 0, total_found: 0, total_speed: 0, total_db_records: 0, running_count: 0
});
const provinceStatus = ref<Record<string, ProvinceStatus>>({});
const logs = ref<string[]>([]);

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pollFallbackTimer: ReturnType<typeof setInterval> | null = null;

export function useSSE() {
  const pollFallback = async () => {
    if (sseConnected.value) return;
    try {
      const res = await fetch('/api/reports/crawl-stats');
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.total === 'number') {
          master.value.total_db_records = data.total;
        }
      }
    } catch { }
  };

  const connectSSE = () => {
    if (eventSource) return;
    try {
      eventSource = new EventSource('/api/stream');

      eventSource.onopen = () => {
        sseConnected.value = true;
        if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      };

      eventSource.onerror = () => {
        sseConnected.value = false;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connectSSE();
          }, 2000);
        }
      };

      eventSource.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          if (payload.master) master.value = payload.master;
          if (payload.provinces) provinceStatus.value = payload.provinces;
          if (payload.logs) logs.value = payload.logs;
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };
    } catch {
      sseConnected.value = false;
    }

    if (!pollFallbackTimer) {
      pollFallbackTimer = setInterval(pollFallback, 3500);
    }
  };

  const clearLogs = () => {
    logs.value = [];
  };

  return { sseConnected, master, provinceStatus, logs, connectSSE, clearLogs };
}
