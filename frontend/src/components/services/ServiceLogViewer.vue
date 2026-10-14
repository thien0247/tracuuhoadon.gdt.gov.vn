<!-- @id 01M4V0HMNMFBJWYTTBY5817MCT -->
<!-- @related 01M4V0HMP0BNNZ0SW67AWG4GN2, 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col h-72">
    <!-- Terminal Header Toolbar -->
    <div class="px-4 py-2 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-2 text-slate-300 font-semibold font-mono">
        <span class="text-emerald-400">💻</span>
        <span>Live System Console</span>
        <span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
          {{ filteredLogs.length }} dòng
        </span>
      </div>

      <div class="flex items-center gap-2.5">
        <!-- Service Filter -->
        <select v-model="selectedService" class="bg-slate-800 text-slate-300 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 focus:outline-hidden">
          <option value="ALL">Tất cả dịch vụ</option>
          <option value="SYSTEM">System</option>
          <option value="WEBVIEW">WebView</option>
          <option value="SERVICE">Service</option>
          <option value="PROXY">Proxy</option>
          <option value="API">Fastify API</option>
        </select>

        <!-- Auto-scroll checkbox -->
        <label class="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
          <input type="checkbox" v-model="autoScroll" class="rounded bg-slate-800 border-slate-700 text-blue-500 w-3.5 h-3.5" />
          <span>Tự cuộn</span>
        </label>

        <!-- Copy button -->
        <button @click="handleCopy" class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition" title="Sao chép nhật ký">
          <span>{{ copied ? '✅' : '📋' }}</span>
        </button>

        <!-- Clear button -->
        <button @click="emit('clear')" class="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition" title="Xóa nhật ký">
          <span>🗑️</span>
        </button>
      </div>
    </div>

    <!-- Terminal Log Stream -->
    <div ref="logContainerRef" class="flex-1 overflow-y-auto p-3.5 space-y-1 font-mono text-[11px] leading-relaxed selection:bg-blue-600 selection:text-white">
      <div v-if="filteredLogs.length === 0" class="text-slate-500 italic py-8 text-center">
        Chưa có dữ liệu nhật ký hệ thống...
      </div>
      <div v-for="item in filteredLogs" :key="item.id" class="flex items-start gap-2 hover:bg-slate-800/40 px-1.5 py-0.5 rounded transition">
        <span class="text-slate-500 shrink-0 select-none">[{{ item.timestamp }}]</span>
        <span class="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-sky-400 shrink-0">
          {{ item.service }}
        </span>
        <span :class="getLevelColor(item.level)" class="break-all whitespace-pre-wrap">
          {{ item.message }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import type { ServiceLogMessage } from '../../types/service';

const props = defineProps<{ logs: ServiceLogMessage[] }>();
const emit = defineEmits<{ (e: 'clear'): void }>();

const selectedService = ref<string>('ALL');
const autoScroll = ref<boolean>(true);
const copied = ref<boolean>(false);
const logContainerRef = ref<HTMLDivElement | null>(null);

const filteredLogs = computed(() => {
  if (selectedService.value === 'ALL') return props.logs;
  return props.logs.filter(l => l.service.toUpperCase().includes(selectedService.value));
});

const scrollToBottom = async () => {
  if (!autoScroll.value || !logContainerRef.value) return;
  await nextTick();
  logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
};

watch(() => props.logs.length, scrollToBottom);

const handleCopy = async () => {
  const text = filteredLogs.value.map(l => `[${l.timestamp}] [${l.service}] ${l.message}`).join('\n');
  await navigator.clipboard.writeText(text);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
};

const getLevelColor = (level: ServiceLogMessage['level']) => {
  switch (level) {
    case 'error': return 'text-rose-400';
    case 'warn': return 'text-amber-400';
    case 'success': return 'text-emerald-400';
    default: return 'text-slate-300';
  }
};
</script>
