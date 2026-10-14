// @id 01M4W0H00K0000000000000004
// @related 01M4W0TYPE0000000000000001, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
/**
 * src/hooks/useTablePageSize.ts
 * React Hook quản lý kích thước trang (Page Size [30, 50, 100]), đồng bộ URL parameters và localStorage.
 */
import { useState, useCallback, useEffect } from 'react';

export const ALLOWED_PAGE_SIZES = [30, 50, 100] as const;
export type PageSizeOption = typeof ALLOWED_PAGE_SIZES[number];

export function useTablePageSize(storageKey: string, defaultSize: PageSizeOption = 50, urlParam = 'pageSize') {
  const syncToUrl = useCallback((val: PageSizeOption) => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get(urlParam) !== String(val)) {
        url.searchParams.set(urlParam, String(val));
        window.history.replaceState({}, '', url.toString());
      }
    } catch { /* Ignore */ }
  }, [urlParam]);

  const [pageSize, setPageSizeState] = useState<PageSizeOption>(() => {
    if (typeof window === 'undefined') return defaultSize;
    try {
      const sp = new URLSearchParams(window.location.search);
      const urlVal = parseInt(sp.get(urlParam) || sp.get('limit') || sp.get('page_size') || '', 10);
      if (ALLOWED_PAGE_SIZES.includes(urlVal as PageSizeOption)) {
        localStorage.setItem(storageKey, String(urlVal));
        return urlVal as PageSizeOption;
      }
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const val = parseInt(raw, 10);
        if (ALLOWED_PAGE_SIZES.includes(val as PageSizeOption)) return val as PageSizeOption;
      }
    } catch { /* Fallback */ }
    return defaultSize;
  });

  useEffect(() => {
    syncToUrl(pageSize);
  }, [pageSize, syncToUrl]);

  const setPageSize = useCallback((newSize: number) => {
    const validSize = ALLOWED_PAGE_SIZES.includes(newSize as PageSizeOption)
      ? (newSize as PageSizeOption)
      : defaultSize;
    setPageSizeState(validSize);
    try { localStorage.setItem(storageKey, String(validSize)); } catch { /* Ignore */ }
    syncToUrl(validSize);
  }, [defaultSize, storageKey, syncToUrl]);

  return { pageSize, setPageSize, allowedPageSizes: ALLOWED_PAGE_SIZES };
}
