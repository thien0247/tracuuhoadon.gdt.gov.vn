<!-- @id 01M4V0HMN1N415JXZC6T3VRPFK -->
<!-- @related 01M4V0HMN0GKMBZKKM224EFBG7, 01M4V0HMMAGER9D326B643B5RY, 01M4V0HMNZYFQF5C97DPYG8AR4, 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ -->
<template>
  <div class="space-y-4">
    <!-- Live Progress Panel nếu có Job đang hoạt động -->
    <EnrichmentProg v-if="activeJob" :job="activeJob" @stop="stopOnline" />

    <!-- 4 Thẻ KPI Tổng Quan -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="card-glass p-3 rounded-xl border border-[var(--border-color)]">
        <div class="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Tổng Bản Ghi DB</div>
        <div class="text-2xl font-extrabold text-[var(--vnpt-blue)] mt-1 font-mono tabular-nums">{{ formatNumber(summary.totalRecords) }}</div>
      </div>
      <div class="card-glass p-3 rounded-xl border border-[var(--border-color)]">
        <div class="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Đã Xác Thực API</div>
        <div class="text-2xl font-extrabold text-emerald-600 mt-1 font-mono tabular-nums">{{ formatNumber(summary.enrichedCount) }}</div>
      </div>
      <div class="card-glass p-3 rounded-xl border border-[var(--border-color)]">
        <div class="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Chờ Xác Thực</div>
        <div class="text-2xl font-extrabold text-amber-600 mt-1 font-mono tabular-nums">{{ formatNumber(summary.pendingCount) }}</div>
      </div>
      <div class="card-glass p-3 rounded-xl border border-[var(--border-color)]">
        <div class="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Tỷ Lệ Hoàn Thành</div>
        <div class="text-2xl font-extrabold text-purple-600 mt-1 font-mono tabular-nums">{{ summary.completionRate }}%</div>
      </div>
    </div>

    <!-- Thanh Công Cụ Lọc & Thao Tác Nhanh -->
    <div class="card-glass p-2.5 rounded-xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2 flex-wrap">
        <div class="relative">
          <input v-model="searchQuery" type="text" placeholder="Tìm tên tỉnh, tiền tố..."
                 class="px-2.5 py-1.5 pl-7 text-xs border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] w-44">
          <span class="absolute left-2 top-1.5 text-xs text-[var(--text-muted)]">🔍</span>
        </div>
        <div class="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg text-xs font-medium border border-[var(--border-color)]">
          <button @click="filterMode = 'all'" :class="filterMode === 'all' ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)]'" class="px-2.5 py-1 rounded-md transition">Tất Cả</button>
          <button @click="filterMode = 'incomplete'" :class="filterMode === 'incomplete' ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)]'" class="px-2.5 py-1 rounded-md transition">Chưa Xong (&lt;100%)</button>
          <button @click="filterMode = 'completed'" :class="filterMode === 'completed' ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)]'" class="px-2.5 py-1 rounded-md transition">Hoàn Thành (100%)</button>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button @click="resetUnverified(null)" title="Làm sạch dữ liệu suy đoán không chuẩn xác để đồng bộ chuẩn từ API"
                class="py-1.5 px-3 rounded-xl border border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1">
          <span>🧹</span><span>Làm Sạch Dữ Liệu Cũ</span>
        </button>
        <button @click="loadSummary" :disabled="loading" class="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-xs font-semibold transition">
          <span :class="loading ? 'animate-spin' : ''">🔄</span>
        </button>
      </div>
    </div>

    <!-- Bảng Thống Kê & Đồng Bộ 62 Tỉnh Thành -->
    <div class="card-glass rounded-xl border border-[var(--border-color)] overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-[var(--text-primary)]">
          <thead class="bg-[var(--bg-secondary)] text-[var(--text-secondary)] uppercase font-bold border-b border-[var(--border-color)] text-[11px]">
            <tr>
              <th class="p-3">Tỉnh / Thành</th>
              <th class="p-3 text-center">Tiền Tố</th>
              <th class="p-3 text-right">Tổng MST</th>
              <th class="p-3 text-right">Đã Xác Thực</th>
              <th class="p-3 text-right">Còn Thiếu</th>
              <th class="p-3">Tiến Độ API</th>
              <th class="p-3 text-center">Trạng Thái</th>
              <th class="p-3 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-color)]">
            <tr v-for="p in filteredProvinces" :key="p.prefix" class="hover:bg-[var(--bg-card-hover)] transition-colors">
              <td class="p-3 font-bold text-sm">{{ p.provinceName }}</td>
              <td class="p-3 text-center font-mono font-bold text-[var(--vnpt-blue)]">{{ p.prefix }}</td>
              <td class="p-3 text-right font-mono tabular-nums">{{ formatNumber(p.totalRecords) }}</td>
              <td class="p-3 text-right font-mono tabular-nums text-emerald-600 font-semibold">{{ formatNumber(p.enrichedCount) }}</td>
              <td class="p-3 text-right font-mono tabular-nums text-amber-600 font-semibold">{{ formatNumber(p.pendingCount) }}</td>
              <td class="p-3 w-44">
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div class="h-full transition-all duration-500" :class="p.completionRate >= 100 ? 'bg-emerald-500' : p.completionRate > 0 ? 'bg-indigo-500' : 'bg-slate-400'" :style="{ width: p.completionRate + '%' }"></div>
                  </div>
                  <span class="font-mono text-[11px] font-bold w-12 text-right">{{ p.completionRate }}%</span>
                </div>
              </td>
              <td class="p-3 text-center">
                <span v-if="p.isRunning" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300 animate-pulse">Đang Sync API</span>
                <span v-else-if="p.completionRate >= 100" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Hoàn thành</span>
                <span v-else class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Chờ sync</span>
              </td>
              <td class="p-3 text-right space-x-1 whitespace-nowrap">
                <button v-if="!p.isRunning" @click="startOnline(p)" title="Bắt đầu đồng bộ API trực tuyến chuẩn xác" class="py-1 px-2.5 rounded-lg font-bold text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition">🔄 Sync API</button>
                <button v-else @click="stopOnline(p.prefix)" title="Dừng tiến trình đồng bộ" class="py-1 px-2.5 rounded-lg font-bold text-[11px] bg-rose-600 hover:bg-rose-500 text-white transition">⏹ Dừng</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import EnrichmentProg from './EnrichmentProg.vue';
