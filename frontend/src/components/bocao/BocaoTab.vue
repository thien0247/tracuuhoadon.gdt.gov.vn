<!-- @id 01M4V0HMMH14JRZKVYT1R8EGQX -->
<!-- @related 01M4V0HMMC9CR0CWQBZ372WK6Q, 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div class="space-y-4">
    <!-- Thống kê & Quản lý cào dữ liệu bố cáo ĐKKD -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-700 space-y-3.5">
      <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
        <div class="flex items-center gap-2.5">
          <span class="text-xl">📰</span>
          <div>
            <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">Cổng Bố Cáo Đăng Ký Doanh Nghiệp (DKKD)</h2>
            <p class="text-[11px] text-slate-500">Giám sát và cào tự động thông tin đăng ký doanh nghiệp mới nhất toàn quốc</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500">Tổng lưu trữ: <b class="text-indigo-600 font-mono">{{ formatNumber(stats.total_records) }}</b> bản ghi</span>
          <span class="text-slate-300">|</span>
          <span class="text-xs text-slate-500">Mới nhất: <b class="text-slate-700 font-mono">{{ stats.latest_pub_time ? String(stats.latest_pub_time).substring(0, 10) : 'Chưa có' }}</b></span>
        </div>
      </div>

      <!-- Khối tác vụ Cào thủ công & Cào tự động -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div class="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-800 dark:text-slate-200">🚀 Cào Bố Cáo Thủ Công</span>
            <div class="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Số trang:</span>
              <input type="number" v-model.number="maxPages" min="1" max="50" class="w-12 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-center">
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="handleCrawl(false)" :disabled="crawling" class="flex-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1">
              <span v-if="crawling" class="animate-spin">⏳</span><span>Cào Trang 1</span>
            </button>
            <button @click="handleCrawl(true)" :disabled="crawling" class="flex-1 py-1.5 px-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1">
              <span v-if="crawling" class="animate-spin">⏳</span><span>Cào {{ maxPages }} Trang</span>
            </button>
          </div>
          <div v-if="crawlMessage" class="text-xs font-semibold" :class="crawlMessage.startsWith('✅') ? 'text-emerald-600' : 'text-rose-600'">{{ crawlMessage }}</div>
        </div>
        <BocaoAutoCrawl @crawled="onAutoCrawled" />
      </div>

      <!-- Bộ Lọc Bố Cáo -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1">
        <input v-model="filterKeyword" @keyup.enter="loadRecords(1)" placeholder="Tìm MST hoặc Tên DN..." class="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500">
        <select v-model="filterType" @change="loadRecords(1)" class="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500">
          <option value="">-- Tất cả Loại Công Bố --</option>
          <option value="Đăng ký mới">Đăng ký mới</option><option value="Đăng ký thay đổi">Đăng ký thay đổi</option>
          <option value="Thông báo thay đổi">Thông báo thay đổi</option><option value="Giải thể">Giải thể</option><option value="Vi phạm">Vi phạm / Thu hồi</option>
        </select>
        <input v-model="filterProvince" @keyup.enter="loadRecords(1)" placeholder="Lọc theo Tỉnh/TP..." class="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500">
        <button @click="loadRecords(1)" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow-sm transition">🔍 Lọc Dữ Liệu</button>
      </div>
    </div>

    <!-- Bảng Dữ Liệu Bố Cáo -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-700 dark:text-slate-200">
          <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700 text-[10px]">
            <tr>
              <th class="p-2.5">Thời Gian Công Bố</th><th class="p-2.5">Mã Số Doanh Nghiệp</th>
              <th class="p-2.5">Tên Doanh Nghiệp</th><th class="p-2.5">Địa Điểm</th><th class="p-2.5">Loại Công Bố</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60 text-[11px]">
            <tr v-if="loading"><td colspan="5" class="p-6 text-center text-slate-400 italic">Đang nạp dữ liệu bố cáo...</td></tr>
            <tr v-else-if="errorText"><td colspan="5" class="p-6 text-center text-rose-500 font-semibold">{{ errorText }}</td></tr>
            <tr v-else-if="records.length === 0"><td colspan="5" class="p-6 text-center text-slate-400 italic">Không tìm thấy bản ghi bố cáo nào.</td></tr>
            <tr v-for="r in records" :key="r.id" class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
              <td class="p-2.5 font-mono text-slate-600 dark:text-slate-400 text-[10px] whitespace-nowrap">{{ r.pub_time ? String(r.pub_time).substring(0, 19).replace('T', ' ') : '---' }}</td>
              <td class="p-2.5 font-mono font-bold">
                <div class="flex items-center gap-1.5">
                  <button @click="$emit('select-tin', r.tin)" class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"><span>{{ r.tin }}</span><span class="text-[10px]">👁️</span></button>
                  <button @click="$emit('open-solr', r.tin)" class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">DKKD</button>
                </div>
              </td>
              <td class="p-2.5 font-semibold text-slate-900 dark:text-slate-100 max-w-sm truncate" :title="r.company_name">{{ r.company_name }}</td>
              <td class="p-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{{ r.province_name || '---' }}</td>
              <td class="p-2.5"><span class="px-2 py-0.5 rounded-full text-[10px] font-medium border" :class="getTypeBadgeClass(r.announcement_type)">{{ r.announcement_type }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
        <span class="text-slate-500 dark:text-slate-400">Hiển thị <b>{{ records.length }}</b> / {{ formatNumber(total) }} bản ghi (Trang {{ page }} / {{ totalPages }})</span>
        <div class="flex items-center gap-1.5">
          <button @click="loadRecords(page - 1)" :disabled="page <= 1" class="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40">◀ Trước</button>
          <button @click="loadRecords(page + 1)" :disabled="page >= totalPages" class="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 disabled:opacity-40">Sau ▶</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ApiClient } from '@/api/client';
