<!-- @id 01M4V0HMMX16CTKCDHJHWXZKTA -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div class="space-y-3">
    <!-- Toast Thông Báo Thao Tác -->
    <div v-if="actionNotice" class="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center justify-between transition animate-bounce">
      <span>{{ actionNotice }}</span>
      <button @click="actionNotice = ''" class="text-white/80 hover:text-white ml-2">✕</button>
    </div>
    <!-- Panel Quét Đỉnh Mới Nhất 6h -->
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-indigo-100 dark:border-indigo-900/60 flex flex-col md:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="text-2xl">🗓️</span>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">Tự Động Quét Đỉnh Mới Nhất</h2>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
              :class="status.newest.enabled ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'">
              {{ status.newest.enabled ? '● Chạy mỗi 6h' : '○ Đã tắt' }}
            </span>
          </div>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
            Đếm ngược: <b class="text-indigo-600 dark:text-indigo-400">{{ fmtCd(status.newest.countdown_sec) }}</b> | 
            Lần cuối: {{ status.newest.last_run || 'Chưa chạy' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto justify-end">
        <button @click="toggleNewest" class="px-3 py-1.5 text-xs font-bold rounded-xl transition shadow-sm"
          :class="status.newest.enabled ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100'">
          {{ status.newest.enabled ? '⏹ Tắt Auto 6h' : '▶ Bật Auto 6h' }}
        </button>
        <button @click="triggerNewest" :disabled="status.is_executing || isTriggering"
          class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50">
          {{ isTriggering ? '⏳ Đang kích hoạt...' : '⚡ Quét Đỉnh Ngay' }}
        </button>
      </div>
    </div>

    <!-- Panel Quét Fill Lỗ Hổng 500 MST Từ Max Xuống (Định kỳ 12h) -->
    <div class="bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 rounded-2xl p-4 shadow-sm border border-amber-200 dark:border-amber-800/60 flex flex-col md:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="text-2xl">🕳️</span>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">Auto Quét Fill Lỗ Hổng 500 MST (Từ Max Xuống)</h2>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold"
              :class="status.gap_fill_500.enabled ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'">
              {{ status.gap_fill_500.enabled ? '● Chạy mỗi 12h' : '○ Đã tắt' }}
            </span>
          </div>
          <p class="text-[11px] text-slate-600 dark:text-slate-300 font-mono mt-0.5">
            Đếm ngược: <b class="text-amber-700 dark:text-amber-400">{{ fmtCd(status.gap_fill_500.countdown_sec) }}</b> | 
            Lần cuối: {{ status.gap_fill_500.last_run || 'Chưa chạy' }}
          </p>
          <div class="flex flex-wrap items-center gap-1.5 mt-1.5">
            <span class="text-[10px] font-bold text-amber-950 dark:text-amber-300 uppercase">Quy tắc dừng 500:</span>
            <button @click="setGapFillMode(true)" type="button"
              class="px-2 py-0.5 rounded-lg text-[10px] font-bold transition border"
              :class="(status.gap_fill_500.reset_on_existing !== false) ? 'bg-amber-600 text-white border-amber-700 shadow-sm' : 'bg-white/80 dark:bg-slate-800 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700 hover:bg-white'">
              Option 1: Reset khi gặp mã trong DB (Vét sâu)
            </button>
            <button @click="setGapFillMode(false)" type="button"
              class="px-2 py-0.5 rounded-lg text-[10px] font-bold transition border"
              :class="(status.gap_fill_500.reset_on_existing === false) ? 'bg-purple-600 text-white border-purple-700 shadow-sm' : 'bg-white/80 dark:bg-slate-800 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700 hover:bg-white'">
              Option 2: Chỉ reset khi có mã mới nạp DB
            </button>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto justify-end">
        <button @click="toggleGapFill" class="px-3 py-1.5 text-xs font-bold rounded-xl transition shadow-sm"
          :class="status.gap_fill_500.enabled ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200' : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 hover:bg-amber-200'">
          {{ status.gap_fill_500.enabled ? '⏹ Tắt Lịch 12h' : '▶ Bật Lịch 12h' }}
        </button>
        <button @click="triggerGapFill" :disabled="status.is_executing || isTriggering"
          class="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-purple-600 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-50">
          {{ isTriggering ? '⏳ Đang kích hoạt...' : '⚡ Quét 500 Lỗ Hổng Ngay' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ApiClient } from '@/api/client';

const status = ref({
  is_executing: false,
  newest: { enabled: false, interval_hours: 6, last_run: '', countdown_sec: 0 },
  gap_fill_500: { enabled: true, interval_hours: 12, last_run: '', countdown_sec: 0, reset_on_existing: true }
});

const actionNotice = ref('');
const isTriggering = ref(false);

const fmtCd = (sec: number) => {
  if (!sec || sec <= 0) return '--:--:--';
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

const setNotice = (msg: string) => {
  actionNotice.value = msg;
  setTimeout(() => { if (actionNotice.value === msg) actionNotice.value = ''; }, 4500);
};

const fetchStatus = async () => {
  try {
    const res = await ApiClient.getScheduleStatus();
    if (res && res.newest && res.gap_fill_500) status.value = res;
  } catch (_) {}
};

const toggleNewest = async () => {
  await ApiClient.toggleScheduleNewest(!status.value.newest.enabled);
  await fetchStatus();
};

const toggleGapFill = async () => {
  await ApiClient.toggleScheduleGapFill(!status.value.gap_fill_500.enabled);
  await fetchStatus();
};

const triggerNewest = async () => {
  isTriggering.value = true;
  try {
    await ApiClient.triggerScheduleNewest();
    setNotice('⚡ Đã kích hoạt đợt quét Đỉnh mới nhất cho 62 tỉnh!');
    await fetchStatus();
  } catch (e: unknown) {
    const err = e as { message?: string };
    setNotice('❌ Lỗi kích hoạt: ' + (err.message || String(e)));
  } finally {
    isTriggering.value = false;
  }
};

const triggerGapFill = async () => {
  isTriggering.value = true;
  try {
    await ApiClient.triggerScheduleGapFill();
    setNotice('⚡ Đã kích hoạt quét 500 lỗ hổng cho 62 tỉnh thành!');
    await fetchStatus();
  } catch (e: unknown) {
    const err = e as { message?: string };
    setNotice('❌ Lỗi kích hoạt: ' + (err.message || String(e)));
  } finally {
    isTriggering.value = false;
  }
};

const setGapFillMode = async (resetOnExisting: boolean) => {
  try {
    await ApiClient.setScheduleGapFillMode(resetOnExisting);
    setNotice(resetOnExisting ? '⚙️ Option 1: Reset khi gặp mã trong DB (Vét cạn sâu)' : '⚙️ Option 2: Chỉ reset khi có mã mới nạp DB (Nghiêm ngặt)');
    await fetchStatus();
  } catch (e: unknown) {
    const err = e as { message?: string };
    setNotice('❌ Lỗi đổi chế độ: ' + (err.message || String(e)));
  }
};

let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  fetchStatus();
  timer = setInterval(() => {
    if (status.value.newest.countdown_sec > 0) status.value.newest.countdown_sec--;
    if (status.value.gap_fill_500.countdown_sec > 0) status.value.gap_fill_500.countdown_sec--;
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
