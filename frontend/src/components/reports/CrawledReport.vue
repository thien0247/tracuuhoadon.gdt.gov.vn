<!-- @id 01M4V0HMNAYS9S56HXX3Y4Z264 -->
<!-- @related 01M4V47G4VQ5MSFSE5GY342ARG, 01M4V47G4VGJ73KC86DBSSKW0W, 01M4V47G4V1YPWK7W1WV2A4BMH, 01M4V47G4V5YD691DZ56FGV4B9, 01M4V47G4V2YGY5Z4S963HFZF7 -->
<template>
  <div class="space-y-4">
    <!-- Filter bar với nút toggle 62 Tỉnh vs 34 Tỉnh Sáp Nhập V2 -->
    <CrawledFilterBar
      v-model:view-mode="viewMode"
      v-model:time-field="timeField"
      v-model:period="period"
      v-model:selected-province="selectedProvince"
      v-model:date-preset="datePreset"
      v-model:chart-type="chartType"
      :loading="loading"
      :syncing="syncing"
      :province-list="provinceList"
      @sync-stats="syncStats"
      @refresh="viewMode === 'traditional' ? fetchStats() : fetchV2Stats()"
      @export-excel="exportExcel"
    />

    <!-- Khối 1: Báo Cáo Sản Lượng 62 Tỉnh Thành -->
    <template v-if="viewMode === 'traditional'">
      <CrawledKpis
        :time-field="timeField"
        :total-records="stats.summary.total_records"
        :today-count="todayCount"
        :peak-period="stats.summary.peak_period"
        :peak-count="stats.summary.peak_count"
        :avg-per-period="stats.summary.avg_per_period"
        :period-count="stats.summary.period_count"
      />
      <CrawledSvgChart :time-field="timeField" :chart-type="chartType" :chart-data="chartData" />
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div class="lg:col-span-8">
          <CrawledDataTable :time-field="timeField" :timeline="stats.timeline" :total-records="stats.summary.total_records" :max-val="chartData.maxVal" @export-csv="exportCsv" />
        </div>
        <div class="lg:col-span-4">
          <CrawledTopProvinces :top-provinces="stats.top_provinces" />
        </div>
      </div>
    </template>

    <!-- Khối 2: Báo Cáo Thống Kê 34 Tỉnh Thành Sau Sáp Nhập (HTKK V2) -->
    <template v-else>
      <V2MergedKpis
        :total-provinces="v2Data.total_provinces"
        :total-mst="v2Data.total_national_mst"
        :top-province-name="v2Data.provinces[0]?.v2_name"
        :top-province-mst="v2Data.provinces[0]?.total_mst"
      />
      <V2MergedTable :provinces="v2Data.provinces" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import CrawledKpis from './crawled/CrawledKpis.vue';
import CrawledFilterBar from './crawled/CrawledFilterBar.vue';
import CrawledSvgChart from './crawled/CrawledSvgChart.vue';
import CrawledDataTable from './crawled/CrawledDataTable.vue';
import CrawledTopProvinces from './crawled/CrawledTopProvinces.vue';
import V2MergedKpis from './v2/V2MergedKpis.vue';
import V2MergedTable from './v2/V2MergedTable.vue';

interface StatsData {
  summary: { total_records: number; peak_period: string | null; peak_count: number; avg_per_period: number; period_count: number };
  timeline: Array<{ period: string; count: number; label: string }>;
  top_provinces: Array<{ prefix: string; province_name: string; count: number; percentage: number }>;
}

const props = defineProps<{ provinceConfigs?: Record<string, { prefix?: string }> }>();

const viewMode = ref<'traditional' | 'v2_merged'>('traditional');
const period = ref('day');
const timeField = ref('scraped_at');
const selectedProvince = ref('all');
const datePreset = ref('30d');
const chartType = ref<'bar' | 'line'>('bar');
const loading = ref(false);
const syncing = ref(false);

const stats = ref<StatsData>({ summary: { total_records: 0, peak_period: null, peak_count: 0, avg_per_period: 0, period_count: 0 }, timeline: [], top_provinces: [] });
const v2Data = ref<{ total_provinces: number; total_national_mst: number; provinces: any[] }>({ total_provinces: 34, total_national_mst: 0, provinces: [] });

const provinceList = computed(() => Object.entries(props.provinceConfigs || {})
  .map(([name, cfg]) => ({ key: name.toLowerCase().replace(/\s+/g, '_'), name, prefix: cfg.prefix })).sort((a, b) => a.name.localeCompare(b.name)));

const todayCount = computed(() => stats.value?.timeline?.find((t) => t.period === new Date().toISOString().split('T')[0])?.count || 0);

const fetchStats = async () => {
  loading.value = true;
  try {
    let fromDate = '';
    const days = { '7d': 7, '30d': 30, '90d': 90 }[datePreset.value as '7d' | '30d' | '90d'];
    if (days) { const d = new Date(); d.setDate(d.getDate() - days); fromDate = d.toISOString().split('T')[0]; }
    const q = new URLSearchParams({ period: period.value, time_field: timeField.value, province_key: selectedProvince.value, ...(fromDate ? { from_date: fromDate } : {}) });
    const res = await fetch(`/api/reports/crawl-stats?${q.toString()}`);
    if (res.ok) stats.value = await res.json();
  } catch (err) { console.error(err); } finally { loading.value = false; }
};

const fetchV2Stats = async () => {
  loading.value = true;
  try {
    const res = await fetch('/api/reports/v2-merged-stats');
    if (res.ok) v2Data.value = await res.json();
  } catch (err) { console.error(err); } finally { loading.value = false; }
};

const syncStats = async () => {
  syncing.value = true;
  try { const res = await fetch('/api/reports/sync-stats', { method: 'POST' }); if (res.ok) await fetchStats(); }
  catch (e) { console.error(e); } finally { syncing.value = false; }
};

const chartData = computed(() => {
  const list = stats.value?.timeline || [];
  if (!list.length) return { points: [], maxVal: 1, linePath: '' };
  const maxVal = Math.max(...list.map((t) => t.count), 1);
  const w = 760, h = 180, padX = 25, padY = 25;
  const step = (w - padX * 2) / Math.max(list.length, 1);
  const points = list.map((item, idx) => ({
    ...item, x: padX + idx * step + step / 2, y: h - padY - Math.max((item.count / maxVal) * (h - padY * 2), 3),
    barH: Math.max((item.count / maxVal) * (h - padY * 2), 3), width: Math.max(Math.min(step * 0.75, 28), 6),
    shortLabel: item.label.length >= 5 ? item.label.slice(0, 5) : item.label
  }));
  return { points, maxVal, linePath: points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') };
});

const exportCsv = () => {
  const tot = stats.value.summary.total_records || 1, rows = [['Ngày / Mốc', 'Số Lượng MST', 'Tỷ Lệ (%)']];
  stats.value.timeline.forEach((t) => rows.push([t.label, String(t.count), ((t.count / tot) * 100).toFixed(2)]));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' }));
  a.download = `san_luong_mst_${timeField.value}_${period.value}_${selectedProvince.value}.csv`;
  a.click();
};

const exportExcel = () => {
  const q = new URLSearchParams({ period: period.value, time_field: timeField.value, province_key: selectedProvince.value });
  window.open(`/api/reports/crawl-stats-excel?${q.toString()}`, '_blank');
};

onMounted(() => {
  fetchStats();
  fetchV2Stats();
});
</script>
