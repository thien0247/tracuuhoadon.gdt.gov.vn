// @id 01M4W0H00K0000000000000007
// @related 01M4W0TYPE0000000000000001, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
/**
 * src/hooks/useTheme.ts - Quản lý chế độ hiển thị Sáng/Tối chuẩn VDDS (React Singleton Hook).
 */
import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'win95';

let currentTheme: ThemeMode = 'light';
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

function applyThemeGlobal(val: ThemeMode): void {
  currentTheme = val;
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('gdt_theme', val); } catch { /* ignore */ }
    document.documentElement.setAttribute('data-theme', val);
    if (val === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  notify();
}

let initialized = false;

export function useTheme() {
  const [, setTick] = useState(0);

  const initTheme = useCallback(() => {
    if (typeof window !== 'undefined') {
      const urlTheme = new URLSearchParams(window.location.search).get('theme') as ThemeMode | null;
      const saved = (urlTheme || localStorage.getItem('gdt_theme')) as ThemeMode | null;
      const valid: ThemeMode =
        saved === 'dark' || saved === 'win95' || saved === 'light' ? saved : 'light';
      applyThemeGlobal(valid);
    }
  }, []);

  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    if (!initialized) {
      initialized = true;
      initTheme();
    }
    return () => { listeners.delete(fn); };
  }, [initTheme]);

  const setTheme = useCallback((mode: ThemeMode) => {
    applyThemeGlobal(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const next: ThemeMode =
      currentTheme === 'light' ? 'dark' : currentTheme === 'dark' ? 'win95' : 'light';
    applyThemeGlobal(next);
  }, []);

  return { theme: currentTheme, setTheme, toggleTheme, initTheme };
}
