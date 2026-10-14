/**
 * searchable-combobox.js - Component Combobox hỗ trợ tìm kiếm nhanh gõ phím & tùy chọn Tất cả.
 */
const SearchableCombobox = {
    name: 'SearchableCombobox',
    props: {
        modelValue: { type: [String, Number], default: '' },
        options: { type: Array, default: () => [] },
        placeholder: { type: String, default: 'Chọn hoặc tìm kiếm...' },
        allLabel: { type: String, default: '' },
        disabled: { type: Boolean, default: false },
        loading: { type: Boolean, default: false }
    },
    emits: ['update:modelValue', 'change'],
    setup(props, { emit }) {
        const { ref, computed, onMounted, onUnmounted, nextTick } = Vue;
        const isOpen = ref(false);
        const search = ref('');
        const containerRef = ref(null);
        const inputRef = ref(null);

        const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const normOptions = computed(() => {
            return (props.options || []).map(opt => {
                if (typeof opt === 'string') return { value: opt, label: opt };
                return {
                    value: opt.name != null ? opt.name : (opt.value != null ? opt.value : opt.code),
                    label: opt.name != null ? opt.name : (opt.label != null ? opt.label : opt.code)
                };
            });
        });

        const selectedLabel = computed(() => {
            if (!props.modelValue) return props.allLabel || props.placeholder;
            const found = normOptions.value.find(o => String(o.value) === String(props.modelValue));
            return found ? found.label : props.modelValue;
        });

        const filteredList = computed(() => {
            const q = norm(search.value.trim());
            if (!q) return normOptions.value;
            return normOptions.value.filter(o => norm(o.label).includes(q) || norm(String(o.value)).includes(q));
        });

        const toggleDropdown = () => {
            if (props.disabled || props.loading) return;
            isOpen.value = !isOpen.value;
            if (isOpen.value) {
                search.value = '';
                nextTick(() => inputRef.value && inputRef.value.focus());
            }
        };

        const selectItem = (val) => {
            emit('update:modelValue', val);
            emit('change', val);
            isOpen.value = false;
            search.value = '';
        };

        const handleClickOutside = (e) => {
            if (containerRef.value && !containerRef.value.contains(e.target)) {
                isOpen.value = false;
            }
        };

        onMounted(() => document.addEventListener('click', handleClickOutside));
        onUnmounted(() => document.removeEventListener('click', handleClickOutside));

        return {
            isOpen, search, containerRef, inputRef, selectedLabel, filteredList,
            toggleDropdown, selectItem
        };
    },
    template: `
    <div ref="containerRef" class="relative w-full">
        <button type="button" @click="toggleDropdown" :disabled="disabled || loading"
            class="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-left flex items-center justify-between transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
            <span class="truncate" :class="modelValue ? 'text-slate-900 font-medium' : 'text-slate-500'">
                {{ loading ? 'Đang nạp dữ liệu...' : selectedLabel }}
            </span>
            <span class="text-slate-400 text-[10px] ml-1 flex-shrink-0">▼</span>
        </button>

        <div v-if="isOpen" class="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
            <div class="p-1.5 border-b border-slate-100 bg-slate-50">
                <input ref="inputRef" v-model="search" type="text" placeholder="Gõ để tìm nhanh..."
                    class="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            </div>
            <div class="overflow-y-auto max-h-48 py-1 text-xs divide-y divide-slate-50">
                <div v-if="allLabel" @click="selectItem('')"
                    class="px-3 py-1.5 hover:bg-indigo-50 cursor-pointer font-semibold text-indigo-700 flex items-center justify-between"
                    :class="{ 'bg-indigo-50': !modelValue }">
                    <span>{{ allLabel }}</span>
                    <span v-if="!modelValue" class="text-indigo-600 font-bold">✓</span>
                </div>
                <div v-if="filteredList.length === 0" class="px-3 py-2 text-center text-slate-400 italic">
                    Không tìm thấy kết quả
                </div>
                <div v-for="item in filteredList" :key="item.value" @click="selectItem(item.value)"
                    class="px-3 py-1.5 hover:bg-slate-100 cursor-pointer text-slate-800 flex items-center justify-between"
                    :class="{ 'bg-indigo-50 font-medium text-indigo-700': String(modelValue) === String(item.value) }">
                    <span class="truncate">{{ item.label }}</span>
                    <span v-if="String(modelValue) === String(item.value)" class="text-indigo-600 font-bold text-xs">✓</span>
                </div>
            </div>
        </div>
    </div>
    `
};

window.SearchableCombobox = SearchableCombobox;
