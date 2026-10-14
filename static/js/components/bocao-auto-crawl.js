/**
 * bocao-auto-crawl.js - Panel quản lý và kích hoạt tự động cào Bố Cáo ĐKKD định kỳ.
 * Hỗ trợ tùy chỉnh chu kỳ (mặc định 2h), start/stop, đếm ngược và nhật ký (logs).
 */
const BocaoAutoCrawl = {
    name: 'BocaoAutoCrawl',
    emits: ['crawled'],
    setup(props, { emit }) {
        const { ref, computed, onMounted, onUnmounted } = Vue;
        const isRunning = ref(localStorage.getItem('bocao_auto_running') === 'true');
        const intervalHours = ref(Number(localStorage.getItem('bocao_auto_interval')) || 2);
        const maxPages = ref(Number(localStorage.getItem('bocao_auto_pages')) || 5);
        const crawlingNow = ref(false), showLogs = ref(false);
        const lastRunTime = ref(localStorage.getItem('bocao_auto_last_run') || '');
        const nextRunCountdown = ref('--:--:--');
        const logs = ref(JSON.parse(localStorage.getItem('bocao_auto_logs') || '[]'));
        let timerId = null;

        const addLog = (msg, type = 'info') => {
            const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
            logs.value.unshift({ time, msg, type });
            if (logs.value.length > 50) logs.value.pop();
            localStorage.setItem('bocao_auto_logs', JSON.stringify(logs.value));
        };

        const executeCrawl = async (isManual = false) => {
            if (crawlingNow.value) return;
            crawlingNow.value = true;
            addLog(`Bắt đầu ${isManual ? 'cào thủ công' : 'tự động cào'} ${maxPages.value} trang...`, 'info');
            try {
                const res = await ApiClient.crawlAllBocao(maxPages.value);
                if (res.success) {
                    addLog(`Thành công: Cào ${res.pages_crawled} trang, ${res.total_found} tin (Mới: ${res.new_inserted}).`, 'success');
                    emit('crawled', res);
                } else {
                    addLog(`Thất bại: ${res.error || 'Không rõ nguyên nhân'}`, 'error');
                }
            } catch (e) {
                addLog(`Lỗi kết nối: ${e.message || e}`, 'error');
            } finally {
                crawlingNow.value = false;
                lastRunTime.value = new Date().toLocaleString('vi-VN');
                localStorage.setItem('bocao_auto_last_run', lastRunTime.value);
                localStorage.setItem('bocao_auto_next_ts', String(Date.now() + intervalHours.value * 3600 * 1000));
            }
        };

        const tick = () => {
            if (!isRunning.value) { nextRunCountdown.value = '--:--:--'; return; }
            let nextTs = Number(localStorage.getItem('bocao_auto_next_ts') || '0');
            const now = Date.now();
            if (!nextTs || nextTs <= now) { executeCrawl(false); return; }
            const diffSec = Math.max(0, Math.floor((nextTs - now) / 1000));
            const h = String(Math.floor(diffSec / 3600)).padStart(2, '0');
            const m = String(Math.floor((diffSec % 3600) / 60)).padStart(2, '0');
            const s = String(diffSec % 60).padStart(2, '0');
            nextRunCountdown.value = `${h}:${m}:${s}`;
        };

        const toggleAutoCrawl = () => {
            isRunning.value = !isRunning.value;
            localStorage.setItem('bocao_auto_running', String(isRunning.value));
            if (isRunning.value) {
                localStorage.setItem('bocao_auto_next_ts', String(Date.now() + intervalHours.value * 3600 * 1000));
                addLog(`Đã kích hoạt Auto Crawl mỗi ${intervalHours.value}h (${maxPages.value} trang/lần).`, 'info');
            } else { addLog('Đã tạm dừng Auto Crawl.', 'warning'); }
        };

        const onIntervalChange = () => {
            localStorage.setItem('bocao_auto_interval', String(intervalHours.value));
            if (isRunning.value) {
                localStorage.setItem('bocao_auto_next_ts', String(Date.now() + intervalHours.value * 3600 * 1000));
                addLog(`Đổi chu kỳ Auto Crawl thành mỗi ${intervalHours.value}h.`, 'info');
            }
        };

        const clearLogs = () => { logs.value = []; localStorage.removeItem('bocao_auto_logs'); };

        onMounted(() => { timerId = setInterval(tick, 1000); tick(); });
        onUnmounted(() => { if (timerId) clearInterval(timerId); });

        return {
            isRunning, intervalHours, maxPages, crawlingNow, showLogs, lastRunTime,
            nextRunCountdown, logs, toggleAutoCrawl, onIntervalChange, executeCrawl, clearLogs
        };
    },
    template: `
    <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3">
        <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2">
            <div class="flex items-center gap-2">
                <span class="text-xl">⏰</span>
                <div>
                    <h2 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Tự Động Cào Bố Cáo Định Kỳ</span>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                              :class="isRunning ? 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse' : 'bg-slate-100 text-slate-600 border-slate-200'">
                            {{ isRunning ? (crawlingNow ? '⏳ Đang cào dữ liệu...' : '● Đang chạy') : '○ Đã tạm dừng' }}
                        </span>
                    </h2>
                    <p class="text-[11px] text-slate-500">Lập lịch tự động cào tin mới từ Cổng Bố cáo Quốc gia để làm giàu CSDL</p>
                </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
                <button @click="toggleAutoCrawl"
                    class="text-xs font-bold py-1.5 px-3.5 rounded-lg shadow-sm transition flex items-center gap-1.5"
                    :class="isRunning ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'">
                    <span>{{ isRunning ? '⏹ Tắt Auto' : '▶ Bật Auto Crawl' }}</span>
                </button>
                <button @click="executeCrawl(true)" :disabled="crawlingNow"
                    class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1">
                    <span>{{ crawlingNow ? '⏳' : '⚡' }} Cào Ngay</span>
                </button>
                <button @click="showLogs = !showLogs"
                    class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 transition">
                    📋 Nhật ký ({{ logs.length }})
                </button>
            </div>
        </div>

        <!-- Cấu hình tham số & Đồng hồ đếm ngược -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span class="text-slate-600 font-medium">Chu kỳ cào:</span>
                <select v-model.number="intervalHours" @change="onIntervalChange" :disabled="crawlingNow"
                    class="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-indigo-700 focus:ring-1 focus:ring-indigo-500">
                    <option :value="0.5">Mỗi 30 phút</option>
                    <option :value="1">Mỗi 1 giờ</option>
                    <option :value="2">Mỗi 2 giờ (Chuẩn)</option>
                    <option :value="4">Mỗi 4 giờ</option>
                    <option :value="6">Mỗi 6 giờ</option>
                    <option :value="12">Mỗi 12 giờ</option>
                </select>
            </div>
            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span class="text-slate-600 font-medium">Số trang cào:</span>
                <select v-model.number="maxPages" :disabled="crawlingNow"
                    class="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-indigo-500">
                    <option :value="3">3 trang (~60 tin)</option>
                    <option :value="5">5 trang (~100 tin)</option>
                    <option :value="10">10 trang (~200 tin)</option>
                    <option :value="20">20 trang (~400 tin)</option>
                </select>
            </div>
            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Lần cào kế tiếp</div>
                <div class="text-sm font-black font-mono" :class="isRunning ? 'text-indigo-600' : 'text-slate-400'">
                    {{ isRunning ? nextRunCountdown : 'Chưa kích hoạt' }}
                </div>
            </div>
            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div class="text-[10px] text-slate-400 font-bold uppercase">Lần cào gần nhất</div>
                <div class="text-xs font-bold text-slate-700 font-mono truncate">{{ lastRunTime || 'Chưa có lượt chạy' }}</div>
            </div>
        </div>

        <!-- Bảng Nhật Ký Logs Rút Gọn -->
        <div v-if="showLogs" class="bg-slate-900 rounded-xl p-3 text-xs text-slate-200 space-y-2 border border-slate-800">
            <div class="flex items-center justify-between border-b border-slate-800 pb-1.5 text-[11px] text-slate-400">
                <span class="font-bold">Nhật ký hoạt động Auto Crawl (50 sự kiện gần nhất)</span>
                <button @click="clearLogs" class="text-rose-400 hover:text-rose-300 transition">🧹 Xóa nhật ký</button>
            </div>
            <div class="max-h-36 overflow-y-auto space-y-1 font-mono text-[11px]">
                <div v-if="logs.length === 0" class="text-slate-500 italic py-2 text-center">Chưa có lịch sử chạy.</div>
                <div v-for="(log, i) in logs" :key="i" class="flex items-start gap-2">
                    <span class="text-slate-500 shrink-0">[{{ log.time }}]</span>
                    <span :class="log.type === 'success' ? 'text-emerald-400' : (log.type === 'error' ? 'text-rose-400' : (log.type === 'warning' ? 'text-amber-400' : 'text-sky-300'))">
                        {{ log.msg }}
                    </span>
                </div>
            </div>
        </div>
    </div>
    `
};

window.BocaoAutoCrawl = BocaoAutoCrawl;
