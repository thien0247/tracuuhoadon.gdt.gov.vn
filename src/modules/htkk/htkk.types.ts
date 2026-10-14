// @id 01M4V0HMKGH9X9G6C1PYFWGM2B
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/htkk/htkk.types.ts
 * Types và interfaces cho Danh mục Địa bàn Hành chính & Cơ quan thuế HTKK.
 */

export interface HtkkProvinceV3 {
  provinceCode: string;
  provinceName: string;
  version?: string;
}

export interface HtkkDistrictV3 {
  districtCode: string;
  provinceCode: string;
  districtName: string;
  version?: string;
}

export interface HtkkCommuneV3 {
  communeCode: string;
  districtCode: string;
  provinceCode: string;
  communeName: string;
  isExpired: boolean;
  version?: string;
}

export interface HtkkProvinceV2 {
  provinceCode: string;
  provinceName: string;
  version?: string;
}

export interface HtkkCommuneV2 {
  communeCode: string;
  provinceCode: string;
  communeName: string;
  version?: string;
}

export interface HtkkTaxOffice {
  taxOfficeCode: string;
  taxOfficeName: string;
  provinceCode: string;
  version?: string;
}

export interface HtkkAdministrativeMapping {
  v3ProvinceCode: string;
  v3ProvinceName: string;
  v3DistrictCode: string;
  v3DistrictName: string;
  v3CommuneCode: string;
  v3CommuneName: string;
  v3CommuneIsExpired: boolean;
  v2ProvinceCode?: string | null;
  v2ProvinceName?: string | null;
  v2CommuneCode?: string | null;
  v2CommuneName?: string | null;
  taxOfficeCode?: string | null;
  taxOfficeName?: string | null;
}

export interface HtkkTaxonomyStats {
  provincesV3Count: number;
  districtsV3Count: number;
  communesV3Count: number;
  provincesV2Count: number;
  communesV2Count: number;
  taxOfficesCount: number;
  communeTaxOfficeMapCount: number;
  provinceMapCount: number;
  communeMapCount: number;
  updatedAt: string;
}

export interface AdministrativeLevel3 {
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  communeCode?: string | null;
  communeName?: string | null;
  taxOfficeCode: string;
  taxOfficeName: string;
  fullAddress?: string;
}

export interface AdministrativeLevel2 {
  provinceCode: string;
  provinceName: string;
  districtStatus: 'Đã bãi bỏ cấp Huyện (Mô hình 2 cấp)';
  communeCode?: string | null;
  communeName?: string | null;
  taxOfficeCode?: string | null;
  taxOfficeName?: string | null;
  cucThueName?: string | null;
  fullAddress?: string;
}

export interface TaxRecordHtkkMapping {
  tin?: string;
  rawTranDist: string;
  rawPayTaxoId: string;
  rawPayTaxoName?: string;
  rawTranAddr?: string;
  remainingAddress: string;
  v3: AdministrativeLevel3;
  v2: AdministrativeLevel2;
  matchedBy: 'EXACT_DISTRICT' | 'PROVINCE_FALLBACK' | 'UNRESOLVED';
}
