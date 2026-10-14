// @id 01M4W0AYT00000000000000001
// @related 01M4W0H00K0000000000000007, 01M4W0H00K0000000000000001, 01M4W0H00K0000000000000006
'use client';
import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useSSE } from '@/hooks/useSSE';
import { useInspector } from '@/hooks/useInspector';

interface AppHeaderProps {
  onToggleSidebar: () => void;
  onSwitchTab: (tab: string) => void;
}

export default function AppHeader({ onToggleSidebar, onSwitchTab }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();
  const { sseConnected } = useSSE();
  const { inspectorMode, toggleInspector } = useInspector();
  const isAntd = theme === 'antd';

  return (
    <header className="h-[48px] sticky top-0 z-50 bg-[var(--vnpt-blue)] text-white flex items-center justify-between px-3 sm:px-4 shadow-sm shrink-0 antd-pro-header">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md hover:bg-white/10 transition text-white shrink-0 flex items-center justify-center"
          title="Thu gọn / Mở rộng Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-6 h-6 rounded-md bg-[#1677ff] flex items-center justify-center text-xs font-extrabold shadow-xs shrink-0">
            {isAntd ? '🐜' : '🔍'}
          </span>
          <span className="font-semibold text-xs sm:text-sm tracking-tight truncate">
            GDT Tax Crawler
          </span>
          <span className="hidden lg:inline-block text-[10px] bg-white/10 border border-white/15 px-2 py-0.5 rounded font-medium text-blue-200 shrink-0">
            {isAntd ? 'Ant Design Pro v5.0' : 'VDDS v4.0 • Next.js 14'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-white/10 border border-white/15">
          <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-[#52c41a] animate-pulse' : 'bg-[#ff4d4f]'}`} />
          <span className="hidden sm:inline text-[11px]">{sseConnected ? 'Online' : 'Offline'}</span>
        </div>
        <button
          onClick={() => onSwitchTab('services')}
          title="Quản lý và điều khiển các dịch vụ hệ thống"
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition bg-[#1677ff] hover:bg-[#4096ff] text-white shadow-xs"
        >
          <span>🛠️</span><span className="hidden sm:inline">Dịch Vụ</span>
        </button>
        <button
          onClick={toggleInspector}
          title={inspectorMode ? 'Tắt AI Inspector (Alt+I)' : 'Bật AI Inspector (Alt+I)'}
          className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition border ${
            inspectorMode
              ? 'bg-[#722ed1] border-[#9254de] text-white'
              : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
          }`}
        >
          <span>🔬</span><span className="hidden xl:inline">Inspector</span>
        </button>

        <div className="flex items-center bg-black/25 p-0.5 rounded-md border border-white/15 text-[11px] font-medium">
          <button
            onClick={() => setTheme('antd')}
            title="Giao diện Ant Design v5 Pro (Mặc định)"
            className={`px-2 py-0.5 rounded transition flex items-center gap-1 ${
              isAntd ? 'bg-[#1677ff] text-white shadow-xs font-semibold' : 'text-white/75 hover:text-white'
            }`}
          >
            <span>💎</span><span>AntD</span>
          </button>
          <button
            onClick={() => setTheme('light')}
            title="Giao diện Sáng (VDDS Light)"
            className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 ${
              theme === 'light' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-white/75 hover:text-white'
            }`}
          >
            <span>☀️</span><span className="hidden md:inline">Sáng</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            title="Giao diện Tối (Dark Mode)"
            className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 ${
              theme === 'dark' ? 'bg-slate-800 text-cyan-300 shadow-xs font-semibold' : 'text-white/75 hover:text-white'
            }`}
          >
            <span>🌙</span><span className="hidden md:inline">Tối</span>
          </button>
        </div>
      </div>
    </header>
  );
}
