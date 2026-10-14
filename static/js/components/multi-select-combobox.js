/**
 * MultiSelectCombobox – multi-select dropdown with checkboxes, search & tags.
 * Drop-in companion to SearchableCombobox for multi-value use-cases.
 */
const MultiSelectCombobox = {
    name: 'MultiSelectCombobox',
    props: {
        modelValue: { type: Array, default: () => [] },
        options: { type: Array, default: () => [] },
        placeholder: { type: String, default: 'Chọn hoặc tìm kiếm...' },
        disabled: { type: Boolean, default: false },
        loading: { type: Boolean, default: false }
    },
    emits: ['update:modelValue', 'change'],
    setup(props, { emit }) {
        const { ref, computed, onMounted, onUnmounted, nextTick } = Vue;
        const open = ref(false);
        const search = ref('');
        const root = ref(null);

        const norm = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        const normalizedOpts = computed(() =>
            props.options.map(o => {
                if (typeof o === 'string') return { value: o, label: o };
                return { value: o.code ?? o.value ?? '', label: o.name ?? o.label ?? '' };
            })
        );

        const filtered = computed(() => {
            if (!search.value) return normalizedOpts.value;
            const q = norm(search.value);
            return normalizedOpts.value.filter(o => norm(o.label).includes(q) || norm(o.value).includes(q));
        });

        const isSelected = (val) => props.modelValue.includes(val);
        const allSelected = computed(() =>
            filtered.value.length > 0 && filtered.value.every(o => isSelected(o.value))
        );

        function toggle(val) {
            const next = isSelected(val)
                ? props.modelValue.filter(v => v !== val)
                : [...props.modelValue, val];
            emit('update:modelValue', next);
            emit('change', next);
        }

        function selectAll() {
            const vals = new Set(props.modelValue);
            filtered.value.forEach(o => vals.add(o.value));
            const next = [...vals];
            emit('update:modelValue', next);
            emit('change', next);
        }

        function deselectAll() {
            const remove = new Set(filtered.value.map(o => o.value));
            const next = props.modelValue.filter(v => !remove.has(v));
            emit('update:modelValue', next);
            emit('change', next);
        }

        function removeTag(val) {
            const next = props.modelValue.filter(v => v !== val);
            emit('update:modelValue', next);
            emit('change', next);
        }

        const labelMap = computed(() => {
            const m = {};
            normalizedOpts.value.forEach(o => { m[o.value] = o.label; });
            return m;
        });

        const visibleTags = computed(() => props.modelValue.slice(0, 3));
        const extraCount = computed(() => Math.max(0, props.modelValue.length - 3));

        function openDropdown() {
            if (props.disabled || props.loading) return;
            open.value = true;
            nextTick(() => root.value?.querySelector('input')?.focus());
        }

        function onClickOutside(e) {
            if (root.value && !root.value.contains(e.target)) open.value = false;
        }

        onMounted(() => document.addEventListener('mousedown', onClickOutside));
        onUnmounted(() => document.removeEventListener('mousedown', onClickOutside));

        return {
            open, search, root, filtered, isSelected, allSelected,
            toggle, selectAll, deselectAll, removeTag,
            labelMap, visibleTags, extraCount, openDropdown
        };
    },
    template: `
<div ref="root" class="relative inline-block w-full">
  <!-- Trigger -->
  <button type="button" @click="openDropdown"
    :disabled="disabled || loading"
    class="w-full flex items-center justify-between bg-slate-50 border border-slate-300
           rounded-lg px-2.5 py-1.5 text-xs text-left transition
           focus:outline-none focus:ring-1 focus:ring-indigo-400
           disabled:opacity-50 disabled:cursor-not-allowed">
    <span v-if="modelValue.length" class="text-slate-700">Đã chọn
      <span class="inline-flex items-center justify-center bg-indigo-600 text-white
                    rounded-full px-1.5 min-w-[18px] text-[10px] font-semibold ml-1">
        {{ modelValue.length }}
      </span>
    </span>
    <span v-else class="text-slate-400">{{ placeholder }}</span>
    <svg class="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform"
         :class="{ 'rotate-180': open }"
         fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
    </svg>
  </button>

  <!-- Tags -->
  <div v-if="modelValue.length" class="flex flex-wrap gap-1 mt-1">
    <span v-for="val in visibleTags" :key="val"
      class="inline-flex items-center bg-indigo-100 text-indigo-700 rounded-full
             px-2 py-0.5 text-[10px] leading-tight max-w-[140px]">
      <span class="truncate">{{ labelMap[val] || val }}</span>
      <button type="button" @click.stop="removeTag(val)"
        class="ml-1 hover:text-indigo-900 focus:outline-none">&times;</button>
    </span>
    <span v-if="extraCount" class="text-[10px] text-slate-500 self-center">+{{ extraCount }} khác</span>
  </div>

  <!-- Dropdown -->
  <div v-show="open"
    class="absolute z-50 mt-1 w-full bg-white border border-slate-200
           rounded-lg shadow-lg overflow-hidden">
    <!-- Search -->
    <div class="p-1.5">
      <input v-model="search" type="text" placeholder="Tìm kiếm..."
        class="w-full border border-slate-200 rounded px-2 py-1 text-xs
               focus:outline-none focus:ring-1 focus:ring-indigo-400" />
    </div>
    <!-- Bulk actions -->
    <div class="flex gap-1 px-1.5 pb-1">
      <button type="button" @click="selectAll"
        class="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200
               text-slate-600 transition">Chọn tất cả</button>
      <button type="button" @click="deselectAll"
        class="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200
               text-slate-600 transition">Bỏ tất cả</button>
    </div>
    <!-- List -->
    <ul class="max-h-48 overflow-y-auto">
      <li v-if="!filtered.length" class="px-3 py-2 text-xs text-slate-400 text-center">
        Không tìm thấy
      </li>
      <li v-for="opt in filtered" :key="opt.value"
        @click="toggle(opt.value)"
        class="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100
               cursor-pointer text-xs select-none">
        <input type="checkbox" :checked="isSelected(opt.value)"
          class="rounded border-slate-300 text-indigo-600
                 focus:ring-indigo-400 pointer-events-none" />
        <span class="truncate">{{ opt.label }}</span>
      </li>
    </ul>
  </div>
</div>`
};

window.MultiSelectCombobox = MultiSelectCombobox;
