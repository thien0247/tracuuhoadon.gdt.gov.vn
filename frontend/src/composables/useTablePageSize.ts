// @id 01M4V8C5K9HZZ1286VCPTY99Q5
// @related 01M4V8A0K2GZZ1186VCPTY99N3, 01M4V0HMNFP54NSRTMHYDMZ9M4
/**
 * frontend/src/composables/useTablePageSize.ts
 * Quản lý kích thước trang (Page Size) cho bảng ma trận, đồng bộ URL parameters và localStorage.
 */

import { ref } from 'vue';

export const ALLOWED_PAGE_SIZES = [30, 50, 100] as const;
export type PageSizeOption = typeof ALLOWED_PAGE_SIZES[number];

export function useTablePageSize(storageKey: string, defaultSize: PageSizeOption = 50, urlParam = 'pageSize') {
  const syncToUrl = (val: PageSizeOption) => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get(urlParam) !== String(val)) {
        url.searchParams.set(urlParam, String(val));
        window.history.replaceState({}, '', url.toString());
      }
    } catch { /* Bỏ qua môi trường test */ }
  };

  const loadSaved = (): PageSizeOption => {
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
  };

  const initialSize = loadSaved();
  const pageSize = ref<PageSizeOption>(initialSize);
  syncToUrl(initialSize);

  const setPageSize = (newSize: number) => {
    const validSize = ALLOWED_PAGE_SIZES.includes(newSize as PageSizeOption)
      ? (newSize as PageSizeOption)
      : defaultSize;
    pageSize.value = validSize;
    try { localStorage.setItem(storageKey, String(validSize)); } catch { /* Ignore */ }
    syncToUrl(validSize);
  };

  return { pageSize, setPageSize, allowedPageSizes: ALLOWED_PAGE_SIZES };
}
