<!-- @id 01M4V0HMMDYFYCBSHSRGXPKJWN -->
<!-- @related 01M4V0HMMJTV6V77PFNGJ4V8K7, 01M4V0HMMFFGPHK4310775K1XK, 01M4V0HMMAGER9D326B643B5RY, 01M4V0HMNZYFQF5C97DPYG8AR4, 01M4V0FH0TF34QKKRRBVF9H0XA -->
<template>
  <AiBadge name="BocaoReconcile" file="src/components/bocao/BocaoReconcile.vue" module="Bố Cáo ĐKKD" desc="Đối soát Mã số doanh nghiệp Bố Cáo với CSDL Thuế">
    <div class="space-y-4">
      <!-- Thẻ Thống Kê Đối Soát -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-xl">⚖️</span>
            <div>
              <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">Đối Soát Mã Số Doanh Nghiệp (Bố Cáo ĐKKD vs CSDL Thuế GDT)</h2>
              <p class="text-[11px] text-slate-500">Phát hiện doanh nghiệp mới công bố nhưng chưa có trong hệ thống CSDL Thuế (1.1M+ bản ghi)</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="syncMissing" :disabled="syncing || stats.unmatched_count === 0" class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50">
              <span v-if="syncing" class="animate-spin">⏳</span><span v-else>⚡</span>
              <span>Quét Bù Vào Thuế ({{ stats.unmatched_count }})</span>
            </button>
            <button @click="loadRecords(1); loadStats();" class="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 transition">↻ Làm Mới</button>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          <div v-for="c in cards" :key="c.t" :class="c.bg" class="p-3 rounded-xl border">
            <div :class="c.tc" class="text-[10px] uppercase font-bold">{{ c.t }}</div>
            <div :class="c.vc" class="text-lg font-black font-mono">{{ c.v }}</div>
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
            <button @click="setStatusFilter('all')" class="px-2.5 py-1 rounded-lg transition" :class="filterStatus==='all' ? 'bg-white dark:bg-slate-700 shadow-xs font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'">Tất Cả ({{ fmtNum(stats.total_bocao) }})</button>
            <button @click="setStatusFilter('retry_later')" class="px-2.5 py-1 rounded-lg transition flex items-center gap-1" :class="filterStatus==='retry_later' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-blue-700 dark:text-blue-400 hover:bg-blue-100/50'">
              <span>⏳ Chờ GDT sync</span><span class="text-[10px] opacity-90">({{ fmtNum(stats.retry_later_count || stats.unmatched_count) }})</span>
            </button>
            <button @click="setStatusFilter('unmatched')" class="px-2.5 py-1 rounded-lg transition flex items-center gap-1" :class="filterStatus==='unmatched' ? 'bg-amber-500 text-white shadow-xs font-bold' : 'text-amber-700 dark:text-amber-400 hover:bg-amber-100/50'">
              <span>⚠️ Chưa Có</span><span class="text-[10px] opacity-90">({{ fmtNum(stats.unmatched_count) }})</span>
            </button>
            <button @click="setStatusFilter('matched')" class="px-2.5 py-1 rounded-lg transition flex items-center gap-1" :class="filterStatus==='matched' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50'">
              <span>✅ Đã Khớp</span><span class="text-[10px] opacity-90">({{ fmtNum(stats.matched_count) }})</span>
            </button>
          </div>

          <div class="flex items-center gap-2 flex-1 max-w-md">
            <input v-model="filterKeyword" @keyup.enter="loadRecords(1)" placeholder="Tìm MST hoặc Tên..." class="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500">
            <input v-model="filterProvince" @keyup.enter="loadRecords(1)" placeholder="Tỉnh/TP..." class="w-28 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500">
            <button @click="loadRecords(1)" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded-lg text-xs shadow-sm transition">🔍 Lọc</button>
          </div>
        </div>
      </div>

      <BocaoScanPanel @scan-done="loadStats(); loadRecords(1);" />

      <!-- Bảng Dữ Liệu Đối Soát Song Song -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead class="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700 text-[10px]">
              <tr>
                <th class="p-2.5">Mã Số Doanh Nghiệp</th>
                <th class="p-2.5">Nguồn Bố Cáo ĐKKD</th>
                <th class="p-2.5">CSDL Thuế GDT (tax_records)</th>
                <th class="p-2.5 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
              <tr v-if="loading"><td colspan="4" class="p-6 text-center text-slate-400 italic">Đang nạp đối soát...</td></tr>
              <tr v-else-if="records.length === 0"><td colspan="4" class="p-6 text-center text-slate-400 italic">Không có bản ghi phù hợp.</td></tr>
              <tr v-for="r in records" :key="r.tin" class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td class="p-2.5 whitespace-nowrap align-top">
                  <div class="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">{{ r.tin }}</div>
                  <div class="mt-1 flex flex-col gap-0.5">
                    <span v-if="r.in_tax_records" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 w-fit">✅ Đã có trong Thuế</span>
                    <span v-else-if="r.sync_status === 'retry_later'" class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 w-fit">⏳ Chờ GDT sync</span>
                    <span v-else class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 w-fit">⚠️ Chưa có trong Thuế</span>
                  </div>
                </td>
                <td class="p-2.5 align-top max-w-xs">
                  <div class="font-semibold text-slate-900 dark:text-slate-100 leading-snug">{{ r.bocao_company_name }}</div>
                  <div class="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">{{ r.announcement_type }}</div>
                  <div class="text-[10px] text-slate-500">{{ r.bocao_province || 'Chưa rõ tỉnh' }}</div>
                </td>
                <td class="p-2.5 align-top max-w-xs">
                  <template v-if="r.in_tax_records">
                    <div class="font-semibold text-slate-900 dark:text-slate-100 leading-snug">{{ r.tax_company_name || 'Đã ghi nhận MST' }}</div>
                    <div class="text-[10px] text-emerald-600 font-medium mt-0.5">{{ r.tax_status || 'Hoạt động' }}</div>
                    <div class="text-[10px] text-slate-500 truncate">{{ r.tax_address || '---' }}</div>
                  </template>
                  <template v-else>
                    <div class="text-amber-600 italic font-medium">Doanh nghiệp mới — Chưa có bản ghi trong DB Thuế GDT.</div>
                  </template>
                </td>
                <td class="p-2.5 align-top text-center whitespace-nowrap">
                  <div class="flex items-center justify-center gap-1">
                    <button @click="emit('open-solr', r.tin)" class="px-2 py-1 text-[10px] font-bold rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200" title="Tra cứu Solr DKKD">🔍 DKKD</button>
                    <button @click="emit('view-detail', r.tin)" class="px-2 py-1 text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-900 text-white" title="Chi tiết Thuế GDT">👁️ GDT</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="totalPages > 1" class="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
          <span class="text-slate-500">Hiển thị <b>{{ records.length }}</b> / {{ fmtNum(total) }} bản ghi (Trang {{ page }} / {{ totalPages }})</span>
          <div class="flex items-center gap-1.5">
            <button @click="loadRecords(page - 1)" :disabled="page <= 1" class="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-40">◀ Trước</button>
            <button @click="loadRecords(page + 1)" :disabled="page >= totalPages" class="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 disabled:opacity-40">Sau ▶</button>
          </div>
        </div>
      </div>
    </div>
  </AiBadge>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AiBadge from '../common/AiBadge.vue';
