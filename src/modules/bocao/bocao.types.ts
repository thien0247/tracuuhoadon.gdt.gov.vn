// @id 01M4V0HMJZ8255KHE2XMM2PWVT
// @related 01M4V0FH0DTKQEFJ3JJ6ZCZSCN, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/bocao/bocao.types.ts
 * Định nghĩa các kiểu dữ liệu và DTO cho Module Bố Cáo Điện Tử.
 */

export interface BocaoRecord {
  [key: string]: unknown;
  id: number;
  tin: string;
  company_name: string;
  province_name: string | null;
  announcement_type: string;
  pub_time: string;
  crawled_at: string;
  raw_data?: Record<string, unknown> | null;
}

export interface BocaoFilterQuery {
  page?: number;
  limit?: number;
  province?: string;
  type?: string;
  keyword?: string;
}

export interface BocaoListResponse {
  total: number;
  page: number;
  limit: number;
  records: BocaoRecord[];
}

export interface BocaoStatsResponse {
  total_records: number;
  types_breakdown: Array<{ announcement_type: string; count: number }>;
  provinces_breakdown: Array<{ province_name: string; count: number }>;
  latest_pub_time: string | null;
}

export interface BocaoCrawlResponse {
  success: boolean;
  total_found?: number;
  new_inserted?: number;
  error?: string;
}

export interface BocaoCrawlAllResponse {
  success: boolean;
  pages_crawled?: number;
  total_found?: number;
  new_inserted?: number;
  error?: string;
}

export interface DkkdEnterpriseProfile {
  [key: string]: unknown;
  Name?: string;
  Name_F?: string;
  Short_Name?: string;
  Enterprise_Code?: string;
  Enterprise_Gdt_Code?: string;
  Ho_Address?: string;
  Legal_First_Name?: string;
}

export interface DkkdSearchResponse {
  success: boolean;
  count?: number;
  enterprises?: DkkdEnterpriseProfile[];
  error?: string;
}

export interface BocaoReconcileRecord {
  [key: string]: unknown;
  id: number;
  tin: string;
  bocao_company_name: string;
  bocao_province: string | null;
  announcement_type: string;
  pub_time: string;
  in_tax_records: boolean;
  sync_status?: string | null;
  sync_attempts?: number;
  last_synced_at?: string | null;
  tax_company_name: string | null;
  tax_address: string | null;
  tax_status: string | null;
  tax_department: string | null;
}

export interface BocaoReconcileQuery {
  page?: number;
  limit?: number;
  status?: 'all' | 'matched' | 'unmatched' | 'retry_later';
  keyword?: string;
  province?: string;
}

export interface BocaoReconcileListResponse {
  total: number;
  page: number;
  limit: number;
  records: BocaoReconcileRecord[];
}

export interface BocaoReconcileStats {
  total_bocao: number;
  matched_count: number;
  unmatched_count: number;
  retry_later_count?: number;
  match_rate: number;
}

export interface BocaoSyncMissingResponse {
  success: boolean;
  processed: number;
  synced_now: number;
  retry_later: number;
  message: string;
}


