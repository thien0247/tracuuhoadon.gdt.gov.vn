<!-- @id 01M4V0HMMW8W0PDCDGDYSZJBYQ -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-700 dark:text-slate-200">
        <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold border-b border-slate-200 dark:border-slate-700 text-[11px]">
          <tr>
            <th class="p-3.5">Tỉnh Thành</th>
            <th class="p-3.5">Trạng Thái</th>
            <th class="p-3.5">Chế Độ & Seed TIN</th>
            <th class="p-3.5">Luồng / Gap</th>
            <th class="p-3.5">Tiến Độ Quét</th>
            <th class="p-3.5">Lịch Sử Scan</th>
            <th class="p-3.5">TIN Min / Max</th>
            <th class="p-3.5 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/60">
          <tr v-for="item in provinces" :key="item.key"
            class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
            :class="item.status.running ? 'bg-emerald-50/20 dark:bg-emerald-950/20' : ''">

            <!-- Tỉnh thành & DB count -->
            <td class="p-3.5 whitespace-nowrap">
              <div class="font-bold text-slate-900 dark:text-slate-100 text-sm">{{ item.key }}</div>
              <div class="text-[11px] text-slate-400 font-mono">DB: {{ formatNumber(item.status.db_count) }} bản ghi</div>
            </td>

            <!-- Status Badge -->
            <td class="p-3.5 whitespace-nowrap">
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold border inline-flex items-center gap-1.5"
                :class="item.status.running ? (item.status.paused ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200') : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600'">
                <span class="w-1.5 h-1.5 rounded-full"
                  :class="item.status.running ? (item.status.paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-slate-400'"></span>
                <span>{{ item.status.running ? (item.status.paused ? 'Tạm Dừng' : 'Đang Quét') : 'Đã dừng' }}</span>
              </span>
            </td>

            <!-- Chế độ & Seed TIN -->
            <td class="p-3.5 whitespace-nowrap space-y-1.5">
              <select v-model="item.prov.scan_mode" :disabled="item.status.running"
                class="w-40 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-1 text-slate-800 dark:text-slate-100 font-medium">
                <option value="bidirectional">▶ 2 Chiều Song Song</option>
                <option value="newest">⚡ Quét Mới Nhất (TIN Max)</option>
                <option value="gap_fill">🧩 Quét Lấp Lỗ Hổng (Gap-Fill)</option>
                <option value="forward">Tịnh Tiến Lên (+)</option>
                <option value="backward">Tịnh Tiến Lùi (-)</option>
              </select>
              <input type="text" v-model="item.prov.seed_tin" :disabled="item.status.running"
                class="w-40 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-1 text-slate-700 dark:text-slate-200 block">
            </td>

            <!-- Luồng & Gap -->
            <td class="p-3.5 whitespace-nowrap space-y-1.5">
              <select v-model.number="item.prov.num_workers" :disabled="item.status.running"
                class="w-32 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-1 text-slate-800 dark:text-slate-100 font-medium">
                <option :value="1">1 luồng (2)</option>
                <option :value="2">2 luồng (4)</option>
                <option :value="3">3 luồng (6)</option>
                <option :value="4">4 luồng (8)</option>
              </select>
              <input type="number" v-model.number="item.prov.gap" :disabled="item.status.running"
                class="w-32 font-mono text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg p-1 text-slate-700 dark:text-slate-200 block">
            </td>

            <!-- Tiến độ quét -->
            <td class="p-3.5 whitespace-nowrap font-mono text-[11px] space-y-0.5">
              <div>Quét: <b class="text-slate-800 dark:text-slate-100">{{ formatNumber(item.status.queried) }}</b></div>
              <div>Tìm: <b class="text-emerald-600">{{ formatNumber(item.status.found) }}</b></div>
              <div class="text-[10px] text-slate-400">{{ item.status.speed || 0 }} req/s · {{ item.status.uptime || '00:00:00' }}</div>
            </td>

            <!-- Lịch Sử Scan Gần Nhất -->
            <td class="p-3.5 whitespace-nowrap font-mono text-[11px] space-y-0.5">
              <div v-if="item.status.last_tin">
                <span class="font-bold px-1.5 py-0.5 rounded border text-[11px]"
                  :class="item.status.running ? 'text-emerald-700 bg-emerald-50 border-emerald-300 animate-pulse' : 'text-indigo-700 bg-indigo-50 border-indigo-200'">
                  {{ item.status.last_tin }}
                </span>
              </div>
              <div v-else class="text-slate-400 italic">Chưa quét</div>
              <div v-if="item.status.last_scanned_at" class="text-[10px] text-slate-400">🕒 {{ formatDate(item.status.last_scanned_at) }}</div>
            </td>

            <!-- TIN Min / Max -->
            <td class="p-3.5 whitespace-nowrap font-mono text-[11px] space-y-0.5">
              <div class="text-blue-600 dark:text-blue-400 font-semibold">Min: {{ item.status.tin_min || '—' }}</div>
              <div class="flex items-center gap-1.5">
                <span class="text-purple-700 dark:text-purple-400 font-semibold cursor-pointer hover:underline"
                  title="Nhấp để chuyển sang Quét Mới Nhất"
                  @click="selectTinMax(item.prov, item.status)">Max: {{ item.status.tin_max || '—' }} ↗</span>
                <button @click="$emit('open-max-tin', item.key)" title="Cập nhật lại Max TIN thủ công"
                  class="p-0.5 hover:bg-purple-100 dark:hover:bg-purple-900 rounded text-purple-600 dark:text-purple-300 transition">✏️</button>
              </div>
            </td>

            <!-- Thao tác nút bấm -->
            <td class="p-3.5 whitespace-nowrap text-right space-x-1">
              <button @click="$emit('start-prov', item.key)" :disabled="item.status.running && !item.status.paused"
                class="py-1 px-2.5 rounded-lg font-bold text-[11px] text-white transition-all disabled:opacity-40"
                :class="item.status.running ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-500'">▶ Start</button>
              <button @click="startNewest(item)" :disabled="item.status.running && !item.status.paused"
                title="Quét MST mới tăng dần từ TIN Max"
                class="py-1 px-2 rounded-lg font-bold text-[11px] text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-all disabled:opacity-40">⚡ Max</button>
              <button @click="$emit('pause-prov', item.key)" :disabled="!item.status.running"
                class="py-1 px-2 rounded-lg font-bold text-[11px] text-white transition-all disabled:opacity-40"
                :class="item.status.paused ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-500 hover:bg-amber-400'">{{ item.status.paused ? '▶' : '⏸' }}</button>
              <button @click="$emit('stop-prov', item.key)" :disabled="!item.status.running"
                class="py-1 px-2 rounded-lg font-bold text-[11px] text-white bg-rose-600 hover:bg-rose-500 transition-all disabled:opacity-40">⏹</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProvinceConfig, ProvinceStatus } from '@/types';

interface ProvinceItem {
  key: string;
  prov: ProvinceConfig;
  status: ProvinceStatus;
}

defineProps<{
  provinces: ProvinceItem[];
}>();

const emit = defineEmits<{
  (e: 'start-prov', key: string): void;
  (e: 'pause-prov', key: string): void;
  (e: 'stop-prov', key: string): void;
  (e: 'open-max-tin', key: string): void;
}>();

const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

const selectTinMax = (prov: ProvinceConfig, status: ProvinceStatus) => {
  if (status.tin_max && !status.running) {
    prov.seed_tin = status.tin_max;
    prov.scan_mode = 'newest';
    prov.gap = 100;
    prov.num_workers = 1;
  }
};

const startNewest = (item: ProvinceItem) => {
  selectTinMax(item.prov, item.status);
  emit('start-prov', item.key);
};

const formatDate = (dt: string) => {
  if (!dt) return '';
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime())) return dt.slice(0, 16).replace('T', ' ');
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  } catch {
    return dt;
  }
};
</script>
