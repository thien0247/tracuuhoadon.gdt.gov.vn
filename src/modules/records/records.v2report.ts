// @id 01M4V47G4VGKW5RT15HK4K74BH
// @related 01M4V0HMKT18F1B47H0XK719NY, 01M4V0HMKVZHSS62XMK5WXBH1P, 01M4V0FH069WB44ZWJCRPYR4FA
/**
 * src/modules/records/records.v2report.ts
 * Nghiệp vụ tổng hợp thống kê sản lượng MST theo mô hình 34 tỉnh thành sau sáp nhập (HTKK V2).
 */

import { query } from '../../db/index.js';

export interface V2MergedProvince {
  v2_code: string;
  v2_name: string;
  prefixes: string[];
  old_provinces: string[];
  total_mst: number;
  percentage: number;
}

export interface V2MergedStatsResponse {
  total_provinces: number;
  total_national_mst: number;
  provinces: V2MergedProvince[];
}

export const V2_MERGED_CATALOG: Array<{
  v2_code: string;
  v2_name: string;
  prefixes: string[];
  old_names: string[];
}> = [
  { v2_code: '701', v2_name: 'Thành phố Hồ Chí Minh', prefixes: ['03', '35', '37'], old_names: ['Hồ Chí Minh (03)', 'Bà Rịa Vũng Tàu (35)', 'Bình Dương (37)'] },
  { v2_code: '101', v2_name: 'Thành phố Hà Nội', prefixes: ['01'], old_names: ['Hà Nội (01)'] },
  { v2_code: '103', v2_name: 'Thành phố Hải Phòng', prefixes: ['02', '08'], old_names: ['Hải Phòng (02)', 'Hải Dương (08)'] },
  { v2_code: '401', v2_name: 'Tỉnh Thanh Hóa', prefixes: ['28'], old_names: ['Thanh Hóa (28)'] },
  { v2_code: '501', v2_name: 'Thành phố Đà Nẵng', prefixes: ['04', '40'], old_names: ['Đà Nẵng (04)', 'Quảng Nam (40)'] },
  { v2_code: '713', v2_name: 'Thành phố Đồng Nai', prefixes: ['36', '38'], old_names: ['Đồng Nai (36)', 'Bình Phước (38)'] },
  { v2_code: '813', v2_name: 'Tỉnh An Giang', prefixes: ['16', '17'], old_names: ['An Giang (16)', 'Kiên Giang (17)'] },
  { v2_code: '117', v2_name: 'Tỉnh Ninh Bình', prefixes: ['06', '07', '27'], old_names: ['Nam Định (06)', 'Hà Nam (07)', 'Ninh Bình (27)'] },
  { v2_code: '801', v2_name: 'Tỉnh Tây Ninh', prefixes: ['11', '39'], old_names: ['Long An (11)', 'Tây Ninh (39)'] },
  { v2_code: '807', v2_name: 'Tỉnh Đồng Tháp', prefixes: ['12', '14'], old_names: ['Tiền Giang (12)', 'Đồng Tháp (14)'] },
  { v2_code: '605', v2_name: 'Tỉnh Đắk Lắk', prefixes: ['44', '60'], old_names: ['Phú Yên (44)', 'Đắk Lắk (60)'] },
  { v2_code: '815', v2_name: 'Thành phố Cần Thơ', prefixes: ['18', '22', '63'], old_names: ['Cần Thơ (18)', 'Sóc Trăng (22)', 'Hậu Giang (63)'] },
  { v2_code: '809', v2_name: 'Tỉnh Vĩnh Long', prefixes: ['13', '15', '21'], old_names: ['Bến Tre (13)', 'Vĩnh Long (15)', 'Trà Vinh (21)'] },
  { v2_code: '403', v2_name: 'Tỉnh Nghệ An', prefixes: ['29'], old_names: ['Nghệ An (29)'] },
  { v2_code: '507', v2_name: 'Tỉnh Gia Lai', prefixes: ['41', '59'], old_names: ['Bình Định (41)', 'Gia Lai (59)'] },
  { v2_code: '221', v2_name: 'Tỉnh Bắc Ninh', prefixes: ['23', '24'], old_names: ['Bắc Ninh (23)', 'Bắc Giang (24)'] },
  { v2_code: '511', v2_name: 'Tỉnh Khánh Hòa', prefixes: ['42', '45'], old_names: ['Khánh Hòa (42)', 'Ninh Thuận (45)'] },
  { v2_code: '217', v2_name: 'Tỉnh Phú Thọ', prefixes: ['25', '26', '54'], old_names: ['Vĩnh Phúc (25)', 'Phú Thọ (26)', 'Hòa Bình (54)'] },
  { v2_code: '109', v2_name: 'Tỉnh Hưng Yên', prefixes: ['09', '10'], old_names: ['Hưng Yên (09)', 'Thái Bình (10)'] },
  { v2_code: '703', v2_name: 'Tỉnh Lâm Đồng', prefixes: ['34', '64'], old_names: ['Bình Thuận (34)', 'Đắk Nông (64)'] },
  { v2_code: '225', v2_name: 'Tỉnh Quảng Ninh', prefixes: ['57'], old_names: ['Quảng Ninh (57)'] },
  { v2_code: '823', v2_name: 'Tỉnh Cà Mau', prefixes: ['19', '20'], old_names: ['Bạc Liêu (19)', 'Cà Mau (20)'] },
  { v2_code: '407', v2_name: 'Tỉnh Quảng Trị', prefixes: ['31', '32'], old_names: ['Quảng Bình (31)', 'Quảng Trị (32)'] },
  { v2_code: '215', v2_name: 'Tỉnh Thái Nguyên', prefixes: ['46', '47'], old_names: ['Thái Nguyên (46)', 'Bắc Kạn (47)'] },
  { v2_code: '505', v2_name: 'Tỉnh Quảng Ngãi', prefixes: ['43', '61'], old_names: ['Quảng Ngãi (43)', 'Kon Tum (61)'] },
  { v2_code: '405', v2_name: 'Tỉnh Hà Tĩnh', prefixes: ['30'], old_names: ['Hà Tĩnh (30)'] },
  { v2_code: '213', v2_name: 'Tỉnh Lào Cai', prefixes: ['52', '53'], old_names: ['Yên Bái (52)', 'Lào Cai (53)'] },
  { v2_code: '411', v2_name: 'Thành phố Huế', prefixes: ['33'], old_names: ['Thừa Thiên Huế (33)'] },
  { v2_code: '211', v2_name: 'Tỉnh Tuyên Quang', prefixes: ['50', '51'], old_names: ['Tuyên Quang (50)', 'Hà Giang (51)'] },
  { v2_code: '303', v2_name: 'Tỉnh Sơn La', prefixes: ['55'], old_names: ['Sơn La (55)'] },
  { v2_code: '209', v2_name: 'Tỉnh Lạng Sơn', prefixes: ['49'], old_names: ['Lạng Sơn (49)'] },
  { v2_code: '203', v2_name: 'Tỉnh Cao Bằng', prefixes: ['48'], old_names: ['Cao Bằng (48)'] },
  { v2_code: '301', v2_name: 'Tỉnh Điện Biên', prefixes: ['56'], old_names: ['Điện Biên (56)'] },
  { v2_code: '302', v2_name: 'Tỉnh Lai Châu', prefixes: ['62'], old_names: ['Lai Châu (62)'] }
];

