<!-- @id 01M4V0HMMRHY97GSJ5BP8N9DWG -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
    <div class="flex items-center justify-between">
      <span class="text-sm font-bold text-slate-800 dark:text-slate-100">📋 Nhật Ký Đa Tỉnh Real-time (Console Log)</span>
      <div class="flex items-center gap-3">
        <label class="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
          <input type="checkbox" :checked="autoScroll" @change="$emit('update:autoScroll', ($event.target as HTMLInputElement).checked)"
            class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
          Tự động cuộn
        </label>
        <button @click="$emit('clear-logs')"
          class="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 px-3 py-1 rounded-lg transition-all">
          Xóa Log
        </button>
      </div>
    </div>

    <div ref="logContainer"
      class="bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl h-60 overflow-y-auto space-y-1 shadow-inner">
      <div v-if="logs.length === 0" class="text-slate-500 italic">Chưa có dữ liệu log...</div>
      <div v-for="(log, idx) in logs" :key="idx"
        :class="getLogClass(log)">
        {{ log }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = withDefaults(defineProps<{
  logs?: string[];
  autoScroll?: boolean;
}>(), {
  logs: () => [],
  autoScroll: true
});

defineEmits<{
  (e: 'clear-logs'): void;
  (e: 'update:autoScroll', val: boolean): void;
}>();

const logContainer = ref<HTMLElement | null>(null);

const getLogClass = (log: string) => {
  if (log.includes('FOUND')) return 'text-emerald-400 font-semibold';
  if (log.includes('WARNING')) return 'text-amber-300';
  if (log.includes('ERROR')) return 'text-rose-400';
  return 'text-slate-300';
};

watch(() => props.logs.length, () => {
  if (props.autoScroll) {
    nextTick(() => {
      if (logContainer.value) {
        logContainer.value.scrollTop = logContainer.value.scrollHeight;
      }
    });
  }
});
</script>
