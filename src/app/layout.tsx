// @id 01M4W0APPR0000000000000001
// @related 01M4W0APPR0000000000000002

import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'GDT Tax Crawler & Search Engine — VNPT VDDS',
  description: 'Hệ thống Vét Cạn & Tra Cứu Mã Số Thuế Quốc Gia (Next.js App Router + PostgreSQL)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Quicksand:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