export async function fetchV2MergedStats(): Promise<V2MergedStatsResponse> {
  const sumRes = await query<{ province_prefix: string; cnt: string }>(
    'SELECT province_prefix, SUM(total_records)::text AS cnt FROM regi_stats_daily GROUP BY 1'
  );

  const prefixCountMap = new Map<string, number>();
  for (const r of sumRes.rows) {
    prefixCountMap.set(r.province_prefix, parseInt(r.cnt, 10) || 0);
  }

  let totalNationalMst = 0;
  const list: V2MergedProvince[] = V2_MERGED_CATALOG.map(c => {
    let provSum = 0;
    for (const p of c.prefixes) {
      provSum += prefixCountMap.get(p) || 0;
    }
    totalNationalMst += provSum;
    return {
      v2_code: c.v2_code,
      v2_name: c.v2_name,
      prefixes: c.prefixes,
      old_provinces: c.old_names,
      total_mst: provSum,
      percentage: 0
    };
  });

  for (const item of list) {
    item.percentage = totalNationalMst > 0 ? Math.round((item.total_mst / totalNationalMst) * 1000) / 10 : 0;
  }

  list.sort((a, b) => b.total_mst - a.total_mst);
  return { total_provinces: list.length, total_national_mst: totalNationalMst, provinces: list };
}

export function getV2MergedCatalog() {
  return V2_MERGED_CATALOG;
}
