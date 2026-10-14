<!-- @id 01M4V0HMNFP54NSRTMHYDMZ9M4 -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ -->
<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden">
    <!-- Toolbar ma trận tinh gọn -->
    <div class="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between text-xs">
      <div class="flex items-center gap-2">
        <span class="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
          Ma trận lọc: <b class="text-indigo-600 dark:text-indigo-400 font-mono">{{ formatNumber(filteredDisplayRows.length) }}</b> / {{ formatNumber(rows.length) }} dòng
        </span>
        <button v-if="hasHeaderFilter" @click="resetHeaderFilters" class="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold text-[11px]">✖ Xóa lọc cột</button>
      </div>
      <div class="flex items-center gap-1.5">
        <button @click="resetSizing" title="Khôi phục kích thước cột mặc định (xóa cache)" class="px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px]">
          <span>↻</span><span>Độ rộng cột</span>
        </button>
        <select :value="currentSize" @change="onPageSizeChange(Number(($event.target as HTMLSelectElement).value))" class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-[11px] text-slate-700 dark:text-slate-200">
          <option v-for="sz in allowedPageSizes" :key="sz" :value="sz">{{ sz }} dòng</option>
        </select>
      </div>
    </div>

    <!-- Bảng ma trận hỗ trợ Resizing -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-800 dark:text-slate-200 border-collapse border-spacing-0 table-fixed" :style="{ width: `${totalWidth}px`, minWidth: '100%' }">
        <thead class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b-2 border-slate-300 dark:border-slate-600 text-[11px] select-none">
          <tr>
            <th class="w-10 min-w-[40px] text-center bg-slate-200/80 dark:bg-slate-700/80 text-slate-500 font-mono text-[10px] border-r border-b border-slate-300 dark:border-slate-600 py-1.5">#</th>
            <th v-for="col in cols" :key="col.key" :style="{ width: `${getColWidth(col.key)}px` }" class="relative px-2 py-1.5 border-r border-b border-slate-300 dark:border-slate-600 whitespace-nowrap overflow-hidden">
              <span class="truncate block">{{ col.title }}</span>
              <div @mousedown.stop="startResize(col.key, $event)" class="absolute right-0 top-0 h-full w-1.5 cursor-col-resize select-none touch-none hover:bg-indigo-500/80 z-10 transition-colors" title="Kéo rê chỉnh độ rộng"></div>
            </th>
          </tr>
          <tr class="bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-300 dark:border-slate-600">
            <th class="text-center font-mono text-slate-400 text-[10px] border-r border-b border-slate-300 dark:border-slate-600 bg-slate-100/60 dark:bg-slate-800/60">fx</th>
            <th v-for="col in cols" :key="'f_' + col.key" :style="{ width: `${getColWidth(col.key)}px` }" class="p-1 border-r border-b border-slate-300 dark:border-slate-600 overflow-hidden">
              <input v-model="headerFilters[col.filterKey as keyof typeof headerFilters]" :placeholder="'Lọc ' + col.shortTitle + '...'" class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 text-[10px] text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans">
            </th>
          </tr>
        </thead>
        <tbody class="divide-none text-[11px]">
          <tr v-if="filteredDisplayRows.length === 0">
            <td :colspan="cols.length + 1" class="p-6 text-center text-slate-400 italic border-b border-slate-300">
              {{ rows.length === 0 ? 'Vui lòng bấm "Lọc Dữ Liệu" để hiển thị ma trận.' : 'Không tìm thấy dòng nào khớp bộ lọc header.' }}
            </td>
          </tr>
          <tr v-for="(row, idx) in paginatedRows" :key="idx" class="hover:bg-sky-50/60 dark:hover:bg-indigo-950/30 transition-colors">
            <td class="w-10 min-w-[40px] text-center bg-slate-100/60 dark:bg-slate-800/60 font-mono text-slate-400 dark:text-slate-500 text-[10px] select-none p-1 border-r border-b border-slate-200 dark:border-slate-700/80 font-medium">{{ pageIndex * currentSize + idx + 1 }}</td>
            <td :style="{ width: `${getColWidth('tin')}px`, maxWidth: `${getColWidth('tin')}px` }" class="px-2 py-1 border-r border-b border-slate-200 dark:border-slate-700/80 font-mono font-bold align-middle overflow-hidden truncate">
              <button @click="$emit('select-tin', String(row[0]))" class="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-mono transition text-[11px]">
                <span>{{ row[0] }}</span><span class="text-[9px]">👁️</span>
              </button>
            </td>
            <td :style="{ width: `${getColWidth('name')}px`, maxWidth: `${getColWidth('name')}px` }" class="px-2 py-1 border-r border-b border-slate-200 dark:border-slate-700/80 align-middle overflow-hidden">
              <div class="font-semibold text-slate-900 dark:text-slate-100 truncate text-[11px]" :title="String(row[1] || '')">{{ row[1] }}</div>
              <div v-if="row[11]" class="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold flex items-center gap-1 truncate" title="Số điện thoại"><span>📞</span><span>{{ row[11] }}</span></div>
            </td>
            <td :style="{ width: `${getColWidth('v3')}px`, maxWidth: `${getColWidth('v3')}px` }" class="px-2 py-1 border-r border-b border-slate-200 dark:border-slate-700/80 align-middle overflow-hidden">
              <div class="font-medium text-slate-800 dark:text-slate-200 truncate text-[11px]">{{ row[6] }}</div>
              <div class="text-[10px] text-slate-400 truncate">{{ row[7] }}</div>
            </td>
            <td :style="{ width: `${getColWidth('v2')}px`, maxWidth: `${getColWidth('v2')}px` }" class="px-2 py-1 border-r border-b border-slate-200 dark:border-slate-700/80 align-middle overflow-hidden">
              <div class="font-semibold text-emerald-700 dark:text-emerald-300 truncate text-[11px]">{{ row[8] }}</div>
              <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">{{ row[10] }}</div>
            </td>
            <td :style="{ width: `${getColWidth('date')}px`, maxWidth: `${getColWidth('date')}px` }" class="px-2 py-1 border-r border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 font-mono text-[10px] align-middle overflow-hidden truncate">{{ row[2] ? String(row[2]).substring(0, 10) : '---' }}</td>
            <td :style="{ width: `${getColWidth('status')}px`, maxWidth: `${getColWidth('status')}px` }" class="px-2 py-1 border-r border-b border-slate-200 dark:border-slate-700/80 align-middle overflow-hidden">
              <span class="px-1.5 py-0.5 rounded text-[10px] font-medium truncate inline-block" :class="row[3] && (row[3] === '00' || String(row[3]).includes('đang hoạt động')) ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'">{{ row[3] || 'Đang hoạt động' }}</span>
            </td>
            <td :style="{ width: `${getColWidth('addr')}px`, maxWidth: `${getColWidth('addr')}px` }" class="px-2 py-1 border-r border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 truncate text-[11px] align-middle overflow-hidden" :title="String(row[4] || '')">{{ row[4] }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Thanh phân trang ma trận tinh gọn -->
    <div v-if="filteredDisplayRows.length" class="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
      <div>Hiển thị dòng <span class="font-bold text-slate-900 dark:text-slate-100 font-mono">{{ pageIndex * currentSize + 1 }}</span> – <span class="font-bold text-slate-900 dark:text-slate-100 font-mono">{{ Math.min((pageIndex + 1) * currentSize, filteredDisplayRows.length) }}</span> / <span class="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{{ filteredDisplayRows.length }}</span> dòng</div>
      <div class="flex items-center gap-1 font-mono">
        <button @click="pageIndex = 0" :disabled="pageIndex === 0" class="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-40">⏮</button>
        <button @click="pageIndex--" :disabled="pageIndex === 0" class="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-40">◀</button>
        <span class="px-1.5 text-slate-700 dark:text-slate-300 font-sans font-semibold">Trang {{ pageIndex + 1 }} / {{ totalPages }}</span>
        <button @click="pageIndex++" :disabled="pageIndex >= totalPages - 1" class="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-40">▶</button>
        <button @click="pageIndex = totalPages - 1" :disabled="pageIndex >= totalPages - 1" class="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-40">⏭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useTableResize } from '@/composables/useTableResize';
