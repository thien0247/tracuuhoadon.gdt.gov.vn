// @id 01M4V7G9K5DXK9976VCPTY98M3
// @related 01M4V0HMKXBVYH5PS5C3KSAX6F, 01M4V0FH069WB44ZWJCRPYR4FA
/**
 * src/modules/records/records.filter.ts
 * Engine xây dựng SQL tối ưu B-tree index scan & thực thi lọc dữ liệu song song (HTKK V2 & V3).
 */

import { query } from '../../db/index.js';
import { getProvincesCache } from '../provinces/index.js';
import type { FilterRequestDto, FilterResponse } from './records.types.js';

async function resolveV2ProvinceV3Codes(v2Codes: string[]): Promise<string[]> {
  const res = await query<{ old_province_code: string }>(
    'SELECT old_province_code FROM htkk_province_map WHERE new_province_code = ANY($1::text[])',
    [v2Codes]
  );
  const mapped = res.rows.map(r => r.old_province_code);
  return mapped.length ? mapped : v2Codes;
}

async function resolveCommuneContext(communeCodes: string[], rawNames: string[]): Promise<{ distPrefixes: string[]; patterns: string[] }> {
  const names = new Set(rawNames.map(n => n.trim()).filter(Boolean));
  const distPrefixes = new Set<string>();

  communeCodes.forEach(c => {
    if (c.length >= 5 && /^\d+$/.test(c)) distPrefixes.add(c.substring(0, 5));
  });

  if (communeCodes.length) {
    const c2 = await query<{ commune_name: string }>(
      'SELECT commune_name FROM htkk_communes_v2 WHERE commune_code = ANY($1::text[])', [communeCodes]
    );
    c2.rows.forEach(r => names.add(r.commune_name));
    const c3 = await query<{ commune_name: string }>(
      `SELECT c3.commune_name FROM htkk_commune_map cm
       JOIN htkk_communes_v3 c3 ON cm.old_commune_code = c3.commune_code
       WHERE cm.new_commune_code = ANY($1::text[])`, [communeCodes]
    );
    c3.rows.forEach(r => names.add(r.commune_name));
  }

  const patterns = Array.from(names).flatMap(c => {
    const clean = c.replace(/^(Xã|Thị trấn|Phường)\s+/i, '').trim();
    return clean && clean !== c ? ['%' + c + '%', '%' + clean + '%'] : ['%' + c + '%'];
  });

  return { distPrefixes: Array.from(distPrefixes), patterns };
}

async function resolveTaxOfficeCommunes(taxCodes: string[]): Promise<string[]> {
  if (!taxCodes.length) return [];
  const res = await query<{ commune_code: string }>(
    'SELECT commune_code FROM htkk_commune_tax_office_map WHERE tax_office_code = ANY($1::text[])',
    [taxCodes]
  );
  return res.rows.map(r => r.commune_code);
}

