// @id 01M4V0HMKA5X6MPTKV06RZ0SQ4
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/enrichment/enrichment.types.ts
 * Types và interfaces cho Module Bổ Sung Dữ Liệu Thuế từ API Xinvoice & Suy luận CSDL.
 */

export interface XinvoiceTaxPayerResponse {
  orgType?: string;
  taxID?: string;
  tin?: string;
  name?: string;
  address?: string;
  taxDepartment?: string;
  status?: string;
  updatedAt?: string;
}

export interface XinvoiceErrorResponse {
  success: boolean;
  message: string;
}

export interface EnrichedRecordResult {
  tin: string;
  norm_name: string;
  org_type: string | null;
  address: string | null;
  tax_department: string | null;
  status_name?: string | null;
  enriched_at: string | null;
  source: 'xinvoice_api' | 'offline_inference' | 'database';
}

export interface ProvinceEnrichmentStatus {
  provinceKey: string;
  prefix: string;
  totalRecords: number;
  enrichedCount: number;
  pendingCount: number;
  isRunning: boolean;
  lastTin?: string;
  lastError?: string;
  updatedAt: string;
}

export interface OfflineEnrichResult {
  provinceKey: string;
  prefix: string;
  updatedRows: number;
  elapsedMs: number;
}

export interface ProvinceEnrichmentSummaryDto {
  provinceName: string;
  prefix: string;
  totalRecords: number;
  enrichedCount: number;
  pendingCount: number;
  completionRate: number;
  isRunning: boolean;
}

export interface NationalEnrichmentSummaryResponse {
  summary: {
    totalRecords: number;
    enrichedCount: number;
    pendingCount: number;
    completionRate: number;
  };
  provinces: ProvinceEnrichmentSummaryDto[];
  updatedAt: string;
}

export interface SyncJobProgress {
  prefix: string;
  provinceName: string;
  isRunning: boolean;
  status: 'idle' | 'running' | 'stopping' | 'completed' | 'error';
  totalToProcess: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  elapsedSeconds: number;
  estimatedSecondsRemaining: number;
  successRate: number;
  failureRate: number;
  progressPercent: number;
  currentTin?: string;
  lastMessage?: string;
  startTime?: string;
  updatedAt: string;
}

