// @id 01M4W0RPRT0000000000000010
// @related 01M4W0RPRT0000000000000002, 01M4W0RPRT0000000000000008

'use client';

import React, { useState } from 'react';

export interface HealthItem {
  province: string; prefix: string; tin_max: string; max_regi_date: string;
  days_diff?: number | null; new_records_in_range?: number; total_records?: number;
  density_rate?: number; status: 'healthy' | 'warning' | 'stalled';
}

interface HealthTableProps {
  provinces: HealthItem[];
  selectedDays: number;
  onSelectTin: (tin: string) => void;
  onScanProvince: (prov: string) => void;
}

export const HealthTable: React.FC<HealthTableProps> = ({
  provinces, selectedDays, onSelectTin, onScanProvince,
}) => {
  const [scanningKey, setScanningKey] = useState('');

  const triggerScan = (provName: string) => {
    setScanningKey(provName);
    onScanProvince(provName);
    setTimeout(() => setScanningKey(''), 1500);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700 text-xs uppercase">
            <tr>
              <th className="p-3">Tỉnh / Thành</th>
              <th className="p-3 text-center">Tiền Tố</th>
              <th className="p-3">TIN Max</th>
              <th className="p-3">Ngày ĐKKD Mới Nhất</th>
              <th className="p-3 text-center">MST Mới ({selectedDays}d)</th>
              <th className="p-3 text-right">Tổng MST</th>
              <th className="p-3 text-center">Độ Đặc Dải Số</th>
              <th className="p-3 text-center">Trạng Thái</th>
              <th className="p-3 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
            {provinces.map((row) => (
              <tr key={row.prefix} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{row.province}</td>
                <td className="p-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">{row.prefix}</td>
                <td className="p-3 font-mono font-semibold">
                  {row.tin_max ? (
                    <button onClick={() => onSelectTin(row.tin_max)} title="Xem chi tiết doanh nghiệp"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono font-bold transition">
                      <span>{row.tin_max}</span><span className="text-[10px]">👁️</span>
                    </button>
                  ) : <span className="text-slate-400">---</span>}
                </td>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-300">
                  {row.max_regi_date}
                  {row.days_diff != null && <span className="text-slate-400 ml-1">({row.days_diff}d trước)</span>}
                </td>
                <td className="p-3 text-center">
                  {(row.new_records_in_range || 0) > 0 ? (
                    <span className="font-bold text-emerald-600 font-mono">+{Number(row.new_records_in_range).toLocaleString('vi-VN')} MST</span>
                  ) : <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-500">0 MST</span>}
                </td>
                <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200">
                  {Number(row.total_records || 0).toLocaleString('vi-VN')}
                </td>
                <td className="p-3 text-center font-mono">
                  {(row.density_rate || 0) >= 85 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">🟢 {row.density_rate}% (Đặc)</span>
                  ) : (row.density_rate || 0) >= 70 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">🟡 {row.density_rate}% (TB)</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200">🔴 {row.density_rate}% (Hổng)</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  {row.status === 'healthy' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">🟢 Bình Thường</span>
                  ) : row.status === 'warning' ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">🟡 Cần Chú Ý</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200">🔴 Tắc Nghẽn</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => triggerScan(row.province)} disabled={scanningKey === row.province}
                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-600 hover:text-white transition">
                    {scanningKey === row.province ? '⏳...' : '⚡ Quét'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
