<!-- @id 01M4V47G4V1YPWK7W1WV2A4BMH -->
<!-- @related 01M4V0HMNAYS9S56HXX3Y4Z264, 01M4V47G4VQ5MSFSE5GY342ARG -->
<template>
  <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] space-y-2">
    <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-1 text-xs">
      <span class="font-bold uppercase tracking-wider text-[var(--text-primary)]">
        📈 Biểu Đồ Sản Lượng MST ({{ timeField === 'regi_date' ? 'Ngày ĐKKD' : 'Ngày Quét' }} - {{ chartData.points.length }} mốc)
      </span>
      <span class="font-mono text-[var(--text-muted)]">Đỉnh: <b class="text-[var(--vnpt-blue)]">{{ formatNum(chartData.maxVal) }}</b> MST</span>
    </div>

    <div class="relative w-full h-48 flex items-center justify-center overflow-x-auto">
      <svg v-if="chartData.points.length" viewBox="0 0 760 180" class="w-full h-full select-none" preserveAspectRatio="none">
        <line x1="20" y1="155" x2="745" y2="155" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1"/>
        <line x1="20" y1="85" x2="745" y2="85" stroke="currentColor" class="text-slate-200 dark:text-slate-800" stroke-dasharray="4" stroke-width="1"/>
        <g v-if="chartType === 'bar'"><g v-for="p in chartData.points" :key="p.period">
          <rect :x="p.x - p.width/2" :y="p.y" :width="p.width" :height="p.barH" rx="2"
                class="fill-blue-500 hover:fill-blue-600 transition-all cursor-pointer opacity-90 hover:opacity-100"
                @mouseenter="showTip($event, p)" @mouseleave="tooltip.visible = false"/>
          <text :x="p.x" :y="Math.max(p.y - 4, 10)" text-anchor="middle" class="text-[7.5px] fill-blue-600 dark:fill-blue-400 font-mono font-bold">{{ compactNum(p.count) }}</text>
          <text :x="p.x" y="168" text-anchor="middle" class="text-[7.5px] fill-slate-500 font-mono">{{ p.shortLabel }}</text>
        </g></g>
        <g v-else>
          <path :d="chartData.linePath" fill="none" stroke="#2563eb" stroke-width="2.5"/>
          <g v-for="p in chartData.points" :key="p.period">
            <circle :cx="p.x" :cy="p.y" r="3.5" class="fill-blue-600 stroke-white stroke-2 hover:r-5 cursor-pointer"
                    @mouseenter="showTip($event, p)" @mouseleave="tooltip.visible = false"/>
            <text :x="p.x" :y="Math.max(p.y - 6, 10)" text-anchor="middle" class="text-[7.5px] fill-blue-600 font-mono font-bold">{{ compactNum(p.count) }}</text>
            <text :x="p.x" y="168" text-anchor="middle" class="text-[7.5px] fill-slate-500 font-mono">{{ p.shortLabel }}</text>
          </g>
        </g>
      </svg>
      <div v-else class="text-xs text-[var(--text-muted)] py-10"><span>📭 Chưa có dữ liệu trong khoảng thời gian đã chọn</span></div>
    </div>

    <div v-if="tooltip.visible" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
         class="fixed -translate-x-1/2 -translate-y-full z-50 pointer-events-none bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-xl font-mono text-center">
      <div class="font-bold text-amber-300">📅 {{ timeField === 'regi_date' ? 'Ngày ĐKKD' : 'Ngày Quét' }}: {{ tooltip.label }}</div>
      <div class="font-bold text-blue-200">⚡ Số lượng: {{ formatNum(tooltip.count) }} MST</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface PointItem { period: string; count: number; label: string; x: number; y: number; barH: number; width: number; shortLabel: string }
interface ChartData { points: PointItem[]; maxVal: number; linePath: string }

defineProps<{ timeField: string; chartType: 'bar' | 'line'; chartData: ChartData }>();

const tooltip = ref({ visible: false, x: 0, y: 0, label: '', count: 0 });
const formatNum = (v: number | string | null | undefined) => Number(v || 0).toLocaleString('vi-VN');
const compactNum = (n: number) => n >= 1e6 ? (n/1e6).toFixed(1) + 'M' : (n >= 1e3 ? (n/1e3).toFixed(1) + 'k' : String(n));

const showTip = (evt: MouseEvent, item: { label: string; count: number }) => {
  const r = (evt.currentTarget as HTMLElement).getBoundingClientRect();
  tooltip.value = { visible: true, x: r.left + r.width / 2, y: r.top - 8, label: item.label, count: item.count };
};
</script>
