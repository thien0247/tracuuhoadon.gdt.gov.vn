/**
 * crawler-grid.js - Component hiển thị các tỉnh thành dưới dạng Lưới Thẻ (Card Grid).
 */

const CrawlerGrid = {
    props: {
        provinces: { type: Array, required: true }
    },
    emits: ['start-prov', 'pause-prov', 'stop-prov'],
    setup(props) {
        const formatNumber = (n) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

        const selectTinMax = (prov, status) => {
            if (status.tin_max && !status.running) {
                prov.seed_tin = status.tin_max;
                prov.scan_mode = 'newest';
                prov.gap = 100;
                prov.num_workers = 1;
            }
        };

        const startNewest = (emit, item) => {
            selectTinMax(item.prov, item.status);
            emit('start-prov', item.key);
        };

        return { formatNumber, selectTinMax, startNewest };
    },
    template: `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="item in provinces" :key="item.key"
            class="bg-white rounded-2xl p-5 shadow-sm border transition-all space-y-4 flex flex-col justify-between"
            :class="item.status.running ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-slate-200'">

            <!-- Card Header -->
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                    <h2 class="text-base font-bold text-slate-900">{{ item.key }}</h2>
                    <p class="text-xs text-slate-400 font-mono">DB: {{ formatNumber(item.status.db_count) }} bản ghi</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5"
                    :class="item.status.running ? (item.status.paused ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200') : 'bg-slate-100 text-slate-500 border-slate-200'">
                    <span class="w-2 h-2 rounded-full"
                        :class="item.status.running ? (item.status.paused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-slate-400'"></span>
                    {{ item.status.running ? (item.status.paused ? 'Tạm dừng' : 'Đang chạy') : 'Đã dừng' }}
                </span>
            </div>

            <!-- Form Cấu hình Quét -->
            <div class="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">Chế độ quét:</label>
                    <select v-model="item.prov.scan_mode" :disabled="item.status.running"
                        class="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 disabled:opacity-60">
                        <option value="bidirectional">▶ 2 Chiều Song Song</option>
                        <option value="edges">▶ Mở Rộng Biên DB (Max/Min)</option>
                        <option value="newest">▶ Quét Mới Nhất (Tăng từ Max)</option>
                        <option value="gap_fill">🧩 Quét Lấp Lỗ Hổng (Gap-Fill)</option>
                        <option value="down_from_min">▼ Quét Xuống từ Min</option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-1">Seed TIN:</label>
                        <input type="text" v-model="item.prov.seed_tin" :disabled="item.status.running"
                            class="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono text-slate-800 disabled:opacity-60">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-slate-600 mb-1">Gap rỗng:</label>
                        <input type="number" v-model.number="item.prov.gap" :disabled="item.status.running"
                            class="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 disabled:opacity-60">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1">Số luồng (Workers):</label>
                    <select v-model.number="item.prov.num_workers" :disabled="item.status.running"
                        class="w-full bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 disabled:opacity-60">
                        <option :value="5">5 luồng / chiều (10 tổng)</option>
                        <option :value="4">4 luồng / chiều (8 tổng)</option>
                        <option :value="3">3 luồng / chiều (6 tổng)</option>
                        <option :value="2">2 luồng / chiều (4 tổng)</option>
                        <option :value="1">1 luồng / chiều (2 tổng)</option>
                    </select>
                </div>
            </div>

            <!-- Thống kê Live -->
            <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span class="text-slate-400">Đã Quét:</span>
                    <span class="font-bold text-slate-800 float-right font-mono">{{ formatNumber(item.status.queried) }}</span>
                </div>
                <div class="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span class="text-slate-400">Tìm Thấy:</span>
                    <span class="font-bold text-emerald-600 float-right font-mono">{{ formatNumber(item.status.found) }}</span>
                </div>
                <div class="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span class="text-slate-400">Tốc Độ:</span>
                    <span class="font-bold text-indigo-600 float-right font-mono">{{ item.status.speed || 0 }} req/s</span>
                </div>
                <div class="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span class="text-slate-400">Thời Gian:</span>
                    <span class="font-bold text-slate-700 float-right font-mono">{{ item.status.uptime || '00:00:00' }}</span>
                </div>
            </div>

            <!-- TIN Min / TIN Max -->
            <div v-if="item.status.tin_min || item.status.tin_max" class="grid grid-cols-2 gap-2 text-xs">
                <div class="bg-blue-50 p-2 rounded-lg border border-blue-100">
                    <span class="text-blue-400 font-semibold block text-[10px] uppercase tracking-wide mb-0.5">TIN Min</span>
                    <span class="font-bold text-blue-700 font-mono text-[11px]">{{ item.status.tin_min || '—' }}</span>
                </div>
                <div class="bg-purple-50 p-2 rounded-lg border border-purple-100 cursor-pointer hover:bg-purple-100/80 transition-colors"
                    title="Nhấp để chọn làm Seed TIN và chuyển sang Quét Mới Nhất"
                    @click="selectTinMax(item.prov, item.status)">
                    <span class="text-purple-400 font-semibold block text-[10px] uppercase tracking-wide mb-0.5 flex items-center justify-between">
                        <span>TIN Max</span>
                        <span class="text-[9px] bg-purple-200/60 text-purple-700 px-1 rounded font-normal">Dùng ↗</span>
                    </span>
                    <span class="font-bold text-purple-700 font-mono text-[11px]">{{ item.status.tin_max || '—' }}</span>
                </div>
            </div>

            <!-- Nút điều khiển -->
            <div class="flex items-center gap-2 pt-2">
                <button @click="$emit('start-prov', item.key)"
                    :disabled="item.status.running && !item.status.paused"
                    class="flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white shadow-sm transition-all disabled:opacity-40"
                    :class="item.status.running ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-500'">
                    ▶ Start
                </button>
                <button @click="startNewest($emit, item)"
                    :disabled="item.status.running && !item.status.paused"
                    title="Quét MST mới tăng dần từ TIN Max"
                    class="py-2 px-2.5 rounded-xl font-bold text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 shadow-sm transition-all disabled:opacity-40 flex items-center gap-1">
                    ⚡ Max
                </button>
                <button @click="$emit('pause-prov', item.key)" :disabled="!item.status.running"
                    class="py-2 px-3 rounded-xl font-bold text-xs text-white shadow-sm transition-all disabled:opacity-40"
                    :class="item.status.paused ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-amber-500 hover:bg-amber-400'">
                    {{ item.status.paused ? '▶ Resume' : '⏸ Pause' }}
                </button>
                <button @click="$emit('stop-prov', item.key)" :disabled="!item.status.running"
                    class="py-2 px-3 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 shadow-sm transition-all disabled:opacity-40">
                    ⏹ Stop
                </button>
            </div>
        </div>
    </div>
    `
};

window.CrawlerGrid = CrawlerGrid;
