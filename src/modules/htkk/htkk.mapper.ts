// @id 01M4V0HMKCEFYY31JKCN5J1022
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1, 01M4V47G4VGKW5RT15HK4K74BH
/**
 * src/modules/htkk/htkk.mapper.ts
 * Engine phân giải địa bàn hành chính & cơ quan thuế song song (V3: 3 cấp vs V2: 2 cấp sau sáp nhập).
 */

import { query } from '../../db/index.js';
import type { TaxRecordHtkkMapping } from './htkk.types.js';

interface RawTaxpayerRecord {
  tin?: string;
  tran_dist: string;
  pay_taxo_id: string;
  pay_taxo_name?: string;
  tran_addr?: string;
}

export class HtkkMapper {
  public static async resolve(record: RawTaxpayerRecord): Promise<TaxRecordHtkkMapping> {
    const rawTranDist = (record.tran_dist || '').trim();
    const rawPayTaxoId = (record.pay_taxo_id || '').trim();
    const rawPayTaxoName = (record.pay_taxo_name || '').trim();
    const rawTranAddr = (record.tran_addr || '').trim();

    const v3Dist = await this.resolveDistrictV3(rawTranDist);
    const v3Commune = await this.resolveCommuneV3(v3Dist.districtCode, rawTranAddr);
    const cqtV3Name = rawPayTaxoName || (await this.resolveTaxOfficeName(rawPayTaxoId));

    const v2Prov = await this.resolveProvinceV2(v3Dist.provinceCode);
    const v2Commune = await this.resolveCommuneV2(v3Commune.communeCode, v3Commune.communeName, v2Prov.provinceCode);
    const thueCoSo = await this.resolveThueCoSo(v2Commune.communeCode || v3Commune.communeCode, v2Prov.provinceCode);

    const detailPart = v3Commune.remainingAddress !== 'Trụ sở chính' ? v3Commune.remainingAddress : null;
    const fullV3 = [detailPart, v3Commune.communeName, v3Dist.districtName, v3Dist.provinceName].filter(Boolean).join(', ');
    const fullV2 = [detailPart, v2Commune.communeName, v2Prov.provinceName].filter(Boolean).join(', ');
    const cucThue = v2Prov.provinceName ? `Cục Thuế ${v2Prov.provinceName}` : 'Chưa phân bổ Cục Thuế';

    return {
      tin: record.tin, rawTranDist, rawPayTaxoId, rawPayTaxoName, rawTranAddr,
      remainingAddress: v3Commune.remainingAddress,
      v3: {
        provinceCode: v3Dist.provinceCode, provinceName: v3Dist.provinceName,
        districtCode: v3Dist.districtCode, districtName: v3Dist.districtName,
        communeCode: v3Commune.communeCode, communeName: v3Commune.communeName,
        taxOfficeCode: rawPayTaxoId, taxOfficeName: cqtV3Name, fullAddress: fullV3
      },
      v2: {
        provinceCode: v2Prov.provinceCode, provinceName: v2Prov.provinceName,
        districtStatus: 'Đã bãi bỏ cấp Huyện (Mô hình 2 cấp)',
        communeCode: v2Commune.communeCode, communeName: v2Commune.communeName,
        taxOfficeCode: thueCoSo.taxOfficeCode, taxOfficeName: thueCoSo.taxOfficeName,
        cucThueName: cucThue, fullAddress: fullV2
      },
      matchedBy: v3Dist.matchedBy
    };
  }

  private static async resolveDistrictV3(distCode: string) {
    const sql = `SELECT d.district_code, d.district_name, p.province_code, p.province_name
      FROM htkk_districts_v3 d JOIN htkk_provinces_v3 p ON d.province_code = p.province_code
      WHERE d.district_code = $1 LIMIT 1`;
    const res = await query<{ district_code: string; district_name: string; province_code: string; province_name: string }>(sql, [distCode]);

    if (res.rows.length) {
      const r = res.rows[0];
      return { districtCode: r.district_code, districtName: r.district_name, provinceCode: r.province_code, provinceName: r.province_name, matchedBy: 'EXACT_DISTRICT' as const };
    }

    const provCode = distCode.substring(0, 3);
    const provRes = await query<{ province_code: string; province_name: string }>(
      'SELECT province_code, province_name FROM htkk_provinces_v3 WHERE province_code = $1 LIMIT 1', [provCode]
    );

    if (provRes.rows.length) {
      const p = provRes.rows[0];
      return { districtCode: distCode, districtName: 'Cấp Tỉnh (Không trực thuộc Huyện)', provinceCode: p.province_code, provinceName: p.province_name, matchedBy: 'PROVINCE_FALLBACK' as const };
    }

    return { districtCode: distCode, districtName: 'Chưa phân giải', provinceCode: provCode, provinceName: 'Chưa phân giải', matchedBy: 'UNRESOLVED' as const };
  }

