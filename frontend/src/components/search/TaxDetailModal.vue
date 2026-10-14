<!-- @id 01M4V0HMNJPJSF4E6XHZX7DC3Z -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0HMKCEFYY31JKCN5J1022 -->
<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm" @click.self="close">
    <div class="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
      <!-- Header -->
      <div class="px-5 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-3">
          <div class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold">🏢</div>
          <div>
            <div class="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Chi Tiết NNT & Địa Bàn HTKK Song Song</div>
            <div class="text-base font-extrabold font-mono text-amber-300 flex items-center gap-2">
              <span>{{ tin }}</span>
              <button @click="copyTin" class="text-xs bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded text-white font-sans transition">📋 Copy</button>
              <a v-if="tin" :href="masothueUrl(tin)" target="_blank" class="text-xs bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded font-sans transition">🔍 Masothue ↗</a>
              <span v-if="copyMsg" class="text-xs text-emerald-300 font-sans font-semibold animate-pulse">{{ copyMsg }}</span>
            </div>
          </div>
        </div>
        <button @click="close" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 overflow-y-auto space-y-3.5 text-xs text-slate-700 dark:text-slate-200">
        <div v-if="loading" class="py-12 text-center text-slate-500 space-y-3">
          <div class="inline-block w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p class="font-medium">Đang truy vấn cơ sở dữ liệu cho MST {{ tin }}...</p>
        </div>
        <div v-else-if="error" class="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 font-bold">⚠️ {{ error }}</div>
        <div v-else-if="record" class="space-y-3">
          <!-- Tên & Trạng Thái Banner -->
          <div class="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-xl p-3.5 space-y-1">
            <div class="flex items-center justify-between">
              <div class="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Tên Người Nộp Thuế</div>
              <a v-if="record.norm_name" :href="masothueUrl(record.norm_name)" target="_blank" class="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline">Tìm theo tên ↗</a>
            </div>
            <div class="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">{{ record.norm_name || 'CHƯA CẬP NHẬT TÊN' }}</div>
            <div class="pt-1 flex flex-wrap gap-2 items-center">
              <span v-if="record.org_type" class="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200">🏢 {{ record.org_type }}</span>
              <span class="px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200">{{ record.status_name || 'Đang hoạt động' }}</span>
            </div>
          </div>

          <!-- Địa Chỉ Chi Tiết Còn Lại -->
          <div v-if="record.htkk_mapping?.remainingAddress" class="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-0.5">
            <div class="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">📍 Địa Chỉ Chi Tiết (Số nhà, đường, thôn xóm)</div>
            <div class="font-bold text-slate-900 dark:text-slate-100 text-sm font-sans">{{ record.htkk_mapping.remainingAddress }}</div>
          </div>

          <!-- Đối Chiếu Địa Bàn HTKK Song Song 2 Mô Hình -->
          <div v-if="record.htkk_mapping" class="bg-slate-900 text-white rounded-xl p-3.5 space-y-2.5 shadow-md">
            <div class="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
              <div class="font-bold flex items-center gap-1.5 text-amber-300">
                <span>🗺️</span><span class="tracking-wide">Địa Bàn Hành Chính & Mạng Lưới Thuế HTKK Song Song</span>
              </div>
              <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">Match: {{ record.htkk_mapping.matchedBy }}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <!-- Mô hình 3 Cấp Cũ -->
              <div class="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700 space-y-1">
                <div class="font-bold text-sky-300 flex items-center justify-between pb-1 border-b border-slate-700">
                  <span>🏛️ Mô hình 3 Cấp (Hiện hành)</span><span class="text-[10px] bg-sky-950 text-sky-200 px-1.5 rounded">Có Huyện</span>
                </div>
                <div><span class="text-slate-400">Tỉnh/TP:</span> <b class="text-white ml-1">{{ record.htkk_mapping.v3?.provinceName }}</b></div>
                <div><span class="text-slate-400">Quận/Huyện:</span> <b class="text-white ml-1">{{ record.htkk_mapping.v3?.districtName }}</b></div>
                <div><span class="text-slate-400">Xã/Phường:</span> <span class="text-slate-200 ml-1">{{ record.htkk_mapping.v3?.communeName || 'Theo huyện' }}</span></div>
                <div><span class="text-slate-400">Chi cục Thuế:</span> <b class="text-amber-200 block truncate">{{ record.htkk_mapping.v3?.taxOfficeName }}</b></div>
              </div>
              <!-- Mô hình 2 Cấp Mới -->
              <div class="bg-indigo-950/50 rounded-lg p-2.5 border border-indigo-800/60 space-y-1">
                <div class="font-bold text-emerald-300 flex items-center justify-between pb-1 border-b border-indigo-800/60">
                  <span>🚀 Mô hình 2 Cấp (Sau sáp nhập)</span><span class="text-[10px] bg-rose-950 text-rose-300 px-1.5 rounded">Bỏ Cấp Huyện</span>
                </div>
                <div><span class="text-slate-400">Tỉnh mới V2:</span> <b class="text-white ml-1">{{ record.htkk_mapping.v2?.provinceName }}</b></div>
                <div><span class="text-slate-400">Cục Thuế:</span> <span class="text-indigo-200 ml-1">{{ record.htkk_mapping.v2?.cucThueName || 'Cục Thuế cấp Tỉnh' }}</span></div>
                <div><span class="text-slate-400">Xã/Phường mới:</span> <span class="text-slate-200 ml-1">{{ record.htkk_mapping.v2?.communeName || 'Theo địa bàn' }}</span></div>
                <div><span class="text-slate-400">Thuế cơ sở:</span> <b class="text-emerald-300 block truncate">{{ record.htkk_mapping.v2?.taxOfficeName || 'Thuế cấp cơ sở' }}</b></div>
              </div>
            </div>
          </div>

          <!-- Thông tin trụ sở & CQT gốc -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
              <div class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 pb-1 border-b border-slate-200 dark:border-slate-700"><span>📍</span><span>Trụ Sở Gốc (GDT)</span></div>
              <div><span class="text-slate-500 block">Địa chỉ:</span><span class="font-semibold text-slate-800 dark:text-slate-100">{{ record.address || record.tran_addr || 'Chưa cập nhật' }}</span></div>
              <div><span class="text-slate-500 block">Điện thoại:</span><b class="text-slate-700 dark:text-slate-200 font-mono">{{ record.tran_tel && record.tran_tel !== 'None' ? record.tran_tel : '---' }}</b></div>
            </div>
            <div class="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
              <div class="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 pb-1 border-b border-slate-200 dark:border-slate-700"><span>🏛️</span><span>Đăng Ký & Thời Gian</span></div>
              <div><span class="text-slate-500 block">CQT GDT:</span><span class="font-semibold text-slate-800 dark:text-slate-100">{{ record.tax_department || record.pay_taxo_name || 'N/A' }}</span></div>
              <div class="grid grid-cols-2 gap-1 text-[11px]">
                <div><span class="text-slate-500 block">Ngày cấp ĐKKD:</span> <b class="text-indigo-600 dark:text-indigo-400 font-mono">{{ fmtDate(record.regi_date) }}</b></div>
                <div><span class="text-slate-500 block">Ngày thay đổi:</span> <b class="text-slate-700 dark:text-slate-300 font-mono">{{ fmtDate(record.chan_date) }}</b></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-5 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div class="flex items-center gap-2 flex-wrap">
          <button @click="copyAllSummary" :disabled="!record" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white transition disabled:opacity-40">📋 Sao Chép</button>
          <button @click="triggerEnrich" :disabled="!record || enriching" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-600 hover:text-white transition flex items-center gap-1 disabled:opacity-50"><span :class="enriching ? 'animate-spin' : ''">⚡</span><span>{{ enriching ? 'Đang bổ sung...' : 'Bổ sung Xinvoice' }}</span></button>
        </div>
        <button @click="close" class="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition">Đóng</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ApiClient } from '@/api/client';
