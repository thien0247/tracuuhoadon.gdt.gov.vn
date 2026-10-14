<!-- @id 01M4V0HMN6W2PBXHV9JWYJ86MW -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <header class="h-[50px] sticky top-0 z-50 bg-[var(--vnpt-blue)] text-white flex items-center justify-between px-4 shadow-md shrink-0">
    <div class="flex items-center gap-3">
      <button @click="$emit('toggle-sidebar')" class="p-1.5 rounded-lg hover:bg-white/10 transition text-white" title="Thu gọn / Mở rộng Sidebar">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
      <div class="flex items-center gap-2">
        <span class="text-xl">🔍</span>
        <span class="font-brand font-bold text-sm tracking-wide uppercase">GDT Tax Crawler</span>
        <span class="hidden md:inline-block text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold text-cyan-200">VDDS v3.5 • Vue 3 Vite</span>
      </div>
    </div>
    <div class="flex items-center gap-2.5">
      <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 border border-white/20">
        <span class="w-2 h-2 rounded-full" :class="sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'"></span>
        <span class="text-[11px]">{{ sseConnected ? 'Live' : 'Offline' }}</span>
      </div>
      <button @click="$emit('switch-tab', 'services')" title="Quản lý và điều khiển các dịch vụ hệ thống"
        class="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition border border-white/20 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm">
        <span>🛠️</span><span>Điều Khiển Dịch Vụ</span>
      </button>
      <button @click="toggleInspector" :title="inspectorMode ? 'Tắt AI Inspector (Alt+I)' : 'Bật AI Inspector (Alt+I)'"
        class="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition border border-white/20"
        :class="inspectorMode ? 'bg-violet-500 text-white shadow-sm' : 'bg-white/10 text-white hover:bg-white/20'">
        <span>🔬</span><span class="hidden sm:inline">Inspector</span>
      </button>
      <button @click="toggleTheme" class="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white" :title="theme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'">
        <span>{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
      </button>
      <div class="hidden sm:flex items-center gap-2 pl-2 border-l border-white/20 text-xs">
        <div class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-cyan-200">VN</div>
        <span class="font-medium text-white/90">Quản trị viên</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme';
import { useSSE } from '@/composables/useSSE';
import { useInspector } from '@/composables/useInspector';

defineEmits<{
  (e: 'toggle-sidebar'): void;
  (e: 'switch-tab', tab: string): void;
}>();

const { theme, toggleTheme } = useTheme();
const { sseConnected } = useSSE();
const { inspectorMode, toggleInspector } = useInspector();
</script>
