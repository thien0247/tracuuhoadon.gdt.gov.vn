<!-- @id 01M4V0HMNDPX7HQ2MD3BTTFVNS -->
<!-- @related 01M4V0HMNFP54NSRTMHYDMZ9M4, 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ -->
<template>
  <div class="space-y-2.5">
    <div class="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-3.5 shadow-sm border border-slate-300 dark:border-slate-700 space-y-2.5">
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
        <div class="flex items-center gap-2">
          <span class="text-sm">🔍</span>
          <span class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">Bộ Lọc Doanh Nghiệp Đa Cấp</span>
          <div class="inline-flex rounded bg-slate-100 dark:bg-slate-700 p-0.5 text-xs font-semibold ml-2">
            <button @click="modelMode = 'v2'; onFilter()" :class="modelMode === 'v2' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-300'" class="px-2 py-0.5 rounded transition flex items-center gap-1 text-[11px]">
              <span>🏛️</span><span>Mô hình 2 Cấp</span>
            </button>
            <button @click="modelMode = 'v3'; onFilter()" :class="modelMode === 'v3' ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-slate-600 dark:text-slate-300'" class="px-2 py-0.5 rounded transition flex items-center gap-1 text-[11px]">
              <span>🏢</span><span>Mô hình 3 Cấp</span>
            </button>
          </div>
        </div>
        <button @click="resetAllFilters" class="text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 font-medium transition">↻ Đặt lại</button>
      </div>

      <div v-if="modelMode === 'v2'" class="grid grid-cols-1 md:grid-cols-3 gap-2 bg-indigo-50/40 dark:bg-indigo-950/20 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/40">
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">1. Tỉnh / Thành phố Mới (V2):</label>
          <MultiSelect v-model="filterV2Prov" :options="provsV2" placeholder="Chọn tỉnh mới (35 tỉnh)..." @change="onV2ProvChange" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">2. Xã Mới (V2 - Đã Bỏ Huyện):</label>
          <MultiSelect v-model="filterV2Comm" :options="commsV2" placeholder="Chọn xã mới..." :disabled="loadingOptions" :loading="loadingOptions" @change="onFilter" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">3. Mạng Lưới Thuế Cơ Sở (V2):</label>
          <MultiSelect v-model="filterV2Tax" :options="taxsV2" placeholder="Chọn thuế cơ sở..." :disabled="loadingOptions" :loading="loadingOptions" @change="onFilter" />
        </div>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-2 bg-emerald-50/40 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100/60 dark:border-emerald-900/40">
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">1. Tỉnh / TP Cũ (V3):</label>
          <MultiSelect v-model="filterV3Prov" :options="provsV3" placeholder="Chọn tỉnh cũ (64 tỉnh)..." @change="onV3ProvChange" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">2. Quận / Huyện (V3):</label>
          <MultiSelect v-model="filterV3Dist" :options="distsV3" placeholder="Chọn quận/huyện..." :disabled="loadingOptions" :loading="loadingOptions" @change="onV3DistChange" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">3. Xã / Phường Cũ (V3):</label>
          <MultiSelect v-model="filterV3Comm" :options="commsV3" placeholder="Chọn xã/phường..." :disabled="loadingOptions || !filterV3Dist.length" :loading="loadingOptions" @change="onFilter" />
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">4. Cơ Quan Thuế GDT:</label>
          <MultiSelect v-model="filterV3Tax" :options="taxsV3" placeholder="Chọn Chi cục / Cục Thuế..." :disabled="loadingOptions" :loading="loadingOptions" @change="onFilter" />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-5 gap-2 pt-0.5">
        <div><label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Từ ngày ĐKKD:</label><input type="date" v-model="filterFromDate" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100"></div>
        <div><label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Đến ngày ĐKKD:</label><input type="date" v-model="filterToDate" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100"></div>
        <div class="flex items-end gap-1.5 col-span-3">
          <button @click="onFilter" :disabled="filtering" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded shadow-sm transition text-xs disabled:opacity-50">{{ filtering ? 'Đang lọc...' : '🔍 Lọc Dữ Liệu' }}</button>
          <div class="relative">
            <button @click="showExportMenu = !showExportMenu" :disabled="filterRows.length === 0" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1 px-2.5 rounded shadow-sm transition text-xs disabled:opacity-50 flex items-center gap-1"><span>💾</span><span>Xuất File ▾</span></button>
            <div v-if="showExportMenu" class="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-1 text-xs">
              <button @click="onExport('csv')" class="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200"><span>📄</span> Xuất CSV Toàn Bộ</button>
              <button @click="onExport('xlsx')" class="w-full text-left px-3 py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-2"><span>📊</span> Xuất Excel XLSX</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="filterCount !== null" class="text-xs font-semibold text-slate-600 dark:text-slate-400 pt-1 flex items-center justify-between flex-wrap gap-2">
        <div>Tìm thấy <span class="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{{ formatNumber(filterCount) }}</span> kết quả. <span class="text-slate-400 font-normal">(Xem trước {{ pageSize }} dòng • Kèm cột SĐT & V2/V3)</span></div>
        <div class="text-[11px] font-medium" :class="modelMode === 'v2' ? 'text-indigo-700 dark:text-indigo-300' : 'text-emerald-700 dark:text-emerald-300'">Chế độ: {{ modelMode === 'v2' ? '🏛️ Mô hình 2 Cấp (Mới HTKK V2)' : '🏢 Mô hình 3 Cấp (Cũ HTKK V3)' }}</div>
      </div>
    </div>
    <FilterTable :rows="filterRows" :loading="filtering" :page-size="pageSize" @change-page-size="onPageSizeChange" @select-tin="$emit('select-tin', $event)" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ApiClient } from '@/api/client';
