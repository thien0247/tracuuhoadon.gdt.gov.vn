<!-- @id 01M4V0HMMFFGPHK4310775K1XK -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div class="bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-200 dark:border-indigo-800/60 space-y-3">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-100 dark:border-indigo-800/40 pb-2">
      <div class="flex items-center gap-2">
        <span class="text-xl">🔍</span>
        <div>
          <h3 class="text-sm font-bold text-indigo-900 dark:text-indigo-200">Quét Bổ Sung MST Vào Thuế GDT</h3>
          <p class="text-[11px] text-indigo-600 dark:text-indigo-400">Dùng Gap-Fill Scan để tra từng MST Bố Cáo chưa có trong tax_records</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5">
        <button v-if="!scanning" @click="startScan"
          class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-sm transition flex items-center gap-1.5">
          <span>⚡</span><span>Bắt Đầu Quét Bổ Sung</span>
        </button>
        <button v-else @click="stopScan"
          class="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-sm transition flex items-center gap-1.5">
          <span class="animate-spin">⏳</span><span>Đang Quét — Dừng</span>
        </button>
      </div>
    </div>

    <!-- Tham Số Cấu Hình -->
    <div class="flex flex-wrap items-end gap-3 text-xs">
      <div>
        <label class="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5 uppercase">Gap (MST/lần)</label>
        <input type="number" v-model.number="gap" min="5" max="200" :disabled="scanning"
          class="w-20 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
      </div>
      <div>
        <label class="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5 uppercase">Workers/Tỉnh</label>
        <select v-model.number="workers" :disabled="scanning"
          class="w-20 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
          <option :value="1">1</option><option :value="2">2</option>
        </select>
      </div>
      <div>
        <label class="block text-[10px] font-bold text-indigo-700 dark:text-indigo-300 mb-0.5 uppercase">Tỉnh Song Song</label>
        <select v-model.number="maxConcurrent" :disabled="scanning"
          class="w-20 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
          <option :value="1">1</option><option :value="2">2 ★</option><option :value="3">3</option>
        </select>
      </div>
      <div v-if="queueStatus" class="ml-auto flex items-center gap-2 text-[11px]">
        <span class="px-2 py-0.5 rounded-full font-bold"
          :class="queueStatus.is_running ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'">
          {{ queueStatus.is_running ? '🟢 Đang Quét' : '⚪ Idle' }}
        </span>
        <span class="text-slate-500 dark:text-slate-400">Hàng đợi: <b>{{ queueStatus.pending_count || 0 }}</b> tỉnh</span>
      </div>
    </div>

    <!-- Kết Quả Khởi Động -->
    <div v-if="result" class="p-2.5 rounded-xl text-xs font-medium"
      :class="result.status === 'scan_queued' ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'">
      <template v-if="result.status === 'scan_queued'">
        ✅ Đã xếp hàng <b>{{ result.total_provinces }}</b> tỉnh có MST chưa khớp vào Rolling Queue
        (max <b>{{ result.max_concurrent }}</b> tỉnh song song, gap=<b>{{ result.gap }}</b>).
      </template>
      <template v-else>ℹ️ Không có MST Bố Cáo nào cần quét bổ sung.</template>
    </div>

    <!-- Activity Logs -->
    <div v-if="logs.length > 0" class="space-y-1">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Nhật Ký Hoạt Động</span>
        <button @click="clearLogs" class="text-[10px] text-slate-400 hover:text-red-500 transition">Xóa</button>
      </div>
      <div class="max-h-28 overflow-y-auto space-y-0.5">
        <div v-for="(l, i) in logs" :key="i" class="flex items-start gap-1.5 text-[10px]">
          <span class="text-slate-400 font-mono shrink-0">{{ l.t }}</span>
          <span :class="l.type === 'error' ? 'text-red-600 dark:text-red-400' : l.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : l.type === 'warning' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'">{{ l.msg }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { ApiClient } from '@/api/client';

const emit = defineEmits<{ (e: 'scan-done'): void }>();

interface ScanResult { status?: string; total_provinces?: number; max_concurrent?: number; gap?: number; queued?: number }
interface QueueStatus { is_running?: boolean; pending_count?: number }

const scanning = ref(false);
const gap = ref(20);
const workers = ref(1);
const maxConcurrent = ref(2);
const result = ref<ScanResult | null>(null);
const queueStatus = ref<QueueStatus | null>(null);
const logs = ref<Array<{ t: string; msg: string; type: string }>>([]);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const addLog = (msg: string, type = 'info') => {
  const t = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  logs.value.unshift({ t, msg, type });
  if (logs.value.length > 30) logs.value.pop();
};

const stopPoll = () => { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } };

const pollQueue = async () => {
  try {
    const s = await (await fetch('/api/crawler/queue_status')).json() as QueueStatus;
    queueStatus.value = s;
    if (!s.is_running && (s.pending_count ?? 0) === 0) {
      stopPoll();
      scanning.value = false;
      addLog('✅ Hàng đợi quét đã hoàn thành.', 'success');
      emit('scan-done');
    }
  } catch (_) {}
};

const startScan = async () => {
  if (scanning.value) return;
  scanning.value = true;
  result.value = null;
  addLog(`Đang khởi động Gap-Fill Scan (gap=${gap.value}, workers=${workers.value}, concurrent=${maxConcurrent.value})...`);
  try {
    const res = await ApiClient.startBocaoGapFillScan({
      gap: gap.value, num_workers: workers.value, max_concurrent: maxConcurrent.value
    }) as ScanResult;
    result.value = res;
    if (res.status === 'nothing_to_scan') {
      addLog('ℹ️ Không có MST Bố Cáo nào cần quét bổ sung.', 'info');
      scanning.value = false;
    } else {
      addLog(`⚡ Đã xếp hàng ${res.queued} tỉnh vào Rolling Queue.`, 'success');
      pollTimer = setInterval(pollQueue, 3000);
    }
  } catch (e: unknown) {
    const err = e as { message?: string };
    addLog(`❌ Lỗi khởi động scan: ${err.message || String(e)}`, 'error');
    scanning.value = false;
  }
};

const stopScan = async () => {
  stopPoll();
  try { await ApiClient.stopAllCrawlers(); } catch (_) {}
  scanning.value = false;
  addLog('⏹ Đã yêu cầu dừng tất cả crawler.', 'warning');
};

const clearLogs = () => { logs.value = []; };
onUnmounted(stopPoll);
</script>
