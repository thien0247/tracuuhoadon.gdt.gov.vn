// @id 01M4W0RPRT0000000000000006
// @related 01M4W0RPRT0000000000000001, 01M4W0RPRT0000000000000003

'use client';

import React from 'react';

interface TimelineItem { period: string; count: number; label: string }

interface CrawledDataTableProps {
  timeField: string;
  timeline: TimelineItem[];
  totalRecords: number;
  maxVal: number;
  onExportCsv: () => void;
}

export const CrawledDataTable: React.FC<CrawledDataTableProps> = ({
  timeField, timeline, totalRecords, maxVal, onExportCsv,
}) => {
  const formatNum = (v: number | string | null | undefined) => Number(v || 0).toLocaleString('vi-VN');
  const reversed = (timeline || []).slice().reverse();

  return (
    <div className="card-glass p-3 rounded-xl border border-[var(--border-color)] space-y-2">
      <div className="flex items-center justify-between pb-1 border-b border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] uppercase">
        <span>📋 Bảng Số Liệu ({timeField === 'regi_date' ? 'Ngày ĐKKD' : 'Ngày Quét'} - {timeline.length} mốc)</span>
        <button onClick={onExportCsv} className="px-2 py-0.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-500 transition flex items-center gap-1 shadow-sm">
          <span>📥 Xuất CSV</span>
        </button>
      </div>
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-semibold uppercase sticky top-0">
            <tr>
              <th className="p-1.5">{timeField === 'regi_date' ? 'Ngày ĐKKD' : 'Ngày Quét'}</th>
              <th className="p-1.5 text-right">Số Lượng MST</th>
              <th className="p-1.5 text-right">Tỷ Trọng</th>
              <th className="p-1.5 w-28">Tiến Độ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {reversed.map((row) => (
              <tr key={row.period} className="hover:bg-[var(--bg-secondary)] transition">
                <td className="p-1.5 font-mono font-bold text-[var(--text-primary)]">📅 {row.label}</td>
                <td className="p-1.5 text-right font-mono font-extrabold text-blue-600 dark:text-blue-400">{formatNum(row.count)} MST</td>
                <td className="p-1.5 text-right font-mono text-[var(--text-muted)]">{((row.count / (totalRecords || 1)) * 100).toFixed(1)}%</td>
                <td className="p-1.5">
                  <div className="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
                    <div className="bg-[var(--vnpt-blue)] h-full rounded-full" style={{ width: `${Math.min((row.count / (maxVal || 1)) * 100, 100)}%` }}></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