import BocaoAutoCrawl from './BocaoAutoCrawl.vue';

interface BocaoItem { id?: number; pub_time?: string; tin: string; company_name?: string; province_name?: string; announcement_type?: string }
defineEmits<{ (e: 'select-tin', tin: string): void; (e: 'open-solr', q: string): void }>();

const records = ref<BocaoItem[]>([]), total = ref(0), page = ref(1), limit = ref(20);
const loading = ref(false), crawling = ref(false), crawlMessage = ref(''), maxPages = ref(5);
const errorText = ref(''), filterType = ref(''), filterKeyword = ref(''), filterProvince = ref('');
const stats = ref<{ total_records?: number; latest_pub_time?: string }>({ total_records: 0 });

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');
const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1);

const loadStats = async () => {
  try {
    const res = await ApiClient.getBocaoStats();
    if (res) stats.value = res as { total_records?: number; latest_pub_time?: string };
  } catch (_) {}
};

const loadRecords = async (p = 1) => {
  page.value = p; loading.value = true; errorText.value = '';
  try {
    const res = await ApiClient.getBocaoRecords({
      page: String(page.value), limit: String(limit.value),
      keyword: filterKeyword.value, type: filterType.value, province: filterProvince.value
    });
    records.value = res.records || []; total.value = res.total || 0;
  } catch (e: unknown) {
    errorText.value = 'Lỗi nạp dữ liệu bố cáo: ' + ((e as Error).message || String(e));
  } finally { loading.value = false; }
};

const handleCrawl = async (isAll = false) => {
  crawling.value = true; crawlMessage.value = '';
  try {
    const res = (isAll ? await ApiClient.crawlAllBocao(maxPages.value || 5) : await ApiClient.crawlBocao()) as { success?: boolean; pages_crawled?: number; total_found?: number; new_inserted?: number; error?: string };
    if (res.success) {
      crawlMessage.value = isAll ? `✅ Cào toàn bộ: ${res.pages_crawled} trang, ${res.total_found} tin (Mới: ${res.new_inserted}).` : `✅ Cào trang 1: ${res.total_found} tin (Mới: ${res.new_inserted}).`;
      await loadStats(); await loadRecords(1);
    } else { crawlMessage.value = `⚠️ Lỗi: ${res.error || 'Thất bại'}`; }
  } catch (e: unknown) { crawlMessage.value = `❌ Lỗi: ${String(e)}`; }
  finally { crawling.value = false; }
};

const onAutoCrawled = async () => { await loadStats(); await loadRecords(1); };
const getTypeBadgeClass = (t?: string) => {
  if (!t) return 'bg-slate-100 text-slate-700';
  if (t.includes('Đăng ký mới')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (t.includes('thay đổi')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (t.includes('Giải thể') || t.includes('Thu hồi')) return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-indigo-50 text-indigo-700 border-indigo-200';
};

onMounted(() => { loadStats(); loadRecords(1); });
</script>
