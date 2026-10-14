// @id 01M4V0HMKXBVYH5PS5C3KSAX6F
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/records/records.types.ts
 * Kiểu dữ liệu và interfaces cho module Tra cứu & Lọc bản ghi thuế (Dual-Mode V2/V3).
 */

export interface TaxRecordRow {
  tin: string;
  norm_name: string;
  regi_date: string;
  status_name: string;
  tran_addr: string;
  pay_taxo_name: string;
  raw_data?: string | null;
}

export interface FilterRequestDto {
  model_mode?: 'v2' | 'v3' | 'both' | null;
  province_key?: string | string[] | null;
  from_date?: string | null;
  to_date?: string | null;
  commune_name?: string | string[] | null;
  tax_office_name?: string | string[] | null;
  // Trường lọc chuyên sâu Mô hình 2 Cấp (Mới - HTKK V2)
  v2_province_codes?: string[] | null;
  v2_commune_codes?: string[] | null;
  v2_tax_office_codes?: string[] | null;
  // Trường lọc chuyên sâu Mô hình 3 Cấp (Cũ - HTKK V3 & GDT)
  v3_province_codes?: string[] | null;
  v3_district_codes?: string[] | null;
  v3_commune_names?: string[] | null;
  pay_taxo_ids?: string[] | null;
  limit?: number | null;
  page_size?: number | null;
}

export interface ExportXlsxResponse {
  filename: string;
  buffer: Buffer;
}

export interface FilterOptionItem {
  code: string;
  name: string;
  extra?: string;
  parentCode?: string;
}

export interface FilterOptionsResponse {
  communes: FilterOptionItem[];
  taxOffices: FilterOptionItem[];
  // Dữ liệu mở rộng mô hình 2 cấp & 3 cấp
  provincesV2?: FilterOptionItem[];
  communesV2?: FilterOptionItem[];
  taxOfficesV2?: FilterOptionItem[];
  provincesV3?: FilterOptionItem[];
  districtsV3?: FilterOptionItem[];
  communesV3?: FilterOptionItem[];
  taxOfficesV3?: FilterOptionItem[];
}

export interface SearchRequestDto {
  tin?: string | null;
  name?: string | null;
  query?: string | null;
  province_key?: string | null;
  limit?: number;
  page_size?: number;
  offset?: number;
}

export interface FilterResponse {
  headers: string[];
  rows: (string | null)[][];
  count: number;
}

export interface SearchResponse {
  headers: string[];
  rows: (string | null)[][];
  count: number;
  total?: number;
}

export interface HealthReportItem {
  prefix: string;
  province_name: string;
  total_in_db: number;
  min_tin: string | null;
  max_tin: string | null;
  estimated_span: number;
  estimated_gaps: number;
}

export interface CrawlStatsQueryDto {
  period?: 'day' | 'month' | 'year';
  time_field?: 'scraped_at' | 'regi_date';
  province_key?: string | null;
  from_date?: string | null;
  to_date?: string | null;
}

export interface CrawlStatsTimelineItem {
  period: string;
  label: string;
  count: number;
}

export interface CrawlStatsTopProvince {
  province_key: string;
  province_name: string;
  prefix: string;
  count: number;
  percentage: number;
}

export interface CrawlStatsSummary {
  total_records: number;
  peak_period: string | null;
  peak_count: number;
  avg_per_period: number;
  period_count: number;
}

export interface CrawlStatsResponse {
  period: 'day' | 'month' | 'year';
  time_field: 'scraped_at' | 'regi_date';
  province_key: string;
  summary: CrawlStatsSummary;
  timeline: CrawlStatsTimelineItem[];
  top_provinces: CrawlStatsTopProvince[];
}
