/**
 * bocao-scan-panel.js - Panel quét bổ sung MST Bố Cáo chưa có trong Thuế GDT.
 * Dùng scan_mode='gap_fill' + Rolling Queue Pool, poll trạng thái mỗi 3s.
 */
const BocaoScanPanel = {
    name: 'BocaoScanPanel',
    emits: ['scan-done'],
    setup(props, { emit }) {
        const { ref, onUnmounted } = Vue;
        const scanning = ref(false), gap = ref(20), workers = ref(1), maxConcurrent = ref(2);
        const result = ref(null), queueStatus = ref(null), logs = ref([]);
        let pollTimer = null;

        const addLog = (msg, type = 'info') => {
            const t = new Date().toLocaleTimeString('vi-VN', { hour12: false });
            logs.value.unshift({ t, msg, type });
            if (logs.value.length > 30) logs.value.pop();
        };

        const stopPoll = () => { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } };

        const pollQueue = async () => {
            try {
                const s = await ApiClient.getQueueStatus();
                queueStatus.value = s;
                if (!s.is_running && s.pending_count === 0) {
                    stopPoll();
                    scanning.value = false;
                    addLog('✅ Hàng đợi quét đã hoàn thành. Làm mới thống kê...', 'success');
                    emit('scan-done');
                }
            } catch (e) { /* ignore poll errors */ }
        };

        const startScan = async () => {
            if (scanning.value) return;
            scanning.value = true;
            result.value = null;
            addLog(`Đang khởi động Gap-Fill Scan (gap=${gap.value}, workers=${workers.value}, concurrent=${maxConcurrent.value})...`);
            try {
                const res = await ApiClient.startBocaoGapFillScan({
                    gap: gap.value, num_workers: workers.value, max_concurrent: maxConcurrent.value
                });
                result.value = res;
                if (res.status === 'nothing_to_scan') {
                    addLog('ℹ️ Không có MST Bố Cáo nào cần quét bổ sung.', 'info');
                    scanning.value = false;
                } else {
                    addLog(`⚡ Đã xếp hàng ${res.queued} tỉnh vào Rolling Queue (max ${res.max_concurrent} song song).`, 'success');
                    pollTimer = setInterval(pollQueue, 3000);
                }
            } catch (e) {
                addLog(`❌ Lỗi khởi động scan: ${e.message || e}`, 'error');
                scanning.value = false;
            }
        };

        const stopScan = async () => {
            stopPoll();
            try { await ApiClient.stopAllCrawlers(); } catch (_) {}
            scanning.value = false;
            addLog('⏹ Đã yêu cầu dừng tất cả crawler.', 'warning');
        };

        const clearLogs = () => { logs.value = []; };
        onUnmounted(stopPoll);

        return {
            scanning, gap, workers, maxConcurrent, result, queueStatus, logs,
            startScan, stopScan, clearLogs
        };
    },
    template: `
    <div class="bg-indigo-50/60 rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-200 space-y-3">
        <!-- Header -->
        <div class="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-100 pb-2">
            <div class="flex items-center gap-2">
                <span class="text-xl">🔍</span>
                <div>
                    <h3 class="text-sm font-bold text-indigo-900">Quét Bổ Sung MST Vào Thuế GDT</h3>
                    <p class="text-[11px] text-indigo-600">Dùng Gap-Fill Scan để tra từng MST Bố Cáo chưa có trong tax_records</p>
                </div>
            </div>
            <div class="flex items-center gap-1.5">
                <button v-if="!scanning" @click="startScan"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-sm transition flex items-center gap-1.5">
                    <span>⚡</span><span>Bắt Đầu Quét Bổ Sung</span>
                </button>
                <button v-else @click="stopScan"
                    class="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1.5 px-4 rounded-lg shadow-sm transition flex items-center gap-1.5">
                    <span class="animate-spin">⏳</span><span>Đang Quét — Dừng</span>
                </button>
            </div>
        </div>

        <!-- Tham Số Cấu Hình -->
        <div class="flex flex-wrap items-end gap-3 text-xs">
            <div>
                <label class="block text-[10px] font-bold text-indigo-700 mb-0.5 uppercase">Gap (MST/lần)</label>
                <input type="number" v-model.number="gap" min="5" max="200" :disabled="scanning"
                    class="w-20 bg-white border border-indigo-300 rounded-lg px-2 py-1 text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-indigo-700 mb-0.5 uppercase">Workers/Tỉnh</label>
                <select v-model.number="workers" :disabled="scanning"
                    class="w-20 bg-white border border-indigo-300 rounded-lg px-2 py-1 text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                    <option :value="1">1</option><option :value="2">2</option>
                </select>
            </div>
            <div>
                <label class="block text-[10px] font-bold text-indigo-700 mb-0.5 uppercase">Tỉnh Song Song</label>
                <select v-model.number="maxConcurrent" :disabled="scanning"
                    class="w-20 bg-white border border-indigo-300 rounded-lg px-2 py-1 text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                    <option :value="1">1</option><option :value="2">2 ★</option><option :value="3">3</option>
                </select>
            </div>
            <!-- Queue Status Badge -->
            <div v-if="queueStatus" class="ml-auto flex items-center gap-2 text-[11px]">
                <span class="px-2 py-0.5 rounded-full font-bold"
                    :class="queueStatus.is_running ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-slate-100 text-slate-600'">
                    {{ queueStatus.is_running ? '🟢 Đang Quét' : '⚪ Idle' }}
                </span>
                <span class="text-slate-500">Hàng đợi: <b>{{ queueStatus.pending_count || 0 }}</b> tỉnh</span>
            </div>
        </div>

        <!-- Kết Quả Khởi Động -->
        <div v-if="result" class="p-2.5 rounded-xl text-xs font-medium"
            :class="result.status === 'scan_queued' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-slate-50 border border-slate-200 text-slate-600'">
            <template v-if="result.status === 'scan_queued'">
                ✅ Đã xếp hàng <b>{{ result.total_provinces }}</b> tỉnh có MST chưa khớp vào Rolling Queue
                (max <b>{{ result.max_concurrent }}</b> tỉnh song song, gap=<b>{{ result.gap }}</b>).
            </template>
            <template v-else>ℹ️ Không có MST Bố Cáo nào cần quét bổ sung.</template>
        </div>

        <!-- Activity Logs -->
        <div v-if="logs.length > 0" class="space-y-1">
            <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold text-indigo-700 uppercase">Nhật Ký Hoạt Động</span>
                <button @click="clearLogs" class="text-[10px] text-slate-400 hover:text-red-500 transition">Xóa</button>
            </div>
            <div class="max-h-28 overflow-y-auto space-y-0.5">
                <div v-for="(l, i) in logs" :key="i" class="flex items-start gap-1.5 text-[10px]">
                    <span class="text-slate-400 font-mono shrink-0">{{ l.t }}</span>
                    <span :class="l.type === 'error' ? 'text-red-600' : l.type === 'success' ? 'text-emerald-700' : l.type === 'warning' ? 'text-amber-700' : 'text-slate-600'">{{ l.msg }}</span>
                </div>
            </div>
        </div>
    </div>
    `
};

window.BocaoScanPanel = BocaoScanPanel;
