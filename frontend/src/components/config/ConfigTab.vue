<!-- @id 01M4V0HMMQ4GCPB23PCFET1VN7 -->
<!-- @related 01M4V0HMMAGER9D326B643B5RY, 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div class="space-y-6">
    <!-- 1. Quản trị hệ thống & Reset Server -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>⚡ Quản Trị Hệ Thống & Khởi Động Lại Server</span>
          </h2>
          <p class="text-xs text-slate-500 mt-0.5">Dừng crawler, giải phóng bộ nhớ, nạp lại cấu hình và khởi động lại máy chủ.</p>
        </div>
        <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          🟢 Hoạt động
        </span>
      </div>

      <div v-if="restarting" class="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold animate-spin text-sm">🔄</div>
        <div>
          <div class="text-sm font-bold text-indigo-900 dark:text-indigo-200">Máy chủ đang khởi động lại...</div>
          <div class="text-xs text-indigo-600 dark:text-indigo-400">Đang tái lập kết nối, trang sẽ tự động tải lại sau <b class="font-mono text-sm">{{ restartCountdown }}s</b></div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 flex flex-col justify-between">
          <div>
            <div class="text-xs font-bold text-slate-800 dark:text-slate-200">🔄 Làm Mới Bộ Nhớ (Soft Reset)</div>
            <p class="text-xs text-slate-500 mt-1">Dừng toàn bộ crawler đang chạy, xóa hàng đợi điều phối, làm sạch log và nạp lại danh mục 62 tỉnh từ CSDL.</p>
          </div>
          <button @click="onResetSystem" :disabled="resetting || restarting"
                  class="w-full py-2 px-3 text-xs font-bold rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition flex items-center justify-center gap-1.5 shadow-sm">
            <span :class="resetting ? 'animate-spin' : ''">🔄</span>
            <span>{{ resetting ? 'Đang làm mới...' : 'Làm Mới Bộ Nhớ' }}</span>
          </button>
        </div>

        <div class="bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200 dark:border-rose-800 space-y-2.5 flex flex-col justify-between">
          <div>
            <div class="text-xs font-bold text-rose-900 dark:text-rose-300">⚡ Khởi Động Lại Server (Hard Restart)</div>
            <p class="text-xs text-rose-700 dark:text-rose-400 mt-1">Khởi động lại toàn diện tiến trình máy chủ. Giải phóng triệt để tài nguyên, reset kết nối mạng và socket.</p>
          </div>
          <button @click="onRestartServer" :disabled="restarting"
                  class="w-full py-2 px-3 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition flex items-center justify-center gap-1.5 shadow-sm">
            <span>⚡</span><span>Khởi Động Lại Server</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. Quản lý thêm/xóa tỉnh thành -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
      <h2 class="text-base font-bold text-slate-900 dark:text-slate-100">Quản Lý Danh Mục Tỉnh Thành (Thêm/Xóa)</h2>
      <form @submit.prevent="addProvince" class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tên (VD: Hà Nội (01)):</label>
          <input type="text" v-model="newProv.name" required class="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tiền tố (Prefix):</label>
          <input type="text" v-model="newProv.prefix" required class="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white">
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">MST Kích hoạt:</label>
          <input type="text" v-model="newProv.activation_tin" required class="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-white">
        </div>
        <div class="flex items-end">
          <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded-lg shadow-sm transition-all text-sm">
            ➕ Thêm Tỉnh
          </button>
        </div>
      </form>

      <div class="overflow-x-auto mt-4 border border-slate-200 dark:border-slate-700 rounded-xl">
        <table class="w-full text-left text-xs text-slate-700 dark:text-slate-300">
          <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase font-bold border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th class="p-3.5">ID</th><th class="p-3.5">Tên Tỉnh</th><th class="p-3.5">Prefix</th><th class="p-3.5">MST Kích hoạt</th><th class="p-3.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="(prov, name) in serverProvinces" :key="name" class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <td class="p-3.5 font-mono text-slate-500">{{ prov.id || '-' }}</td>
              <td class="p-3.5 font-bold text-slate-900 dark:text-slate-100">{{ name }}</td>
              <td class="p-3.5 font-mono text-indigo-600 dark:text-indigo-400">{{ prov.prefix || '-' }}</td>
              <td class="p-3.5 font-mono text-slate-600 dark:text-slate-400">{{ prov.activation_tin }}</td>
              <td class="p-3.5 text-right">
                <button @click="deleteProvince(prov.id)" class="text-rose-500 hover:text-rose-700 font-bold px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 transition-colors">🗑 Xóa</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ApiClient } from '../../api/client';

interface ServerProvItem { id?: number | string; prefix?: string; activation_tin?: string; name?: string }
defineProps<{ serverProvinces: Record<string, ServerProvItem> }>();
const emit = defineEmits<{ (e: 'province-updated'): void }>();

const newProv = ref({ name: '', prefix: '', activation_tin: '' });
const resetting = ref(false);
const restarting = ref(false);
const restartCountdown = ref(0);

const addProvince = async () => {
  try {
    const res = await ApiClient.addProvince(newProv.value);
    if (res.ok) {
      newProv.value = { name: '', prefix: '', activation_tin: '' };
      emit('province-updated'); alert("Thêm tỉnh thành công!");
    } else {
      const err = await res.json() as { detail?: string };
      alert("Lỗi: " + (err.detail || 'Không thể thêm tỉnh'));
    }
  } catch (e) { alert("Lỗi kết nối: " + e); }
};

const deleteProvince = async (id?: number | string) => {
  if (!id || !confirm("Bạn có chắc chắn muốn xóa tỉnh này?")) return;
  try {
    const res = await ApiClient.deleteProvince(id);
    if (res.ok) { emit('province-updated'); alert("Xóa thành công!"); }
    else { alert("Lỗi khi xóa tỉnh"); }
  } catch (e) { alert("Lỗi kết nối: " + e); }
};

const onResetSystem = async () => {
  if (!confirm("Xác nhận làm mới bộ nhớ? Toàn bộ crawler sẽ dừng và nạp lại cấu hình từ CSDL.")) return;
  resetting.value = true;
  try {
    const res = await ApiClient.resetSystem() as { message?: string };
    emit('province-updated'); alert(res?.message || "Đã reset bộ nhớ thành công!");
  } catch (e) { alert("Lỗi reset: " + e); }
  finally { resetting.value = false; }
};

const onRestartServer = async () => {
  if (!confirm("XÁC NHẬN KHỞI ĐỘNG LẠI SERVER?\n\nTiến trình máy chủ sẽ được khởi động lại.")) return;
  restarting.value = true; restartCountdown.value = 3;
  try { await ApiClient.restartServer(); } catch (e) { console.warn("Server restarting...", e); }
  const timer = setInterval(() => {
    if (--restartCountdown.value <= 0) { clearInterval(timer); window.location.reload(); }
  }, 1000);
};
</script>
