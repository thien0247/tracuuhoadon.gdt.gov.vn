<!-- @id 01M4V0HMN8CRGK8ASNXFFBPNMN -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
    <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] flex flex-col justify-between">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Tốc Độ Quét</span>
        <span class="text-[9px] font-bold text-[var(--vnpt-blue)] bg-blue-50 dark:bg-blue-950 px-1 py-0.5 rounded">Max: {{ maxRps }} rps</span>
      </div>
      <div class="flex items-center justify-between mt-1">
        <div class="text-xl font-extrabold text-[var(--vnpt-blue)] font-mono tabular-nums">
          {{ master.total_speed || 0 }} <span class="text-[10px] font-normal text-[var(--text-muted)]">req/s</span>
        </div>
        <div class="flex items-center bg-[var(--bg-secondary)] rounded-lg p-0.5 border border-[var(--border-color)]">
          <button @click="$emit('change-rps', -2)" class="w-5 h-5 flex items-center justify-center font-bold hover:bg-[var(--bg-card)] rounded text-xs">-</button>
          <input type="number" :value="maxRps" @change="$emit('update-rps', Number(($event.target as HTMLInputElement).value))" class="w-8 text-center text-xs font-bold font-mono bg-transparent border-0 p-0 text-[var(--text-primary)] focus:ring-0">
          <button @click="$emit('change-rps', 2)" class="w-5 h-5 flex items-center justify-center font-bold hover:bg-[var(--bg-card)] rounded text-xs">+</button>
        </div>
      </div>
    </div>
    <div class="card-glass p-3 rounded-xl border border-[var(--border-color)]">
      <span class="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Đang Chạy</span>
      <div class="text-xl font-extrabold text-emerald-600 mt-1 font-mono tabular-nums">{{ master.running_count || 0 }} <span class="text-[10px] font-normal text-[var(--text-muted)]">tỉnh</span></div>
    </div>
    <div class="card-glass p-3 rounded-xl border border-[var(--border-color)]">
      <span class="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Tổng Đã Quét</span>
      <div class="text-xl font-extrabold text-[var(--text-primary)] mt-1 font-mono tabular-nums">{{ formatNumber(master.total_queried) }}</div>
    </div>
    <div class="card-glass p-3 rounded-xl border border-[var(--border-color)]">
      <span class="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Tổng Tìm Thấy</span>
      <div class="text-xl font-extrabold text-emerald-600 mt-1 font-mono tabular-nums">{{ formatNumber(master.total_found) }}</div>
    </div>
    <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] col-span-2 md:col-span-1">
      <span class="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Dữ Liệu DB</span>
      <div class="text-xl font-extrabold text-purple-600 mt-1 font-mono tabular-nums">{{ formatNumber(master.total_db_records) }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MasterMetrics } from '@/types';

defineProps<{
  master: MasterMetrics;
  maxRps: number;
}>();

defineEmits<{
  (e: 'change-rps', delta: number): void;
  (e: 'update-rps', val: number): void;
}>();

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');
</script>
