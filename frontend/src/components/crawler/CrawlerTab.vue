<!-- @id 01M4V0HMMYPS07J4VMVA1PVV7Q -->
<!-- @related 01M4V0HMMX16CTKCDHJHWXZKTA, 01M4V0HMMVBBWHXC5609Q6682C, 01M4V0HMMW8W0PDCDGDYSZJBYQ, 01M4V0HMMS4A7D3ZXQ6S7D6B6A, 01M4V18JXRGFZS2AGBE3VJD8SP -->
<template>
  <div class="space-y-4">
    <!-- Panel Tự Động Quét Theo Lịch -->
    <CrawlerSchedule :total-provinces="totalProvinces" />

    <!-- Toolbar: Tìm kiếm, Bộ lọc trạng thái, Sắp xếp, Nút Crawl Bố Cáo và Chế độ xem -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        <div class="relative flex-1 md:w-52">
          <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">🔍</span>
          <input type="text" v-model="searchKeyword" placeholder="Tìm tỉnh thành, prefix..."
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500">
          <button v-if="searchKeyword" @click="searchKeyword = ''" class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 text-xs">✕</button>
        </div>

        <select v-model="statusFilter" class="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <option value="all">⚡ Tất cả trạng thái</option>
          <option value="running">🟢 Đang chạy</option>
          <option value="paused">🟡 Tạm dừng</option>
          <option value="stopped">⚪ Đã dừng</option>
        </select>

        <select v-model="sortBy" class="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
          <option value="default">↕ Sắp xếp mặc định</option>
          <option value="scan_recent">🕒 Quét gần đây nhất</option>
          <option value="speed_desc">🚀 Tốc độ cao nhất</option>
          <option value="db_desc">📊 DB nhiều nhất</option>
          <option value="found_desc">✨ Tìm thấy nhiều nhất</option>
          <option value="name_asc">🔤 Tên tỉnh A-Z</option>
        </select>
      </div>

      <!-- Nút Crawl Bố Cáo & View Mode Switcher -->
      <div class="flex flex-wrap items-center justify-between md:justify-end gap-2.5 w-full md:w-auto">
        <!-- Nút Cập Nhật Max TIN & Nút Crawl Bố Cáo -->
        <button @click="openMaxTinModal('')" title="Đối soát và cập nhật lại Max TIN thủ công cho từng tỉnh hoặc toàn quốc"
          class="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0">
          <span>🎯</span><span>Cập Nhật Max TIN</span>
        </button>

        <button @click="showBocaoModal = true" title="Crawl bổ sung MST theo danh sách Mã Số Doanh Nghiệp Bố Cáo ĐKKD"
          class="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 shrink-0">
          <span>📰</span><span>Crawl Bố Cáo</span>
          <span v-if="bocaoPendingCount > 0" class="px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-mono">{{ bocaoPendingCount }}</span>
        </button>

        <span class="text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span class="text-indigo-600 dark:text-indigo-400 font-bold">{{ filteredProvinces.length }}</span>/{{ totalProvinces }} tỉnh
        </span>

        <div class="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-700">
          <button @click="viewMode = 'grid'" class="px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1"
            :class="viewMode === 'grid' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">⊞ Lưới</button>
          <button @click="viewMode = 'list'" class="px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1"
            :class="viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'">☰ Bảng</button>
        </div>
      </div>
    </div>

    <!-- Trạng thái trống khi lọc không ra kết quả -->
    <div v-if="filteredProvinces.length === 0" class="bg-white dark:bg-slate-800 rounded-2xl p-10 text-center border border-slate-200 dark:border-slate-700 space-y-2">
      <div class="text-3xl">🔍</div>
      <p class="text-slate-700 dark:text-slate-200 font-semibold text-sm">Không tìm thấy tỉnh thành nào phù hợp với bộ lọc.</p>
      <button @click="resetFilters" class="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-bold text-xs rounded-xl transition">🔄 Đặt lại bộ lọc</button>
    </div>

    <!-- Hiển thị dạng Lưới (Grid) hoặc Danh Sách (List Table) -->
    <CrawlerGrid v-else-if="viewMode === 'grid'" :provinces="filteredProvinces"
      @start-prov="$emit('start-prov', $event)" @pause-prov="$emit('pause-prov', $event)" @stop-prov="$emit('stop-prov', $event)"
      @open-max-tin="openMaxTinModal($event)" />
    <CrawlerList v-else :provinces="filteredProvinces"
      @start-prov="$emit('start-prov', $event)" @pause-prov="$emit('pause-prov', $event)" @stop-prov="$emit('stop-prov', $event)"
      @open-max-tin="openMaxTinModal($event)" />

    <!-- Modals -->
    <CrawlerBocao :visible="showBocaoModal" @close="showBocaoModal = false" @sync-complete="loadBocaoCount" />
    <UpdateMaxTinModal :visible="showMaxTinModal" :initial-province-key="targetMaxTinProvKey" :province-configs="provinceConfigs" @close="showMaxTinModal = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ApiClient } from '@/api/client';
