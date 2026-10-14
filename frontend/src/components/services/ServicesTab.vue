<!-- @id 01M4V0HMNP498R2TP9DW4E42CC -->
<!-- @related 01M4V0HMNVM4S634MN7VYTNK44, 01M4V0HMNMFBJWYTTBY5817MCT, 01M4V0HMNNDJW9HSABMQFV34GF, 01M4V0HMP0BNNZ0SW67AWG4GN2, 01M4V0FH0TF34QKKRRBVF9H0XA -->
<template>
  <div class="space-y-4">
    <!-- Header & Action Bar -->
    <div class="bg-[var(--bg-card)] rounded-2xl p-4 shadow-xs border border-[var(--border-color)] flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xl">🛠️</span>
          <h2 class="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)]">Trung Tâm Điều Khiển Dịch Vụ</h2>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5"
                :class="isNative ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-blue-50 text-blue-700 border-blue-200'">
            <span class="w-1.5 h-1.5 rounded-full" :class="isNative ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'"></span>
            {{ isNative ? 'C# WebView2 Native IPC' : 'Web Fallback Mode' }}
          </span>
        </div>
        <p class="text-xs text-[var(--text-muted)] mt-0.5">Giám sát và điều phối Start, Stop, Reset 5 tiến trình cốt lõi hệ thống</p>
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto justify-end">
        <span class="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg flex items-center gap-1.5 border border-slate-200">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Đồng bộ: {{ lastSyncedAt }}</span>
        </span>
        <button @click="openDiagModal" class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition flex items-center gap-1 cursor-pointer">
          <span>🩺</span><span>Chẩn Đoán</span>
        </button>
        <button @click="refreshServices" :disabled="actionLoading" class="px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-xs font-bold rounded-xl transition flex items-center gap-1 border border-[var(--border-color)]">
          <span>↻</span><span>Làm Mới</span>
        </button>
        <button @click="startAll" :disabled="actionLoading" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1">
          <span>▶</span><span>Bật Hết</span>
        </button>
        <button @click="stopAll" :disabled="actionLoading" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1">
          <span>⏹</span><span>Tắt Hết</span>
        </button>
      </div>
    </div>

    <!-- Overview Badges -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
        <span class="text-xs font-semibold text-[var(--text-muted)]">Tổng Dịch Vụ</span>
        <span class="text-lg font-black text-[var(--text-primary)] font-mono">{{ totalCount }}</span>
      </div>
      <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
        <span class="text-xs font-semibold text-emerald-600">Đang Chạy (Online)</span>
        <span class="text-lg font-black text-emerald-600 font-mono">{{ runningCount }}</span>
      </div>
      <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
        <span class="text-xs font-semibold text-rose-600">Đã Dừng (Offline)</span>
        <span class="text-lg font-black text-rose-600 font-mono">{{ totalCount - runningCount }}</span>
      </div>
      <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] flex items-center justify-between">
        <span class="text-xs font-semibold text-purple-600">Chế Độ Kết Nối</span>
        <span class="text-xs font-bold" :class="isNative ? 'text-emerald-500' : 'text-blue-500'">{{ isNative ? 'IPC NATIVE' : 'HTTP REST' }}</span>
      </div>
    </div>

    <!-- Notice banner -->
    <div v-if="notice" class="p-3 rounded-xl text-xs font-bold flex items-center justify-between transition"
         :class="notice.isError ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'">
      <span>{{ notice.text }}</span><button @click="notice = null">✕</button>
    </div>

    <!-- Service Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="svc in services" :key="svc.id" class="card-glass p-4 rounded-2xl border border-[var(--border-color)] flex flex-col justify-between space-y-3 hover:shadow-md transition">
        <div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">{{ getIcon(svc.id) }}</span>
              <h3 class="text-xs font-bold text-[var(--text-primary)]">{{ svc.name }}</h3>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono" :class="getStatusBadge(svc.status)">
              {{ svc.status.toUpperCase() }}
            </span>
          </div>
          <p class="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-2">{{ svc.description }}</p>
          <div class="mt-2.5 pt-2 border-t border-[var(--border-color)] text-[11px] space-y-1 text-[var(--text-secondary)] font-mono">
            <div v-if="svc.port" class="flex justify-between"><span>Cổng TCP:</span><span class="font-bold text-[var(--vnpt-blue)]">{{ svc.port }}</span></div>
            <div v-if="svc.pid" class="flex justify-between"><span>Tiến trình PID:</span><span class="font-bold text-purple-600">{{ svc.pid }}</span></div>
            <div v-if="svc.statusText" class="flex justify-between"><span>Chi tiết:</span><span class="truncate max-w-[140px]" :title="svc.statusText">{{ svc.statusText }}</span></div>
          </div>
        </div>

        <!-- Actions Toolbar -->
        <div class="space-y-1.5 pt-2 border-t border-[var(--border-color)]">
          <div class="flex items-center gap-1.5">
            <button v-if="hasAction(svc, 'start')" @click="startService(svc.id)" :disabled="isServiceActive(svc) || actionLoading || svc.status === 'starting'"
                    class="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-30">▶ Start</button>
            <button v-if="hasAction(svc, 'stop')" @click="stopService(svc.id)" :disabled="!isServiceActive(svc) || actionLoading || svc.status === 'starting'"
                    class="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-30">⏹ Stop</button>
            <button v-if="hasAction(svc, 'restart')" @click="restartService(svc.id)" :disabled="actionLoading"
                    class="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-30">🔄 Reset</button>
            <button v-if="hasAction(svc, 'test_connection')" @click="executeApiAction(svc.id, 'test_connection')" :disabled="actionLoading"
                    class="flex-1 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition">🩺 Ping</button>
            <button v-if="hasAction(svc, 'trigger')" @click="executeApiAction(svc.id, 'trigger')" :disabled="actionLoading"
                    class="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition">⚡ Chạy</button>
            <button v-if="svc.url" @click="openUrl(svc.url)" class="px-2 py-1.5 bg-blue-50 text-[var(--vnpt-blue)] rounded-lg text-xs font-bold border border-blue-200" title="Mở Web">🌐</button>
          </div>
          <button v-if="svc.parameters && svc.parameters.length" @click="openParamModal(svc)"
                  class="w-full py-1 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-lg text-[11px] font-bold text-[var(--vnpt-blue)] transition flex items-center justify-center gap-1">
            <span>⚙️</span><span>Tùy biến tham số kích hoạt...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Live Console Output -->
    <ServiceLogViewer :logs="logs" @clear="clearLogs" />

    <!-- Parameter Config Modal -->
    <ServiceParamModal :show="showModal" :service="activeParamSvc" :loading="actionLoading"
                       @close="showModal = false" @submit="handleParamSubmit" />

    <!-- Diagnostics & Auto-Heal Modal -->
    <ServiceDiagnosticsModal :show="showDiagModal" :diagnostics="diagnostics" :loading="diagLoading"
                             @close="showDiagModal = false" @auto-heal="triggerAutoHeal" @refresh="fetchDiagnostics" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useServiceManager } from '../../composables/useServiceManager';
