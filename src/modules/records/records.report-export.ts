// @id 01M4V47G4VACFSMFJ5M922DWZV
// @related 01M4V0HMKRFRW61N82JVX0WAKJ, 01M4V0HMKT18F1B47H0XK719NY, 01M4V47G4VGKW5RT15HK4K74BH
/**
 * src/modules/records/records.report-export.ts
 * Động cơ xuất Excel chuyên nghiệp đa bảng cho Báo Cáo Sản Lượng, Sức Khỏe & 34 Tỉnh Sáp Nhập.
 */

import ExcelJS from 'exceljs';
import type { CrawlStatsResponse } from './records.types.js';
import type { V2MergedStatsResponse } from './records.v2report.js';
import type { ProvinceHealthItem } from './records.health.js';

const VNPT_BLUE_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF005BAA' }
};

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' }, bottom: { style: 'thin' },
  left: { style: 'thin' }, right: { style: 'thin' }
};

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = VNPT_BLUE_FILL;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = BORDER_THIN;
  });
}

export async function exportCrawlStatsToExcel(stats: CrawlStatsResponse): Promise<{ filename: string; buffer: Buffer }> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sản Lượng MST');

  ws.mergeCells('A1:C1');
  const title = ws.getCell('A1');
  title.value = `BÁO CÁO SẢN LƯỢNG DOANH NGHIỆP (${stats.time_field === 'regi_date' ? 'NGÀY ĐKKD' : 'NGÀY QUÉT'})`;
  title.font = { size: 13, bold: true, color: { argb: 'FF005BAA' } };

  ws.addRow([`Kỳ báo cáo: ${stats.period.toUpperCase()}`, `Tổng MST: ${stats.summary.total_records.toLocaleString('vi-VN')}`, `Mốc: ${stats.timeline.length}`]);
  ws.addRow([]);

  const headerRow = ws.addRow(['Thời Gian / Mốc', 'Số Lượng MST', 'Tỷ Trọng (%)']);
  applyHeaderStyle(headerRow);

  const total = stats.summary.total_records || 1;
  for (const item of stats.timeline) {
    const pct = ((item.count / total) * 100).toFixed(2) + '%';
    const r = ws.addRow([item.label, item.count, pct]);
    r.getCell(2).numFmt = '#,##0';
    r.eachCell(c => { c.border = BORDER_THIN; });
  }

  ws.columns = [{ width: 22 }, { width: 18 }, { width: 16 }];
  const buf = await wb.xlsx.writeBuffer();
  return { filename: `BaoCao_SanLuong_${stats.time_field}_${stats.period}.xlsx`, buffer: Buffer.from(buf) };
}

export async function exportV2MergedStatsToExcel(data: V2MergedStatsResponse): Promise<{ filename: string; buffer: Buffer }> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('34 Tỉnh Sáp Nhập V2');

  ws.mergeCells('A1:E1');
  const title = ws.getCell('A1');
  title.value = 'BÁO CÁO THỐNG KÊ QUY MÔ DOANH NGHIỆP THEO 34 TỈNH THÀNH SAU SÁP NHẬP (HTKK V2)';
  title.font = { size: 13, bold: true, color: { argb: 'FF005BAA' } };

  ws.addRow([`Tổng số tỉnh thành mới: ${data.total_provinces}`, `Tổng MST toàn quốc: ${data.total_national_mst.toLocaleString('vi-VN')}`]);
  ws.addRow([]);

  const headerRow = ws.addRow(['Mã V2', 'Tên Tỉnh / Thành Phố Mới', 'Tập Tiền Tố TIN', 'Tỉnh Thành Cũ Cấu Thành', 'Số Lượng MST', 'Tỷ Trọng (%)']);
  applyHeaderStyle(headerRow);

  for (const p of data.provinces) {
    const r = ws.addRow([p.v2_code, p.v2_name, p.prefixes.join(', '), p.old_provinces.join(' + '), p.total_mst, `${p.percentage}%`]);
    r.getCell(1).alignment = { horizontal: 'center' };
    r.getCell(3).alignment = { horizontal: 'center' };
    r.getCell(5).numFmt = '#,##0';
    r.getCell(6).alignment = { horizontal: 'right' };
    r.eachCell(c => { c.border = BORDER_THIN; });
  }

  ws.columns = [{ width: 12 }, { width: 30 }, { width: 18 }, { width: 45 }, { width: 18 }, { width: 15 }];
  const buf = await wb.xlsx.writeBuffer();
  return { filename: `BaoCao_34_Tinh_Thanh_Sap_Nhap_V2.xlsx`, buffer: Buffer.from(buf) };
}

export async function exportHealthToExcel(items: ProvinceHealthItem[]): Promise<{ filename: string; buffer: Buffer }> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Sức Khỏe & Độ Đặc Dải Số');

  ws.mergeCells('A1:G1');
  const title = ws.getCell('A1');
  title.value = 'BÁO CÁO SỨC KHỎE CRAWLER & BẢN ĐỒ ĐỘ ĐẶC DẢI SỐ (62 TỈNH THÀNH)';
  title.font = { size: 13, bold: true, color: { argb: 'FF005BAA' } };
  ws.addRow([]);

  const headerRow = ws.addRow(['Tỉnh / Thành Phố', 'Tiền Tố', 'TIN Max Hiện Tại', 'Ngày ĐKKD Mới Nhất', 'Số Ngày Trễ', 'Tổng Bản Ghi', 'Độ Đặc Dải Số (%)', 'Trạng Thái']);
  applyHeaderStyle(headerRow);

  for (const it of items) {
    const statusText = it.status === 'healthy' ? 'Bình Thường' : (it.status === 'warning' ? 'Cần Chú Ý' : 'Tắc Nghẽn');
    const r = ws.addRow([
      it.province, it.prefix, it.tin_max, it.max_regi_date,
      it.days_diff != null ? `${it.days_diff} ngày` : 'Chưa có',
      it.total_records, `${it.density_rate}%`, statusText
    ]);
    r.getCell(2).alignment = { horizontal: 'center' };
    r.getCell(6).numFmt = '#,##0';
    r.getCell(7).alignment = { horizontal: 'right' };
    r.getCell(8).alignment = { horizontal: 'center' };
    r.eachCell(c => { c.border = BORDER_THIN; });
  }

  ws.columns = [{ width: 25 }, { width: 10 }, { width: 18 }, { width: 22 }, { width: 15 }, { width: 18 }, { width: 20 }, { width: 16 }];
  const buf = await wb.xlsx.writeBuffer();
  return { filename: `BaoCao_SucKhoe_DoDac_62_Tinh.xlsx`, buffer: Buffer.from(buf) };
}
