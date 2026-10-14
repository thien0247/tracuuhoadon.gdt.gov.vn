<!-- @id 01M4V0HMMK0CJ7THGHKEJ7C4W8 -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div v-if="selectedComponent" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="closeInspector">
    <div class="bg-[#1e1b4b] border border-purple-500 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
      <div class="flex items-center justify-between px-5 py-3.5 bg-purple-700/80 border-b border-purple-500/50">
        <div class="flex items-center gap-2">
          <span class="text-base">🔬</span>
          <span class="font-mono font-bold text-sm text-white">&lt;{{ selectedComponent.name }} /&gt;</span>
        </div>
        <button @click="closeInspector" class="text-slate-300 hover:text-white transition p-1 text-lg font-bold">&times;</button>
      </div>
      <div class="p-5 space-y-3.5 text-xs">
        <div>
          <span class="text-purple-300 font-semibold uppercase tracking-wider block mb-1">Đường dẫn tệp nguồn:</span>
          <code class="block bg-slate-900/90 text-cyan-300 px-3 py-2 rounded-lg font-mono text-xs border border-purple-900/60 select-all">{{ selectedComponent.file }}</code>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <span class="text-purple-300 font-semibold uppercase tracking-wider block mb-1">Module:</span>
            <div class="bg-slate-900/60 px-3 py-1.5 rounded-lg border border-purple-900/40 text-slate-200 font-medium">{{ selectedComponent.module }}</div>
          </div>
          <div>
            <span class="text-purple-300 font-semibold uppercase tracking-wider block mb-1">Cấu trúc:</span>
            <div class="bg-slate-900/60 px-3 py-1.5 rounded-lg border border-purple-900/40 text-emerald-300 font-medium">Vue 3 SFC (&lt;script setup&gt;)</div>
          </div>
        </div>
        <div>
          <span class="text-purple-300 font-semibold uppercase tracking-wider block mb-1">Mô tả vai trò:</span>
          <div class="bg-slate-900/60 p-3 rounded-lg border border-purple-900/40 text-slate-300 leading-relaxed">{{ selectedComponent.desc }}</div>
        </div>
      </div>
      <div class="px-5 py-3 bg-slate-950/60 border-t border-purple-900/60 flex items-center justify-end gap-2">
        <button @click="copyPrompt" class="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5">
          <span>📋</span><span>{{ copied ? 'Đã sao chép!' : 'Sao chép Prompt yêu cầu sửa' }}</span>
        </button>
        <button @click="closeInspector" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition font-medium">Đóng</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useInspector } from '@/composables/useInspector';

const { selectedComponent, closeInspector } = useInspector();
const copied = ref(false);

const copyPrompt = async () => {
  if (!selectedComponent.value) return;
  const promptText = `Tôi muốn chỉnh sửa component ${selectedComponent.value.name} tại tệp ${selectedComponent.value.file} (Module: ${selectedComponent.value.module}).`;
  try {
    await navigator.clipboard.writeText(promptText);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  } catch (err) {
    console.error('Clipboard copy error:', err);
  }
};
</script>
