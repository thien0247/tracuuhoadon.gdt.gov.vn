// @id 01M4W0H00K0000000000000006
// @related 01M4W0TYPE0000000000000001, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
/**
 * src/hooks/useInspector.ts - Quản lý trạng thái AI Inspector & Modal tra cứu component (React Singleton Hook).
 */
import { useState, useEffect, useCallback } from 'react';

export interface InspectorMeta {
  name: string;
  file: string;
  module: string;
  desc: string;
  ulid?: string;
}

let inspectorModeGlobal = false;
let selectedComponentGlobal: InspectorMeta | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export function useInspector() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  const toggleInspector = useCallback(() => {
    inspectorModeGlobal = !inspectorModeGlobal;
    notify();
  }, []);

  const openInspector = useCallback((meta: InspectorMeta) => {
    selectedComponentGlobal = meta;
    notify();
  }, []);

  const closeInspector = useCallback(() => {
    selectedComponentGlobal = null;
    notify();
  }, []);

  return {
    inspectorMode: inspectorModeGlobal,
    selectedComponent: selectedComponentGlobal,
    toggleInspector,
    openInspector,
    closeInspector
  };
}
