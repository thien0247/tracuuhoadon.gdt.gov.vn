<!-- @id 01M4V0HMNNDJW9HSABMQFV34GF -->
<!-- @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1 -->
<template>
  <div v-if="show && service" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
    <div class="card-glass bg-[var(--bg-card)] rounded-2xl max-w-md w-full border border-[var(--border-color)] shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
        <div class="flex items-center gap-2">
          <span class="text-xl">⚙️</span>
          <div>
            <h3 class="text-sm font-bold text-[var(--text-primary)]">Tham Số: {{ service.name }}</h3>
            <p class="text-[11px] text-[var(--text-muted)]">Tùy biến tham số gọi và kích hoạt dịch vụ</p>
          </div>
        </div>
        <button @click="$emit('close')" class="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg">✕</button>
      </div>

      <!-- Parameters Form -->
      <div class="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
        <div v-for="param in service.parameters" :key="param.key" class="space-y-1">
          <label class="block text-xs font-semibold text-[var(--text-primary)]">{{ param.label }}</label>
          <p class="text-[10px] text-[var(--text-muted)]">{{ param.description }}</p>

          <!-- Select Input -->
          <select v-if="param.type === 'select'" v-model="formValues[param.key]"
                  class="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--vnpt-blue)]">
            <option v-for="opt in param.options" :key="String(opt.value)" :value="opt.value">{{ opt.label }}</option>
          </select>

          <!-- Number Input -->
          <input v-else-if="param.type === 'number'" type="number" v-model.number="formValues[param.key]"
                 :min="param.min" :max="param.max" :step="param.step"
                 class="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--vnpt-blue)]" />

          <!-- Boolean Checkbox -->
          <label v-else-if="param.type === 'boolean'" class="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" v-model="formValues[param.key]" class="rounded text-[var(--vnpt-blue)] focus:ring-0 w-4 h-4" />
            <span class="text-xs text-[var(--text-secondary)]">Kích hoạt tùy chọn này</span>
          </label>

          <!-- String Input -->
          <input v-else type="text" v-model="formValues[param.key]"
                 class="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--vnpt-blue)]" />
        </div>
      </div>

      <!-- Action Footer -->
      <div class="flex items-center justify-between pt-3 border-t border-[var(--border-color)] gap-2">
        <button @click="$emit('close')" type="button" class="px-3 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-semibold hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">Hủy</button>
        <div class="flex items-center gap-1.5">
          <button v-for="act in actionButtons" :key="act.key" @click="handleAction(act.key)" :disabled="loading"
                  class="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition disabled:opacity-40"
                  :class="act.color">
            {{ act.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

export interface ParamDef {
  key: string; label: string; type: 'select' | 'number' | 'boolean' | 'string';
  defaultValue: unknown; description: string;
  options?: Array<{ label: string; value: string | number | boolean }>;
  min?: number; max?: number; step?: number;
}

export interface ModalServiceItem {
  id: string; name: string; supportedActions: string[]; parameters?: ParamDef[];
}

const props = defineProps<{ show: boolean; service: ModalServiceItem | null; loading?: boolean }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'submit', action: string, params: Record<string, unknown>): void }>();

const formValues = ref<Record<string, unknown>>({});

watch(() => props.service, (svc) => {
  if (!svc || !svc.parameters) { formValues.value = {}; return; }
  const init: Record<string, unknown> = {};
  for (const p of svc.parameters) init[p.key] = p.defaultValue;
  formValues.value = init;
}, { immediate: true });

const actionButtons = computed(() => {
  if (!props.service) return [];
  const acts = props.service.supportedActions;
  const list = [];
  if (acts.includes('trigger')) list.push({ key: 'trigger', label: '⚡ Kích Hoạt', color: 'bg-amber-600 hover:bg-amber-500' });
  if (acts.includes('test_connection')) list.push({ key: 'test_connection', label: '🩺 Kiểm Tra', color: 'bg-purple-600 hover:bg-purple-500' });
  if (acts.includes('start')) list.push({ key: 'start', label: '▶ Bắt Đầu', color: 'bg-emerald-600 hover:bg-emerald-500' });
  if (acts.includes('restart')) list.push({ key: 'restart', label: '🔄 Khởi Động Lại', color: 'bg-indigo-600 hover:bg-indigo-500' });
  return list.length ? list : [{ key: 'apply', label: 'Áp Dụng', color: 'bg-[var(--vnpt-blue)]' }];
});

const handleAction = (action: string) => emit('submit', action, { ...formValues.value });
</script>
