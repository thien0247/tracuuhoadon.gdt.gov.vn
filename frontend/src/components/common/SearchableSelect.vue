<!-- @id 01M4V0HMMPX5WBQR893V0S0MVC -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div ref="containerRef" class="relative w-full">
    <button type="button" @click="toggleDropdown" :disabled="disabled || loading"
      class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-left flex items-center justify-between transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
      <span class="truncate" :class="modelValue ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-500'">
        {{ loading ? 'Đang nạp dữ liệu...' : selectedLabel }}
      </span>
      <span class="text-slate-400 text-[10px] ml-1 flex-shrink-0">▼</span>
    </button>

    <div v-if="isOpen" class="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
      <div class="p-1.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <input ref="inputRef" v-model="search" type="text" placeholder="Gõ để tìm nhanh..."
          class="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500">
      </div>
      <div class="overflow-y-auto max-h-48 py-1 text-xs divide-y divide-slate-50 dark:divide-slate-700/50">
        <div v-if="allLabel" @click="selectItem('')"
          class="px-3 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer font-semibold text-indigo-700 dark:text-indigo-400 flex items-center justify-between"
          :class="{ 'bg-indigo-50 dark:bg-indigo-950/40': !modelValue }">
          <span>{{ allLabel }}</span>
          <span v-if="!modelValue" class="text-indigo-600 font-bold">✓</span>
        </div>
        <div v-if="filteredList.length === 0" class="px-3 py-2 text-center text-slate-400 italic">
          Không tìm thấy kết quả
        </div>
        <div v-for="item in filteredList" :key="item.value" @click="selectItem(item.value)"
          class="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer text-slate-800 dark:text-slate-200 flex items-center justify-between"
          :class="{ 'bg-indigo-50 dark:bg-indigo-950/40 font-medium text-indigo-700 dark:text-indigo-400': String(modelValue) === String(item.value) }">
          <span class="truncate">{{ item.label }}</span>
          <span v-if="String(modelValue) === String(item.value)" class="text-indigo-600 font-bold text-xs">✓</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue';

interface OptionItem {
  value: string | number;
  label: string;
}

const props = withDefaults(defineProps<{
  modelValue?: string | number;
  options?: unknown[];
  placeholder?: string;
  allLabel?: string;
  disabled?: boolean;
  loading?: boolean;
}>(), {
  modelValue: '',
  options: () => [],
  placeholder: 'Chọn hoặc tìm kiếm...',
  allLabel: '',
  disabled: false,
  loading: false
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | number): void;
  (e: 'change', val: string | number): void;
}>();

const isOpen = ref(false);
const search = ref('');
const containerRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const norm = (s: unknown) => (s ?? '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const normOptions = computed<OptionItem[]>(() => {
  return (props.options || []).map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') return { value: opt, label: String(opt) };
    const o = opt as Record<string, unknown>;
    const val = (o.name ?? o.value ?? o.code ?? '') as string | number;
    const lbl = (o.name ?? o.label ?? o.code ?? '') as string;
    return { value: val, label: String(lbl) };
  });
});

const selectedLabel = computed(() => {
  if (!props.modelValue) return props.allLabel || props.placeholder;
  const found = normOptions.value.find((o) => String(o.value) === String(props.modelValue));
  return found ? found.label : String(props.modelValue);
});

const filteredList = computed(() => {
  const q = norm(search.value.trim());
  if (!q) return normOptions.value;
  return normOptions.value.filter((o) => norm(o.label).includes(q) || norm(o.value).includes(q));
});

const toggleDropdown = () => {
  if (props.disabled || props.loading) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    search.value = '';
    nextTick(() => inputRef.value?.focus());
  }
};

const selectItem = (val: string | number) => {
  emit('update:modelValue', val);
  emit('change', val);
  isOpen.value = false;
  search.value = '';
};

const handleClickOutside = (e: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));
</script>
