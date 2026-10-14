// @id 01M4V0HMNR9DVYBS4PKA9P3ACP
// @related 01M4V0HMMAGER9D326B643B5RY, 01M4V0HMNWVM2K7TD8J9CYHS8V, 01M4V0HMNZYFQF5C97DPYG8AR4, 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ
/**
 * composables/useCrawlerControl.ts - Điều khiển điều phối crawler, cấu hình tỉnh thành và RPS toàn cục.
 */
import { ref } from 'vue';
import { ApiClient } from '../api/client';
import { useSSE } from './useSSE';
import type { ProvinceConfig, SystemConfig } from '../types';

export function useCrawlerControl() {
  const { provinceStatus } = useSSE();
  const provinceConfigs = ref<Record<string, ProvinceConfig>>({});
  const serverProvinces = ref<Record<string, { id?: string | number; prefix?: string; activation_tin?: string; name?: string }>>({});
  const systemConfig = ref<SystemConfig>({ max_global_rps: 32 });
  const maxConcurrentProvinces = ref(3);

  const getProvStatus = (key: string) => {
    return (provinceStatus.value && provinceStatus.value[key]) || {
      running: false, paused: false, queried: 0, found: 0, speed: 0,
      last_tin: '', last_scanned_at: '', uptime: '00:00:00', db_count: 0
    };
  };

  const loadSystemConfig = async () => {
    try {
      const res = await ApiClient.getSystemConfig();
      if (res) systemConfig.value = res;
    } catch (e) { console.error('Lỗi tải system config:', e); }
  };

  const saveGlobalRps = async () => {
    const val = Math.max(0.5, Number(systemConfig.value.max_global_rps) || 8);
    systemConfig.value.max_global_rps = val;
    await ApiClient.updateSystemConfig({ max_global_rps: val });
  };

  const changeGlobalRps = async (delta: number) => {
    const next = Math.max(0.5, (Number(systemConfig.value.max_global_rps) || 8) + delta);
    systemConfig.value.max_global_rps = next;
    await ApiClient.updateSystemConfig({ max_global_rps: next });
  };

  const loadProvinces = async (retries = 15, delayMs = 1500) => {
    try {
      const cfgData = await ApiClient.getProvincesConfig();
      serverProvinces.value = cfgData.provinces || {};
      for (const key in serverProvinces.value) {
        if (!provinceConfigs.value[key]) {
          provinceConfigs.value[key] = {
            scan_mode: 'bidirectional', gap: 5000, num_workers: 3,
            seed_tin: serverProvinces.value[key].activation_tin
          };
        }
      }
      await ApiClient.getProvincesLive();
    } catch {
      if (retries > 0) setTimeout(() => loadProvinces(retries - 1, delayMs), delayMs);
    }
  };

  const startProv = async (key: string) => {
    const cfg = provinceConfigs.value[key] || {};
    let seed = cfg.seed_tin || '';
    if (cfg.scan_mode === 'newest' && getProvStatus(key).tin_max) {
      seed = getProvStatus(key).tin_max || seed;
    }
    await ApiClient.startCrawler({
      province_key: key, scan_mode: cfg.scan_mode || 'bidirectional',
      seed_tin: seed, gap: cfg.gap || 5000, num_workers: cfg.num_workers || 3
    });
  };

  const pauseProv = async (key: string) => { await ApiClient.pauseCrawler(key); };
  const stopProv = async (key: string) => { await ApiClient.stopCrawler(key); };

  const startAllProvinces = async () => {
    const reqList = Object.entries(provinceConfigs.value).map(([key, cfg]) => ({
      province_key: key, scan_mode: cfg.scan_mode || 'bidirectional',
      seed_tin: (cfg.scan_mode === 'newest' && getProvStatus(key).tin_max) ? getProvStatus(key).tin_max : cfg.seed_tin,
      gap: cfg.gap || 5000, num_workers: cfg.num_workers || 3
    }));
    await ApiClient.startAllCrawlers(reqList);
  };

  const startAllNewestProvinces = async () => {
    for (const key in provinceConfigs.value) {
      const status = getProvStatus(key);
      if (status.tin_max) {
        provinceConfigs.value[key].seed_tin = status.tin_max;
        provinceConfigs.value[key].scan_mode = 'newest';
        provinceConfigs.value[key].gap = 20;
        provinceConfigs.value[key].num_workers = 2;
      }
    }
    await ApiClient.startAllNewestCrawlers({
      gap: 20, num_workers: 2,
      max_concurrent_provinces: Number(maxConcurrentProvinces.value) || 3
    });
  };

  const stopAllProvinces = async () => { await ApiClient.stopAllCrawlers(); };

  return {
    provinceConfigs, serverProvinces, systemConfig, maxConcurrentProvinces,
    loadSystemConfig, saveGlobalRps, changeGlobalRps, loadProvinces,
    startProv, pauseProv, stopProv, startAllProvinces, startAllNewestProvinces, stopAllProvinces
  };
}