  private static async resolveCommuneV3(districtCode: string, addr: string) {
    if (!addr || !districtCode) return { communeCode: null, communeName: null, remainingAddress: addr || 'Trụ sở chính' };
    const res = await query<{ commune_code: string; commune_name: string }>(
      'SELECT commune_code, commune_name FROM htkk_communes_v3 WHERE district_code = $1', [districtCode]
    );

    const addrLower = addr.toLowerCase();
    const sorted = [...res.rows].sort((a, b) => b.commune_name.length - a.commune_name.length);
    for (const c of sorted) {
      const cLower = c.commune_name.toLowerCase();
      const rawName = cLower.replace(/^(phường|xã|thị trấn)\s+/i, '');
      const idxFull = addrLower.lastIndexOf(cLower);
      const idxRaw = rawName.length >= 3 ? addrLower.lastIndexOf(rawName) : -1;
      const matchIdx = idxFull >= 0 ? idxFull : idxRaw;

      if (matchIdx >= 0) {
        let remaining = addr.substring(0, matchIdx).trim().replace(/,\s*$/, '');
        if (!remaining) remaining = 'Trụ sở chính';
        return { communeCode: c.commune_code, communeName: c.commune_name, remainingAddress: remaining };
      }
    }
    return { communeCode: null, communeName: null, remainingAddress: addr || 'Trụ sở chính' };
  }

  private static async resolveProvinceV2(v3ProvCode: string) {
    const mapRes = await query<{ province_code: string; province_name: string }>(
      `SELECT p2.province_code, p2.province_name FROM htkk_province_map pm
       JOIN htkk_provinces_v2 p2 ON pm.new_province_code = p2.province_code
       WHERE pm.old_province_code = $1 LIMIT 1`, [v3ProvCode]
    );
    if (mapRes.rows.length) return { provinceCode: mapRes.rows[0].province_code, provinceName: mapRes.rows[0].province_name };

    const dirRes = await query<{ province_code: string; province_name: string }>(
      'SELECT province_code, province_name FROM htkk_provinces_v2 WHERE province_code = $1 LIMIT 1', [v3ProvCode]
    );
    return dirRes.rows[0] ? { provinceCode: dirRes.rows[0].province_code, provinceName: dirRes.rows[0].province_name }
      : { provinceCode: v3ProvCode, provinceName: 'Chưa chuyển đổi V2' };
  }

  private static async resolveCommuneV2(v3Code: string | null, v3Name: string | null, v2Prov: string) {
    if (!v3Code && !v3Name) return { communeCode: null, communeName: null };
    if (v3Code) {
      const mapRes = await query<{ commune_code: string; commune_name: string }>(
        `SELECT c2.commune_code, c2.commune_name FROM htkk_commune_map cm
         JOIN htkk_communes_v2 c2 ON cm.new_commune_code = c2.commune_code
         WHERE cm.old_commune_code = $1 LIMIT 1`, [v3Code]
      );
      if (mapRes.rows.length) return { communeCode: mapRes.rows[0].commune_code, communeName: mapRes.rows[0].commune_name };
    }
    if (v3Name && v2Prov) {
      const nRes = await query<{ commune_code: string; commune_name: string }>(
        'SELECT commune_code, commune_name FROM htkk_communes_v2 WHERE province_code = $1 AND commune_name = $2 LIMIT 1',
        [v2Prov, v3Name]
      );
      if (nRes.rows.length) return { communeCode: nRes.rows[0].commune_code, communeName: nRes.rows[0].commune_name };
    }
    return { communeCode: v3Code, communeName: v3Name };
  }

  private static async resolveThueCoSo(communeCode: string | null, provCode: string) {
    if (communeCode) {
      const mapRes = await query<{ tax_office_code: string; tax_office_name: string }>(
        'SELECT tax_office_code, tax_office_name FROM htkk_commune_tax_office_map WHERE commune_code = $1 LIMIT 1',
        [communeCode]
      );
      if (mapRes.rows.length) return { taxOfficeCode: mapRes.rows[0].tax_office_code, taxOfficeName: mapRes.rows[0].tax_office_name };
    }
    const provOffice = await query<{ tax_office_code: string; tax_office_name: string }>(
      'SELECT tax_office_code, tax_office_name FROM htkk_tax_offices WHERE province_code LIKE $1 LIMIT 1', [provCode + '%']
    );
    return provOffice.rows[0] ? { taxOfficeCode: provOffice.rows[0].tax_office_code, taxOfficeName: provOffice.rows[0].tax_office_name }
      : { taxOfficeCode: null, taxOfficeName: 'Chưa phân bổ Thuế cơ sở' };
  }

  private static async resolveTaxOfficeName(taxOfficeCode: string): Promise<string> {
    if (!taxOfficeCode) return 'Chưa xác định CQT';
    const res = await query<{ tax_office_name: string }>(
      'SELECT tax_office_name FROM htkk_tax_offices WHERE tax_office_code = $1 LIMIT 1', [taxOfficeCode]
    );
    return res.rows[0]?.tax_office_name || `Chi cục Thuế (${taxOfficeCode})`;
  }
}