import ServiceLogViewer from './ServiceLogViewer.vue';
import ServiceParamModal, { type ModalServiceItem } from './ServiceParamModal.vue';
import ServiceDiagnosticsModal from './ServiceDiagnosticsModal.vue';
import type { ManagedService } from '../../types/service';

const {
  services, logs, isNative, runningCount, totalCount, actionLoading, notice, lastSyncedAt,
  diagnostics, diagLoading, fetchDiagnostics, triggerAutoHeal,
  startService, stopService, restartService, startAll, stopAll, openUrl, clearLogs,
  executeApiAction, refreshServices
} = useServiceManager();

const showModal = ref(false);
const showDiagModal = ref(false);
const activeParamSvc = ref<ModalServiceItem | null>(null);

const openDiagModal = async () => {
  showDiagModal.value = true;
  await fetchDiagnostics();
};

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

const openParamModal = (svc: ManagedService) => {
  activeParamSvc.value = svc as unknown as ModalServiceItem;
  showModal.value = true;
};

const handleParamSubmit = async (action: string, params: Record<string, unknown>) => {
  if (!activeParamSvc.value) return;
  const id = activeParamSvc.value.id;
  showModal.value = false;
  if (action === 'start') await startService(id, params);
  else if (action === 'restart') await restartService(id, params);
  else await executeApiAction(id, action, params);
};
</script>
