// @id 01M4W0RPRT0000000000000003
// @related 01M4W0RPRT0000000000000001

'use client';

import React from 'react';

interface CrawledKpisProps {
  timeField: string;
  totalRecords: number;
  todayCount: number;
  peakPeriod: string | null;
  peakCount: number;
  avgPerPeriod: number;
  periodCount: number;
}

export const CrawledKpis: React.FC<CrawledKpisProps> = ({
  timeField, totalRecords, todayCount, peakPeriod, peakCount, avgPerPeriod, periodCount,
}) => {
  const formatNum = (v: number | string | null | undefined) => Number(v || 0).toLocaleString('vi-VN');

  const cards = [
    {
      t: timeField === 'regi_date' ? 'Tổng Doanh Nghiệp ĐKKD' : 'Tổng MST Quét Được',
      v: formatNum(totalRecords),
      s: timeField === 'regi_date' ? 'Bảng regi_stats_daily' : 'Bảng crawl_stats_daily',
      c: 'text-[var(--vnpt-blue)]',
    },
    {
      t: timeField === 'regi_date' ? 'Hôm Nay (ĐKKD Mới)' : 'Hôm Nay (Quét Mới)',
      v: `${formatNum(todayCount)} MST`,
      s: 'Ghi nhận trong ngày',
      c: 'text-emerald-600',
    },
    {
      t: 'Kỳ Cao Điểm Nhất',
      v: peakPeriod || '---',
      s: `${formatNum(peakCount)} MST`,
      c: 'text-purple-600',
    },
    {
      t: 'Trung Bình / Kỳ',
      v: formatNum(avgPerPeriod),
      s: `${periodCount} mốc`,
      c: 'text-amber-600',
    },
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
