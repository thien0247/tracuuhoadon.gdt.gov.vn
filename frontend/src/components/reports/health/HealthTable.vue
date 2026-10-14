<!-- @id 01M4V47G4V7PJV9C98H5Q3EG2G -->
<!-- @related 01M4V0HMNCXQ9YSTN0952D9K7Q, 01M4V47G4V5SH5205T3XW0HQMA -->
<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 text-xs uppercase">
          <tr>
            <th class="p-3">Tỉnh / Thành</th>
            <th class="p-3 text-center">Tiền Tố</th>
            <th class="p-3">TIN Max</th>
            <th class="p-3">Ngày ĐKKD Mới Nhất</th>
            <th class="p-3 text-center">MST Mới ({{ selectedDays }}d)</th>
            <th class="p-3 text-right">Tổng MST</th>
            <th class="p-3 text-center">Độ Đặc Dải Số</th>
            <th class="p-3 text-center">Trạng Thái</th>
            <th class="p-3 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
          <tr v-for="row in provinces" :key="row.prefix" class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
            <td class="p-3 font-medium text-slate-800 dark:text-slate-100">{{ row.province }}</td>
            <td class="p-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{{ row.prefix }}</td>
            <td class="p-3 font-mono font-semibold">
              <button v-if="row.tin_max" @click="$emit('select-tin', row.tin_max)" title="Xem chi tiết doanh nghiệp"
                      class="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono font-bold transition">
                <span>{{ row.tin_max }}</span><span class="text-[10px]">👁️</span>
              </button>
              <span v-else class="text-slate-400">---</span>
            </td>
            <td class="p-3 font-mono text-slate-600 dark:text-slate-300">
              {{ row.max_regi_date }}
              <span v-if="row.days_diff != null" class="text-slate-400 ml-1">({{ row.days_diff }}d trước)</span>
            </td>
            <td class="p-3 text-center">
              <span v-if="(row.new_records_in_range || 0) > 0" class="font-bold text-emerald-600 font-mono">
                +{{ Number(row.new_records_in_range).toLocaleString('vi-VN') }} MST
              </span>
              <span v-else class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500">
                0 MST
              </span>
            </td>
            <td class="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200">
              {{ Number(row.total_records || 0).toLocaleString('vi-VN') }}
            </td>
            <td class="p-3 text-center font-mono">
              <span v-if="(row.density_rate || 0) >= 85" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                🟢 {{ row.density_rate }}% (Đặc)
              </span>
              <span v-else-if="(row.density_rate || 0) >= 70" class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">
                🟡 {{ row.density_rate }}% (TB)
              </span>
              <span v-else class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200">
                🔴 {{ row.density_rate }}% (Hổng)
              </span>
            </td>
            <td class="p-3 text-center">
              <span v-if="row.status === 'healthy'" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">🟢 Bình Thường</span>
              <span v-else-if="row.status === 'warning'" class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">🟡 Cần Chú Ý</span>
              <span v-else class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200">🔴 Tắc Nghẽn</span>
            </td>
            <td class="p-3 text-right">
              <button @click="triggerScan(row.province)" :disabled="scanningKey === row.province"
                      class="px-2 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-600 hover:text-white transition">
                {{ scanningKey === row.province ? '⏳...' : '⚡ Quét' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface HealthItem {
  province: string; prefix: string; tin_max: string; max_regi_date: string;
  days_diff?: number | null; new_records_in_range?: number; total_records?: number;
  density_rate?: number; status: 'healthy' | 'warning' | 'stalled';
}

defineProps<{ provinces: HealthItem[]; selectedDays: number }>();
const emit = defineEmits<{ (e: 'select-tin', tin: string): void; (e: 'scan-province', prov: string): void }>();

const scanningKey = ref('');
const triggerScan = (provName: string) => {
  scanningKey.value = provName;
  emit('scan-province', provName);
  setTimeout(() => { scanningKey.value = ''; }, 1500);
};
</script>
