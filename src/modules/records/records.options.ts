// @id 01M4V7G9K3DMN4476VCPTY98M2
// @related 01M4V0HMKXBVYH5PS5C3KSAX6F, 01M4V0FH069WB44ZWJCRPYR4FA
/**
 * src/modules/records/records.options.ts
 * Service trích xuất danh mục bộ lọc địa bàn & cơ quan thuế song song (HTKK V2 & V3).
 */

import { query } from '../../db/index.js';
import { getProvincesCache } from '../provinces/index.js';
import type { FilterOptionsResponse, FilterOptionItem } from './records.types.js';

export async function getFilterOptionsV2(provInput?: string): Promise<{
  provinces: FilterOptionItem[];
  communes: FilterOptionItem[];
  taxOffices: FilterOptionItem[];
}> {
  const pRes = await query<{ province_code: string; province_name: string }>(
    'SELECT province_code, province_name FROM htkk_provinces_v2 ORDER BY province_name ASC'
  );
  const provinces = pRes.rows.map(r => ({ code: r.province_code, name: r.province_name }));

  const raw = (provInput || '').trim();
  if (!raw) return { provinces, communes: [], taxOffices: [] };

  const pMatch = await query<{ province_code: string }>(
    'SELECT province_code FROM htkk_provinces_v2 WHERE province_code = $1 OR province_name ILIKE $2 LIMIT 1',
    [raw, '%' + raw + '%']
  );
  const provCode = pMatch.rows[0]?.province_code || raw;

  const [cRes, tRes] = await Promise.all([
    query<{ commune_code: string; commune_name: string }>(
      'SELECT commune_code, commune_name FROM htkk_communes_v2 WHERE province_code = $1 ORDER BY commune_name ASC',
      [provCode]
    ),
    query<{ tax_office_code: string; tax_office_name: string }>(
      `SELECT DISTINCT m.tax_office_code, m.tax_office_name
       FROM htkk_commune_tax_office_map m
       JOIN htkk_communes_v2 c ON m.commune_code = c.commune_code
       WHERE c.province_code = $1
       UNION
       SELECT tax_office_code, tax_office_name
       FROM htkk_tax_offices
       WHERE province_code LIKE $2
       ORDER BY tax_office_name ASC`,
      [provCode, provCode + '%']
    )
  ]);

  return {
    provinces,
    communes: cRes.rows.map(r => ({ code: r.commune_code, name: r.commune_name })),
    taxOffices: tRes.rows.map(r => ({ code: r.tax_office_code, name: r.tax_office_name }))
  };
}

export async function getFilterOptionsV3(provInput?: string, distInput?: string): Promise<{
  provinces: FilterOptionItem[];
  districts: FilterOptionItem[];
  communes: FilterOptionItem[];
  taxOffices: FilterOptionItem[];
}> {
  const pRes = await query<{ province_code: string; province_name: string }>(
    'SELECT province_code, province_name FROM htkk_provinces_v3 ORDER BY province_name ASC'
  );
  const provinces = pRes.rows.map(r => ({ code: r.province_code, name: r.province_name }));

  const rawProv = (provInput || '').trim();
  if (!rawProv) return { provinces, districts: [], communes: [], taxOffices: [] };

  const pMatch = await query<{ province_code: string; province_name: string }>(
    'SELECT province_code, province_name FROM htkk_provinces_v3 WHERE province_code = $1 OR province_name ILIKE $2 LIMIT 1',
    [rawProv, '%' + rawProv + '%']
  );
  const provCode = pMatch.rows[0]?.province_code || rawProv;
  const provName = pMatch.rows[0]?.province_name || '';

  const dRes = await query<{ district_code: string; district_name: string }>(
    'SELECT district_code, district_name FROM htkk_districts_v3 WHERE province_code = $1 ORDER BY district_name ASC',
    [provCode]
  );
  const districts = dRes.rows.map(r => ({ code: r.district_code, name: r.district_name }));

  const taxOffices: FilterOptionItem[] = [
    { code: provCode + '00', name: `Cục Thuế ${provName || provCode} (${provCode}00)` },
    ...districts.map(d => ({ code: d.code, name: `Chi cục Thuế ${d.name} (${d.code})` }))
  ];

  let communes: FilterOptionItem[] = [];
  const rawDist = (distInput || '').trim();
  if (rawDist) {
    const dMatch = await query<{ district_code: string }>(
      'SELECT district_code FROM htkk_districts_v3 WHERE (district_code = $1 OR district_name ILIKE $2) AND province_code = $3 LIMIT 1',
      [rawDist, '%' + rawDist + '%', provCode]
    );
    const distCode = dMatch.rows[0]?.district_code || rawDist;
    const cRes = await query<{ commune_code: string; commune_name: string }>(
      'SELECT commune_code, commune_name FROM htkk_communes_v3 WHERE district_code = $1 ORDER BY commune_name ASC',
      [distCode]
    );
    communes = cRes.rows.map(r => ({ code: r.commune_code, name: r.commune_name }));
  }

  return { provinces, districts, communes, taxOffices };
}

export async function getUnifiedFilterOptions(provinceKey?: string | null): Promise<FilterOptionsResponse> {
  let v3Code = '';
  let v2Code = '';

  if (provinceKey) {
    const cache = getProvincesCache();
    const cfg = cache[provinceKey];
    if (cfg?.prefix) {
      const p3 = await query<{ province_code: string }>(
        'SELECT province_code FROM htkk_provinces_v3 WHERE province_code = $1 OR province_name ILIKE $2 LIMIT 1',
        [cfg.prefix, '%' + cfg.name.replace(/\s*\(\d+\)$/, '').trim() + '%']
      );
      if (p3.rows[0]) {
        v3Code = p3.rows[0].province_code;
        const p2 = await query<{ new_province_code: string }>(
          'SELECT new_province_code FROM htkk_province_map WHERE old_province_code = $1 LIMIT 1',
          [v3Code]
        );
        v2Code = p2.rows[0]?.new_province_code || v3Code;
      }
    }
  }

  const [v2Data, v3Data] = await Promise.all([
    getFilterOptionsV2(v2Code || undefined),
    getFilterOptionsV3(v3Code || undefined)
  ]);

  return {
    communes: v2Data.communes.length ? v2Data.communes : v3Data.communes,
    taxOffices: [...v3Data.taxOffices, ...v2Data.taxOffices],
    provincesV2: v2Data.provinces,
    communesV2: v2Data.communes,
    taxOfficesV2: v2Data.taxOffices,
    provincesV3: v3Data.provinces,
    districtsV3: v3Data.districts,
    communesV3: v3Data.communes,
    taxOfficesV3: v3Data.taxOffices
  };
}
