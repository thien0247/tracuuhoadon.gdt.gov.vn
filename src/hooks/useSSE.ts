// @id 01M4W0H00K0000000000000001
// @related 01M4W0TYPE0000000000000001, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
/**
 * src/hooks/useSSE.ts - React Hook quản lý kết nối thời gian thực Server-Sent Events (/api/stream).
 */
import { useState, useEffect, useCallback } from 'react';
import type { MasterMetrics, ProvinceStatus } from '../types';

interface SSEStoreState {
  sseConnected: boolean;
  master: MasterMetrics;
  provinceStatus: Record<string, ProvinceStatus>;
  logs: string[];
}

const state: SSEStoreState = {
  sseConnected: false,
  master: { total_queried: 0, total_found: 0, total_speed: 0, total_db_records: 0, running_count: 0 },
  provinceStatus: {},
  logs: []
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let pollFallbackTimer: ReturnType<typeof setInterval> | null = null;

async function pollFallback(): Promise<void> {
  if (state.sseConnected) return;
  try {
    const res = await fetch('/api/reports/crawl-stats');
    if (res.ok) {
      const data = (await res.json()) as { total?: number; summary?: { total_records?: number } };
      const total = data?.total ?? data?.summary?.total_records;
      if (typeof total === 'number') {
        state.master = { ...state.master, total_db_records: total };
        notify();
      }
    }
  } catch { /* ignore */ }
}

export function connectSSEGlobal(): void {
  if (typeof window === 'undefined' || eventSource) return;
  try {
    eventSource = new EventSource('/api/stream');
    eventSource.onopen = () => {
      state.sseConnected = true;
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      notify();
    };
    eventSource.onerror = () => {
      state.sseConnected = false;
      if (eventSource) { eventSource.close(); eventSource = null; }
      notify();
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => { reconnectTimer = null; connectSSEGlobal(); }, 2000);
      }
    };
    eventSource.onmessage = (evt) => {
      try {
        const payload = JSON.parse(evt.data) as {
          master?: MasterMetrics;
          provinces?: Record<string, ProvinceStatus>;
          logs?: string[];
        };
        if (payload.master) state.master = payload.master;
        if (payload.provinces) state.provinceStatus = payload.provinces;
        if (payload.logs) state.logs = payload.logs;
        notify();
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };
  } catch {
    state.sseConnected = false;
    notify();
  }
  if (!pollFallbackTimer) {
    pollFallbackTimer = setInterval(() => { void pollFallback(); }, 3500);
  }
}

export function clearLogsGlobal(): void {
  state.logs = [];
  notify();
}

export function useSSE() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const connectSSE = useCallback(() => connectSSEGlobal(), []);
  const clearLogs = useCallback(() => clearLogsGlobal(), []);

  return {
    sseConnected: state.sseConnected,
    master: state.master,
    provinceStatus: state.provinceStatus,
    logs: state.logs,
    connectSSE,
    clearLogs
  };
}