import { useTablePageSize } from '@/composables/useTablePageSize';

const props = withDefaults(defineProps<{ rows?: (string | number | null)[][]; loading?: boolean; pageSize?: number }>(), { rows: () => [], loading: false, pageSize: 50 });
const emit = defineEmits<{ (e: 'select-tin', tin: string): void; (e: 'change-page-size', size: number): void }>();

const defaultSizes: Record<string, number> = { tin: 135, name: 240, v3: 170, v2: 170, date: 100, status: 130, addr: 260 };
const { columnSizing, onSizingChange, resetSizing } = useTableResize('gdt_filter_table_col_widths', defaultSizes);
const { pageSize: localSize, setPageSize, allowedPageSizes } = useTablePageSize('gdt_filter_table_page_size', 50, 'pageSize');

const currentSize = computed(() => props.pageSize || localSize.value);
const pageIndex = ref(0);
const onPageSizeChange = (sz: number) => { setPageSize(sz); pageIndex.value = 0; emit('change-page-size', sz); };

const cols = [
  { key: 'tin', title: 'Mã Số Thuế', shortTitle: 'MST', filterKey: 'tin' },
  { key: 'name', title: 'Tên Doanh Nghiệp & SĐT', shortTitle: 'Tên', filterKey: 'name' },
  { key: 'v3', title: 'Mô Hình 3 Cấp (V3)', shortTitle: 'V3', filterKey: 'v3' },
  { key: 'v2', title: 'Mô Hình 2 Cấp (V2)', shortTitle: 'V2', filterKey: 'v2' },
  { key: 'date', title: 'Ngày Cấp', shortTitle: 'Ngày', filterKey: 'date' },
  { key: 'status', title: 'Trạng Thái', shortTitle: 'Trạng thái', filterKey: 'status' },
  { key: 'addr', title: 'Địa Chỉ Trụ Sở', shortTitle: 'Địa chỉ', filterKey: 'addr' }
];

