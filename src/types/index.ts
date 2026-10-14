// @id 01M4W0TYPE0000000000000001
// @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/types/index.ts - Định nghĩa TypeScript interfaces toàn bộ thực thể dữ liệu Web Dashboard (Next.js App Router).
 */

export interface MasterMetrics {
  total_queried: number;
  total_found: number;
  total_speed: number;
  total_db_records: number;
  running_count: number;
}

export interface ProvinceConfig {
  scan_mode?: 'bidirectional' | 'newest';
  gap?: number;
  num_workers?: number;
  seed_tin?: string;
  activation_tin?: string;
  province_name?: string;
  prefix?: string;
}

export interface ProvinceStatus {
  running: boolean;
  paused: boolean;
  queried: number;
  found: number;
  speed: number;
  last_tin: string;
  tin_max?: string;
  tin_min?: string;
  last_scanned_at: string;
  uptime: string;
  db_count: number;
  error?: string;
}

export interface SystemConfig {
  max_global_rps: number;
  [key: string]: unknown;
}

export interface HealthItem {
  province: string;
  prefix: string;
  tin_max: string;
  max_regi_date: string;
  days_diff?: number;
  new_records_in_range?: number;
  status: 'healthy' | 'warning' | 'stalled';
}

export interface HealthReport {
  summary?: { total?: number; healthy?: number; warning?: number; stalled?: number };
  provinces?: HealthItem[];
}

export interface CrawledStatDay {
  stat_date: string;
  day_count: number;
  new_tin_count?: number;
  regi_date_count?: number;
}

export interface CrawledStatsReport {
  summary: {
    total_records: number;
    today_records: number;
    active_provinces: number;
  };
  data: CrawledStatDay[];
}

export interface BocaoRecord {
  id?: number;
  tin: string;
  enterprise_name?: string;
  bocao_company_name?: string;
  bocao_province?: string;
  announcement_type?: string;
  publish_date?: string;
  pub_time?: string;
  sync_status?: string;
  sync_attempts?: number;
  in_tax_records?: boolean;
  tax_company_name?: string;
  tax_status?: string;
  tax_address?: string;
  tax_department?: string;
  [key: string]: unknown;
}

export interface FilterOptions {
  communes: string[];
  taxOffices: string[];
}

export interface FilterResult {
  count: number;
  rows: (string | number | null)[][];
  headers: string[];
}

export interface TaxDetailRecord {
  tin: string;
  name?: string;
  norm_name?: string;
  regi_date?: string;
  status_name?: string;
  tran_addr?: string;
  tran_tel?: string;
  pay_taxo_name?: string;
  v3_dist?: string;
  v3_prov?: string;
  v2_prov?: string;
  v2_comm?: string;
  thue_co_so?: string;
  [key: string]: unknown;
}

export interface EnrichmentJob {
  prefix: string;
  provinceName: string;
  isRunning: boolean;
  lastMessage?: string;
  processedCount: number;
  totalToProcess: number;
  progressPercent: number;
  successCount: number;
  successRate: number;
  failedCount: number;
  failureRate: number;
  elapsedSeconds: number;
  estimatedSecondsRemaining: number;
}

export interface EnrichmentProvince {
  prefix: string;
  provinceName: string;
  totalRecords: number;
  enrichedCount: number;
  pendingCount: number;
  completionRate: number;
  isRunning?: boolean;
}

export interface EnrichmentSummary {
  totalRecords: number;
  enrichedCount: number;
  pendingCount: number;
  completionRate: number;
}
