<!-- @id 01M4V47G4VR70SH6GQBVBSQJEX -->
<!-- @related 01M4V0HMNAYS9S56HXX3Y4Z264, 01M4V47G4VQ5MSFSE5GY342ARG -->
<template>
  <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] space-y-2">
    <div class="flex items-center justify-between pb-1 border-b border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] uppercase">
      <span>🏆 Top Tỉnh Thành</span><span class="text-[10px] text-[var(--text-muted)]">Tỷ lệ %</span>
    </div>
    <div class="space-y-1 max-h-64 overflow-y-auto pr-1">
      <div v-for="(prov, idx) in topProvinces" :key="prov.prefix" class="space-y-0.5">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-[var(--text-primary)] truncate">
            <b class="font-mono text-[var(--vnpt-blue)]">#{{ idx + 1 }}</b> {{ prov.province_name }} ({{ prov.prefix }})
          </span>
          <span class="font-mono font-bold">{{ formatNum(prov.count) }} <span class="text-[10px] text-[var(--text-muted)]">({{ prov.percentage }}%)</span></span>
        </div>
        <div class="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden">
          <div class="bg-[var(--vnpt-blue)] h-full rounded-full transition-all" :style="{ width: prov.percentage + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TopProvItem { prefix: string; province_name: string; count: number; percentage: number }

defineProps<{ topProvinces: TopProvItem[] }>();

const formatNum = (v: number | string | null | undefined) => Number(v || 0).toLocaleString('vi-VN');
</script>
