// @id 01M4W0H00K0000000000000003
// @related 01M4W0TYPE0000000000000001, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
/**
 * src/hooks/useTableResize.ts
 * React Hook quản lý kích thước cột (Column Resizing) và lưu cache vào browser localStorage.
 */
import { useState, useCallback, useEffect } from 'react';
import type { ColumnSizingState, OnChangeFn } from '@tanstack/react-table';

export function useTableResize(storageKey: string, defaultSizes: Record<string, number> = {}) {
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => ({ ...defaultSizes }));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        setColumnSizing({ ...defaultSizes, ...parsed });
      }
    } catch {
      // fallback to default on error
    }
  }, [storageKey]);

  const onSizingChange: OnChangeFn<ColumnSizingState> = useCallback((updater) => {
    setColumnSizing((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore storage quota issues
      }
      return next;
    });
  }, [storageKey]);

  const resetSizing = useCallback(() => {
    setColumnSizing({ ...defaultSizes });
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey, defaultSizes]);

  return { columnSizing, onSizingChange, resetSizing };
}
