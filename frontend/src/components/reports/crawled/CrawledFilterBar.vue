<!-- @id 01M4V47G4VGJ73KC86DBSSKW0W -->
<!-- @related 01M4V0HMNAYS9S56HXX3Y4Z264, 01M4V47G4VQ5MSFSE5GY342ARG -->
<template>
  <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2.5">
    <div class="flex flex-wrap items-center gap-2">
      <!-- Toggle Chế Độ 62 Tỉnh vs 34 Tỉnh Sáp Nhập V2 -->
      <div class="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)] text-xs font-bold">
        <button @click="$emit('update:viewMode', 'traditional')" :class="viewMode === 'traditional' ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'" class="px-2.5 py-1 rounded transition">🏛️ 62 Tỉnh Thành</button>
        <button @click="$emit('update:viewMode', 'v2_merged')" :class="viewMode === 'v2_merged' ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'" class="px-2.5 py-1 rounded transition">🔄 34 Tỉnh Sáp Nhập</button>
      </div>

      <template v-if="viewMode === 'traditional'">
        <div class="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold">
          <button @click="$emit('update:timeField', 'scraped_at')" :class="timeField === 'scraped_at' ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'" class="px-2 py-1 rounded transition">🕒 Ngày Quét</button>
          <button @click="$emit('update:timeField', 'regi_date')" :class="timeField === 'regi_date' ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'" class="px-2 py-1 rounded transition">🏢 Ngày ĐKKD</button>
        </div>
        <div class="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold">
          <button v-for="p in [{k:'day', l:'📅 Ngày'}, {k:'month', l:'📆 Tháng'}, {k:'year', l:'🗓️ Năm'}]" :key="p.k"
                  @click="$emit('update:period', p.k)" :class="period === p.k ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'" class="px-2.5 py-1 rounded transition">{{ p.l }}</button>
        </div>
        <select :value="selectedProvince" @change="$emit('update:selectedProvince', ($event.target as HTMLSelectElement).value)"
                class="text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1 font-medium text-[var(--text-primary)]">
          <option value="all">🌐 Toàn Quốc (62 Tỉnh)</option>
          <option v-for="pr in provinceList" :key="pr.key" :value="pr.key">({{ pr.prefix }}) {{ pr.name }}</option>
        </select>
      </template>
    </div>

    <div class="flex items-center gap-2">
      <template v-if="viewMode === 'traditional'">
        <div class="flex items-center space-x-1">
          <button v-for="ps in [{k:'7d', l:'7d'}, {k:'30d', l:'30d'}, {k:'90d', l:'90d'}, {k:'all', l:'All'}]" :key="ps.k"
                  @click="$emit('update:datePreset', ps.k)" :class="datePreset === ps.k ? 'bg-[var(--vnpt-blue)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]'" class="px-2 py-1 text-xs font-medium rounded-lg transition">{{ ps.l }}</button>
        </div>
        <div class="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)] text-xs">
          <button @click="$emit('update:chartType', 'bar')" :class="chartType === 'bar' ? 'bg-[var(--vnpt-blue)] text-white' : 'text-[var(--text-secondary)]'" class="px-2 py-0.5 rounded">📊</button>
          <button @click="$emit('update:chartType', 'line')" :class="chartType === 'line' ? 'bg-[var(--vnpt-blue)] text-white' : 'text-[var(--text-secondary)]'" class="px-2 py-0.5 rounded">📈</button>
        </div>
        <button @click="$emit('export-excel')" class="px-2 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition flex items-center gap-1 shadow-sm">
          <span>📥 Excel</span>
        </button>
        <button @click="$emit('sync-stats')" :disabled="syncing" class="px-2 py-1 text-xs font-semibold bg-emerald-700 text-white rounded-lg flex items-center gap-1 transition">
          <span :class="syncing ? 'animate-spin' : ''">⚡</span><span>Đồng Bộ</span>
        </button>
      </template>
      <button @click="$emit('refresh')" :disabled="loading" class="px-2.5 py-1 text-xs font-semibold bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:opacity-90 flex items-center gap-1 transition">
        <span :class="loading ? 'animate-spin' : ''">🔄</span><span>Tải Lại</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  viewMode: 'traditional' | 'v2_merged';
  timeField: string;
  period: string;
  selectedProvince: string;
  datePreset: string;
  chartType: 'bar' | 'line';
  loading: boolean;
  syncing: boolean;
  provinceList: Array<{ key: string; name: string; prefix?: string }>;
}>();

defineEmits<{
  (e: 'update:viewMode', v: 'traditional' | 'v2_merged'): void;
  (e: 'update:timeField', v: string): void;
  (e: 'update:period', v: string): void;
  (e: 'update:selectedProvince', v: string): void;
  (e: 'update:datePreset', v: string): void;
  (e: 'update:chartType', v: 'bar' | 'line'): void;
  (e: 'sync-stats'): void;
  (e: 'refresh'): void;
  (e: 'export-excel'): void;
}>();
</script>
