// @id 01M4W0AYT00000000000000002
// @related 01M4W0TYPE0000000000000001, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
import React from 'react';

interface AppSidebarProps {
  collapsed: boolean;
  activeTab: string;
  maxConcurrent: number;
  stalledCount?: number;
  onChangeActiveTab: (tab: string) => void;
  onChangeMaxConcurrent: (val: number) => void;
  onStartNewest: () => void;
  onStartAll: () => void;
  onStopAll: () => void;
}

const menuGroups = [
  {
    title: 'Vét Cạn & Giám Sát',
    items: [
      { id: 'scan', icon: '📊', name: 'Quản Lý Quét Đa Tỉnh' },
      { id: 'services', icon: '🛠️', name: 'Điều Khiển Dịch Vụ' },
      { id: 'crawled_report', icon: '📈', name: 'Báo Cáo Sản Lượng' },
      { id: 'health_report', icon: '🩺', name: 'Giám Sát Sức Khỏe' },
      { id: 'config', icon: '⚙️', name: 'Cấu Hình Tỉnh Thành' }
    ]
  },
  {
    title: 'Bố Cáo & Đối Soát',
    items: [
      { id: 'bocao', icon: '📰', name: 'Bố Cáo ĐKKD Mới Nhất' },
      { id: 'bocao_reconcile', icon: '⚖️', name: 'Đối Soát Bố Cáo & Thuế' }
    ]
  },
  {
    title: 'Tra Cứu & Khai Thác',
    items: [
      { id: 'search', icon: '🔍', name: 'Tra Cứu Doanh Nghiệp' },
      { id: 'filter', icon: '📅', name: 'Lọc & Xuất Dữ Liệu' },
      { id: 'enrichment', icon: '✨', name: 'Làm Giàu Thuộc Tính' }
    ]
  },
  {
    title: 'Kiến Trúc & Đồ Thị',
    items: [
      { id: 'graphify', icon: '🕸️', name: 'Đồ Thị Kiến Trúc (Graph)' }
    ]
  }
];

export default function AppSidebar({
  collapsed,
  activeTab,
  maxConcurrent,
  stalledCount = 0,
  onChangeActiveTab,
  onChangeMaxConcurrent,
  onStartNewest,
  onStartAll,
  onStopAll
}: AppSidebarProps) {
  return (
    <aside className={`${collapsed ? 'w-16' : 'w-60'} transition-all duration-200 border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col justify-between shrink-0 shadow-sm`}>
      <div className="p-3 space-y-4">
        <nav className="space-y-2.5">
          {menuGroups.map((grp, gIdx) => (
            <div key={grp.title} className={gIdx > 0 ? 'pt-2 border-t border-[var(--border-color)]' : ''}>
              {!collapsed && <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 mb-1">{grp.title}</div>}
              <div className="space-y-0.5">
                {grp.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onChangeActiveTab(item.id)}
                    title={item.name}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-semibold transition text-left ${
                      activeTab === item.id
                        ? 'bg-[var(--vnpt-blue)] text-white shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                    }`}
                  >
                    <span className="text-sm shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.name}</span>}
                    {item.id === 'health_report' && !collapsed && stalledCount > 0 && (
                      <span className="ml-auto px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">{stalledCount}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="p-3 border-t border-[var(--border-color)] space-y-2 bg-[var(--bg-secondary)]">
        {!collapsed && <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">Tác Vụ Nhanh</div>}
        <button
          onClick={onStartNewest}
          title={collapsed ? 'Quét TIN Max Toàn Bộ' : ''}
          className="w-full py-1.5 px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
        >
          <span>⚡</span>{!collapsed && <span>Quét TIN Max</span>}
        </button>
        {!collapsed && (
          <div className="flex items-center justify-between bg-[var(--bg-card)] px-2.5 py-1 rounded-xl border border-[var(--border-color)]">
            <span className="text-[11px] font-semibold text-[var(--text-muted)]">Song song:</span>
            <select
              value={maxConcurrent}
              onChange={(e) => onChangeMaxConcurrent(Number(e.target.value))}
              className="bg-transparent border-0 text-xs font-bold text-[var(--vnpt-blue)] focus:ring-0 cursor-pointer p-0"
            >
              <option value={1}>1 tỉnh</option>
              <option value={2}>2 tỉnh</option>
              <option value={3}>3 tỉnh</option>
              <option value={4}>4 tỉnh</option>
            </select>
          </div>
        )}
        <div className={`grid ${collapsed ? 'grid-cols-1 gap-1' : 'grid-cols-2 gap-1.5'}`}>
          <button onClick={onStartAll} title="Start All" className="py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1">
            <span>🚀</span>{!collapsed && <span>Start</span>}
          </button>
          <button onClick={onStopAll} title="Stop All" className="py-1 px-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1">
            <span>⏹</span>{!collapsed && <span>Stop</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
