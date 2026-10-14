// @id 01M4V0HMKRFRW61N82JVX0WAKJ
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/records/records.export.ts
 * Logic xuất dữ liệu CSV và XLSX hỗ trợ cả 2 mô hình HTKK V2 & V3.
 */

import ExcelJS from 'exceljs';
import { query } from '../../db/index.js';
import { getProvincesCache } from '../provinces/index.js';
import type { ExportXlsxResponse } from './records.types.js';

const HEADERS = [
  'Mã Số Thuế', 'Tên Doanh Nghiệp', 'Số Điện Thoại', 'Ngày Cấp MST', 'Trạng Thái',
  'Địa Chỉ Trụ Sở', 'Cơ Quan Thuế GDT (V3)', 'Quận / Huyện (V3)', 'Tỉnh / TP (V3)',
  'Tỉnh Mới (V2)', 'Xã Mới (V2)', 'Thuế Cơ Sở (V2)'
];

const ROW_KEYS = [
  'tin', 'norm_name', 'tran_tel', 'regi_date', 'status_name', 'tran_addr',
  'pay_taxo_name', 'v3_dist', 'v3_prov', 'v2_prov', 'v2_comm', 'thue_co_so'
] as const;

function buildExportWhere(
  prefixes: string[] | null, fromD: string | null, toD: string | null,
  communes: string[] | null, taxOffices: string[] | null
) {
  const conds: string[] = [];
  const params: unknown[] = [];
  let idx = 1;
  if (prefixes?.length) {
    conds.push(`t.tin LIKE ANY($${idx}::text[])`);
    params.push(prefixes.map(p => p + '%'));
    idx++;
  }
  if (fromD) { conds.push(`t.regi_date::date >= $${idx}::date`); params.push(fromD); idx++; }
  if (toD) { conds.push(`t.regi_date::date <= $${idx}::date`); params.push(toD); idx++; }
  if (communes?.length) {
    const patterns = communes.flatMap(c => {
      const clean = c.replace(/^(Xã|Thị trấn|Phường)\s+/i, '').trim();
      return clean && clean !== c ? ['%' + c + '%', '%' + clean + '%'] : ['%' + c + '%'];
    });
    conds.push(`(t.v2_commune_name ILIKE ANY($${idx}::text[]) OR t.tran_addr ILIKE ANY($${idx}::text[]))`);
    params.push(patterns);
    idx++;
  }
  if (taxOffices?.length) {
    conds.push(`(t.pay_taxo_name ILIKE ANY($${idx}::text[]) OR t.thue_co_so_name ILIKE ANY($${idx}::text[]) OR t.tran_addr ILIKE ANY($${idx}::text[]))`);
    params.push(taxOffices.map(t => '%' + t + '%'));
    idx++;
  }
  return { whereSql: conds.length ? `WHERE ${conds.join(' AND ')}` : '', params };
}

const SELECT_SQL = `
  SELECT t.tin, t.norm_name, COALESCE(t.tran_tel, '') AS tran_tel, t.regi_date::text, t.status_name, t.tran_addr, t.pay_taxo_name,
    COALESCE(t.v3_district_name, d3.district_name, '') AS v3_dist,
    COALESCE(t.v3_province_name, p3.province_name, '') AS v3_prov,
    COALESCE(t.v2_province_name, p2.province_name, p3.province_name, '') AS v2_prov,
    COALESCE(t.v2_commune_name, '') AS v2_comm,
    COALESCE(t.thue_co_so_name, ctom.tax_office_name, '') AS thue_co_so
  FROM tax_records t
  LEFT JOIN htkk_districts_v3 d3 ON t.tran_dist = d3.district_code
  LEFT JOIN htkk_provinces_v3 p3 ON d3.province_code = p3.province_code
  LEFT JOIN htkk_province_map pm ON p3.province_code = pm.old_province_code
  LEFT JOIN htkk_provinces_v2 p2 ON pm.new_province_code = p2.province_code
  LEFT JOIN htkk_commune_tax_office_map ctom ON t.v2_commune_code = ctom.commune_code`;

async function runExportQuery(
  provinceKeys: string[], fromDate: string | null, toDate: string | null,
  communeNames: string[], taxOfficeNames: string[]
) {
  const cache = getProvincesCache();
  const prefixes = provinceKeys.length ? provinceKeys.map(k => cache[k]?.prefix).filter((p): p is string => !!p) : null;
  const fD = fromDate?.trim() || null;
  const tD = toDate?.trim() || null;
  const { whereSql, params } = buildExportWhere(prefixes, fD, tD, communeNames.length ? communeNames : null, taxOfficeNames.length ? taxOfficeNames : null);
  const res = await query(`${SELECT_SQL} ${whereSql} ORDER BY t.regi_date DESC NULLS LAST LIMIT 50000`, params);
  const tag = prefixes?.length === 1 ? prefixes[0] : 'toanquoc';
  return { rows: res.rows, filenameBase: `export_${tag}_${fD || 'all'}_to_${tD || 'all'}` };
}

export async function exportCsvData(
  provinceKeys: string[], fromDate: string | null, toDate: string | null,
  communeNames: string[], taxOfficeNames: string[]
): Promise<{ filename: string; csvContent: string }> {
  const { rows, filenameBase } = await runExportQuery(provinceKeys, fromDate, toDate, communeNames, taxOfficeNames);
  const lines = [HEADERS.map(h => `"${h}"`).join(',')];
  for (const r of rows) {
    const vals = ROW_KEYS.map(k => `"${String(r[k] || '').replace(/"/g, '""')}"`);
    lines.push(vals.join(','));
  }
  return { filename: `${filenameBase}.csv`, csvContent: '\ufeff' + lines.join('\r\n') };
}

export async function exportXlsxData(
  provinceKeys: string[], fromDate: string | null, toDate: string | null,
  communeNames: string[], taxOfficeNames: string[]
): Promise<ExportXlsxResponse> {
  const { rows, filenameBase } = await runExportQuery(provinceKeys, fromDate, toDate, communeNames, taxOfficeNames);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Dữ Liệu Thuế HTKK V2-V3');

  const headerRow = ws.addRow(HEADERS);
  headerRow.eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  HEADERS.forEach((h, i) => { ws.getColumn(i + 1).width = Math.max(h.length + 4, 12); });
  ws.views = [{ state: 'frozen', ySplit: 1, xSplit: 0 }];

  for (const r of rows) { ws.addRow(ROW_KEYS.map(k => String(r[k] || ''))); }
  const buffer = await wb.xlsx.writeBuffer();
  return { filename: `${filenameBase}.xlsx`, buffer: Buffer.from(buffer) };
}
