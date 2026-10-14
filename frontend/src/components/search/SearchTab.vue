<!-- @id 01M4V0HMNG67WYQGAJ650769V9 -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div class="space-y-2.5">
    <div class="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-3.5 shadow-sm border border-slate-300 dark:border-slate-700 space-y-2.5">
      <div class="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
        <h2 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <span>🔎</span><span>Tra Cứu Doanh Nghiệp (Ma Trận Dữ Liệu Resizable)</span>
        </h2>
        <span class="text-[11px] text-slate-400">Tra cứu tức thì • Kéo rê chỉnh cột • Tự động lưu cache</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div>
          <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Mã số thuế:</label>
          <input type="text" v-model="searchTin" @keyup.enter="onSearch" placeholder="VD: 0316341824"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 font-mono focus:ring-1 focus:ring-indigo-500">
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Tên công ty:</label>
          <input type="text" v-model="searchName" @keyup.enter="onSearch" placeholder="VD: CÔNG TY TNHH..."
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500">
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">Lọc theo tỉnh thành:</label>
          <select v-model="searchProvKey"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500">
            <option value="">-- Tất cả tỉnh thành --</option>
            <option v-for="(_, key) in provinceConfigs" :key="key" :value="key">{{ key }}</option>
          </select>
        </div>
        <div class="flex items-end gap-1.5">
          <button @click="onSearch" :disabled="searching"
            class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded shadow-sm transition text-xs disabled:opacity-50 flex items-center justify-center gap-1">
            <span>{{ searching ? '⏳' : '🔍' }}</span><span>{{ searching ? 'Đang tìm...' : 'Tra Cứu' }}</span>
          </button>
          <button @click="clearSearch" class="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-1 px-2.5 rounded transition text-xs">
            ✖
          </button>
        </div>
      </div>

      <div v-if="searchCount !== null" class="text-[11px] font-semibold text-slate-600 dark:text-slate-400 pt-0.5 flex items-center justify-between">
        <div>Tìm thấy <span class="text-indigo-600 dark:text-indigo-400 font-bold font-mono">{{ formatNumber(searchCount) }}</span> kết quả trong CSDL. <span class="text-slate-400 font-normal">(Nạp ma trận {{ pageSize }} dòng • Tự động lưu cache & URL)</span></div>
      </div>
    </div>

    <!-- Bảng kết quả tìm kiếm với TanStack Table v8 hỗ trợ Resizing -->
    <SearchTable :rows="searchRows" :count="searchCount" :loading="searching" :page-size="pageSize" @change-page-size="onPageSizeChange" @select-tin="$emit('select-tin', $event)" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ApiClient } from '@/api/client';
import { useTablePageSize } from '@/composables/useTablePageSize';
import SearchTable from './SearchTable.vue';

defineProps<{ provinceConfigs?: Record<string, unknown> }>();
defineEmits<{ (e: 'select-tin', tin: string): void }>();

const { pageSize, setPageSize } = useTablePageSize('gdt_search_table_page_size', 50, 'pageSize');

const searchTin = ref(''), searchName = ref(''), searchProvKey = ref('');
const searchRows = ref<(string | number | null)[][]>([]), searchCount = ref<number | null>(null), searching = ref(false);

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

const onPageSizeChange = (sz: number) => {
  setPageSize(sz);
  if (searchTin.value.trim() || searchName.value.trim()) onSearch();
};

const onSearch = async () => {
  const q = searchTin.value.trim() || searchName.value.trim();
  if (!q) {
    alert('Vui lòng nhập Mã Số Thuế hoặc Tên Công Ty để tìm kiếm.');
    return;
  }
  searching.value = true;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('q', q);
    if (searchProvKey.value) url.searchParams.set('prov', searchProvKey.value); else url.searchParams.delete('prov');
    url.searchParams.set('pageSize', String(pageSize.value));
    window.history.replaceState({}, '', url.toString());

    const data = await ApiClient.searchRecords({
      query: q,
      province_key: searchProvKey.value || null,
      limit: pageSize.value
    }) as { rows?: (string | number | null)[][]; count?: number };
    searchRows.value = data.rows || [];
    searchCount.value = data.count || 0;
  } catch (e: unknown) {
    alert('Lỗi tìm kiếm: ' + String(e));
  } finally {
    searching.value = false;
  }
};

const clearSearch = () => {
  searchTin.value = ''; searchName.value = ''; searchProvKey.value = '';
  searchRows.value = []; searchCount.value = null;
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('q'); url.searchParams.delete('prov');
    window.history.replaceState({}, '', url.toString());
  } catch {}
};

onMounted(() => {
  try {
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get('q'), prov = sp.get('prov');
    if (q) {
      if (/^\d+$/.test(q)) searchTin.value = q; else searchName.value = q;
      if (prov) searchProvKey.value = prov;
      onSearch();
    }
  } catch {}
});
</script>
