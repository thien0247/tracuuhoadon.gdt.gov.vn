// @id 01M4V47G4VG4XV2H4AP6ZXE134
// @related 01M4V0HMKCEFYY31JKCN5J1022, 01M4V0HMKFCP6GWCTMP6Y19K92
/**
 * scripts/test_address_mapping.ts
 * Kiểm thử bóc tách địa chỉ chi tiết còn lại và ánh xạ cơ quan thuế HTKK 2 mô hình (V3 vs V2).
 */

import { HtkkMapper } from '../src/modules/htkk/htkk.mapper.js';
import { closePool } from '../src/db/pool.js';

async function main() {
  const records = [
    {
      tin: '0402359695',
      tran_dist: '50101',
      pay_taxo_id: '50101',
      pay_taxo_name: 'Chi cục Thuế Quận Hải Châu',
      tran_addr: 'K46/H16/9 Cao Thắng, Phường Hải Châu'
    },
    {
      tin: '3703520135',
      tran_dist: '71107',
      pay_taxo_id: '71107',
      pay_taxo_name: 'Chi cục Thuế TP Thuận An',
      tran_addr: 'T6/18M, đường Mỹ Phước Tân Vạn, tổ 6, Khu phố Bình Thuận 2, Phường Thuận Giao'
    },
    {
      tin: '5200973661',
      tran_dist: '21307',
      pay_taxo_id: '21307',
      pay_taxo_name: 'Chi cục Thuế huyện Văn Yên',
      tran_addr: 'Thôn Thọ Lâm, Xã Lâm Giang'
    },
    {
      tin: '0700929485',
      tran_dist: '11109',
      pay_taxo_id: '11109',
      pay_taxo_name: 'Chi cục Thuế huyện Thanh Liêm',
      tran_addr: 'Tại nhà ông Bùi Văn Toại, thôn Thử Hòa, Xã Thanh Lâm'
    }
  ];

  console.log('=== KẾT QUẢ KIỂM THỬ BÓC TÁCH ĐỊA CHỈ & ÁNH XẠ CƠ QUAN THUẾ HTKK ===\n');

  for (const r of records) {
    const res = await HtkkMapper.resolve(r);
    console.log(`[MST: ${res.tin}]`);
    console.log(`  - Địa chỉ gốc GDT       : ${res.rawTranAddr}`);
    console.log(`  - Địa chỉ chi tiết còn lại: ${res.remainingAddress}`);
    console.log(`  - Mô hình 3 Cấp Cũ (V3) : ${res.v3.fullAddress}`);
    console.log(`    * CQT Chi Cục Thuế V3 : ${res.v3.taxOfficeName} (Mã: ${res.v3.taxOfficeCode})`);
    console.log(`  - Mô hình 2 Cấp Mới (V2): ${res.v2.fullAddress}`);
    console.log(`    * Tỉnh mới sau sáp nhập : ${res.v2.provinceName} (Mã V2: ${res.v2.provinceCode})`);
    console.log(`    * Cục Thuế quản lý    : ${res.v2.cucThueName}`);
    console.log(`    * Thuế cơ sở phụ trách : ${res.v2.taxOfficeName} (Mã: ${res.v2.taxOfficeCode})`);
    console.log('');
  }

  await closePool();
}

main().catch(console.error);
