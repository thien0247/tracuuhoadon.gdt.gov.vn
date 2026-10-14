/**
 * crawler-bocao-modal.js - Modal điều khiển crawl theo danh sách Mã Số Doanh Nghiệp Bố Cáo ĐKKD.
 * Hỗ trợ 2 chế độ: Quét trực tiếp danh sách MST (Radar Direct) & Quét cuốn chiếu đa tỉnh (Gap-Fill Queue).
 */
const CrawlerBocaoModal = {
    name: 'CrawlerBocaoModal',
    props: { visible: { type: Boolean, default: false } },
    emits: ['close', 'sync-complete'],
    setup(props, { emit }) {
        const { ref, watch, onUnmounted } = Vue;
        const stats = ref({ total_bocao: 0, matched_count: 0, unmatched_count: 0, retry_later_count: 0, match_rate: 0 });
        const loadingStats = ref(false), scanning = ref(false), scanMode = ref('direct');
        const batchSize = ref(60), gap = ref(20), maxConcurrent = ref(2), logs = ref([]);
        let pollTimer = null;

        const addLog = (msg, type = 'info') => {
            const t = new Date().toLocaleTimeString('vi-VN', { hour12: false });
            logs.value.unshift({ t, msg, type });
            if (logs.value.length > 25) logs.value.pop();
        };

        const loadStats = async () => {
            loadingStats.value = true;
            try { stats.value = await ApiClient.getBocaoReconcileStats(); }
            catch (e) { addLog('Không thể tải thống kê: ' + (e.message || e), 'error'); }
            finally { loadingStats.value = false; }
        };

        const stopPoll = () => { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } };

        const startScan = async () => {
            if (scanning.value) return;
            scanning.value = true;
            if (scanMode.value === 'direct') {
                addLog(`⚡ Bắt đầu quét trực tiếp ${batchSize.value} MST từ Bố Cáo...`, 'info');
                try {
                    const res = await ApiClient.syncMissingBocao(batchSize.value);
                    addLog(res.message || `Quét xong: nạp mới ${res.synced_now || 0}, hẹn lại ${res.retry_later || 0}`, 'success');
                    await loadStats(); emit('sync-complete');
                } catch (e) { addLog('❌ Lỗi: ' + (e.message || e), 'error'); }
                finally { scanning.value = false; }
            } else {
                addLog(`🚀 Bắt đầu Gap-Fill (gap=${gap.value}, song song=${maxConcurrent.value} tỉnh)...`, 'info');
                try {
                    const res = await ApiClient.startBocaoGapFillScan({ gap: gap.value, max_concurrent: maxConcurrent.value });
                    if (res.status === 'nothing_to_scan') {
                        addLog('ℹ️ Toàn bộ MST Bố Cáo đã có trong Thuế.', 'info');
                        scanning.value = false;
                    } else {
                        addLog(`⚡ Đã xếp ${res.queued} tỉnh vào Rolling Queue Pool.`, 'success');
                        pollTimer = setInterval(async () => {
                            try {
                                const q = await ApiClient.getQueueStatus();
                                if (!q.is_running && q.pending_count === 0) {
                                    stopPoll(); scanning.value = false;
                                    addLog('✅ Hàng đợi quét đã hoàn thành.', 'success');
                                    await loadStats(); emit('sync-complete');
                                }
                            } catch (_) {}
                        }, 3000);
                    }
                } catch (e) { addLog('❌ Lỗi: ' + (e.message || e), 'error'); scanning.value = false; }
            }
        };

        const stopScan = async () => {
            stopPoll();
            try { await ApiClient.stopAllCrawlers(); } catch (_) {}
            scanning.value = false; addLog('⏹ Đã gửi lệnh dừng tiến trình.', 'warning');
        };

        watch(() => props.visible, (v) => { if (v) { loadStats(); } else { stopPoll(); } });
        onUnmounted(stopPoll);

        return {
            stats, loadingStats, scanning, scanMode, batchSize, gap, maxConcurrent, logs,
            startScan, stopScan, loadStats, close: () => emit('close')
        };
    },
    template: `
    <div v-if="visible" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-4 sm:p-5 space-y-3.5 text-slate-800">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div class="flex items-center gap-2">
                    <span class="text-2xl">📰</span>
                    <div>
                        <h3 class="text-sm font-bold text-slate-900">Quét Bổ Sung Theo Bố Cáo ĐKKD</h3>
                        <p class="text-[11px] text-slate-500">Tra cứu Mã Số Doanh Nghiệp công bố mới nhưng chưa có trong CSDL Thuế</p>
                    </div>
                </div>
                <button @click="close" class="text-slate-400 hover:text-slate-700 text-lg w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center">✕</button>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center text-xs">
                <div class="bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <div class="text-[10px] uppercase font-bold text-slate-400">Tổng Bố Cáo</div>
                    <div class="text-base font-extrabold text-slate-800 font-mono">{{ stats.total_bocao || 0 }}</div>
                </div>
                <div class="bg-blue-50 p-2 rounded-xl border border-blue-200">
                    <div class="text-[10px] uppercase font-bold text-blue-600">Chờ Quét Bù</div>
                    <div class="text-base font-extrabold text-blue-700 font-mono">{{ (stats.retry_later_count || 0) + (stats.unmatched_count || 0) }}</div>
                </div>
                <div class="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                    <div class="text-[10px] uppercase font-bold text-emerald-600">Tỷ Lệ Đã Có</div>
                    <div class="text-base font-extrabold text-emerald-700 font-mono">{{ stats.match_rate || 0 }}%</div>
                </div>
            </div>
            <div class="space-y-1.5">
                <label class="text-[10px] font-bold text-slate-600 uppercase">Chế Độ Quét</label>
                <div class="grid grid-cols-2 gap-2 text-xs">
                    <button type="button" @click="scanMode = 'direct'" :disabled="scanning" class="p-2 rounded-xl border text-left transition flex flex-col gap-0.5"
                        :class="scanMode === 'direct' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold' : 'border-slate-200 text-slate-600'">
                        <span class="font-bold">🎯 Quét Trực Tiếp MST</span><span class="text-[10px] text-slate-500">Tra cứu danh sách cụ thể từng MST</span>
                    </button>
                    <button type="button" @click="scanMode = 'gap_fill'" :disabled="scanning" class="p-2 rounded-xl border text-left transition flex flex-col gap-0.5"
                        :class="scanMode === 'gap_fill' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold' : 'border-slate-200 text-slate-600'">
                        <span class="font-bold">🔄 Quét Cuốn Chiếu</span><span class="text-[10px] text-slate-500">Rolling Queue Pool đa tỉnh thành</span>
                    </button>
                </div>
            </div>
            <div class="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                <template v-if="scanMode === 'direct'">
                    <span class="text-slate-600 font-medium">Số MST quét:</span>
                    <input type="number" v-model.number="batchSize" min="10" max="200" step="10" :disabled="scanning" class="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-bold font-mono">
                    <span class="text-[10px] text-slate-400">(Tối đa 200 MST/lần)</span>
                </template>
                <template v-else>
                    <div class="flex items-center gap-1"><span class="text-slate-600">Gap:</span><input type="number" v-model.number="gap" min="5" max="100" :disabled="scanning" class="w-14 bg-white border border-slate-300 rounded-lg px-1 py-1 text-center font-bold font-mono"></div>
                    <div class="flex items-center gap-1 ml-auto"><span class="text-slate-600">Song song:</span><select v-model.number="maxConcurrent" :disabled="scanning" class="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-indigo-600"><option :value="1">1 tỉnh</option><option :value="2">2 tỉnh</option><option :value="3">3 tỉnh</option></select></div>
                </template>
            </div>
            <div v-if="logs.length > 0" class="bg-slate-900 rounded-xl p-2.5 text-[10px] font-mono text-slate-300 max-h-24 overflow-y-auto space-y-1">
                <div v-for="(l, idx) in logs" :key="idx" class="flex gap-1.5 leading-tight">
                    <span class="text-slate-500 shrink-0">[{{ l.t }}]</span><span :class="l.type === 'error' ? 'text-rose-400' : l.type === 'success' ? 'text-emerald-400' : l.type === 'warning' ? 'text-amber-400' : 'text-slate-200'">{{ l.msg }}</span>
                </div>
            </div>
            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
                <button @click="close" class="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold transition">Đóng</button>
                <button v-if="!scanning" @click="startScan" class="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"><span>⚡ Bắt Đầu Quét</span></button>
                <button v-else @click="stopScan" class="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"><span class="animate-spin">⏳</span><span>Dừng Quét</span></button>
            </div>
        </div>
    </div>`
};

window.CrawlerBocaoModal = CrawlerBocaoModal;
