// @id 01M4W0SRCH0000000000000003
// @related 01M4W0SRCH0000000000000001, 01M4W0H00K0000000000000003, 01M4W0H00K0000000000000004
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable, getCoreRowModel, getSortedRowModel, getPaginationRowModel,
  getFilteredRowModel, flexRender, type ColumnDef, type SortingState,
  type VisibilityState, type PaginationState
} from '@tanstack/react-table';
import { useTableResize } from '@/hooks/useTableResize';
import { useTablePageSize } from '@/hooks/useTablePageSize';
import type { SearchRecordItem, SearchTableProps } from './search-table.types';

const defaultSizes: Record<string, number> = {
  rowNum: 40, tin: 135, name: 270, regiDate: 100, status: 130, address: 260, taxOffice: 200
};

export default function SearchTable({
  rows = [], count = null, loading = false, pageSize = 50, onChangePageSize, onSelectTin
}: SearchTableProps) {
  const { columnSizing, onSizingChange, resetSizing } = useTableResize('gdt_search_table_col_widths', defaultSizes);
  const { pageSize: localSize, setPageSize, allowedPageSizes } = useTablePageSize('gdt_search_table_page_size', 50, 'pageSize');

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showColMenu, setShowColMenu] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: pageSize || localSize });

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageSize: pageSize || localSize, pageIndex: 0 }));
  }, [pageSize, localSize]);

  const handlePageSizeChange = (sz: number) => {
    setPageSize(sz);
    setPagination({ pageIndex: 0, pageSize: sz });
    onChangePageSize?.(sz);
  };

  const data = useMemo<SearchRecordItem[]>(() => (rows || []).map((r) => ({
    tin: String(r[0] ?? ''), name: String(r[1] ?? ''), regiDate: r[2] ? String(r[2]).substring(0, 10) : '',
    status: String(r[3] ?? 'Đang hoạt động'), address: String(r[4] ?? ''), taxOffice: String(r[5] ?? '')
  })), [rows]);

  const columns = useMemo<ColumnDef<SearchRecordItem>[]>(() => [
    {
      id: 'rowNum', header: '#', size: 40, minSize: 35, maxSize: 60, enableResizing: false, enableSorting: false,
      cell: ({ row, table }) => <span>{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + row.index + 1}</span>
    },
    {
      accessorKey: 'tin', header: 'Mã Số Thuế', size: 135, minSize: 100, maxSize: 220,
      cell: ({ row }) => (
        <button onClick={() => onSelectTin?.(row.original.tin)} className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-mono font-bold text-[11px] truncate" title="Xem chi tiết">
          <span>{row.original.tin}</span>
          <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 px-1 rounded border border-indigo-200 dark:border-indigo-800">👁️</span>
        </button>
      )
    },
    {
      accessorKey: 'name', header: 'Tên Doanh Nghiệp', size: 270, minSize: 140, maxSize: 600,
      cell: ({ row }) => <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-[11px]" title={row.original.name}>{row.original.name}</div>
    },
    {
      accessorKey: 'regiDate', header: 'Ngày ĐKKD', size: 100, minSize: 85, maxSize: 160,
      cell: ({ row }) => <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px]">{row.original.regiDate || '---'}</span>
    },
    {
      accessorKey: 'status', header: 'Trạng Thái', size: 130, minSize: 95, maxSize: 200,
      cell: ({ row }) => (
        <span className={row.original.status.includes('hoạt động') ? 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}>
          {row.original.status}
        </span>
      )
    },
    {
      accessorKey: 'address', header: 'Địa Chỉ Trụ Sở', size: 260, minSize: 140, maxSize: 700,
      cell: ({ row }) => <div className="text-slate-600 dark:text-slate-400 truncate text-[11px]" title={row.original.address}>{row.original.address || '---'}</div>
    },
    {
      accessorKey: 'taxOffice', header: 'Cơ Quan Thuế', size: 200, minSize: 110, maxSize: 500,
      cell: ({ row }) => <div className="text-slate-600 dark:text-slate-400 truncate text-[11px]" title={row.original.taxOffice}>{row.original.taxOffice || '---'}</div>
    }
  ], [onSelectTin]);

  const table = useReactTable({
    data, columns, enableColumnResizing: true, columnResizeMode: 'onChange',
    state: { sorting, globalFilter, pagination, columnVisibility, columnSizing },
    onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination, onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: onSizingChange,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(), getFilteredRowModel: getFilteredRowModel()
  });

  const exportCurrentCsv = () => {
    const fRows = table.getFilteredRowModel().rows;
    if (!fRows.length) return;
    const lines = ['Mã Số Thuế,Tên Doanh Nghiệp,Ngày Cấp,Trạng Thái,Địa Chỉ,Cơ Quan Thuế'];
    const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
    for (const r of fRows) {
      lines.push([esc(r.original.tin), esc(r.original.name), esc(r.original.regiDate), esc(r.original.status), esc(r.original.address), esc(r.original.taxOffice)].join(','));
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
    link.download = `mst_search_export_${Date.now()}.csv`; link.click(); URL.revokeObjectURL(link.href);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden">
      <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
          <span className="text-slate-400 font-mono text-[11px] font-bold">fx</span>
          <input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Tìm kiếm nhanh trong ma trận..." className="w-full max-w-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-0.5 text-xs text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 font-sans" />
          {globalFilter && <button onClick={() => setGlobalFilter('')} className="text-slate-400 hover:text-slate-600 text-xs">✖</button>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={resetSizing} title="Khôi phục kích thước cột mặc định (xóa cache)" className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 text-[11px]"><span>↻</span><span>Cột</span></button>
          <div className="relative">
            <button onClick={() => setShowColMenu((p) => !p)} className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1 text-[11px]"><span>👁️ Ẩn/Hiện</span><span>▾</span></button>
            {showColMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded shadow-xl z-50 p-2 space-y-1">
                {table.getAllLeafColumns().filter((c) => c.id !== 'rowNum').map((col) => (
                  <label key={col.id} className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={col.getIsVisible()} onChange={col.getToggleVisibilityHandler()} className="rounded text-indigo-600" />
                    <span>{String(col.columnDef.header)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <button onClick={exportCurrentCsv} disabled={!table.getFilteredRowModel().rows.length} className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition disabled:opacity-40 flex items-center gap-1 text-[11px]"><span>💾</span><span>CSV</span></button>
          <select value={table.getState().pagination.pageSize} onChange={(e) => handlePageSizeChange(Number(e.target.value))} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-1.5 py-1 text-[11px] text-slate-700 dark:text-slate-200">
            {allowedPageSizes.map((sz) => <option key={sz} value={sz}>{sz} dòng</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-800 dark:text-slate-200 border-collapse border-spacing-0 table-fixed" style={{ width: `${table.getTotalSize()}px`, minWidth: '100%' }}>
          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b-2 border-slate-300 dark:border-slate-600 text-[11px] select-none">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} style={{ width: `${header.getSize()}px` }} onClick={header.column.getToggleSortingHandler()} className={`relative px-2 py-1.5 border-r border-b border-slate-300 dark:border-slate-600 transition-colors whitespace-nowrap overflow-hidden ${header.column.id === 'rowNum' ? 'text-center bg-slate-200/80 dark:bg-slate-700/80 text-slate-500' : 'hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer'}`}>
                    <div className={`flex items-center gap-1 overflow-hidden ${header.column.id === 'rowNum' ? 'justify-center' : ''}`}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === 'asc' && <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">▲</span>}
                      {header.column.getIsSorted() === 'desc' && <span className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">▼</span>}
                      {!header.column.getIsSorted() && header.column.getCanSort() && <span className="text-slate-300 dark:text-slate-600 text-[10px]">⇅</span>}
                    </div>
                    {header.column.getCanResize() && (
                      <div onClick={(e) => e.stopPropagation()} onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none z-10 transition-colors ${header.column.getIsResizing() ? 'bg-indigo-600 w-1.5' : 'hover:bg-indigo-400/80'}`} title="Kéo rê chỉnh độ rộng" />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-none text-[11px]">
            {loading && <tr><td colSpan={table.getAllLeafColumns().length} className="p-6 text-center text-slate-400 animate-pulse border-b border-slate-300">⏳ Đang truy xuất ma trận dữ liệu...</td></tr>}
            {!loading && table.getRowModel().rows.length === 0 && <tr><td colSpan={table.getAllLeafColumns().length} className="p-6 text-center text-slate-400 italic border-b border-slate-300">{count === null ? 'Nhập từ khóa và bấm Tra Cứu để nạp dữ liệu.' : 'Không tìm thấy dòng nào khớp điều kiện.'}</td></tr>}
            {!loading && table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-sky-50/60 dark:hover:bg-indigo-950/30 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ width: `${cell.column.getSize()}px`, maxWidth: `${cell.column.getSize()}px` }} className={`border-r border-b border-slate-200 dark:border-slate-700/80 align-middle overflow-hidden ${cell.column.id === 'rowNum' ? 'text-center bg-slate-100/60 dark:bg-slate-800/60 select-none p-1 font-mono text-slate-400 dark:text-slate-500 text-[10px] font-medium' : 'px-2 py-1'}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.getFilteredRowModel().rows.length > 0 && (
        <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <div>Hiển thị dòng <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> – <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}</span> / <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">{table.getFilteredRowModel().rows.length}</span> dòng</div>
          <div className="flex items-center gap-1 font-mono">
            <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-40">⏮</button>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-40">◀</button>
            <span className="px-1.5 text-slate-700 dark:text-slate-300 font-sans font-semibold">Trang {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-40">▶</button>
            <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded disabled:opacity-40">⏭</button>
          </div>
        </div>
      )}
    </div>
  );
}
