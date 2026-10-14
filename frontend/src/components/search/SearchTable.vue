<!-- @id 01M4V8A0K2GZZ1186VCPTY99N3 -->
<!-- @related 01M4V0HMNG67WYQGAJ650769V9, 01M4V0FH0TF34QKKRRBVF9H0XA -->
<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden">
    <!-- Toolbar kiểu Google Sheets tinh gọn -->
    <div class="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div class="flex items-center gap-2 flex-1 min-w-[220px]">
        <span class="text-slate-400 font-mono text-[11px] font-bold">fx</span>
        <input v-model="globalFilter" placeholder="Tìm kiếm nhanh trong ma trận..."
          class="w-full max-w-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 font-sans">
        <button v-if="globalFilter" @click="globalFilter = ''" class="text-slate-400 hover:text-slate-600 text-xs">✖</button>
      </div>
      <div class="flex items-center gap-1.5">
        <button @click="resetSizing" title="Khôi phục kích thước cột mặc định (xóa cache)" class="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px]">
          <span>↻</span><span>Cột</span>
        </button>
        <div class="relative">
          <button @click="showColMenu = !showColMenu" class="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1 text-[11px]">
            <span>👁️ Ẩn/Hiện</span><span>▾</span>
          </button>
          <div v-if="showColMenu" class="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow-xl z-50 p-2 space-y-1">
            <label v-for="col in table.getAllLeafColumns().filter(c => c.id !== 'rowNum')" :key="col.id" class="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" :checked="col.getIsVisible()" @change="col.toggleVisibility()" class="rounded text-indigo-600">
              <span>{{ col.columnDef.header }}</span>
            </label>
          </div>
        </div>
        <button @click="exportCurrentCsv" :disabled="!table.getFilteredRowModel().rows.length" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition disabled:opacity-40 flex items-center gap-1 text-[11px]">
          <span>💾</span><span>CSV</span>
        </button>
        <select :value="table.getState().pagination.pageSize" @change="onPageSizeChange(Number(($event.target as HTMLSelectElement).value))" class="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-[11px] text-slate-700 dark:text-slate-200">
          <option v-for="sz in allowedPageSizes" :key="sz" :value="sz">{{ sz }} dòng</option>
        </select>
      </div>
    </div>

    <!-- Bảng ma trận lưới Google Sheets hỗ trợ Resizing -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs text-slate-800 dark:text-slate-200 border-collapse border-spacing-0 table-fixed" :style="{ width: `${table.getTotalSize()}px`, minWidth: '100%' }">
        <thead class="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b-2 border-slate-300 dark:border-slate-600 text-[11px] select-none">
          <tr v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <th v-for="header in headerGroup.headers" :key="header.id"
              :style="{ width: `${header.getSize()}px` }"
              :class="[
                header.column.id === 'rowNum' ? 'text-center bg-slate-200/80 dark:bg-slate-700/80 text-slate-500' : 'hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer',
                header.column.getCanSort() ? 'select-none' : ''
              ]"
              class="relative px-2 py-1.5 border-r border-b border-slate-300 dark:border-slate-600 transition-colors whitespace-nowrap overflow-hidden"
              @click="header.column.getToggleSortingHandler()?.($event)">
              <div class="flex items-center gap-1 overflow-hidden" :class="header.column.id === 'rowNum' ? 'justify-center' : ''">
                <FlexRender :render="header.column.columnDef.header" :props="header.getContext()" />
                <span v-if="header.column.getIsSorted() === 'asc'" class="text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">▲</span>
                <span v-else-if="header.column.getIsSorted() === 'desc'" class="text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">▼</span>
                <span v-else-if="header.column.getCanSort()" class="text-slate-300 dark:text-slate-600 text-[10px]">⇅</span>
              </div>
              <div v-if="header.column.getCanResize()" @click.stop @mousedown="header.getResizeHandler()($event)" @touchstart="header.getResizeHandler()($event)"
                :class="header.column.getIsResizing() ? 'bg-indigo-600 w-1.5' : 'hover:bg-indigo-400/80'"
                class="absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none z-10 transition-colors" title="Kéo rê chỉnh độ rộng"></div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-none text-[11px]">
          <tr v-if="loading"><td :colspan="table.getAllLeafColumns().length" class="p-6 text-center text-slate-400 animate-pulse border-b border-slate-300">⏳ Đang truy xuất ma trận dữ liệu...</td></tr>
          <tr v-else-if="!table.getRowModel().rows.length"><td :colspan="table.getAllLeafColumns().length" class="p-6 text-center text-slate-400 italic border-b border-slate-300">{{ count === null ? 'Nhập từ khóa và bấm Tra Cứu để nạp dữ liệu.' : 'Không tìm thấy dòng nào khớp điều kiện.' }}</td></tr>
          <tr v-for="row in table.getRowModel().rows" :key="row.id" class="hover:bg-sky-50/60 dark:hover:bg-indigo-950/30 transition-colors">
            <td v-for="cell in row.getVisibleCells()" :key="cell.id"
              :style="{ width: `${cell.column.getSize()}px`, maxWidth: `${cell.column.getSize()}px` }"
              :class="cell.column.id === 'rowNum' ? 'text-center bg-slate-100/60 dark:bg-slate-800/60 select-none p-1 font-mono text-slate-400 dark:text-slate-500 text-[10px] font-medium' : 'px-2 py-1'"
              class="border-r border-b border-slate-200 dark:border-slate-700/80 align-middle overflow-hidden">
              <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Thanh phân trang ma trận tinh gọn -->
    <div v-if="table.getFilteredRowModel().rows.length" class="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
      <div>Hiển thị dòng <span class="font-bold text-slate-900 dark:text-slate-100 font-mono">{{ table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 }}</span> – <span class="font-bold text-slate-900 dark:text-slate-100 font-mono">{{ Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length) }}</span> / <span class="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{{ table.getFilteredRowModel().rows.length }}</span> dòng</div>
      <div class="flex items-center gap-1 font-mono">
        <button @click="table.setPageIndex(0)" :disabled="!table.getCanPreviousPage()" class="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-40">⏮</button>
        <button @click="table.previousPage()" :disabled="!table.getCanPreviousPage()" class="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-40">◀</button>
        <span class="px-1.5 text-slate-700 dark:text-slate-300 font-sans font-semibold">Trang {{ table.getState().pagination.pageIndex + 1 }} / {{ table.getPageCount() }}</span>
        <button @click="table.nextPage()" :disabled="!table.getCanNextPage()" class="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-40">▶</button>
        <button @click="table.setPageIndex(table.getPageCount() - 1)" :disabled="!table.getCanNextPage()" class="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-40">⏭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue';
import { useVueTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel, getFilteredRowModel, FlexRender, type ColumnDef, type SortingState, type VisibilityState, type PaginationState } from '@tanstack/vue-table';
import { useTableResize } from '@/composables/useTableResize';
import { useTablePageSize } from '@/composables/useTablePageSize';
import type { SearchRecordItem, SearchTableProps } from './search-table.types';

const props = withDefaults(defineProps<SearchTableProps & { pageSize?: number }>(), { rows: () => [], count: null, loading: false, pageSize: 50 });
const emit = defineEmits<{ (e: 'select-tin', tin: string): void; (e: 'change-page-size', size: number): void }>();

const defaultSizes: Record<string, number> = { rowNum: 40, tin: 135, name: 270, regiDate: 100, status: 130, address: 260, taxOffice: 200 };
const { columnSizing, onSizingChange, resetSizing } = useTableResize('gdt_search_table_col_widths', defaultSizes);
const { pageSize: localSize, setPageSize, allowedPageSizes } = useTablePageSize('gdt_search_table_page_size', 50, 'pageSize');

const sorting = ref<SortingState>([]), globalFilter = ref(''), showColMenu = ref(false), columnVisibility = ref<VisibilityState>({});
const pagination = ref<PaginationState>({ pageIndex: 0, pageSize: props.pageSize || localSize.value });
const onPageSizeChange = (sz: number) => { setPageSize(sz); table.setPageSize(sz); emit('change-page-size', sz); };

