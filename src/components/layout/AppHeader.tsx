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
  const isWin98 = theme === 'win98';

  return (
    <header className="h-[46px] sticky top-0 z-50 bg-[var(--vnpt-blue)] text-white flex items-center justify-between px-2.5 sm:px-3.5 shadow-md shrink-0 win98-titlebar">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-white/10 transition text-white shrink-0 flex items-center gap-1 win98-start-btn"
          title="Thu gọn / Mở rộng Menu"
        >
          {isWin98 ? (
            <span className="font-bold text-xs px-1.5 py-0.5 flex items-center gap-1 text-black">
              <span>🪟</span><span>Start</span>
            </span>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className="text-base sm:text-lg shrink-0">{isWin98 ? '💻' : '🔍'}</span>
          <span className="font-brand font-bold text-xs sm:text-sm tracking-wide truncate win98-title-text">
            {isWin98 ? 'GDT Tax Crawler - Control Panel [Windows 98 SE]' : 'GDT Tax Crawler'}
          </span>
          {!isWin98 && (
            <span className="hidden lg:inline-block text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold text-cyan-200 shrink-0">
              VDDS v4.0 • Next.js App Router
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-white/10 border border-white/20 win98-status-pill">
          <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          <span className="hidden sm:inline text-[11px]">{sseConnected ? 'Live' : 'Offline'}</span>
        </div>
        <button
          onClick={() => onSwitchTab('services')}
          title="Quản lý và điều khiển các dịch vụ hệ thống"
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold transition border border-white/20 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
        >
          <span>🛠️</span><span className="hidden sm:inline">Dịch Vụ</span>
        </button>
        <button
          onClick={toggleInspector}
          title={inspectorMode ? 'Tắt AI Inspector (Alt+I)' : 'Bật AI Inspector (Alt+I)'}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition border border-white/20 ${
            inspectorMode ? 'bg-violet-500 text-white shadow-sm win98-btn-active' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <span>🔬</span><span className="hidden xl:inline">Inspector</span>
        </button>

        <div className="flex items-center bg-black/20 p-0.5 rounded-lg border border-white/20 text-[11px] font-bold win98-theme-group">
          <button
            onClick={() => setTheme('light')}
            title="Giao diện Sáng (VDDS Light)"
            className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 ${
              theme === 'light' ? 'bg-white text-slate-900 shadow-sm win98-btn-active' : 'text-white/80 hover:text-white'
            }`}
          >
            <span>☀️</span><span className="hidden md:inline">Sáng</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            title="Giao diện Tối (VDDS Dark)"
            className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 ${
              theme === 'dark' ? 'bg-slate-800 text-cyan-300 shadow-sm win98-btn-active' : 'text-white/80 hover:text-white'
            }`}
          >
            <span>🌙</span><span className="hidden md:inline">Tối</span>
          </button>
          <button
            onClick={() => setTheme('win98')}
            title="Giao diện Windows 98 Classic (98.css Style)"
            className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 ${
              isWin98 ? 'bg-[#c0c0c0] text-black shadow-sm win98-btn-active' : 'text-white/80 hover:text-white'
            }`}
          >
            <span>🪟</span><span>Win98</span>
          </button>
        </div>

        {isWin98 && (
          <div className="hidden sm:flex items-center gap-0.5 ml-1 pl-1 border-l border-white/30" aria-hidden="true">
            <span className="win98-caption-btn" title="Minimize">_</span>
            <span className="win98-caption-btn" title="Maximize">□</span>
            <span className="win98-caption-btn font-extrabold" title="Close">✕</span>
          </div>
        )}
      </div>
    </header>
  );
}