import type { ProvinceConfig, ProvinceStatus } from '@/types';
import CrawlerSchedule from './CrawlerSchedule.vue';
import CrawlerGrid from './CrawlerGrid.vue';
import CrawlerList from './CrawlerList.vue';
import CrawlerBocao from './CrawlerBocao.vue';
import UpdateMaxTinModal from './UpdateMaxTinModal.vue';

interface ProvinceItem {
  key: string;
  prov: ProvinceConfig;
  status: ProvinceStatus;
}

const props = defineProps<{
  provinceConfigs: Record<string, ProvinceConfig>;
  provinceStatus: Record<string, ProvinceStatus>;
}>();

defineEmits<{
  (e: 'start-prov', key: string): void;
  (e: 'pause-prov', key: string): void;
  (e: 'stop-prov', key: string): void;
}>();

const viewMode = ref<'grid' | 'list'>('list');
const searchKeyword = ref('');
const statusFilter = ref<'all' | 'running' | 'paused' | 'stopped'>('all');
const sortBy = ref('default');
const showBocaoModal = ref(false);
const bocaoPendingCount = ref(0);
const showMaxTinModal = ref(false);
const targetMaxTinProvKey = ref('');

const openMaxTinModal = (key = '') => {
  targetMaxTinProvKey.value = key;
  showMaxTinModal.value = true;
};

const getProvStatus = (key: string): ProvinceStatus => (props.provinceStatus && props.provinceStatus[key]) || {
  running: false, paused: false, queried: 0, found: 0, speed: 0,
  last_tin: '', last_scanned_at: '', uptime: '00:00:00', db_count: 0
};

const totalProvinces = computed(() => Object.keys(props.provinceConfigs || {}).length);

const filteredProvinces = computed<ProvinceItem[]>(() => {
  const list: ProvinceItem[] = [];
  const kw = searchKeyword.value.trim().toLowerCase();
  for (const key in props.provinceConfigs) {
    const prov = props.provinceConfigs[key];
    const status = getProvStatus(key);
    if (kw && !key.toLowerCase().includes(kw)) continue;
    if (statusFilter.value === 'running' && (!status.running || status.paused)) continue;
    if (statusFilter.value === 'paused' && (!status.running || !status.paused)) continue;
    if (statusFilter.value === 'stopped' && status.running) continue;
    list.push({ key, prov, status });
  }
  if (sortBy.value === 'scan_recent') list.sort((a, b) => (b.status.last_scanned_at || '').localeCompare(a.status.last_scanned_at || ''));
  else if (sortBy.value === 'speed_desc') list.sort((a, b) => (b.status.speed || 0) - (a.status.speed || 0));
  else if (sortBy.value === 'db_desc') list.sort((a, b) => (b.status.db_count || 0) - (a.status.db_count || 0));
  else if (sortBy.value === 'found_desc') list.sort((a, b) => (b.status.found || 0) - (a.status.found || 0));
  else if (sortBy.value === 'name_asc') list.sort((a, b) => a.key.localeCompare(b.key, 'vi'));
  return list;
});

const loadBocaoCount = async () => {
  try {
    const s = await ApiClient.getBocaoReconcileStats() as { retry_later_count?: number; unmatched_count?: number };
    bocaoPendingCount.value = (s.retry_later_count || 0) + (s.unmatched_count || 0);
  } catch (_) {}
};

const resetFilters = () => {
  searchKeyword.value = '';
  statusFilter.value = 'all';
  sortBy.value = 'default';
};

onMounted(loadBocaoCount);
</script>
