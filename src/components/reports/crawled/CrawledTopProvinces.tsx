// @id 01M4W0RPRT0000000000000007
// @related 01M4W0RPRT0000000000000001, 01M4W0RPRT0000000000000003

'use client';

import React from 'react';

export interface TopProvItem { prefix: string; province_name: string; count: number; percentage: number }

interface CrawledTopProvincesProps {
  topProvinces: TopProvItem[];
}

export const CrawledTopProvinces: React.FC<CrawledTopProvincesProps> = ({ topProvinces }) => {
  const formatNum = (v: number | string | null | undefined) => Number(v || 0).toLocaleString('vi-VN');

  return (
    <div className="card-glass p-3 rounded-xl border border-[var(--border-color)] space-y-2">
      <div className="flex items-center justify-between pb-1 border-b border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] uppercase">
        <span>🏆 Top Tỉnh Thành</span><span className="text-[10px] text-[var(--text-muted)]">Tỷ lệ %</span>
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
        {(topProvinces || []).map((prov, idx) => (
          <div key={prov.prefix} className="space-y-0.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--text-primary)] truncate">
                <b className="font-mono text-[var(--vnpt-blue)]">#{idx + 1}</b> {prov.province_name} ({prov.prefix})
              </span>
              <span className="font-mono font-bold">{formatNum(prov.count)} <span className="text-[10px] text-[var(--text-muted)]">({prov.percentage}%)</span></span>
            </div>
            <div className="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[var(--vnpt-blue)] h-full rounded-full transition-all" style={{ width: `${prov.percentage}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
