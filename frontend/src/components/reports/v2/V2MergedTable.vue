<!-- @id 01M4V47G4V2YGY5Z4S963HFZF7 -->
<!-- @related 01M4V47G4VGKW5RT15HK4K74BH, 01M4V47G4V5YD691DZ56FGV4B9, 01M4V0HMNAYS9S56HXX3Y4Z264 -->
<template>
  <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[var(--border-color)] text-xs">
      <div class="flex items-center gap-2">
        <span class="font-bold uppercase tracking-wider text-[var(--text-primary)]">🏛️ Bảng Số Liệu 34 Tỉnh Thành Mới Sau Sáp Nhập</span>
        <span class="text-[10px] text-[var(--text-muted)] font-mono">({{ filteredList.length }} đơn vị)</span>
      </div>
      <div class="flex items-center gap-2">
        <input v-model="searchQuery" type="text" placeholder="Tìm tên tỉnh mới hoặc tiền tố..."
               class="px-2.5 py-1 text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] w-48 font-medium">
        <button @click="exportExcel" class="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition flex items-center gap-1 shadow-sm">
          <span>📥 Xuất Excel V2</span>
        </button>
      </div>
    </div>

    <div class="overflow-x-auto max-h-[520px] overflow-y-auto">
      <table class="w-full text-left text-xs">
        <thead class="bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-semibold uppercase sticky top-0">
          <tr>
            <th class="p-2 text-center w-12">Mã V2</th>
            <th class="p-2">Tỉnh / Thành Phố Mới</th>
            <th class="p-2">Tỉnh Cũ Cấu Thành & Tiền Tố TIN</th>
            <th class="p-2 text-right">Số Lượng MST</th>
            <th class="p-2 text-right">Tỷ Trọng (%)</th>
            <th class="p-2 w-32">Phân Bổ Quy Mô</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[var(--border-color)]">
          <tr v-for="row in filteredList" :key="row.v2_code" class="hover:bg-[var(--bg-secondary)] transition">
            <td class="p-2 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">{{ row.v2_code }}</td>
            <td class="p-2 font-bold text-[var(--text-primary)]">{{ row.v2_name }}</td>
            <td class="p-2">
              <div class="flex flex-wrap gap-1">
                <span v-for="oldP in row.old_provinces" :key="oldP"
                      class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {{ oldP }}
                </span>
              </div>
            </td>
            <td class="p-2 text-right font-mono font-black text-blue-600 dark:text-blue-400">{{ formatNum(row.total_mst) }} MST</td>
            <td class="p-2 text-right font-mono font-bold text-[var(--text-muted)]">{{ row.percentage }}%</td>
            <td class="p-2">
              <div class="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
                <div class="bg-[var(--vnpt-blue)] h-full rounded-full transition-all" :style="{ width: Math.min(row.percentage * 3, 100) + '%' }"></div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface V2Item {
  v2_code: string;
  v2_name: string;
  prefixes: string[];
  old_provinces: string[];
  total_mst: number;
  percentage: number;
}

const props = defineProps<{ provinces: V2Item[] }>();
const searchQuery = ref('');

const formatNum = (v: number) => Number(v || 0).toLocaleString('vi-VN');

const filteredList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return props.provinces || [];
  return (props.provinces || []).filter(p =>
    p.v2_name.toLowerCase().includes(q) ||
    p.v2_code.includes(q) ||
    p.prefixes.some(pref => pref.includes(q)) ||
    p.old_provinces.some(op => op.toLowerCase().includes(q))
  );
});

const exportExcel = () => {
  window.open('/api/reports/v2-excel', '_blank');
};
</script>
