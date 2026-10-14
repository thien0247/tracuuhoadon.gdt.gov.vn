// @id 01M4V0HMJQW0H28WZZG31AXN0K
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/config/env.ts
 * Quản lý cấu hình hệ thống, nạp thông số mạng và kết nối PostgreSQL.
 */

import fs from 'node:fs';
import path from 'node:path';

export interface SystemConfig {
  host: string;
  port: number;
  workerPort: number;
  dbDsn: string;
  maxGlobalRps: number;
  maxConcurrentRequests: number;
  staggerDelaySeconds: number;
  wafCooldownSeconds: number;
}

const CONFIG_PATH = path.resolve(process.cwd(), 'config.json');

const DEFAULT_CONFIG: SystemConfig = {
  host: '0.0.0.0',
  port: 8123,
  workerPort: 8124,
  dbDsn: process.env.DB_DSN || 'postgresql://zzsu:Zzs%40123@localhost:5433/taxdb',
  maxGlobalRps: 8.0,
  maxConcurrentRequests: 4,
  staggerDelaySeconds: 1.5,
  wafCooldownSeconds: 30.0
};

export function loadSystemConfig(): SystemConfig {
  const config: SystemConfig = { ...DEFAULT_CONFIG };
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data.host) config.host = String(data.host);
      if (data.port) config.port = Number(data.port);
      if (data.worker_port) config.workerPort = Number(data.worker_port);
      if (data.max_global_rps) config.maxGlobalRps = Number(data.max_global_rps);
      if (data.max_concurrent_requests) {
        config.maxConcurrentRequests = Number(data.max_concurrent_requests);
      }
      if (data.stagger_delay_seconds) {
        config.staggerDelaySeconds = Number(data.stagger_delay_seconds);
      }
      if (data.waf_cooldown_seconds) {
        config.wafCooldownSeconds = Number(data.waf_cooldown_seconds);
      }
    } catch (err) {
      console.warn('[Config] Failed to parse config.json, using defaults:', err);
    }
  }
  return config;
}

export function saveSystemConfig(updates: Partial<SystemConfig>): SystemConfig {
  const current = loadSystemConfig();
  const nextConfig: SystemConfig = {
    ...current,
    ...updates
  };

  try {
    const rawToSave = {
      host: nextConfig.host,
      port: nextConfig.port,
      worker_port: nextConfig.workerPort,
      max_global_rps: nextConfig.maxGlobalRps,
      max_concurrent_requests: nextConfig.maxConcurrentRequests,
      stagger_delay_seconds: nextConfig.staggerDelaySeconds,
      waf_cooldown_seconds: nextConfig.wafCooldownSeconds
    };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(rawToSave, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Config] Failed to save config.json:', err);
  }

  return nextConfig;
}

export const env = loadSystemConfig();
