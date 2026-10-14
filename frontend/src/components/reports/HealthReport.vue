<!-- @id 01M4V0HMNCXQ9YSTN0952D9K7Q -->
<!-- @related 01M4V47G4V5SH5205T3XW0HQMA, 01M4V47G4VE6FHKY2R9W1ZRDAE, 01M4V47G4V7PJV9C98H5Q3EG2G, 01M4V0HMKSY4WCNXSND8ER981Y -->
<template>
  <div class="space-y-4">
    <!-- 1. Thẻ tổng quan 4 trạng thái -->
    <HealthStatusCards
      :summary="summary"
      :current-status="statusFilter"
      :selected-days="selectedDays"
      @select-status="statusFilter = $event"
    />

    <!-- 2. Hàng điều khiển Bộ lọc & Xuất Excel -->
    <HealthFilterBar
      v-model:search-query="searchQuery"
      v-model:status-filter="statusFilter"
      v-model:has-new-filter="hasNewFilter"
      v-model:sort-by="sortBy"
      :selected-days="selectedDays"
      :filtered-count="filteredProvinces.length"
      :total-count="reportData?.provinces?.length || 62"
      :loading="loading"
      @change-days="changeDays"
      @reset-filters="resetFilters"
      @refresh="$emit('refresh', selectedDays)"
      @export-excel="exportExcel"
    />

    <!-- 3. Bảng Dữ Liệu Sức Khỏe & Độ Đặc Dải Số -->
    <HealthTable
      :provinces="filteredProvinces"
      :selected-days="selectedDays"
      @select-tin="$emit('select-tin', $event)"
      @scan-province="$emit('scan-province', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import HealthStatusCards from './health/HealthStatusCards.vue';
import HealthFilterBar from './health/HealthFilterBar.vue';
import HealthTable from './health/HealthTable.vue';

interface HealthItem {
  province: string; prefix: string; tin_max: string; max_regi_date: string;
  days_diff?: number | null; new_records_in_range?: number; total_records?: number;
  density_rate?: number; status: 'healthy' | 'warning' | 'stalled';
}

interface ReportData {
  summary?: { total?: number; healthy?: number; warning?: number; stalled?: number };
  provinces?: HealthItem[];
}

const props = withDefaults(defineProps<{ reportData?: ReportData; loading?: boolean }>(), {
  reportData: () => ({ summary: {}, provinces: [] }), loading: false
});

const emit = defineEmits<{
  (e: 'refresh', days: number): void;
  (e: 'scan-province', provName: string): void;
  (e: 'select-tin', tin: string): void;
}>();

const selectedDays = ref(3);
const statusFilter = ref('all');
const hasNewFilter = ref('all');
const sortBy = ref('days_desc');
const searchQuery = ref('');

const summary = computed(() => props.reportData?.summary || { total: 0, healthy: 0, warning: 0, stalled: 0 });

const filteredProvinces = computed<HealthItem[]>(() => {
  let list = (props.reportData?.provinces || []).slice();
  const q = searchQuery.value.trim().toLowerCase();
  if (q) list = list.filter((p) => p.province.toLowerCase().includes(q) || p.prefix.includes(q));
  if (statusFilter.value !== 'all') list = list.filter((p) => p.status === statusFilter.value);
  if (hasNewFilter.value === 'has_new') list = list.filter((p) => (p.new_records_in_range || 0) > 0);
  if (hasNewFilter.value === 'no_new') list = list.filter((p) => (p.new_records_in_range || 0) === 0);

  list.sort((a, b) => {
    if (sortBy.value === 'days_desc') return ((b.days_diff ?? 9999) - (a.days_diff ?? 9999));
    if (sortBy.value === 'new_desc') return (b.new_records_in_range || 0) - (a.new_records_in_range || 0);
    if (sortBy.value === 'density_asc') return (a.density_rate || 0) - (b.density_rate || 0);
    return sortBy.value === 'prefix_asc' ? a.prefix.localeCompare(b.prefix) : a.province.localeCompare(b.province);
  });
  return list;
});

const resetFilters = () => { statusFilter.value = 'all'; hasNewFilter.value = 'all'; sortBy.value = 'days_desc'; searchQuery.value = ''; };
const changeDays = (days: number) => { selectedDays.value = days; emit('refresh', days); };
const exportExcel = () => { window.open(`/api/reports/health-excel?days=${selectedDays.value}`, '_blank'); };
</script>
