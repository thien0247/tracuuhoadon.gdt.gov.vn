<!-- @id 01M4V47G4VQ5MSFSE5GY342ARG -->
<!-- @related 01M4V0HMNAYS9S56HXX3Y4Z264, 01M4V0HMKT18F1B47H0XK719NY -->
<template>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
    <div v-for="c in cards" :key="c.t" class="card-glass p-3 rounded-xl border border-[var(--border-color)]">
      <div class="text-[10px] font-semibold text-[var(--text-muted)] uppercase">{{ c.t }}</div>
      <div class="text-xl font-black mt-0.5 font-mono truncate" :class="c.c">{{ c.v }}</div>
      <div class="text-[10px] text-[var(--text-muted)] font-mono">{{ c.s }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  timeField: string;
  totalRecords: number;
  todayCount: number;
  peakPeriod: string | null;
  peakCount: number;
  avgPerPeriod: number;
  periodCount: number;
}>();

const formatNum = (v: number | string | null | undefined) => Number(v || 0).toLocaleString('vi-VN');

const cards = computed(() => [
  {
    t: props.timeField === 'regi_date' ? 'Tổng Doanh Nghiệp ĐKKD' : 'Tổng MST Quét Được',
    v: formatNum(props.totalRecords),
    s: props.timeField === 'regi_date' ? 'Bảng regi_stats_daily' : 'Bảng crawl_stats_daily',
    c: 'text-[var(--vnpt-blue)]'
  },
  {
    t: props.timeField === 'regi_date' ? 'Hôm Nay (ĐKKD Mới)' : 'Hôm Nay (Quét Mới)',
    v: `${formatNum(props.todayCount)} MST`,
    s: 'Ghi nhận trong ngày',
    c: 'text-emerald-600'
  },
  {
    t: 'Kỳ Cao Điểm Nhất',
    v: props.peakPeriod || '---',
    s: `${formatNum(props.peakCount)} MST`,
    c: 'text-purple-600'
  },
  {
    t: 'Trung Bình / Kỳ',
    v: formatNum(props.avgPerPeriod),
    s: `${props.periodCount} mốc`,
    c: 'text-amber-600'
  }
]);
</script>
