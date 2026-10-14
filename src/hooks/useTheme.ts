// @id 01M4W0H00K0000000000000007
// @related 01M4W0TYPE0000000000000001, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
/**
 * src/hooks/useTheme.ts - Quản lý chế độ hiển thị Sáng/Tối chuẩn VDDS (React Singleton Hook).
 */
import { useState, useEffect, useCallback } from 'react';

let currentTheme: 'light' | 'dark' = 'light';
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

function applyThemeGlobal(val: 'light' | 'dark'): void {
  currentTheme = val;
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('gdt_theme', val); } catch { /* ignore */ }
    document.documentElement.setAttribute('data-theme', val);
  }
  notify();
}

export function useTheme() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const toggleTheme = useCallback(() => {
    applyThemeGlobal(currentTheme === 'dark' ? 'light' : 'dark');
  }, []);

  const initTheme = useCallback(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem('gdt_theme') as 'light' | 'dark') || 'light';
      applyThemeGlobal(saved);
    }
  }, []);

  return { theme: currentTheme, toggleTheme, initTheme };
}
