// @id 01M4V0HMKFCP6GWCTMP6Y19K92
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/htkk/htkk.service.ts
 * Nghiệp vụ tra cứu danh mục địa bàn & cơ quan thuế HTKK (3 cấp & 2 cấp).
 */

import { query } from '../../db/index.js';
import type {
  HtkkProvinceV3,
  HtkkDistrictV3,
  HtkkCommuneV3,
  HtkkProvinceV2,
  HtkkCommuneV2,
  HtkkTaxOffice,
  HtkkAdministrativeMapping,
  HtkkTaxonomyStats,
  TaxRecordHtkkMapping
} from './htkk.types.js';
import { HtkkMapper } from './htkk.mapper.js';

export class HtkkService {
  public static async getStats(): Promise<HtkkTaxonomyStats> {
    const [pV3, dV3, cV3, pV2, cV2, tOff, ctoMap, pMap, cMap] = await Promise.all([
      query<{ cnt: number }>('SELECT COUNT(*)::int AS cnt FROM htkk_provinces_v3'),
      query<{ cnt: number }>('SELECT COUNT(*)::int AS cnt FROM htkk_districts_v3'),
      query<{ cnt: number }>('SELECT COUNT(*)::int AS cnt FROM htkk_communes_v3'),
      query<{ cnt: number }>('SELECT COUNT(*)::int AS cnt FROM htkk_provinces_v2'),
      query<{ cnt: number }>('SELECT COUNT(*)::int AS cnt FROM htkk_communes_v2'),
      query<{ cnt: number }>('SELECT COUNT(*)::int AS cnt FROM htkk_tax_offices'),
      query<{ cnt: number }>('SELECT COUNT(*)::int AS cnt FROM htkk_commune_tax_office_map'),
      query<{ cnt: number }>('SELECT COUNT(*)::int AS cnt FROM htkk_province_map'),
      query<{ cnt: number }>('SELECT COUNT(*)::int AS cnt FROM htkk_commune_map')
    ]);

    return {
      provincesV3Count: pV3.rows[0]?.cnt || 0,
      districtsV3Count: dV3.rows[0]?.cnt || 0,
      communesV3Count: cV3.rows[0]?.cnt || 0,
      provincesV2Count: pV2.rows[0]?.cnt || 0,
      communesV2Count: cV2.rows[0]?.cnt || 0,
      taxOfficesCount: tOff.rows[0]?.cnt || 0,
      communeTaxOfficeMapCount: ctoMap.rows[0]?.cnt || 0,
      provinceMapCount: pMap.rows[0]?.cnt || 0,
      communeMapCount: cMap.rows[0]?.cnt || 0,
      updatedAt: new Date().toISOString()
    };
  }

  public static async getProvincesV3(): Promise<HtkkProvinceV3[]> {
    const res = await query<{ province_code: string; province_name: string; version: string }>(
      'SELECT province_code, province_name, version FROM htkk_provinces_v3 ORDER BY province_code ASC'
    );
    return res.rows.map((r) => ({ provinceCode: r.province_code, provinceName: r.province_name, version: r.version }));
  }

  public static async getDistrictsV3(provinceCode: string): Promise<HtkkDistrictV3[]> {
    const res = await query<{ district_code: string; province_code: string; district_name: string; version: string }>(
      'SELECT district_code, province_code, district_name, version FROM htkk_districts_v3 WHERE province_code = $1 ORDER BY district_code ASC',
      [provinceCode]
    );
    return res.rows.map((r) => ({
      districtCode: r.district_code, provinceCode: r.province_code,
      districtName: r.district_name, version: r.version
    }));
  }

  public static async getCommunesV3(districtCode: string): Promise<HtkkCommuneV3[]> {
    const res = await query<{ commune_code: string; district_code: string; province_code: string; commune_name: string; is_expired: boolean }>(
      'SELECT commune_code, district_code, province_code, commune_name, is_expired FROM htkk_communes_v3 WHERE district_code = $1 ORDER BY commune_code ASC',
      [districtCode]
    );
    return res.rows.map((r) => ({
      communeCode: r.commune_code, districtCode: r.district_code,
      provinceCode: r.province_code, communeName: r.commune_name, isExpired: r.is_expired
    }));
  }

  public static async getProvincesV2(): Promise<HtkkProvinceV2[]> {
    const res = await query<{ province_code: string; province_name: string; version: string }>(
      'SELECT province_code, province_name, version FROM htkk_provinces_v2 ORDER BY province_code ASC'
    );
    return res.rows.map((r) => ({ provinceCode: r.province_code, provinceName: r.province_name, version: r.version }));
  }

