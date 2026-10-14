<!-- @id 01M4V18JXRGFZS2AGBE3VJD8SP -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH0Y37YAJEQCSBTEP0YK, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm" @click.self="$emit('close')">
    <div class="bg-white dark:bg-slate-800 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[92vh]">
      <!-- Header -->
      <div class="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
        <div class="flex items-center space-x-2.5">
          <span class="text-xl">🎯</span>
          <div>
            <h3 class="text-sm font-bold uppercase tracking-wider">Cập Nhật Max TIN Thủ Công</h3>
            <p class="text-[10px] text-slate-300">Đối soát 4 chiều và điều chỉnh đỉnh quét cho crawler</p>
          </div>
        </div>
        <button @click="$emit('close')" class="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition">✕</button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4 overflow-y-auto text-xs text-slate-700 dark:text-slate-200">
        <!-- Chọn Tỉnh Thành -->
        <div class="space-y-1">
          <label class="block font-bold text-slate-800 dark:text-slate-100">Chọn tỉnh thành:</label>
          <select v-model="selectedProvKey" @change="loadDetect(selectedProvKey)" :disabled="loading"
            class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold">
            <option v-for="(cfg, key) in provinceConfigs" :key="key" :value="key">({{ cfg.prefix }}) {{ key }}</option>
          </select>
        </div>

        <!-- Thẻ đối soát 4 chiều -->
        <div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
          <div v-for="c in statCards" :key="c.t" :class="c.bg" class="p-2.5 rounded-xl border">
            <div class="text-[10px] font-sans font-bold" :class="c.tc">{{ c.t }}</div>
            <div class="font-bold mt-0.5 truncate" :class="c.vc">{{ c.v || '—' }}</div>
          </div>
        </div>

        <!-- Ô nhập Max TIN -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label class="font-bold text-slate-800 dark:text-slate-100">Max TIN mới (10 số):</label>
            <button v-if="detectInfo?.suggested_max_tin" @click="inputMaxTin = detectInfo.suggested_max_tin"
              class="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              ⚡ Điền đỉnh cao nhất: {{ detectInfo.suggested_max_tin }}
            </button>
          </div>
          <input type="text" v-model="inputMaxTin" maxlength="10" placeholder="VD: 0318999999"
            class="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl px-3 py-2 text-sm font-mono font-bold"
            :class="isValidInput ? 'border-slate-300 dark:border-slate-600 text-indigo-600 dark:text-indigo-400' : 'border-rose-500 text-rose-600'">
          <p v-if="!isValidInput && inputMaxTin" class="text-[10px] text-rose-500">MST phải có đúng 10 chữ số và bắt đầu bằng ({{ currentPrefix }}).</p>
        </div>

        <!-- Checkboxes -->
        <div class="space-y-1.5 pt-1">
          <label class="flex items-center gap-2 cursor-pointer text-xs">
            <input type="checkbox" v-model="updateScanProgress" class="rounded text-indigo-600">
            <span>Cập nhật vào Tiến trình quét (<code class="text-[10px] font-mono">scan_progress.last_tin</code>)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer text-xs">
            <input type="checkbox" v-model="updateActivationTin" class="rounded text-indigo-600">
            <span>Cập nhật vào Mã khởi tạo tỉnh (<code class="text-[10px] font-mono">provinces.activation_tin</code>)</span>
          </label>
        </div>

        <!-- Notice -->
        <div v-if="msg" class="p-2.5 rounded-xl font-bold text-xs" :class="isErr ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'">{{ msg }}</div>
      </div>

      <!-- Footer Buttons -->
      <div class="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
        <button @click="onSyncAll" :disabled="syncing"
          class="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-100 transition flex items-center gap-1.5">
          <span :class="syncing ? 'animate-spin' : ''">🔄</span><span>Đồng Bộ 62 Tỉnh</span>
        </button>
        <div class="flex items-center gap-2">
          <button @click="$emit('close')" class="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 transition">Đóng</button>
          <button @click="onSave" :disabled="saving || !isValidInput"
            class="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition disabled:opacity-50">
            {{ saving ? 'Đang lưu...' : 'Lưu Cập Nhật' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { ProvincesApi, type ProvinceMaxTinDetectResult } from '@/api/provinces';
import type { ProvinceConfig } from '@/types';

const props = defineProps<{ visible: boolean; initialProvinceKey?: string; provinceConfigs: Record<string, ProvinceConfig> }>();
const emit = defineEmits<{(e: 'close'): void; (e: 'updated'): void;}>();

const selectedProvKey = ref('');
const detectInfo = ref<ProvinceMaxTinDetectResult | null>(null);
const inputMaxTin = ref('');
const updateScanProgress = ref(true);
const updateActivationTin = ref(true);
const loading = ref(false), saving = ref(false), syncing = ref(false);
const msg = ref(''), isErr = ref(false);

const currentPrefix = computed(() => (selectedProvKey.value && props.provinceConfigs[selectedProvKey.value]?.prefix) || '');
const isValidInput = computed(() => {
  const tin = inputMaxTin.value.trim();
  return tin.length === 10 && /^\d+$/.test(tin) && tin.startsWith(currentPrefix.value);
});

const statCards = computed(() => [
  { t: '🏛️ CSDL Thuế', v: detectInfo.value?.db_tax_max, bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900', tc: 'text-blue-600 dark:text-blue-300', vc: 'text-blue-900 dark:text-blue-100' },
  { t: '📰 Bố Cáo ĐKKD', v: detectInfo.value?.db_bocao_max, bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900', tc: 'text-purple-600 dark:text-purple-300', vc: 'text-purple-900 dark:text-purple-100' },
  { t: '🕒 Đã Quét Gần Nhất', v: detectInfo.value?.last_scanned_tin, bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900', tc: 'text-emerald-600 dark:text-emerald-300', vc: 'text-emerald-900 dark:text-emerald-100' },
  { t: '⚙️ Mã Khởi Tạo', v: detectInfo.value?.activation_tin, bg: 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600', tc: 'text-slate-500 dark:text-slate-300', vc: 'text-slate-800 dark:text-slate-100' }
]);

const loadDetect = async (key: string) => {
  if (!key) return;
  loading.value = true; msg.value = '';
  try {
    detectInfo.value = await ProvincesApi.detectMaxTin(key);
    inputMaxTin.value = detectInfo.value.suggested_max_tin || '';
  } catch (e) { msg.value = (e as Error).message; isErr.value = true; }
  finally { loading.value = false; }
};

watch(() => props.visible, (v) => {
  if (v) {
    selectedProvKey.value = props.initialProvinceKey || Object.keys(props.provinceConfigs)[0] || '';
    void loadDetect(selectedProvKey.value);
  }
});

const onSave = async () => {
  if (!isValidInput.value) return;
  saving.value = true; msg.value = '';
  try {
    await ProvincesApi.updateMaxTin(selectedProvKey.value, {
      max_tin: inputMaxTin.value.trim(),
      update_scan_progress: updateScanProgress.value,
      update_activation_tin: updateActivationTin.value
    });
    msg.value = `Đã cập nhật thành công Max TIN cho ${selectedProvKey.value}!`; isErr.value = false;
    emit('updated'); setTimeout(() => emit('close'), 1200);
  } catch (e) { msg.value = (e as Error).message; isErr.value = true; }
  finally { saving.value = false; }
};

const onSyncAll = async () => {
  syncing.value = true;
  try {
    const res = await ProvincesApi.syncAllMaxTin();
    msg.value = `Đã đồng bộ thành công ${res.synced_count} tỉnh thành từ CSDL!`; isErr.value = false;
    emit('updated');
  } catch (e) { msg.value = (e as Error).message; isErr.value = true; }
  finally { syncing.value = false; }
};
</script>