async function buildFilterConditions(dto: FilterRequestDto) {
  const conds: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  // 1. Lọc theo Crawler Prefixes (Tương thích ngược)
  const cache = getProvincesCache();
  const keys = dto.province_key ? (Array.isArray(dto.province_key) ? dto.province_key : [dto.province_key]) : [];
  const prefixes = keys.map(k => cache[k]?.prefix).filter((p): p is string => !!p);
  if (prefixes.length) {
    conds.push(`t.tin LIKE ANY($${idx}::text[])`);
    params.push(prefixes.map(p => p + '%'));
    idx++;
  }

  // 2. Lọc theo Khoảng ngày ĐKKD
  if (dto.from_date?.trim()) { conds.push(`t.regi_date::date >= $${idx}::date`); params.push(dto.from_date.trim()); idx++; }
  if (dto.to_date?.trim()) { conds.push(`t.regi_date::date <= $${idx}::date`); params.push(dto.to_date.trim()); idx++; }

  // 3. Lọc theo Mô hình 3 Cấp (V3)
  if (dto.v3_district_codes?.length) {
    const distCodes = dto.v3_district_codes.filter(d => /^\d+$/.test(d));
    const distNames = dto.v3_district_codes.filter(d => !/^\d+$/.test(d));
    if (distNames.length) {
      const match = await query<{ district_code: string }>('SELECT district_code FROM htkk_districts_v3 WHERE district_name = ANY($1::text[])', [distNames]);
      match.rows.forEach(r => distCodes.push(r.district_code));
    }
    if (distCodes.length) { conds.push(`t.tran_dist = ANY($${idx}::text[])`); params.push(distCodes); idx++; }
  } else if (dto.v3_province_codes?.length) {
    const provCodes = dto.v3_province_codes.filter(p => /^\d+$/.test(p));
    const provNames = dto.v3_province_codes.filter(p => !/^\d+$/.test(p));
    if (provNames.length) {
      const match = await query<{ province_code: string }>('SELECT province_code FROM htkk_provinces_v3 WHERE province_name = ANY($1::text[])', [provNames]);
      match.rows.forEach(r => provCodes.push(r.province_code));
    }
    if (provCodes.length) { conds.push(`SUBSTRING(t.tran_dist, 1, 3) = ANY($${idx}::text[])`); params.push(provCodes); idx++; }
  }

  // 4. Lọc theo Mô hình 2 Cấp (V2 Tỉnh Mới)
  if (dto.v2_province_codes?.length && !dto.v3_province_codes?.length && !dto.v3_district_codes?.length) {
    const v3Codes = await resolveV2ProvinceV3Codes(dto.v2_province_codes);
    conds.push(`SUBSTRING(t.tran_dist, 1, 3) = ANY($${idx}::text[])`);
    params.push(v3Codes);
    idx++;
  }

  // 5. Lọc theo Thuế Cơ Sở (V2): Ánh xạ sang các xã phụ trách
  const v2TaxCodes = (dto.v2_tax_office_codes || []).filter(t => /^\d+$/.test(t));
  const autoCommuneCodes = await resolveTaxOfficeCommunes(v2TaxCodes);

  // 6. Lọc theo Địa Bàn Xã (V2 & V3)
  const v2CommCodes = (dto.v2_commune_codes || [])
    .concat(dto.commune_name ? (Array.isArray(dto.commune_name) ? dto.commune_name : [dto.commune_name]) : [])
    .concat(autoCommuneCodes);
  const { distPrefixes, patterns } = await resolveCommuneContext(v2CommCodes.filter(c => /^\d+$/.test(c)), v2CommCodes.filter(c => !/^\d+$/.test(c)));

  if (distPrefixes.length && !dto.v3_district_codes?.length) {
    conds.push(`t.tran_dist = ANY($${idx}::text[])`);
    params.push(distPrefixes);
    idx++;
  }

  if (patterns.length) {
    conds.push(`(t.v2_commune_name ILIKE ANY($${idx}::text[]) OR t.tran_addr ILIKE ANY($${idx}::text[]))`);
    params.push(patterns);
    idx++;
  }

  // 7. Lọc theo Cơ Quan Thuế GDT (V3)
  const gdtTaxCodes = (dto.pay_taxo_ids || []).filter(t => /^\d+$/.test(t));
  const gdtTaxNames = (dto.pay_taxo_ids || []).filter(t => !/^\d+$/.test(t));
  if (dto.tax_office_name) {
    const arr = Array.isArray(dto.tax_office_name) ? dto.tax_office_name : [dto.tax_office_name];
    arr.forEach(t => gdtTaxNames.push(t));
  }
  if (gdtTaxCodes.length || gdtTaxNames.length) {
    conds.push(`(t.pay_taxo_id = ANY($${idx}::text[]) OR t.pay_taxo_name ILIKE ANY($${idx + 1}::text[]))`);
    params.push(gdtTaxCodes);
    params.push(gdtTaxNames.map(t => '%' + t + '%'));
    idx += 2;
  }

  return { whereSql: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

export async function filterRecords(dto: FilterRequestDto): Promise<FilterResponse> {
  const { whereSql, params } = await buildFilterConditions(dto);
  const rowLimit = Math.min(Math.max(Number(dto.limit || dto.page_size) || 500, 1), 1000);

  const selectSql = `
    SELECT t.tin, t.norm_name, t.regi_date::text, t.status_name, t.tran_addr, t.pay_taxo_name,
      COALESCE(t.v3_district_name, d3.district_name, 'Chưa rõ') AS v3_dist,
      COALESCE(t.v3_province_name, p3.province_name, 'Chưa rõ') AS v3_prov,
      COALESCE(t.v2_province_name, p2.province_name, p3.province_name, 'Chưa rõ') AS v2_prov,
      COALESCE(t.v2_commune_name, 'Theo địa bàn') AS v2_comm,
      COALESCE(t.thue_co_so_name, ctom.tax_office_name, 'Thuế cơ sở Tỉnh') AS thue_co_so,
      COALESCE(t.tran_tel, '') AS tran_tel
    FROM tax_records t
    LEFT JOIN htkk_districts_v3 d3 ON t.tran_dist = d3.district_code
    LEFT JOIN htkk_provinces_v3 p3 ON d3.province_code = p3.province_code
    LEFT JOIN htkk_province_map pm ON p3.province_code = pm.old_province_code
    LEFT JOIN htkk_provinces_v2 p2 ON pm.new_province_code = p2.province_code
    LEFT JOIN htkk_commune_tax_office_map ctom ON t.v2_commune_code = ctom.commune_code
    ${whereSql} ORDER BY t.regi_date DESC NULLS LAST LIMIT ${rowLimit}
  `;

  const [resData, resCount] = await Promise.all([
    query(selectSql, params),
    query<{ total: string }>(`SELECT COUNT(*) AS total FROM tax_records t ${whereSql}`, params)
  ]);

  const rows = resData.rows.map((r) => [
    r.tin, r.norm_name, r.regi_date, r.status_name, r.tran_addr, r.pay_taxo_name,
    r.v3_dist, r.v3_prov, r.v2_prov, r.v2_comm, r.thue_co_so, r.tran_tel
  ]);
  const count = parseInt(resCount.rows[0]?.total || '0', 10);
  const headers = [
    'Mã Số Thuế', 'Tên Doanh Nghiệp', 'Ngày Cấp', 'Trạng Thái', 'Địa Chỉ', 'Cơ Quan Thuế GDT',
    'Quận / Huyện (V3)', 'Tỉnh / TP (V3)', 'Tỉnh Mới (V2)', 'Xã Mới (V2)', 'Thuế Cơ Sở (V2)', 'Số Điện Thoại'
  ];
  return { headers, rows, count };
}