const data = computed<SearchRecordItem[]>(() => (props.rows || []).map(r => ({
  tin: String(r[0] ?? ''), name: String(r[1] ?? ''), regiDate: r[2] ? String(r[2]).substring(0, 10) : '',
  status: String(r[3] ?? 'Đang hoạt động'), address: String(r[4] ?? ''), taxOffice: String(r[5] ?? '')
})));

const columns: ColumnDef<SearchRecordItem>[] = [
  { id: 'rowNum', header: '#', size: 40, minSize: 35, maxSize: 60, enableResizing: false, enableSorting: false, cell: ({ row }) => h('span', String(table.getState().pagination.pageIndex * table.getState().pagination.pageSize + row.index + 1)) },
  { accessorKey: 'tin', header: 'Mã Số Thuế', size: 135, minSize: 100, maxSize: 220, cell: ({ row }) => h('button', { onClick: () => emit('select-tin', row.original.tin), class: 'text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-mono font-bold text-[11px] truncate', title: 'Xem chi tiết' }, [h('span', row.original.tin), h('span', { class: 'text-[9px] bg-indigo-50 dark:bg-indigo-950 px-1 rounded border border-indigo-200 dark:border-indigo-800' }, '👁️')]) },
  { accessorKey: 'name', header: 'Tên Doanh Nghiệp', size: 270, minSize: 140, maxSize: 600, cell: ({ row }) => h('div', { class: 'font-semibold text-slate-900 dark:text-slate-100 truncate text-[11px]', title: row.original.name }, row.original.name) },
  { accessorKey: 'regiDate', header: 'Ngày ĐKKD', size: 100, minSize: 85, maxSize: 160, cell: ({ row }) => h('span', { class: 'font-mono text-slate-600 dark:text-slate-400 text-[11px]' }, row.original.regiDate || '---') },
  { accessorKey: 'status', header: 'Trạng Thái', size: 130, minSize: 95, maxSize: 200, cell: ({ row }) => h('span', { class: row.original.status.includes('hoạt động') ? 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' }, row.original.status) },
  { accessorKey: 'address', header: 'Địa Chỉ Trụ Sở', size: 260, minSize: 140, maxSize: 700, cell: ({ row }) => h('div', { class: 'text-slate-600 dark:text-slate-400 truncate text-[11px]', title: row.original.address }, row.original.address || '---') },
  { accessorKey: 'taxOffice', header: 'Cơ Quan Thuế', size: 200, minSize: 110, maxSize: 500, cell: ({ row }) => h('div', { class: 'text-slate-600 dark:text-slate-400 truncate text-[11px]', title: row.original.taxOffice }, row.original.taxOffice || '---') }
];

const table = useVueTable({
  get data() { return data.value; },
  columns,
  enableColumnResizing: true,
  columnResizeMode: 'onChange',
  state: {
    get sorting() { return sorting.value; }, get globalFilter() { return globalFilter.value; },
    get pagination() { return pagination.value; }, get columnVisibility() { return columnVisibility.value; },
    get columnSizing() { return columnSizing.value; }
  },
  onSortingChange: u => { sorting.value = typeof u === 'function' ? u(sorting.value) : u; },
  onGlobalFilterChange: u => { globalFilter.value = typeof u === 'function' ? u(globalFilter.value) : u; },
  onPaginationChange: u => { pagination.value = typeof u === 'function' ? u(pagination.value) : u; },
  onColumnVisibilityChange: u => { columnVisibility.value = typeof u === 'function' ? u(columnVisibility.value) : u; },
  onColumnSizingChange: onSizingChange,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getFilteredRowModel: getFilteredRowModel()
});

const exportCurrentCsv = () => {
  const rows = table.getFilteredRowModel().rows;
  if (!rows.length) return;
  const headers = ['Mã Số Thuế', 'Tên Doanh Nghiệp', 'Ngày Cấp', 'Trạng Thái', 'Địa Chỉ', 'Cơ Quan Thuế'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    lines.push([esc(r.original.tin), esc(r.original.name), esc(r.original.regiDate), esc(r.original.status), esc(r.original.address), esc(r.original.taxOffice)].join(','));
  }
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
  link.download = `mst_search_export_${Date.now()}.csv`; link.click(); URL.revokeObjectURL(link.href);
};
</script>