import { ApiClient } from '../../api/client';
import type { EnrichmentJob, EnrichmentProvince, EnrichmentSummary } from '../../types';

const loading = ref(false);
const searchQuery = ref('');
const filterMode = ref<'all' | 'incomplete' | 'completed'>('all');
const summary = ref<EnrichmentSummary>({ totalRecords: 0, enrichedCount: 0, pendingCount: 0, completionRate: 0 });
const provinces = ref<EnrichmentProvince[]>([]);
const activeJob = ref<EnrichmentJob | null>(null);
let pollTimer: ReturnType<typeof setInterval> | null = null;

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

const checkJobs = async () => {
  try {
    const res = await ApiClient.getEnrichmentJobs();
    const running = res?.jobs?.find(j => j.isRunning);
    activeJob.value = running || (res?.jobs?.length ? res.jobs[res.jobs.length - 1] : null);
    if (running && !pollTimer) {
      pollTimer = setInterval(checkJobs, 1500);
    } else if (!running && pollTimer) {
      clearInterval(pollTimer); pollTimer = null;
      await loadSummary();
    }
  } catch (e) { console.error('Lỗi kiểm tra jobs:', e); }
};

const loadSummary = async () => {
  loading.value = true;
  try {
    const data = await ApiClient.getEnrichmentSummary();
    if (data?.summary) summary.value = data.summary;
    if (data?.provinces) provinces.value = data.provinces;
    await checkJobs();
  } catch (e) { console.error('Lỗi tải thống kê:', e); }
  finally { loading.value = false; }
};

const filteredProvinces = computed(() => {
  let list = provinces.value.slice();
  const q = searchQuery.value.trim().toLowerCase();
  if (q) list = list.filter(p => p.provinceName.toLowerCase().includes(q) || p.prefix.includes(q));
  if (filterMode.value === 'incomplete') list = list.filter(p => p.completionRate < 100);
  if (filterMode.value === 'completed') list = list.filter(p => p.completionRate >= 100);
  return list;
});

const resetUnverified = async (prefix: string | null = null) => {
  const msg = prefix ? `Reset tỉnh ${prefix}?` : 'Reset toàn bộ dữ liệu suy đoán để sync chuẩn từ API?';
  if (!confirm(msg)) return;
  try {
    const res = await ApiClient.resetUnverifiedEnrichment(prefix) as { message: string };
    alert(res?.message || 'Đã reset hoàn tất!'); await loadSummary();
  } catch (e: unknown) { alert('Lỗi: ' + (e instanceof Error ? e.message : String(e))); }
};

const startOnline = async (p: EnrichmentProvince) => {
  try { await ApiClient.startProvinceOnlineSync(p.prefix); p.isRunning = true; await checkJobs(); }
  catch (e: unknown) { alert('Lỗi: ' + (e instanceof Error ? e.message : String(e))); }
};

const stopOnline = async (prefix: string) => {
  try { await ApiClient.stopProvinceOnlineSync(prefix); await checkJobs(); }
  catch (e: unknown) { alert('Lỗi: ' + (e instanceof Error ? e.message : String(e))); }
};

onMounted(() => { loadSummary(); });
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer); });
</script>
