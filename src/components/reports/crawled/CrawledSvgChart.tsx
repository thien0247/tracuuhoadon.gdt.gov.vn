// @id 01M4W0RPRT0000000000000004
// @related 01M4W0RPRT0000000000000001, 01M4W0RPRT0000000000000003

'use client';

import React, { useState } from 'react';

export interface PointItem { period: string; count: number; label: string; x: number; y: number; barH: number; width: number; shortLabel: string }
export interface ChartData { points: PointItem[]; maxVal: number; linePath: string }

interface CrawledSvgChartProps {
  timeField: string;
  chartType: 'bar' | 'line';
  chartData: ChartData;
}

export const CrawledSvgChart: React.FC<CrawledSvgChartProps> = ({ timeField, chartType, chartData }) => {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, label: '', count: 0 });
  const formatNum = (v: number | string | null | undefined) => Number(v || 0).toLocaleString('vi-VN');
  const compactNum = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : (n >= 1e3 ? (n / 1e3).toFixed(1) + 'k' : String(n));

  const showTip = (evt: React.MouseEvent<SVGElement>, item: { label: string; count: number }) => {
    const r = evt.currentTarget.getBoundingClientRect();
    setTooltip({ visible: true, x: r.left + r.width / 2, y: r.top - 8, label: item.label, count: item.count });
  };

  return (
    <div className="card-glass p-3 rounded-xl border border-[var(--border-color)] space-y-2">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-1 text-xs">
        <span className="font-bold uppercase tracking-wider text-[var(--text-primary)]">
          📈 Biểu Đồ Sản Lượng MST ({timeField === 'regi_date' ? 'Ngày ĐKKD' : 'Ngày Quét'} - {chartData.points.length} mốc)
        </span>
        <span className="font-mono text-[var(--text-muted)]">Đỉnh: <b className="text-[var(--vnpt-blue)]">{formatNum(chartData.maxVal)}</b> MST</span>
      </div>

      <div className="relative w-full h-48 flex items-center justify-center overflow-x-auto">
        {chartData.points.length ? (
          <svg viewBox="0 0 760 180" className="w-full h-full select-none" preserveAspectRatio="none">
            <line x1="20" y1="155" x2="745" y2="155" stroke="currentColor" className="text-slate-300 dark:text-slate-700" strokeWidth="1" />
            <line x1="20" y1="85" x2="745" y2="85" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4" strokeWidth="1" />
            {chartType === 'bar' ? (
              <g>
                {chartData.points.map((p) => (
                  <g key={p.period}>
                    <rect x={p.x - p.width / 2} y={p.y} width={p.width} height={p.barH} rx="2"
                      className="fill-blue-500 hover:fill-blue-600 transition-all cursor-pointer opacity-90 hover:opacity-100"
                      onMouseEnter={(e) => showTip(e, p)} onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))} />
                    <text x={p.x} y={Math.max(p.y - 4, 10)} textAnchor="middle" className="text-[7.5px] fill-blue-600 dark:fill-blue-400 font-mono font-bold">{compactNum(p.count)}</text>
                    <text x={p.x} y="168" textAnchor="middle" className="text-[7.5px] fill-slate-500 font-mono">{p.shortLabel}</text>
                  </g>
                ))}
              </g>
            ) : (
              <g>
                <path d={chartData.linePath} fill="none" stroke="#2563eb" strokeWidth="2.5" />
                {chartData.points.map((p) => (
                  <g key={p.period}>
                    <circle cx={p.x} cy={p.y} r="3.5" className="fill-blue-600 stroke-white stroke-2 cursor-pointer"
                      onMouseEnter={(e) => showTip(e, p)} onMouseLeave={() => setTooltip((prev) => ({ ...prev, visible: false }))} />
                    <text x={p.x} y={Math.max(p.y - 6, 10)} textAnchor="middle" className="text-[7.5px] fill-blue-600 font-mono font-bold">{compactNum(p.count)}</text>
                    <text x={p.x} y="168" textAnchor="middle" className="text-[7.5px] fill-slate-500 font-mono">{p.shortLabel}</text>
                  </g>
                ))}
              </g>
            )}
          </svg>
        ) : (
          <div className="text-xs text-[var(--text-muted)] py-10"><span>📭 Chưa có dữ liệu trong khoảng thời gian đã chọn</span></div>
        )}
      </div>

      {tooltip.visible && (
        <div style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
          className="fixed -translate-x-1/2 -translate-y-full z-50 pointer-events-none bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-xl font-mono text-center">
          <div className="font-bold text-amber-300">📅 {timeField === 'regi_date' ? 'Ngày ĐKKD' : 'Ngày Quét'}: {tooltip.label}</div>
          <div className="font-bold text-blue-200">⚡ Số lượng: {formatNum(tooltip.count)} MST</div>
        </div>
      )}
    </div>
  );
};
