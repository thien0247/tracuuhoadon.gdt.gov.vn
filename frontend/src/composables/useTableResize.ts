// @id 01M4V8B5K3HZZ1286VCPTY99P2
// @related 01M4V8A0K2GZZ1186VCPTY99N3, 01M4V0HMNFP54NSRTMHYDMZ9M4
/**
 * frontend/src/composables/useTableResize.ts
 * Composable quản lý kích thước cột (Column Resizing) và lưu cache vào browser localStorage.
 */

import { ref } from 'vue';

export function useTableResize(storageKey: string, defaultSizes: Record<string, number> = {}) {
  const loadSaved = (): Record<string, number> => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        return { ...defaultSizes, ...parsed };
      }
    } catch {
      // fallback to default on error
    }
    return { ...defaultSizes };
  };

  const columnSizing = ref<Record<string, number>>(loadSaved());

  const onSizingChange = (updater: unknown) => {
    columnSizing.value = typeof updater === 'function'
      ? (updater as (old: Record<string, number>) => Record<string, number>)(columnSizing.value)
      : (updater as Record<string, number>);
    try {
      localStorage.setItem(storageKey, JSON.stringify(columnSizing.value));
    } catch {
      // ignore storage quota issues
    }
  };

  const resetSizing = () => {
    columnSizing.value = { ...defaultSizes };
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  return { columnSizing, onSizingChange, resetSizing };
}
