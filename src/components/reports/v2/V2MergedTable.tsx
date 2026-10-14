// @id 01M4W0RPRT0000000000000012
// @related 01M4W0RPRT0000000000000001, 01M4W0RPRT0000000000000011

'use client';

import React, { useState, useMemo } from 'react';

export interface V2Item {
  v2_code: string;
  v2_name: string;
  prefixes: string[];
  old_provinces: string[];
  total_mst: number;
  percentage: number;
}

interface V2MergedTableProps {
  provinces: V2Item[];
}

export const V2MergedTable: React.FC<V2MergedTableProps> = ({ provinces }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const formatNum = (v: number) => Number(v || 0).toLocaleString('vi-VN');

  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return provinces || [];
    return (provinces || []).filter((p) =>
      p.v2_name.toLowerCase().includes(q) ||
      p.v2_code.includes(q) ||
      p.prefixes.some((pref) => pref.includes(q)) ||
      p.old_provinces.some((op) => op.toLowerCase().includes(q)),
    );
  }, [provinces, searchQuery]);

  const exportExcel = () => {
    window.open('/api/reports/v2-excel', '_blank');
  };

  return (
    <div className="card-glass p-3 rounded-xl border border-[var(--border-color)] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[var(--border-color)] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">🏛️ Bảng Số Liệu 34 Tỉnh Thành Mới Sau Sáp Nhập</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">({filteredList.length} đơn vị)</span>
        </div>
        <div className="flex items-center gap-2">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} type="text" placeholder="Tìm tên tỉnh mới hoặc tiền tố..."
            className="px-2.5 py-1 text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] w-48 font-medium" />
          <button onClick={exportExcel} className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition flex items-center gap-1 shadow-sm">
            <span>📥 Xuất Excel V2</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-semibold uppercase sticky top-0">
            <tr>
              <th className="p-2 text-center w-12">Mã V2</th>
              <th className="p-2">Tỉnh / Thành Phố Mới</th>
              <th className="p-2">Tỉnh Cũ Cấu Thành &amp; Tiền Tố TIN</th>
              <th className="p-2 text-right">Số Lượng MST</th>
              <th className="p-2 text-right">Tỷ Trọng (%)</th>
              <th className="p-2 w-32">Phân Bổ Quy Mô</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)]">
            {filteredList.map((row) => (
              <tr key={row.v2_code} className="hover:bg-[var(--bg-secondary)] transition">
                <td className="p-2 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">{row.v2_code}</td>
                <td className="p-2 font-bold text-[var(--text-primary)]">{row.v2_name}</td>
                <td className="p-2">
                  <div className="flex flex-wrap gap-1">
                    {row.old_provinces.map((oldP) => (
                      <span key={oldP} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {oldP}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-2 text-right font-mono font-black text-blue-600 dark:text-blue-400">{formatNum(row.total_mst)} MST</td>
                <td className="p-2 text-right font-mono font-bold text-[var(--text-muted)]">{row.percentage}%</td>
                <td className="p-2">
                  <div className="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
                    <div className="bg-[var(--vnpt-blue)] h-full rounded-full transition-all" style={{ width: `${Math.min(row.percentage * 3, 100)}%` }}></div>
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
