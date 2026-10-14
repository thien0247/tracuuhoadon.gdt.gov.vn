/**
 * health-report-tab.js - Giám sát TIN Max & Ngày Đăng Ký mới nhất 62 tỉnh (phạm vi N ngày).
 */

const HealthReportTab = {
    props: {
        reportData: { type: Object, default: () => ({ summary: {}, provinces: [] }) },
        loading: { type: Boolean, default: false }
    },
    emits: ['refresh', 'scan-province'],
    setup(props, { emit }) {
        const { ref, computed } = Vue;

        const selectedDays = ref(3);
        const statusFilter = ref('all');
        const hasNewFilter = ref('all');
        const sortBy = ref('days_desc');
        const searchQuery = ref('');
        const scanningKey = ref('');

        const summary = computed(() => props.reportData?.summary || { total: 0, healthy: 0, warning: 0, stalled: 0 });

        const statusCards = computed(() => [
            { key: 'all', label: 'Tổng Số Tỉnh Thành', val: summary.value.total || 62, icon: '🏢', border: 'border-slate-200', text: 'text-slate-800' },
            { key: 'healthy', label: `Bình Thường (≤ ${selectedDays.value} ngày)`, val: summary.value.healthy || 0, icon: '🟢', border: 'border-emerald-200', text: 'text-emerald-700' },
            { key: 'warning', label: 'Cần Chú Ý (4 - 7 ngày)', val: summary.value.warning || 0, icon: '🟡', border: 'border-amber-200', text: 'text-amber-700' },
            { key: 'stalled', label: 'Cảnh Báo Tắc Nghẽn (> 7 ngày)', val: summary.value.stalled || 0, icon: '🔴', border: 'border-rose-200', text: 'text-rose-700' }
        ]);

        const filteredProvinces = computed(() => {
            let list = (props.reportData?.provinces || []).slice();
            const q = searchQuery.value.trim().toLowerCase();
            if (q) list = list.filter(p => p.province.toLowerCase().includes(q) || p.prefix.includes(q));
            if (statusFilter.value !== 'all') list = list.filter(p => p.status === statusFilter.value);
            if (hasNewFilter.value === 'has_new') list = list.filter(p => (p.new_records_in_range || 0) > 0);
            if (hasNewFilter.value === 'no_new') list = list.filter(p => (p.new_records_in_range || 0) === 0);

            list.sort((a, b) => {
                if (sortBy.value === 'days_desc') return ((b.days_diff ?? 9999) - (a.days_diff ?? 9999));
                if (sortBy.value === 'new_desc') return (b.new_records_in_range || 0) - (a.new_records_in_range || 0);
                if (sortBy.value === 'prefix_asc') return a.prefix.localeCompare(b.prefix);
                return a.province.localeCompare(b.province);
            });
            return list;
        });

        const resetFilters = () => { statusFilter.value = 'all'; hasNewFilter.value = 'all'; sortBy.value = 'days_desc'; searchQuery.value = ''; };
        const triggerScan = (provName) => { scanningKey.value = provName; emit('scan-province', provName); setTimeout(() => { scanningKey.value = ''; }, 1500); };
        const changeDays = (days) => { selectedDays.value = days; emit('refresh', days); };
        const openDetail = (tin) => { if (window.openTaxDetail) window.openTaxDetail(tin); };

        return {
            selectedDays, statusFilter, hasNewFilter, sortBy, searchQuery, scanningKey,
            summary, statusCards, filteredProvinces, resetFilters, triggerScan, changeDays, openDetail
        };
    },
    template: `
    <div class="space-y-6">
        <!-- 1. Thẻ tổng quan 4 trạng thái -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div v-for="c in statusCards" :key="c.key" @click="statusFilter = c.key"
                :class="[c.border, statusFilter === c.key ? 'ring-2 ring-indigo-500 shadow' : '']"
                class="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition">
                <div><div class="text-xs font-medium text-slate-500">{{ c.label }}</div><div class="text-2xl font-bold" :class="c.text">{{ c.val }}</div></div>
                <div class="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-lg">{{ c.icon }}</div>
            </div>
        </div>

        <!-- 2. Hàng điều khiển Bộ lọc Nâng Cao (Filter Bar) -->
        <div class="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap items-center gap-2.5">
                    <div class="relative">
                        <input v-model="searchQuery" type="text" placeholder="Tìm tên tỉnh, tiền tố..."
                            class="px-3 py-1.5 pl-8 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-44">
                        <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                    </div>

                    <div class="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                        <button @click="statusFilter = 'all'" :class="statusFilter === 'all' ? 'bg-white shadow text-slate-800' : 'text-slate-500'" class="px-2 py-1 rounded">Tất Cả</button>
                        <button @click="statusFilter = 'healthy'" :class="statusFilter === 'healthy' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'" class="px-2 py-1 rounded">Bình Thường</button>
                        <button @click="statusFilter = 'warning'" :class="statusFilter === 'warning' ? 'bg-white shadow text-amber-700' : 'text-slate-500'" class="px-2 py-1 rounded">Chú Ý</button>
                        <button @click="statusFilter = 'stalled'" :class="statusFilter === 'stalled' ? 'bg-white shadow text-rose-700' : 'text-slate-500'" class="px-2 py-1 rounded">Tắc Nghẽn</button>
                    </div>

                    <select v-model="hasNewFilter" class="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium">
                        <option value="all">📊 Tất cả MST mới</option>
                        <option value="has_new">✨ Có MST mới (> 0)</option>
                        <option value="no_new">⚠️ Không có MST mới (= 0)</option>
                    </select>

                    <select v-model="sortBy" class="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium">
                        <option value="days_desc">⏳ Ngày trễ nhất</option>
                        <option value="new_desc">🔥 MST mới nhiều nhất</option>
                        <option value="prefix_asc">🔢 Tiền tố (01 → 99)</option>
                        <option value="name_asc">🔤 Tên tỉnh (A → Z)</option>
                    </select>

                    <button v-if="statusFilter !== 'all' || hasNewFilter !== 'all' || searchQuery || sortBy !== 'days_desc'"
                        @click="resetFilters" class="px-2 py-1 text-xs text-slate-500 hover:text-rose-600 transition font-medium">✕ Xóa lọc</button>
                </div>

                <div class="flex items-center space-x-2">
                    <span class="text-xs text-slate-500 font-medium">Phạm vi:</span>
                    <button v-for="d in [3, 7, 14, 30]" :key="d" @click="changeDays(d)"
                        :class="selectedDays === d ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'"
                        class="px-2.5 py-1 text-xs font-semibold rounded-lg transition">{{ d }}d</button>
                    <button @click="$emit('refresh', selectedDays)" :disabled="loading"
                        class="ml-2 px-3 py-1 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition flex items-center space-x-1">
                        <span :class="loading ? 'animate-spin' : ''">🔄</span>
                        <span>Làm Mới</span>
                    </button>
                </div>
            </div>

            <div class="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>Hiển thị <b class="text-slate-800">{{ filteredProvinces.length }}</b> / {{ reportData?.provinces?.length || 62 }} tỉnh thành</span>
                <span v-if="filteredProvinces.length === 0" class="text-rose-500 font-medium">Không tìm thấy tỉnh nào phù hợp với bộ lọc hiện tại.</span>
            </div>
        </div>

        <!-- 3. Bảng Dữ Liệu -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase">
                        <tr>
                            <th class="p-3.5">Tỉnh / Thành</th>
                            <th class="p-3.5 text-center">Tiền Tố</th>
                            <th class="p-3.5">TIN Max Hiện Tại</th>
                            <th class="p-3.5">Ngày ĐKKD Mới Nhất</th>
                            <th class="p-3.5 text-center">MST Mới ({{ selectedDays }} ngày)</th>
                            <th class="p-3.5 text-center">Trạng Thái</th>
                            <th class="p-3.5 text-right">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-for="row in filteredProvinces" :key="row.prefix" class="hover:bg-slate-50 transition">
                            <td class="p-3.5 font-medium text-slate-800">{{ row.province }}</td>
                            <td class="p-3.5 text-center font-mono font-bold text-blue-600">{{ row.prefix }}</td>
                            <td class="p-3.5 font-mono font-semibold">
                                <button v-if="row.tin_max" @click="openDetail(row.tin_max)" title="Xem chi tiết doanh nghiệp mới nhất này"
                                    class="text-blue-600 hover:text-blue-900 hover:underline flex items-center gap-1 group font-mono font-bold transition">
                                    <span>{{ row.tin_max }}</span><span class="opacity-0 group-hover:opacity-100 text-[10px]">👁️</span>
                                </button>
                                <span v-else class="text-slate-400">---</span>
                            </td>
                            <td class="p-3.5 font-mono text-slate-600 text-xs">
                                {{ row.max_regi_date }}
                                <span v-if="row.days_diff != null" class="text-slate-400 ml-1">({{ row.days_diff }}d trước)</span>
                            </td>
                            <td class="p-3.5 text-center">
                                <span v-if="row.new_records_in_range > 0" class="font-bold text-emerald-600 font-mono">
                                    +{{ Number(row.new_records_in_range).toLocaleString('vi-VN') }} MST
                                </span>
                                <span v-else class="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                    0 MST (Chưa có)
                                </span>
                            </td>
                            <td class="p-3.5 text-center">
                                <span v-if="row.status === 'healthy'" class="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Bình Thường</span>
                                <span v-else-if="row.status === 'warning'" class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">🟡 Cần Chú Ý</span>
                                <span v-else class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">🔴 Tắc Nghẽn</span>
                            </td>
                            <td class="p-3.5 text-right">
                                <button @click="triggerScan(row.province)" :disabled="scanningKey === row.province"
                                    class="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition">
                                    {{ scanningKey === row.province ? '⏳ Đang gọi...' : '⚡ Quét TIN Max' }}
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `
};

window.HealthReportTab = HealthReportTab;
