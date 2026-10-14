<!-- @id 01M4V47G4V5YD691DZ56FGV4B9 -->
<!-- @related 01M4V47G4VGKW5RT15HK4K74BH, 01M4V47G4V2YGY5Z4S963HFZF7, 01M4V0HMNAYS9S56HXX3Y4Z264 -->
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
  totalProvinces: number;
  totalMst: number;
  topProvinceName: string;
  topProvinceMst: number;
}>();

const formatNum = (v: number) => Number(v || 0).toLocaleString('vi-VN');

const cards = computed(() => [
  { t: 'Đơn Vị Hành Chính Mới', v: `${props.totalProvinces || 34} Tỉnh/TP`, s: 'Mô hình 2 cấp HTKK V2', c: 'text-[var(--vnpt-blue)]' },
  { t: 'Tổng Doanh Nghiệp Toàn Quốc', v: `${formatNum(props.totalMst)} MST`, s: 'Quy tụ từ 62 tỉnh cũ', c: 'text-emerald-600' },
  { t: 'Quy Mô Lớn Nhất', v: props.topProvinceName || 'TP. Hồ Chí Minh', s: `${formatNum(props.topProvinceMst)} MST`, c: 'text-purple-600' },
  { t: 'Tỷ Trọng Cực Tăng Trưởng', v: props.totalMst > 0 ? `${((props.topProvinceMst / props.totalMst) * 100).toFixed(1)}%` : '---', s: 'Đô thị hạt nhân', c: 'text-amber-600' }
]);
</script>
