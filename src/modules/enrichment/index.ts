// @id 01M4V0HMKB70K6G5E0YWJ0H4EX
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/enrichment/index.ts
 * Barrel file xuất khẩu công khai của Module Enrichment.
 */

export { handleEnrichmentRoutes } from './enrichment.routes.js';
export { EnrichmentService } from './enrichment.service.js';
export { EnrichmentJobManager } from './enrichment.job.js';
export type {
  XinvoiceTaxPayerResponse,
  EnrichedRecordResult,
  ProvinceEnrichmentStatus,
  OfflineEnrichResult,
  SyncJobProgress,
} from './enrichment.types.js';

