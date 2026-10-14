<!-- @id 01M4V47G4V5SH5205T3XW0HQMA -->
<!-- @related 01M4V0HMNCXQ9YSTN0952D9K7Q, 01M4V0HMKSY4WCNXSND8ER981Y -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div v-for="c in statusCards" :key="c.key" @click="$emit('select-status', c.key)"
         :class="[c.border, currentStatus === c.key ? 'ring-2 ring-indigo-500 shadow' : '']"
         class="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition">
      <div>
        <div class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ c.label }}</div>
        <div class="text-2xl font-bold" :class="c.text">{{ c.val }}</div>
      </div>
      <div class="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-lg">{{ c.icon }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  summary: { total?: number; healthy?: number; warning?: number; stalled?: number };
  currentStatus: string;
  selectedDays: number;
}>();

defineEmits<{ (e: 'select-status', status: string): void }>();

const statusCards = computed(() => [
  { key: 'all', label: 'Tổng Số Tỉnh Thành', val: props.summary.total || 62, icon: '🏢', border: 'border-slate-200', text: 'text-slate-800 dark:text-slate-100' },
  { key: 'healthy', label: `Bình Thường (≤ ${props.selectedDays} ngày)`, val: props.summary.healthy || 0, icon: '🟢', border: 'border-emerald-200', text: 'text-emerald-700 dark:text-emerald-400' },
  { key: 'warning', label: 'Cần Chú Ý (4 - 7 ngày)', val: props.summary.warning || 0, icon: '🟡', border: 'border-amber-200', text: 'text-amber-700 dark:text-amber-400' },
  { key: 'stalled', label: 'Cảnh Báo Tắc Nghẽn (> 7 ngày)', val: props.summary.stalled || 0, icon: '🔴', border: 'border-rose-200', text: 'text-rose-700 dark:text-rose-400' }
]);
</script>
