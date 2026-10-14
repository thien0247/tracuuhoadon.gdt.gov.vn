// @id 01M4W0AYT00000000000000003
// @related 01M4W0TYPE0000000000000001, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
import React from 'react';

export default function AppFooter() {
  return (
    <footer className="h-9 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between px-5 text-xs text-[var(--text-muted)] shrink-0">
      <span>Bản quyền © 2026 GDT Tax Crawler | VNPT VDDS Design System</span>
      <span className="font-mono">Next.js 14 App Router • React 18 • PostgreSQL 16</span>
    </footer>
  );
}
