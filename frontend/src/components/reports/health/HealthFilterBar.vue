<!-- @id 01M4V47G4VE6FHKY2R9W1ZRDAE -->
<!-- @related 01M4V0HMNCXQ9YSTN0952D9K7Q, 01M4V47G4V5SH5205T3XW0HQMA -->
<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2.5">
        <div class="relative">
          <input :value="searchQuery" @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
                 type="text" placeholder="Tìm tên tỉnh, tiền tố..."
                 class="px-3 py-1.5 pl-8 text-xs border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 w-44">
          <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
        </div>

        <div class="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg text-xs font-medium">
          <button @click="$emit('update:statusFilter', 'all')" :class="statusFilter === 'all' ? 'bg-white dark:bg-slate-800 shadow text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'" class="px-2 py-1 rounded">Tất Cả</button>
          <button @click="$emit('update:statusFilter', 'healthy')" :class="statusFilter === 'healthy' ? 'bg-white dark:bg-slate-800 shadow text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'" class="px-2 py-1 rounded">Bình Thường</button>
          <button @click="$emit('update:statusFilter', 'warning')" :class="statusFilter === 'warning' ? 'bg-white dark:bg-slate-800 shadow text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'" class="px-2 py-1 rounded">Chú Ý</button>
          <button @click="$emit('update:statusFilter', 'stalled')" :class="statusFilter === 'stalled' ? 'bg-white dark:bg-slate-800 shadow text-rose-700 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'" class="px-2 py-1 rounded">Tắc Nghẽn</button>
        </div>

        <select :value="hasNewFilter" @change="$emit('update:hasNewFilter', ($event.target as HTMLSelectElement).value)"
                class="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium">
          <option value="all">📊 Tất cả MST mới</option>
          <option value="has_new">✨ Có MST mới (> 0)</option>
          <option value="no_new">⚠️ Không có MST mới (= 0)</option>
        </select>

        <select :value="sortBy" @change="$emit('update:sortBy', ($event.target as HTMLSelectElement).value)"
                class="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 font-medium">
          <option value="days_desc">⏳ Ngày trễ nhất</option>
          <option value="new_desc">🔥 MST mới nhiều nhất</option>
          <option value="density_asc">⚠️ Độ đặc thấp nhất</option>
          <option value="prefix_asc">🔢 Tiền tố (01 → 99)</option>
          <option value="name_asc">🔤 Tên tỉnh (A → Z)</option>
        </select>

        <button v-if="statusFilter !== 'all' || hasNewFilter !== 'all' || searchQuery || sortBy !== 'days_desc'"
                @click="$emit('reset-filters')" class="px-2 py-1 text-xs text-slate-500 hover:text-rose-600 transition font-medium">✕ Xóa lọc</button>
      </div>

      <div class="flex items-center space-x-2">
        <span class="text-xs text-slate-500 font-medium">Phạm vi:</span>
        <button v-for="d in [3, 7, 14, 30]" :key="d" @click="$emit('change-days', d)"
                :class="selectedDays === d ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200'"
                class="px-2.5 py-1 text-xs font-semibold rounded-lg transition">{{ d }}d</button>
        <button @click="$emit('export-excel')" class="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition flex items-center gap-1 shadow-sm">
          <span>📥 Excel</span>
        </button>
        <button @click="$emit('refresh')" :disabled="loading"
                class="px-3 py-1 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition flex items-center space-x-1">
          <span :class="loading ? 'animate-spin' : ''">🔄</span><span>Làm Mới</span>
        </button>
      </div>
    </div>

    <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700">
      <span>Hiển thị <b class="text-slate-800 dark:text-slate-100">{{ filteredCount }}</b> / {{ totalCount }} tỉnh thành</span>
      <span v-if="filteredCount === 0" class="text-rose-500 font-medium">Không tìm thấy tỉnh nào phù hợp.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  searchQuery: string;
  statusFilter: string;
  hasNewFilter: string;
  sortBy: string;
  selectedDays: number;
  filteredCount: number;
  totalCount: number;
  loading: boolean;
}>();

defineEmits<{
  (e: 'update:searchQuery', v: string): void;
  (e: 'update:statusFilter', v: string): void;
  (e: 'update:hasNewFilter', v: string): void;
  (e: 'update:sortBy', v: string): void;
  (e: 'change-days', days: number): void;
  (e: 'reset-filters'): void;
  (e: 'refresh'): void;
  (e: 'export-excel'): void;
}>();
</script>