import type { TaxDetailRecord } from '@/types';

interface DetailRecord extends TaxDetailRecord {
  htkk_mapping?: {
    matchedBy?: string;
    remainingAddress?: string;
    v3?: { provinceName?: string; districtName?: string; communeName?: string; taxOfficeName?: string; fullAddress?: string };
    v2?: { provinceName?: string; communeName?: string; taxOfficeName?: string; cucThueName?: string; fullAddress?: string };
  };
  chan_date?: string; org_type?: string;
}

const props = defineProps<{ targetTin?: string }>();
const emit = defineEmits<{ (e: 'close'): void }>();

const isOpen = ref(false); const loading = ref(false); const enriching = ref(false);
const tin = ref(''); const record = ref<DetailRecord | null>(null);
const error = ref<string | null>(null); const copyMsg = ref('');

const fmtDate = (d: unknown) => (!d || d === 'None') ? 'Chưa có' : String(d).trim().substring(0, 10);
const masothueUrl = (q: unknown) => `https://masothue.com/Search/?type=auto&q=${encodeURIComponent(String(q || ''))}`;

const loadDetail = async (targetTin: string) => {
  if (!targetTin) return;
  tin.value = targetTin.trim();
  isOpen.value = true; loading.value = true; error.value = null; record.value = null; copyMsg.value = '';
  try {
    record.value = await ApiClient.getRecordDetail(tin.value) as DetailRecord;
  } catch (err: unknown) {
    const e = err as { message?: string };
    error.value = 'Không tìm thấy dữ liệu: ' + (e.message || String(err));
  } finally { loading.value = false; }
};

const close = () => { isOpen.value = false; emit('close'); };
const copyClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    copyMsg.value = '✓ Đã chép!';
    setTimeout(() => { copyMsg.value = ''; }, 2000);
  } catch { copyMsg.value = 'Lỗi copy!'; }
};

const copyTin = () => { if (tin.value) copyClipboard(tin.value); };
const copyAllSummary = () => {
  if (!record.value) return;
  const r = record.value;
  copyClipboard([`MST: ${r.tin || tin.value}`, `Tên: ${r.norm_name || 'N/A'}`, `Địa chỉ: ${r.address || r.tran_addr || 'N/A'}`].join('\n'));
};

const triggerEnrich = async () => {
  if (!tin.value) return;
  enriching.value = true;
  try {
    const res = await ApiClient.enrichRecord(tin.value) as { org_type?: string; address?: string };
    if (res && record.value) {
      if (res.org_type) record.value.org_type = res.org_type;
      if (res.address) record.value.address = res.address;
      copyMsg.value = '✓ Đã bổ sung!';
      setTimeout(() => { copyMsg.value = ''; }, 2500);
    }
  } catch { copyMsg.value = 'Lỗi bổ sung!'; }
  finally { enriching.value = false; }
};

watch(() => props.targetTin, (val) => {
  if (val) loadDetail(val);
  else isOpen.value = false;
});

defineExpose({ open: loadDetail, close });
</script>
