// @id 01M4W0AYT00000000000000002
// @related 01M4W0TYPE0000000000000001, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
import React from 'react';

interface AppSidebarProps {
  collapsed: boolean;
  mobileOpen?: boolean;
  activeTab: string;
  maxConcurrent: number;
  stalledCount?: number;
  onChangeActiveTab: (tab: string) => void;
  onCloseMobile?: () => void;
  onToggleMobile?: () => void;
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

const mobileQuickTabs = [
  { id: 'scan', icon: '📊', label: 'Quét MST' },
  { id: 'search', icon: '🔍', label: 'Tra Cứu' },
  { id: 'filter', icon: '📅', label: 'Lọc & Xuất' },
  { id: 'bocao', icon: '📰', label: 'Bố Cáo' },
];

export default function AppSidebar({
  collapsed,
  mobileOpen = false,
  activeTab,
  maxConcurrent,
  stalledCount = 0,
  onChangeActiveTab,
  onCloseMobile,
  onToggleMobile,
  onChangeMaxConcurrent,
  onStartNewest,
  onStartAll,
  onStopAll
}: AppSidebarProps) {
  const showLabels = !collapsed || mobileOpen;
  const selectTab = (id: string) => {
    onChangeActiveTab(id);
    onCloseMobile?.();
  };

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 top-[50px] bg-slate-900/50 backdrop-blur-[1px] z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 top-[50px] z-40 w-64 transform transition-transform duration-200 md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } ${collapsed ? 'md:w-16' : 'md:w-60'} border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col justify-between shrink-0 overflow-y-auto md:shadow-sm`}
      >
        <div className="p-3 space-y-4">
          <nav className="space-y-2.5">
            {menuGroups.map((grp, gIdx) => (
              <div key={grp.title} className={gIdx > 0 ? 'pt-2 border-t border-[var(--border-color)]' : ''}>
                {showLabels && <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 mb-1">{grp.title}</div>}
                <div className="space-y-0.5">
                  {grp.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectTab(item.id)}
                      title={item.name}
                      className={`w-full flex items-center gap-2 px-2 py-2 md:py-1.5 rounded-xl text-xs font-semibold transition text-left ${
                        activeTab === item.id
                          ? 'bg-[var(--vnpt-blue)] text-white shadow-sm'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                      }`}
                    >
                      <span className="text-sm shrink-0">{item.icon}</span>
                      {showLabels && <span className="truncate">{item.name}</span>}
                      {item.id === 'health_report' && showLabels && stalledCount > 0 && (
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
          {showLabels && <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">Tác Vụ Nhanh</div>}
          <button
            onClick={onStartNewest}
            title={!showLabels ? 'Quét TIN Max Toàn Bộ' : ''}
            className="w-full py-1.5 px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <span>⚡</span>{showLabels && <span>Quét TIN Max</span>}
          </button>
          {showLabels && (
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
          <div className={`grid ${!showLabels ? 'grid-cols-1 gap-1' : 'grid-cols-2 gap-1.5'}`}>
            <button onClick={onStartAll} title="Start All" className="py-1.5 md:py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1">
              <span>🚀</span>{showLabels && <span>Start</span>}
            </button>
            <button onClick={onStopAll} title="Stop All" className="py-1.5 md:py-1 px-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1">
              <span>⏹</span>{showLabels && <span>Stop</span>}
            </button>
          </div>
        </div>
      </aside>

      <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-[var(--bg-card)] border-t border-[var(--border-color)] grid grid-cols-5 h-14 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        {mobileQuickTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => selectTab(t.id)}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition ${
              activeTab === t.id ? 'text-[var(--vnpt-blue)] bg-blue-50/60 dark:bg-indigo-950/40' : 'text-[var(--text-secondary)]'
            }`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            <span className="truncate max-w-full px-1">{t.label}</span>
          </button>
        ))}
        <button
          onClick={onToggleMobile}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition ${
            mobileOpen ? 'text-[var(--vnpt-blue)] bg-blue-50/60 dark:bg-indigo-950/40' : 'text-[var(--text-secondary)]'
          }`}
        >
          <span className="text-base leading-none">☰</span>
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
}
