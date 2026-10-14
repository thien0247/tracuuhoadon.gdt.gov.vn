// @id 01M4W0APJC0000000000000002
// @related 01M4W0APJC0000000000000001, 01M4W0TYPE0000000000000001
/**
 * src/api/provinces.ts
 * API Client chuyên trách quản lý danh mục và đối soát Max TIN tỉnh thành.
 */

export interface ProvinceMaxTinDetectResult {
  province_key: string;
  prefix: string;
  current_max_tin: string | null;
  db_tax_max: string | null;
  db_bocao_max: string | null;
  last_scanned_tin: string | null;
  activation_tin: string | null;
  suggested_max_tin: string | null;
}

export interface UpdateMaxTinPayload {
  max_tin: string;
  update_scan_progress?: boolean;
  update_activation_tin?: boolean;
}

export const ProvincesApi = {
  async detectMaxTin(provinceKey: string): Promise<ProvinceMaxTinDetectResult> {
    const encoded = encodeURIComponent(provinceKey);
    const res = await fetch(`/api/provinces/${encoded}/max-tin-detect`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Lỗi khi đối soát Max TIN');
    }
    return res.json();
  },

  async updateMaxTin(provinceKey: string, payload: UpdateMaxTinPayload): Promise<{ success: boolean; message: string }> {
    const encoded = encodeURIComponent(provinceKey);
    const res = await fetch(`/api/provinces/${encoded}/max-tin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Lỗi khi cập nhật Max TIN');
    }
    return res.json();
  },

  async syncAllMaxTin(): Promise<{ success: boolean; synced_count: number }> {
    const res = await fetch('/api/provinces/sync-all-max-tin', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.detail || 'Lỗi khi đồng bộ Max TIN toàn quốc');
    }
    return res.json();
  }
};
