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
  const { theme, toggleTheme } = useTheme();
  const { sseConnected } = useSSE();
  const { inspectorMode, toggleInspector } = useInspector();

  return (
    <header className="h-[50px] sticky top-0 z-50 bg-[var(--vnpt-blue)] text-white flex items-center justify-between px-4 shadow-md shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar} className="p-1.5 rounded-lg hover:bg-white/10 transition text-white" title="Thu gọn / Mở rộng Sidebar">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl">🔍</span>
          <span className="font-brand font-bold text-sm tracking-wide uppercase">GDT Tax Crawler</span>
          <span className="hidden md:inline-block text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold text-cyan-200">
            VDDS v4.0 • Next.js App Router
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20">
          <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
          <span className="text-[11px]">{sseConnected ? 'Live' : 'Offline'}</span>
        </div>
        <button
          onClick={() => onSwitchTab('services')}
          title="Quản lý và điều khiển các dịch vụ hệ thống"
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition border border-white/20 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
        >
          <span>🛠️</span><span>Điều Khiển Dịch Vụ</span>
        </button>
        <button
          onClick={toggleInspector}
          title={inspectorMode ? 'Tắt AI Inspector (Alt+I)' : 'Bật AI Inspector (Alt+I)'}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition border border-white/20 ${
            inspectorMode ? 'bg-violet-500 text-white shadow-sm' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <span>🔬</span><span className="hidden sm:inline">Inspector</span>
        </button>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
          title={theme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'}
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/20 text-xs">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-cyan-200">VN</div>
          <span className="font-medium text-white/90">Quản trị viên</span>
        </div>
      </div>
    </header>
  );
}