  public static async getCommunesV2(provinceCode: string): Promise<HtkkCommuneV2[]> {
    const res = await query<{ commune_code: string; province_code: string; commune_name: string; version: string }>(
      'SELECT commune_code, province_code, commune_name, version FROM htkk_communes_v2 WHERE province_code = $1 ORDER BY commune_code ASC',
      [provinceCode]
    );
    return res.rows.map((r) => ({
      communeCode: r.commune_code, provinceCode: r.province_code,
      communeName: r.commune_name, version: r.version
    }));
  }

  public static async getTaxOffices(provinceCode?: string): Promise<HtkkTaxOffice[]> {
    const sql = provinceCode
      ? 'SELECT tax_office_code, tax_office_name, province_code, version FROM htkk_tax_offices WHERE province_code = $1 ORDER BY tax_office_code ASC'
      : 'SELECT tax_office_code, tax_office_name, province_code, version FROM htkk_tax_offices ORDER BY tax_office_code ASC LIMIT 100';
    const res = await query<{ tax_office_code: string; tax_office_name: string; province_code: string; version: string }>(
      sql, provinceCode ? [provinceCode] : []
    );
    return res.rows.map((r) => ({
      taxOfficeCode: r.tax_office_code, taxOfficeName: r.tax_office_name,
      provinceCode: r.province_code, version: r.version
    }));
  }

  public static async getMappingByCommune(communeCode: string): Promise<HtkkAdministrativeMapping | null> {
    const sql = `
      SELECT v3_province_code, v3_province_name, v3_district_code, v3_district_name,
             v3_commune_code, v3_commune_name, v3_commune_is_expired,
             v2_province_code, v2_province_name, v2_commune_code, v2_commune_name,
             tax_office_code, tax_office_name
      FROM v_htkk_administrative_mapping
      WHERE v3_commune_code = $1 OR v2_commune_code = $1 LIMIT 1
    `;
    const res = await query(sql, [communeCode]);
    if (res.rows.length) {
      const r = res.rows[0];
      return {
        v3ProvinceCode: r.v3_province_code, v3ProvinceName: r.v3_province_name,
        v3DistrictCode: r.v3_district_code, v3DistrictName: r.v3_district_name,
        v3CommuneCode: r.v3_commune_code, v3CommuneName: r.v3_commune_name,
        v3CommuneIsExpired: r.v3_commune_is_expired, v2ProvinceCode: r.v2_province_code,
        v2ProvinceName: r.v2_province_name, v2CommuneCode: r.v2_commune_code,
        v2CommuneName: r.v2_commune_name, taxOfficeCode: r.tax_office_code,
        taxOfficeName: r.tax_office_name
      };
    }

    const v2Res = await query<{
      commune_code: string; commune_name: string; province_code: string;
      province_name: string; tax_office_code: string; tax_office_name: string;
    }>(`
      SELECT c.commune_code, c.commune_name, c.province_code, p.province_name,
             m.tax_office_code, m.tax_office_name
      FROM htkk_communes_v2 c
      JOIN htkk_provinces_v2 p ON c.province_code = p.province_code
      LEFT JOIN htkk_commune_tax_office_map m ON c.commune_code = m.commune_code
      WHERE c.commune_code = $1 LIMIT 1
    `, [communeCode]);
    if (!v2Res.rows.length) return null;
    const v2 = v2Res.rows[0];
    return {
      v3ProvinceCode: v2.province_code, v3ProvinceName: v2.province_name,
      v3DistrictCode: '', v3DistrictName: 'Đã bỏ cấp Huyện (Mô hình 2 cấp)',
      v3CommuneCode: v2.commune_code, v3CommuneName: v2.commune_name,
      v3CommuneIsExpired: false, v2ProvinceCode: v2.province_code,
      v2ProvinceName: v2.province_name, v2CommuneCode: v2.commune_code,
      v2CommuneName: v2.commune_name, taxOfficeCode: v2.tax_office_code || null,
      taxOfficeName: v2.tax_office_name || null
    };
  }

  public static async resolveTaxpayerMapping(tin: string): Promise<TaxRecordHtkkMapping | null> {
    const res = await query<{
      tin: string; tran_dist: string; pay_taxo_id: string;
      pay_taxo_name: string; tran_addr: string;
    }>(
      'SELECT tin, tran_dist, pay_taxo_id, pay_taxo_name, tran_addr FROM tax_records WHERE tin = $1 LIMIT 1',
      [tin.trim()]
    );
    if (!res.rows.length) return null;
    return HtkkMapper.resolve(res.rows[0]);
  }
}