const getColWidth = (key: string) => columnSizing.value[key] || defaultSizes[key] || 150;
const totalWidth = computed(() => 40 + cols.reduce((sum, c) => sum + getColWidth(c.key), 0));

const startResize = (colKey: string, e: MouseEvent) => {
  e.preventDefault();
  const startX = e.clientX, startW = getColWidth(colKey);
  const onMove = (me: MouseEvent) => { columnSizing.value = { ...columnSizing.value, [colKey]: Math.max(60, startW + (me.clientX - startX)) }; };
  const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); onSizingChange(columnSizing.value); };
  window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp);
};

const headerFilters = ref({ tin: '', name: '', v3: '', v2: '', date: '', status: '', addr: '' });
const norm = (s: unknown) => (s ?? '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const formatNumber = (n: number | null | undefined) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');
const hasHeaderFilter = computed(() => Object.values(headerFilters.value).some((v) => v.trim() !== ''));

const filteredDisplayRows = computed(() => {
  const { tin, name, v3, v2, date, status, addr } = headerFilters.value;
  const qTin = norm(tin), qName = norm(name), qV3 = norm(v3), qV2 = norm(v2), qDate = norm(date), qStatus = norm(status), qAddr = norm(addr);
  if (!qTin && !qName && !qV3 && !qV2 && !qDate && !qStatus && !qAddr) return props.rows;
  return props.rows.filter((r) => {
    if (qTin && !norm(r[0]).includes(qTin)) return false;
    if (qName && !norm(String(r[1] ?? '') + ' ' + String(r[11] ?? '')).includes(qName)) return false;
    if (qV3 && !norm(String(r[6] ?? '') + ' ' + String(r[7] ?? '')).includes(qV3)) return false;
    if (qV2 && !norm(String(r[8] ?? '') + ' ' + String(r[9] ?? '') + ' ' + String(r[10] ?? '')).includes(qV2)) return false;
    if (qDate && !norm(r[2]).includes(qDate)) return false;
    if (qStatus && !norm(r[3]).includes(qStatus)) return false;
    if (qAddr && !norm(r[4]).includes(qAddr)) return false;
    return true;
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredDisplayRows.value.length / currentSize.value)));
const paginatedRows = computed(() => {
  const start = pageIndex.value * currentSize.value;
  return filteredDisplayRows.value.slice(start, start + currentSize.value);
});

watch([filteredDisplayRows, currentSize], () => { pageIndex.value = 0; });
const resetHeaderFilters = () => { headerFilters.value = { tin: '', name: '', v3: '', v2: '', date: '', status: '', addr: '' }; };
</script>
