// @id 01M4V0HMKHV21R0CMCY6ZB3G43
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/htkk/index.ts
 * Barrel file xuất khẩu công khai của Module Danh Mục HTKK.
 */

export { htkkRoutes } from './htkk.routes.js';
export { HtkkService } from './htkk.service.js';
export type {
  HtkkProvinceV3,
  HtkkDistrictV3,
  HtkkCommuneV3,
  HtkkProvinceV2,
  HtkkCommuneV2,
  HtkkTaxOffice,
  HtkkAdministrativeMapping,
  HtkkTaxonomyStats,
} from './htkk.types.js';
