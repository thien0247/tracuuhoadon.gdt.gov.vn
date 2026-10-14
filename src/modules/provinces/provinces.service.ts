// @id 01M4V0HMKNWS255D6X91RPS6R3
// @related 01M4V0FH0C5JKJFSR38G6JSD62, 01M4V0FGZJ7X5P2WVWRKXB1XSB, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/provinces/provinces.service.ts
 * Nghiệp vụ truy vấn và quản lý danh mục cấu hình tỉnh thành.
 */
import { query } from '../../db/index.js';
import type {
  ProvinceRecord,
  ProvinceConfigMap,
  ProvinceStatsMap,
  CreateProvinceDto,
  UpdateTargetsDto,
  UpdateMaxTinDto,
  ProvinceMaxTinDetectResult
} from './provinces.types.js';

let provincesCache: ProvinceConfigMap = {};

export async function loadProvinces(): Promise<ProvinceConfigMap> {
  const start = Date.now();
  const sql = `
    SELECT id, name, prefix, activation_tin
    FROM provinces
    ORDER BY id ASC
  `;
  const result = await query<ProvinceRecord>(sql);
  const map: ProvinceConfigMap = {};
  for (const row of result.rows) {
    const existing = provincesCache[row.name];
    map[row.name] = {
      id: row.id,
      name: row.name,
      prefix: row.prefix,
      activation_tin: row.activation_tin,
      target_count: existing?.target_count || 0,
      target_from_date: existing?.target_from_date || null,
      target_to_date: existing?.target_to_date || null
    };
  }
  provincesCache = map;
  const elapsed = Date.now() - start;
  console.log(`[Provinces Service] Đã nạp ${result.rowCount} tỉnh thành vào bộ nhớ đệm (${elapsed}ms).`);
  return map;
}

export function getProvincesCache(): ProvinceConfigMap {
  return provincesCache;
}

export async function createProvince(dto: CreateProvinceDto): Promise<void> {
  const sql = `
    INSERT INTO provinces (name, prefix, activation_tin)
    VALUES ($1, $2, $3)
  `;
  await query(sql, [dto.name, dto.prefix, dto.activation_tin]);
  console.log(`[Provinces Service] Đã tạo tỉnh mới: ${dto.name} (prefix ${dto.prefix})`);
  await loadProvinces();
}

export async function deleteProvince(id: number): Promise<void> {
  await query('DELETE FROM provinces WHERE id = $1', [id]);
  console.log(`[Provinces Service] Đã xóa tỉnh ID: ${id}`);
  await loadProvinces();
}

export async function updateProvinceTargets(id: number, dto: UpdateTargetsDto): Promise<void> {
  for (const key of Object.keys(provincesCache)) {
    if (provincesCache[key].id === id) {
      if (dto.target_count !== undefined) provincesCache[key].target_count = dto.target_count;
      if (dto.target_from_date !== undefined) provincesCache[key].target_from_date = dto.target_from_date;
      if (dto.target_to_date !== undefined) provincesCache[key].target_to_date = dto.target_to_date;
      console.log(`[Provinces Service] Cập nhật chỉ tiêu cho ${key}: ${JSON.stringify(dto)}`);
    }
  }
}

export async function fetchProvinceStats(): Promise<ProvinceStatsMap> {
  const start = Date.now();
  const sql = `
    SELECT province_prefix AS prefix,
           SUM(total_records)::text AS total
    FROM regi_stats_daily
    GROUP BY province_prefix
  `;
  const res = await query<{ prefix: string; total: string }>(sql);

  const statsMap: ProvinceStatsMap = {};
  for (const row of res.rows) {
    const total = parseInt(row.total, 10) || 0;
    statsMap[row.prefix] = {
      total,
      active: total,
      suspended: 0,
      closed: 0
    };
  }
  const elapsed = Date.now() - start;
  console.log(`[Provinces Service] Thống kê tổng hợp ${res.rowCount} tiền tố tỉnh thành (${elapsed}ms).`);
  return statsMap;
}