import { useTablePageSize } from '@/composables/useTablePageSize';
import MultiSelect from '@/components/common/MultiSelect.vue';
import FilterTable from './FilterTable.vue';

interface OptionItem { code: string; name: string }
defineProps<{ provinceConfigs?: Record<string, unknown> }>();
defineEmits<{ (e: 'select-tin', tin: string): void }>();

const { pageSize, setPageSize } = useTablePageSize('gdt_filter_table_page_size', 50, 'pageSize');
const onPageSizeChange = (sz: number) => { setPageSize(sz); onFilter(); };

const modelMode = ref<'v2' | 'v3'>('v2');
const filterV2Prov = ref<string[]>([]), filterV2Comm = ref<string[]>([]), filterV2Tax = ref<string[]>([]);
const filterV3Prov = ref<string[]>([]), filterV3Dist = ref<string[]>([]), filterV3Comm = ref<string[]>([]), filterV3Tax = ref<string[]>([]);
const filterFromDate = ref(''), filterToDate = ref(''), filterRows = ref<(string | number | null)[][]>([]);
const filterCount = ref<number | null>(null), filtering = ref(false), loadingOptions = ref(false), showExportMenu = ref(false);
const provsV2 = ref<OptionItem[]>([]), commsV2 = ref<OptionItem[]>([]), taxsV2 = ref<OptionItem[]>([]);
const provsV3 = ref<OptionItem[]>([]), distsV3 = ref<OptionItem[]>([]), commsV3 = ref<OptionItem[]>([]), taxsV3 = ref<OptionItem[]>([]);

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

const loadOptionsV2 = async (provCode = '') => {
  loadingOptions.value = true;
  try {
    const res = await ApiClient.getFilterOptions({ model: 'v2', province_code: provCode }) as unknown as { provinces?: OptionItem[]; communes?: OptionItem[]; taxOffices?: OptionItem[] };
    if (!provCode) provsV2.value = res.provinces || [];
    commsV2.value = res.communes || []; taxsV2.value = res.taxOffices || [];
  } catch { commsV2.value = []; taxsV2.value = []; }
  finally { loadingOptions.value = false; }
};

const loadOptionsV3 = async (provCode = '') => {
  loadingOptions.value = true;
  try {
    const res = await ApiClient.getFilterOptions({ model: 'v3', province_code: provCode }) as unknown as { provinces?: OptionItem[]; districts?: OptionItem[]; taxOffices?: OptionItem[] };
    if (!provCode) provsV3.value = res.provinces || [];
    distsV3.value = res.districts || []; commsV3.value = []; taxsV3.value = res.taxOffices || [];
  } catch { distsV3.value = []; commsV3.value = []; taxsV3.value = []; }
  finally { loadingOptions.value = false; }
};

const loadCommunesV3 = async (provCode = '', distCode = '') => {
  if (!distCode) { commsV3.value = []; return; }
  try {
    const res = await ApiClient.getFilterOptions({ model: 'v3', province_code: provCode, district_code: distCode }) as unknown as { communes?: OptionItem[] };
    commsV3.value = res.communes || [];
  } catch { commsV3.value = []; }
};

const onV2ProvChange = () => { filterV2Comm.value = []; filterV2Tax.value = []; loadOptionsV2(filterV2Prov.value[0] || ''); onFilter(); };
const onV3ProvChange = () => { filterV3Dist.value = []; filterV3Comm.value = []; filterV3Tax.value = []; loadOptionsV3(filterV3Prov.value[0] || ''); onFilter(); };
const onV3DistChange = () => { filterV3Comm.value = []; loadCommunesV3(filterV3Prov.value[0] || '', filterV3Dist.value[0] || ''); onFilter(); };

const onFilter = async () => {
  filtering.value = true;
  try {
    const payload: Record<string, unknown> = {
      from_date: filterFromDate.value, to_date: filterToDate.value,
      model_mode: modelMode.value, limit: pageSize.value
    };
    if (modelMode.value === 'v2') {
      payload.v2_province_codes = filterV2Prov.value;
      payload.v2_commune_codes = filterV2Comm.value;
      payload.v2_tax_office_codes = filterV2Tax.value;
    } else {
      payload.v3_province_codes = filterV3Prov.value;
      payload.v3_district_codes = filterV3Dist.value;
      payload.v3_commune_names = filterV3Comm.value;
      payload.pay_taxo_ids = filterV3Tax.value;
    }
    const data = await ApiClient.filterRecords(payload);
    filterRows.value = data.rows || [];
    filterCount.value = data.count || 0;
  } catch (e: unknown) { alert('Lỗi lọc: ' + String(e)); }
  finally { filtering.value = false; }
};

const resetAllFilters = () => {
  filterV2Prov.value = []; filterV2Comm.value = []; filterV2Tax.value = [];
  filterV3Prov.value = []; filterV3Dist.value = []; filterV3Comm.value = []; filterV3Tax.value = [];
  filterFromDate.value = ''; filterToDate.value = '';
  loadOptionsV2(''); loadOptionsV3(''); onFilter();
};

const onExport = (format: 'csv' | 'xlsx') => {
  showExportMenu.value = false;
  const provs = modelMode.value === 'v2' ? filterV2Prov.value : filterV3Prov.value;
  const comms = modelMode.value === 'v2' ? filterV2Comm.value : filterV3Comm.value;
  const taxs = modelMode.value === 'v2' ? filterV2Tax.value : filterV3Tax.value;
  const args = [provs, filterFromDate.value, filterToDate.value, comms, taxs] as const;
  const url = format === 'xlsx' ? ApiClient.getExportXlsxUrl(...args) : ApiClient.getExportUrl(...args);
  window.open(url, '_blank');
};

onMounted(() => { loadOptionsV2(''); loadOptionsV3(''); onFilter(); });
</script>
