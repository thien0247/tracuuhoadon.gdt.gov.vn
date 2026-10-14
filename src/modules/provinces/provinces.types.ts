// @id 01M4V0HMKPPP2QZ57VFX12A48P
// @related 01M4V0FH0C5JKJFSR38G6JSD62, 01M4V0FGZJ7X5P2WVWRKXB1XSB, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/provinces/provinces.types.ts
 * Kiểu dữ liệu và interfaces cho module Quản lý Tỉnh thành.
 */

export interface ProvinceRecord {
  id: number;
  name: string;
  prefix: string;
  activation_tin: string;
  target_count?: number;
  target_from_date?: string | null;
  target_to_date?: string | null;
}

export interface ProvinceConfigMap {
  [key: string]: {
    id: number;
    name: string;
    prefix: string;
    activation_tin: string;
    target_count: number;
    target_from_date: string | null;
    target_to_date: string | null;
  };
}

export interface ProvinceStats {
  total: number;
  active: number;
  suspended: number;
  closed: number;
}

export interface ProvinceStatsMap {
  [prefix: string]: ProvinceStats;
}

export interface CreateProvinceDto {
  name: string;
  prefix: string;
  activation_tin: string;
}

export interface UpdateTargetsDto {
  target_count?: number;
  target_from_date?: string | null;
  target_to_date?: string | null;
}

export interface UpdateMaxTinDto {
  max_tin: string;
  update_scan_progress?: boolean;
  update_activation_tin?: boolean;
}

export interface ProvinceMaxTinDetectResult {
  province_key: string;
  prefix: string;
  current_max_tin: string | null;
  db_tax_max: string | null;
  db_bocao_max: string | null;
  last_scanned_tin: string | null;
  activation_tin: string | null;
  suggested_max_tin: string | null;
}
