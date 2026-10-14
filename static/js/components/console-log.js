/**
 * console-log.js - Component hiển thị khung Terminal Console Log thời gian thực.
 */

const ConsoleLog = {
    props: {
        logs: { type: Array, required: true },
        autoScroll: { type: Boolean, default: true }
    },
    emits: ['clear-logs', 'update:autoScroll'],
    setup(props) {
        const { ref, watch, nextTick } = Vue;
        const logContainer = ref(null);

        watch(() => props.logs.length, () => {
            if (props.autoScroll) {
                nextTick(() => {
                    if (logContainer.value) {
                        logContainer.value.scrollTop = logContainer.value.scrollHeight;
                    }
                });
            }
        });

        return { logContainer };
    },
    template: `
    <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-3">
        <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-slate-800">📋 Nhật Ký Đa Tỉnh Real-time (Console Log)</span>
            <div class="flex items-center gap-3">
                <label class="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600">
                    <input type="checkbox" :checked="autoScroll" @change="$emit('update:autoScroll', $event.target.checked)"
                        class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500">
                    Tự động cuộn
                </label>
                <button @click="$emit('clear-logs')"
                    class="text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg transition-all">
                    Xóa Log
                </button>
            </div>
        </div>

        <div ref="logContainer"
            class="bg-slate-900 text-slate-100 font-mono text-xs p-4 rounded-xl h-60 overflow-y-auto space-y-1 shadow-inner">
            <div v-if="logs.length === 0" class="text-slate-500 italic">Chưa có dữ liệu log...</div>
            <div v-for="(log, idx) in logs" :key="idx"
                :class="log.includes('FOUND') ? 'text-emerald-400 font-semibold' : log.includes('WARNING') ? 'text-amber-300' : log.includes('ERROR') ? 'text-rose-400' : 'text-slate-300'">
                {{ log }}
            </div>
        </div>
    </div>
    `
};

window.ConsoleLog = ConsoleLog;
