// @id 01M4W0RPRT0000000000000008
// @related 01M4W0RPRT0000000000000002

'use client';

import React from 'react';

interface HealthStatusCardsProps {
  summary: { total?: number; healthy?: number; warning?: number; stalled?: number };
  currentStatus: string;
  selectedDays: number;
  onSelectStatus: (status: string) => void;
}

export const HealthStatusCards: React.FC<HealthStatusCardsProps> = ({
  summary, currentStatus, selectedDays, onSelectStatus,
}) => {
  const statusCards = [
    { key: 'all', label: 'Tổng Số Tỉnh Thành', val: summary.total || 62, icon: '🏢', border: 'border-slate-200', text: 'text-slate-800 dark:text-slate-100' },
    { key: 'healthy', label: `Bình Thường (≤ ${selectedDays} ngày)`, val: summary.healthy || 0, icon: '🟢', border: 'border-emerald-200', text: 'text-emerald-700 dark:text-emerald-400' },
    { key: 'warning', label: 'Cần Chú Ý (4 - 7 ngày)', val: summary.warning || 0, icon: '🟡', border: 'border-amber-200', text: 'text-amber-700 dark:text-amber-400' },
    { key: 'stalled', label: 'Cảnh Báo Tắc Nghẽn (> 7 ngày)', val: summary.stalled || 0, icon: '🔴', border: 'border-rose-200', text: 'text-rose-700 dark:text-rose-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statusCards.map((c) => (
        <div key={c.key} onClick={() => onSelectStatus(c.key)}
          className={`bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition ${c.border} ${currentStatus === c.key ? 'ring-2 ring-indigo-500 shadow' : ''}`}>
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{c.label}</div>
            <div className={`text-2xl font-bold ${c.text}`}>{c.val}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-lg">{c.icon}</div>
        </div>
      ))}
    </div>
  );
};
