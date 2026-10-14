<!-- @id 01M4V0HMN7FE4FE1E8F43DFEBB -->
<!-- @related 01M4V0HMP0BNNZ0SW67AWG4GN2, 01M4V0HMNVM4S634MN7VYTNK44, 01M4V0HMMAGER9D326B643B5RY -->
<script setup lang="ts">
import type { SystemDiagnosticsResponse } from '../../types/service';

defineProps<{
  show: boolean;
  diagnostics: SystemDiagnosticsResponse | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'auto-heal'): void;
  (e: 'refresh'): void;
}>();

const getStatusBadge = (status: string) => {
  if (status === 'healthy') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (status === 'warning') return 'bg-amber-100 text-amber-800 border-amber-300';
  return 'bg-rose-100 text-rose-800 border-rose-300';
};
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
    <div class="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-xl">🩺</span>
          <div>
            <h3 class="text-base font-bold text-slate-900">Chẩn Đoán & Tự Sửa Lỗi Hệ Thống</h3>
            <p class="text-xs text-slate-500">Phát hiện xung đột port, đo độ trễ CSDL và tự giải phóng tiến trình treo</p>
          </div>
        </div>
        <button @click="emit('close')" class="text-slate-400 hover:text-slate-600 rounded-lg p-1 text-lg leading-none cursor-pointer">&times;</button>
      </div>

      <!-- Body -->
      <div class="p-6 overflow-y-auto space-y-4 flex-1">
        <div v-if="loading && !diagnostics" class="flex flex-col items-center justify-center py-10 space-y-3">
          <div class="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs text-slate-500 font-medium">Đang kiểm tra toàn diện các dịch vụ & cổng kết nối...</span>
        </div>

        <div v-else-if="diagnostics" class="space-y-4">
          <!-- Summary Banner -->
          <div :class="['p-3 rounded-lg border flex items-center justify-between',
                       diagnostics.healthy ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800']">
            <div class="flex items-center space-x-2">
              <span class="text-lg">{{ diagnostics.healthy ? '✅' : '⚠️' }}</span>
              <span class="text-xs font-semibold">
                {{ diagnostics.healthy ? 'Hệ thống vận hành tối ưu' : 'Phát hiện một số cảnh báo cần lưu ý' }}
                (RAM: {{ diagnostics.memoryUsageMb }} MB)
              </span>
            </div>
            <span class="text-[11px] opacity-75 font-mono">{{ diagnostics.systemTime }}</span>
          </div>

          <!-- Items Grid -->
          <div class="space-y-2">
            <div v-for="item in diagnostics.diagnostics" :key="item.id"
                 class="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start justify-between">
              <div class="space-y-0.5 max-w-[80%]">
                <div class="flex items-center space-x-2">
                  <span class="text-xs font-bold text-slate-800">{{ item.name }}</span>
                  <span v-if="item.latencyMs !== undefined" class="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                    {{ item.latencyMs }} ms
                  </span>
                </div>
                <p class="text-xs text-slate-600">{{ item.value }}</p>
              </div>
              <span :class="['text-[11px] px-2 py-0.5 rounded-full border font-semibold', getStatusBadge(item.status)]">
                {{ item.status.toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button @click="emit('refresh')" :disabled="loading"
                class="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 cursor-pointer">
          🔄 Quét Lại
        </button>
        <div class="flex items-center space-x-2">
          <button @click="emit('auto-heal')" :disabled="loading"
                  class="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer">
            <span>⚡ Tự Động Khắc Phục</span>
          </button>
          <button @click="emit('close')"
                  class="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg cursor-pointer">
            Đóng
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
