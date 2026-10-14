// @id 01M4W0RPRT0000000000000009
// @related 01M4W0RPRT0000000000000002, 01M4W0RPRT0000000000000008

'use client';

import React from 'react';

interface HealthFilterBarProps {
  searchQuery: string;
  statusFilter: string;
  hasNewFilter: string;
  sortBy: string;
  selectedDays: number;
  filteredCount: number;
  totalCount: number;
  loading: boolean;
  onChangeSearchQuery: (v: string) => void;
  onChangeStatusFilter: (v: string) => void;
  onChangeHasNewFilter: (v: string) => void;
  onChangeSortBy: (v: string) => void;
  onChangeDays: (days: number) => void;
  onResetFilters: () => void;
  onRefresh: () => void;
  onExportExcel: () => void;
}

export const HealthFilterBar: React.FC<HealthFilterBarProps> = ({
  searchQuery, statusFilter, hasNewFilter, sortBy, selectedDays, filteredCount, totalCount, loading,
  onChangeSearchQuery, onChangeStatusFilter, onChangeHasNewFilter, onChangeSortBy,
  onChangeDays, onResetFilters, onRefresh, onExportExcel,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input value={searchQuery} onChange={(e) => onChangeSearchQuery(e.target.value)}
              type="text" placeholder="Tìm tên tỉnh, tiền tố..."
              className="px-3 py-1.5 pl-8 text-xs border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 w-44" />
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg text-xs font-medium">
            <button onClick={() => onChangeStatusFilter('all')} className={`px-2 py-1 rounded ${statusFilter === 'all' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>Tất Cả</button>
            <button onClick={() => onChangeStatusFilter('healthy')} className={`px-2 py-1 rounded ${statusFilter === 'healthy' ? 'bg-white dark:bg-slate-800 shadow text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>Bình Thường</button>
            <button onClick={() => onChangeStatusFilter('warning')} className={`px-2 py-1 rounded ${statusFilter === 'warning' ? 'bg-white dark:bg-slate-800 shadow text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'}`}>Chú Ý</button>
            <button onClick={() => onChangeStatusFilter('stalled')} className={`px-2 py-1 rounded ${statusFilter === 'stalled' ? 'bg-white dark:bg-slate-800 shadow text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>Tắc Nghẽn</button>
          </div>

          <select value={hasNewFilter} onChange={(e) => onChangeHasNewFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium">
            <option value="all">📊 Tất cả MST mới</option>
            <option value="has_new">✨ Có MST mới (&gt; 0)</option>
            <option value="no_new">⚠️ Không có MST mới (= 0)</option>
          </select>

          <select value={sortBy} onChange={(e) => onChangeSortBy(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium">
            <option value="days_desc">⏳ Ngày trễ nhất</option>
            <option value="new_desc">🔥 MST mới nhiều nhất</option>
            <option value="density_asc">⚠️ Độ đặc thấp nhất</option>
            <option value="prefix_asc">🔢 Tiền tố (01 → 99)</option>
            <option value="name_asc">🔤 Tên tỉnh (A → Z)</option>
          </select>

          {(statusFilter !== 'all' || hasNewFilter !== 'all' || searchQuery || sortBy !== 'days_desc') && (
            <button onClick={onResetFilters} className="px-2 py-1 text-xs text-slate-500 hover:text-rose-600 transition font-medium">✕ Xóa lọc</button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Phạm vi:</span>
          {[3, 7, 14, 30].map((d) => (
            <button key={d} onClick={() => onChangeDays(d)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${selectedDays === d ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'}`}>{d}d</button>
          ))}
          <button onClick={onExportExcel} className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition flex items-center gap-1 shadow-sm">
            <span>📥 Excel</span>
          </button>
          <button onClick={onRefresh} disabled={loading}
            className="px-3 py-1 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition flex items-center space-x-1">
            <span className={loading ? 'animate-spin' : ''}>🔄</span><span>Làm Mới</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
        <span>Hiển thị <b className="text-slate-800 dark:text-slate-100">{filteredCount}</b> / {totalCount} tỉnh thành</span>
        {filteredCount === 0 && <span className="text-rose-500 font-medium">Không tìm thấy tỉnh nào phù hợp.</span>}
      </div>
    </div>
  );
};
