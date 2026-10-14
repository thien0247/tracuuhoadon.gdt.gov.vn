// @id 01M4W0H00K0000000000000002
// @related 01M4W0APJC0000000000000001, 01M4W0H00K0000000000000001, 01M4W0TYPE0000000000000001
'use client';
/**
 * src/hooks/useCrawlerControl.ts - Điều khiển điều phối crawler, cấu hình tỉnh thành và RPS toàn cục.
 */
import { useState, useCallback } from 'react';
import { ApiClient } from '../api/client';
import { useSSE } from './useSSE';
import type { ProvinceConfig, SystemConfig } from '../types';

export function useCrawlerControl() {
  const { provinceStatus } = useSSE();
  const [provinceConfigs, setProvinceConfigs] = useState<Record<string, ProvinceConfig>>({});
  const [serverProvinces, setServerProvinces] = useState<Record<string, { id?: string | number; prefix?: string; activation_tin?: string; name?: string }>>({});
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({ max_global_rps: 32 });
  const [maxConcurrentProvinces, setMaxConcurrentProvinces] = useState<number>(3);

  const getProvStatus = useCallback((key: string) => {
    return (provinceStatus && provinceStatus[key]) || {
      running: false, paused: false, queried: 0, found: 0, speed: 0,
      last_tin: '', last_scanned_at: '', uptime: '00:00:00', db_count: 0
    };
  }, [provinceStatus]);

  const loadSystemConfig = useCallback(async () => {
    try {
      const res = await ApiClient.getSystemConfig();
      if (res) setSystemConfig(res);
    } catch (e) { console.error('Lỗi tải system config:', e); }
  }, []);

  const saveGlobalRps = useCallback(async (overrideRps?: number) => {
    const val = Math.max(0.5, Number(overrideRps ?? systemConfig.max_global_rps) || 8);
    setSystemConfig((prev) => ({ ...prev, max_global_rps: val }));
    await ApiClient.updateSystemConfig({ max_global_rps: val });
  }, [systemConfig.max_global_rps]);

  const changeGlobalRps = useCallback(async (delta: number) => {
    const next = Math.max(0.5, (Number(systemConfig.max_global_rps) || 8) + delta);
    setSystemConfig((prev) => ({ ...prev, max_global_rps: next }));
    await ApiClient.updateSystemConfig({ max_global_rps: next });
  }, [systemConfig.max_global_rps]);

  const loadProvinces = useCallback(async (retries = 15, delayMs = 1500) => {
    try {
      const cfgData = await ApiClient.getProvincesConfig();
      const srvProvs = cfgData.provinces || {};
      setServerProvinces(srvProvs);
      setProvinceConfigs((prev) => {
        const next = { ...prev };
        for (const key in srvProvs) {
          if (!next[key]) {
            next[key] = {
              scan_mode: 'bidirectional', gap: 5000, num_workers: 3,
              seed_tin: srvProvs[key].activation_tin
            };
          }
        }
        return next;
      });
      await ApiClient.getProvincesLive();
    } catch {
      if (retries > 0) setTimeout(() => { void loadProvinces(retries - 1, delayMs); }, delayMs);
    }
  }, []);

  const updateProvinceConfig = useCallback((key: string, patch: Partial<ProvinceConfig>) => {
    setProvinceConfigs((prev) => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...patch }
    }));
  }, []);

  const startProv = useCallback(async (key: string) => {
    const cfg = provinceConfigs[key] || {};
    let seed = cfg.seed_tin || '';
    const st = getProvStatus(key);
    if (cfg.scan_mode === 'newest' && st.tin_max) {
      seed = st.tin_max || seed;
    }
    await ApiClient.startCrawler({
      province_key: key, scan_mode: cfg.scan_mode || 'bidirectional',
      seed_tin: seed, gap: cfg.gap || 5000, num_workers: cfg.num_workers || 3
    });
  }, [provinceConfigs, getProvStatus]);

  const pauseProv = useCallback(async (key: string) => { await ApiClient.pauseCrawler(key); }, []);
  const stopProv = useCallback(async (key: string) => { await ApiClient.stopCrawler(key); }, []);

  const startAllProvinces = useCallback(async () => {
    const reqList = Object.entries(provinceConfigs).map(([key, cfg]) => ({
      province_key: key, scan_mode: cfg.scan_mode || 'bidirectional',
      seed_tin: (cfg.scan_mode === 'newest' && getProvStatus(key).tin_max) ? getProvStatus(key).tin_max : cfg.seed_tin,
      gap: cfg.gap || 5000, num_workers: cfg.num_workers || 3
    }));
    await ApiClient.startAllCrawlers(reqList);
  }, [provinceConfigs, getProvStatus]);

  const startAllNewestProvinces = useCallback(async () => {
    setProvinceConfigs((prev) => {
      const next = { ...prev };
      for (const key in next) {
        const status = getProvStatus(key);
        if (status.tin_max) {
          next[key] = { ...next[key], seed_tin: status.tin_max, scan_mode: 'newest', gap: 20, num_workers: 2 };
        }
      }
      return next;
    });
    await ApiClient.startAllNewestCrawlers({
      gap: 20, num_workers: 2,
      max_concurrent_provinces: Number(maxConcurrentProvinces) || 3
    });
  }, [getProvStatus, maxConcurrentProvinces]);

  const stopAllProvinces = useCallback(async () => { await ApiClient.stopAllCrawlers(); }, []);

  return {
    provinceConfigs, setProvinceConfigs, updateProvinceConfig,
    serverProvinces, systemConfig, setSystemConfig,
    maxConcurrentProvinces, setMaxConcurrentProvinces,
    loadSystemConfig, saveGlobalRps, changeGlobalRps, loadProvinces,
    startProv, pauseProv, stopProv, startAllProvinces, startAllNewestProvinces, stopAllProvinces
  };
}
