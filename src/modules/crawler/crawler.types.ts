// @id 01M4V0HMK5E6M49MPCPG8C9DR6
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/crawler/crawler.types.ts
 * Kiểu dữ liệu và interfaces cho module Điều khiển Crawler.
 */

export interface StartCrawlerDto {
  province_key: string;
  scan_mode?: 'full' | 'newest';
  seed_tin?: string | null;
  gap?: number;
  num_workers?: number;
}

export interface StartAllNewestDto {
  selected_provinces?: string[];
  gap?: number;
  num_workers?: number;
  max_concurrent_provinces?: number;
}

export interface ProvinceControlDto {
  province_key: string;
}

export interface CrawlerEngineStatus {
  province_key: string;
  is_running: boolean;
  is_paused: boolean;
  total_queried: number;
  total_found: number;
  speed: number;
  uptime: string;
}

export interface WorkerEngineStatus {
  is_running: boolean;
  is_paused: boolean;
  total_queried: number;
  total_found: number;
  last_tin?: string;
  last_scanned_at?: string;
  speed?: number;
  uptime?: string;
  scan_mode?: string;
  num_workers?: number;
}

export interface WorkerBridgeStatusResponse {
  engines: Record<string, WorkerEngineStatus>;
  logs: string[];
}
