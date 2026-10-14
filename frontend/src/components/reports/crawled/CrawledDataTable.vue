<!-- @id 01M4V47G4VQFT8YE37TNFCG3Q9 -->
<!-- @related 01M4V0HMNAYS9S56HXX3Y4Z264, 01M4V47G4VQ5MSFSE5GY342ARG -->
<template>
  <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] space-y-2">
    <div class="flex items-center justify-between pb-1 border-b border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] uppercase">
      <span>📋 Bảng Số Liệu ({{ timeField === 'regi_date' ? 'Ngày ĐKKD' : 'Ngày Quét' }} - {{ timeline.length }} mốc)</span>
      <button @click="$emit('export-csv')" class="px-2 py-0.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-500 transition flex items-center gap-1 shadow-sm">
        <span>📥 Xuất CSV</span>
      </button>
    </div>
    <div class="overflow-x-auto max-h-64 overflow-y-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-semibold uppercase sticky top-0">
          <tr>
            <th class="p-1.5">{{ timeField === 'regi_date' ? 'Ngày ĐKKD' : 'Ngày Quét' }}</th>
            <th class="p-1.5 text-right">Số Lượng MST</th>
            <th class="p-1.5 text-right">Tỷ Trọng</th>
            <th class="p-1.5 w-28">Tiến Độ</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--border-color)]">
          <tr v-for="row in (timeline || []).slice().reverse()" :key="row.period" class="hover:bg-[var(--bg-secondary)] transition">
            <td class="p-1.5 font-mono font-bold text-[var(--text-primary)]">📅 {{ row.label }}</td>
            <td class="p-1.5 text-right font-mono font-extrabold text-blue-600 dark:text-blue-400">{{ formatNum(row.count) }} MST</td>
            <td class="p-1.5 text-right font-mono text-[var(--text-muted)]">{{ ((row.count / (totalRecords || 1)) * 100).toFixed(1) }}%</td>
            <td class="p-1.5">
              <div class="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
                <div class="bg-[var(--vnpt-blue)] h-full rounded-full" :style="{ width: Math.min((row.count / (maxVal || 1)) * 100, 100) + '%' }"></div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TimelineItem { period: string; count: number; label: string }

defineProps<{
  timeField: string;
  timeline: TimelineItem[];
  totalRecords: number;
  maxVal: number;
}>();

defineEmits<{ (e: 'export-csv'): void }>();

const formatNum = (v: number | string | null | undefined) => Number(v || 0).toLocaleString('vi-VN');
</script>
