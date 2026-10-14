<!-- @id 01M4V0HMN7RQJAYSHAG59PF1JQ -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <aside :class="collapsed ? 'w-16' : 'w-60'" class="transition-all duration-200 border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col justify-between shrink-0 shadow-sm">
    <div class="p-3 space-y-4">
      <nav class="space-y-2.5">
        <div v-for="(grp, gIdx) in menuGroups" :key="grp.title" :class="gIdx > 0 ? 'pt-2 border-t border-[var(--border-color)]' : ''">
          <div v-show="!collapsed" class="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-2 mb-1">{{ grp.title }}</div>
          <div class="space-y-0.5">
            <button v-for="item in grp.items" :key="item.id" @click="$emit('update:activeTab', item.id)" :title="item.name"
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-xs font-semibold transition text-left"
              :class="activeTab === item.id ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'">
              <span class="text-sm shrink-0">{{ item.icon }}</span>
              <span v-show="!collapsed" class="truncate">{{ item.name }}</span>
              <span v-if="item.id === 'health_report' && !collapsed && (stalledCount ?? 0) > 0"
                class="ml-auto px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-700 font-bold">{{ stalledCount }}</span>
            </button>
          </div>
        </div>
      </nav>
    </div>

    <!-- Quick Actions -->
    <div class="p-3 border-t border-[var(--border-color)] space-y-2 bg-[var(--bg-secondary)]">
      <div v-show="!collapsed" class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">Tác Vụ Nhanh</div>
      <button @click="$emit('start-newest')" :title="collapsed ? 'Quét TIN Max Toàn Bộ' : ''"
        class="w-full py-1.5 px-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5">
        <span>⚡</span><span v-show="!collapsed">Quét TIN Max</span>
      </button>
      <div v-show="!collapsed" class="flex items-center justify-between bg-[var(--bg-card)] px-2.5 py-1 rounded-xl border border-[var(--border-color)]">
        <span class="text-[11px] font-semibold text-[var(--text-muted)]">Song song:</span>
        <select :value="maxConcurrent" @change="$emit('update:maxConcurrent', Number(($event.target as HTMLSelectElement).value))" class="bg-transparent border-0 text-xs font-bold text-[var(--vnpt-blue)] focus:ring-0 cursor-pointer p-0">
          <option :value="1">1 tỉnh</option><option :value="2">2 tỉnh</option><option :value="3">3 tỉnh</option><option :value="4">4 tỉnh</option>
        </select>
      </div>
      <div class="grid" :class="collapsed ? 'grid-cols-1 gap-1' : 'grid-cols-2 gap-1.5'">
        <button @click="$emit('start-all')" title="Start All" class="py-1 px-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1">
          <span>🚀</span><span v-show="!collapsed">Start</span>
        </button>
        <button @click="$emit('stop-all')" title="Stop All" class="py-1 px-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center gap-1">
          <span>⏹</span><span v-show="!collapsed">Stop</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  collapsed: boolean;
  activeTab: string;
  maxConcurrent: number;
  stalledCount?: number;
}>();

defineEmits<{
  (e: 'update:activeTab', tab: string): void;
  (e: 'update:maxConcurrent', val: number): void;
  (e: 'start-newest'): void;
  (e: 'start-all'): void;
  (e: 'stop-all'): void;
}>();

const menuGroups = [
  {
    title: 'Vét Cạn & Giám Sát',
    items: [
      { id: 'scan', icon: '📊', name: 'Quản Lý Quét Đa Tỉnh' },
      { id: 'services', icon: '🛠️', name: 'Điều Khiển Dịch Vụ' },
      { id: 'crawled_report', icon: '📈', name: 'Báo Cáo Sản Lượng' },
      { id: 'health_report', icon: '🩺', name: 'Giám Sát Sức Khỏe' },
      { id: 'config', icon: '⚙️', name: 'Cấu Hình Tỉnh Thành' }
    ]
  },
  {
    title: 'Bố Cáo & Đối Soát',
    items: [
      { id: 'bocao', icon: '📰', name: 'Bố Cáo ĐKKD Mới Nhất' },
      { id: 'bocao_reconcile', icon: '⚖️', name: 'Đối Soát Bố Cáo & Thuế' }
    ]
  },
  {
    title: 'Tra Cứu & Khai Thác',
    items: [
      { id: 'search', icon: '🔍', name: 'Tra Cứu Doanh Nghiệp' },
      { id: 'filter', icon: '📅', name: 'Lọc & Xuất Dữ Liệu' },
      { id: 'enrichment', icon: '✨', name: 'Làm Giàu Thuộc Tính' }
    ]
  },
  {
    title: 'Kiến Trúc & Đồ Thị',
    items: [
      { id: 'graphify', icon: '🕸️', name: 'Đồ Thị Kiến Trúc (Graph)' }
    ]
  }
];
</script>
