// @id 01M4W0RPRT0000000000000011
// @related 01M4W0RPRT0000000000000001, 01M4W0RPRT0000000000000012

'use client';

import React from 'react';

interface V2MergedKpisProps {
  totalProvinces: number;
  totalMst: number;
  topProvinceName: string;
  topProvinceMst: number;
}

export const V2MergedKpis: React.FC<V2MergedKpisProps> = ({
  totalProvinces, totalMst, topProvinceName, topProvinceMst,
}) => {
  const formatNum = (v: number) => Number(v || 0).toLocaleString('vi-VN');

  const cards = [
    { t: 'Đơn Vị Hành Chính Mới', v: `${totalProvinces || 34} Tỉnh/TP`, s: 'Mô hình 2 cấp HTKK V2', c: 'text-[var(--vnpt-blue)]' },
    { t: 'Tổng Doanh Nghiệp Toàn Quốc', v: `${formatNum(totalMst)} MST`, s: 'Quy tụ từ 62 tỉnh cũ', c: 'text-emerald-600' },
    { t: 'Quy Mô Lớn Nhất', v: topProvinceName || 'TP. Hồ Chí Minh', s: `${formatNum(topProvinceMst)} MST`, c: 'text-purple-600' },
    { t: 'Tỷ Trọng Cực Tăng Trưởng', v: totalMst > 0 ? `${((topProvinceMst / totalMst) * 100).toFixed(1)}%` : '---', s: 'Đô thị hạt nhân', c: 'text-amber-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.t} className="card-glass p-3 rounded-xl border border-[var(--border-color)]">
          <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">{c.t}</div>
          <div className={`text-xl font-black mt-0.5 font-mono truncate ${c.c}`}>{c.v}</div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono">{c.s}</div>
        </div>
      ))}
    </div>
  );
};