export async function detectProvinceMaxTin(provKey: string): Promise<ProvinceMaxTinDetectResult> {
  const cfg = provincesCache[provKey];
  if (!cfg) throw new Error(`Không tìm thấy cấu hình cho tỉnh ${provKey}`);
  const prefix = cfg.prefix;

  const [taxRes, bocaoRes, progRes] = await Promise.all([
    query<{ max_tin: string }>(
      'SELECT tin AS max_tin FROM tax_records WHERE tin >= $1 AND tin < $2 AND LENGTH(tin) = 10 ORDER BY tin DESC LIMIT 1',
      [`${prefix}00000000`, `${prefix}90000000`]
    ),
    query<{ max_tin: string }>(
      'SELECT tin AS max_tin FROM bocao_records WHERE tin >= $1 AND tin <= $2 AND LENGTH(tin) = 10 ORDER BY tin DESC LIMIT 1',
      [`${prefix}00000000`, `${prefix}99999999`]
    ),
    query<{ last_tin: string }>('SELECT last_tin FROM scan_progress WHERE prefix = $1', [prefix])
  ]);

  const dbTaxMax = taxRes.rows[0]?.max_tin || null;
  const dbBocaoMax = bocaoRes.rows[0]?.max_tin || null;
  const lastScanned = progRes.rows[0]?.last_tin || null;
  const actTin = cfg.activation_tin || null;

  const candidates = [dbTaxMax, dbBocaoMax, lastScanned, actTin].filter((t): t is string => Boolean(t && t.length === 10));
  candidates.sort((a, b) => b.localeCompare(a));

  return {
    province_key: provKey,
    prefix,
    current_max_tin: dbTaxMax,
    db_tax_max: dbTaxMax,
    db_bocao_max: dbBocaoMax,
    last_scanned_tin: lastScanned,
    activation_tin: actTin,
    suggested_max_tin: candidates[0] || null
  };
}

export async function updateProvinceMaxTin(provKey: string, dto: UpdateMaxTinDto): Promise<{ success: boolean; message: string }> {
  const cfg = provincesCache[provKey];
  if (!cfg) throw new Error(`Không tìm thấy cấu hình cho tỉnh ${provKey}`);
  const prefix = cfg.prefix;
  const maxTin = dto.max_tin?.trim();

  if (!maxTin || maxTin.length !== 10 || !maxTin.startsWith(prefix) || !/^\d+$/.test(maxTin)) {
    throw new Error(`Mã số thuế không hợp lệ. Phải gồm đúng 10 chữ số và bắt đầu bằng ${prefix}`);
  }

  if (dto.update_scan_progress !== false) {
    const sql = `
      INSERT INTO scan_progress (prefix, last_tin, total_queried, total_found, updated_at)
      VALUES ($1, $2, 0, 0, NOW()::text)
      ON CONFLICT (prefix) DO UPDATE
      SET last_tin = EXCLUDED.last_tin, updated_at = NOW()::text
    `;
    await query(sql, [prefix, maxTin]);
  }

  if (dto.update_activation_tin !== false) {
    await query('UPDATE provinces SET activation_tin = $1 WHERE prefix = $2', [maxTin, prefix]);
    cfg.activation_tin = maxTin;
  }

  return { success: true, message: `Đã cập nhật Max TIN cho tỉnh ${provKey}: ${maxTin}` };
}

export async function syncAllProvincesMaxTin(): Promise<{ synced_count: number }> {
  let count = 0;
  for (const [key] of Object.entries(provincesCache)) {
    try {
      const detect = await detectProvinceMaxTin(key);
      if (detect.suggested_max_tin) {
        await updateProvinceMaxTin(key, {
          max_tin: detect.suggested_max_tin,
          update_scan_progress: true,
          update_activation_tin: false
        });
        count++;
      }
    } catch (_) {}
  }
  return { synced_count: count };
}
