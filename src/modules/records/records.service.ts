// @id 01M4V0HMKWYPTEAJVHS9471AKW
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/records/records.service.ts
 * Facade điều phối dịch vụ Tra cứu, Tìm kiếm, Lọc và Chi tiết Người Nộp Thuế.
 */

import { query } from '../../db/index.js';
import { getProvincesCache } from '../provinces/index.js';
import { HtkkService } from '../htkk/index.js';
import type { SearchRequestDto, SearchResponse } from './records.types.js';

// Re-export các dịch vụ phân rã
export { filterRecords } from './records.filter.js';
export { getUnifiedFilterOptions as getFilterOptions, getFilterOptionsV2, getFilterOptionsV3 } from './records.options.js';

export async function searchRecords(dto: SearchRequestDto): Promise<SearchResponse> {
  const cache = getProvincesCache();
  const tin = (dto.tin || dto.query || '').trim();
  const name = (dto.name || '').trim();
  const provKey = (dto.province_key || '').trim();
  const prefixFilter = provKey && cache[provKey] ? cache[provKey].prefix : null;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;
  if (tin) { conditions.push(`tin LIKE $${paramIdx}`); params.push(tin.length < 10 ? tin + '%' : tin); paramIdx++; }
  if (name) { conditions.push(`norm_name ILIKE $${paramIdx}`); params.push('%' + name + '%'); paramIdx++; }
  if (prefixFilter) { conditions.push(`tin LIKE $${paramIdx}`); params.push(prefixFilter + '%'); paramIdx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rowLimit = Math.min(Math.max(Number(dto.limit || dto.page_size) || 200, 1), 1000);
  const [resData, resCount] = await Promise.all([
    query(`SELECT tin, norm_name, regi_date::text, status_name, tran_addr, pay_taxo_name
           FROM tax_records ${where} ORDER BY regi_date DESC NULLS LAST LIMIT ${rowLimit}`, params),
    query<{ total: string }>(`SELECT COUNT(*) AS total FROM tax_records ${where}`, params)
  ]);

  const rows = resData.rows.map((r) => [r.tin, r.norm_name, r.regi_date, r.status_name, r.tran_addr, r.pay_taxo_name]);
  const count = parseInt(resCount.rows[0]?.total || '0', 10);
  const headers = ['Mã Số Thuế', 'Tên Doanh Nghiệp', 'Ngày Đăng Ký', 'Trạng Thái', 'Địa Chỉ', 'Cơ Quan Thuế'];
  return { headers, rows, count };
}

export async function getRecordDetail(tin: string): Promise<Record<string, unknown> | null> {
  const res = await query('SELECT * FROM tax_records WHERE tin = $1', [tin.trim()]);
  if (!res.rows[0]) return null;
  const record = res.rows[0];
  try {
    const htkkMapping = await HtkkService.resolveTaxpayerMapping(tin);
    return { ...record, htkk_mapping: htkkMapping };
  } catch {
    return { ...record, htkk_mapping: null };
  }
}