import BocaoScanPanel from './BocaoScanPanel.vue';
import { ApiClient } from '../../api/client';
import type { BocaoRecord } from '../../types';

const emit = defineEmits<{
  (e: 'view-detail', tin: string): void;
  (e: 'open-solr', tin: string): void;
}>();

const records = ref<BocaoRecord[]>([]); const total = ref(0); const page = ref(1); const limit = ref(20);
const loading = ref(false); const syncing = ref(false);
const filterStatus = ref('all'); const filterKeyword = ref(''); const filterProvince = ref('');
const stats = ref<{ total_bocao: number; matched_count: number; unmatched_count: number; retry_later_count: number; match_rate: number }>({
  total_bocao: 0, matched_count: 0, unmatched_count: 0, retry_later_count: 0, match_rate: 0
});

const fmtNum = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');
const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1);
const cards = computed(() => [
  { t: 'Tổng Bố Cáo ĐKKD', v: fmtNum(stats.value.total_bocao), bg: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700', tc: 'text-slate-500', vc: 'text-slate-900 dark:text-white' },
  { t: 'Đã Có Trong Thuế GDT', v: fmtNum(stats.value.matched_count), bg: 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', tc: 'text-emerald-700 dark:text-emerald-400', vc: 'text-emerald-700 dark:text-emerald-400' },
  { t: 'Chờ GDT Sync', v: fmtNum(stats.value.retry_later_count || stats.value.unmatched_count), bg: 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', tc: 'text-blue-700 dark:text-blue-400', vc: 'text-blue-700 dark:text-blue-400' },
  { t: 'Tỷ Lệ Bao Phủ', v: `${stats.value.match_rate}%`, bg: 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800', tc: 'text-purple-700 dark:text-purple-400', vc: 'text-purple-700 dark:text-purple-400' }
]);

const loadStats = async () => {
  try {
    const res = await ApiClient.getBocaoReconcileStats() as typeof stats.value;
    if (res) stats.value = res;
  } catch (e) { console.error('Lỗi tải thống kê đối soát:', e); }
};

const loadRecords = async (p = 1) => {
  page.value = p; loading.value = true;
  try {
    const res = await ApiClient.getBocaoReconcile({
      page: String(page.value), limit: String(limit.value),
      status: filterStatus.value, keyword: filterKeyword.value, province: filterProvince.value
    }) as { records: BocaoRecord[]; total: number };
    records.value = res.records || []; total.value = res.total || 0;
  } catch (e: unknown) { alert('Lỗi tải danh sách đối soát: ' + (e instanceof Error ? e.message : String(e))); }
  finally { loading.value = false; }
};

const setStatusFilter = (st: string) => { filterStatus.value = st; loadRecords(1); };

const syncMissing = async () => {
  syncing.value = true;
  try {
    const res = await ApiClient.syncMissingBocao(60) as { message?: string };
    alert(res?.message || 'Đã hoàn thành quét bù!');
    await loadStats(); await loadRecords(page.value);
  } catch (e: unknown) { alert('Lỗi quét bù: ' + (e instanceof Error ? e.message : String(e))); }
  finally { syncing.value = false; }
};

onMounted(() => { loadStats(); loadRecords(1); });
</script>
