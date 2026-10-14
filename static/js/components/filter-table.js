/**
 * filter-table.js - Bảng kết quả lọc MST tích hợp bộ lọc Header tức thì và hiển thị đa cấp V2/V3.
 */
const FilterTable = {
    name: 'FilterTable',
    props: {
        rows: { type: Array, default: () => [] },
        loading: { type: Boolean, default: false }
    },
    setup(props) {
        const { ref, computed } = Vue;
        const headerFilters = ref({ tin: '', name: '', v3: '', v2: '', date: '', status: '', addr: '' });

        const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const formatNumber = (n) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

        const hasHeaderFilter = computed(() => Object.values(headerFilters.value).some(v => v.trim() !== ''));

        const filteredDisplayRows = computed(() => {
            const { tin, name, v3, v2, date, status, addr } = headerFilters.value;
            const qTin = norm(tin), qName = norm(name), qV3 = norm(v3), qV2 = norm(v2), qDate = norm(date), qStatus = norm(status), qAddr = norm(addr);
            if (!qTin && !qName && !qV3 && !qV2 && !qDate && !qStatus && !qAddr) return props.rows;
            return props.rows.filter(r => {
                if (qTin && !norm(r[0]).includes(qTin)) return false;
                if (qName && !norm(r[1] + ' ' + (r[11] || '')).includes(qName)) return false;
                if (qV3 && !norm((r[6] || '') + ' ' + (r[7] || '')).includes(qV3)) return false;
                if (qV2 && !norm((r[8] || '') + ' ' + (r[9] || '') + ' ' + (r[10] || '')).includes(qV2)) return false;
                if (qDate && !norm(r[2]).includes(qDate)) return false;
                if (qStatus && !norm(r[3]).includes(qStatus)) return false;
                if (qAddr && !norm(r[4]).includes(qAddr)) return false;
                return true;
            });
        });

        const resetHeaderFilters = () => {
            headerFilters.value = { tin: '', name: '', v3: '', v2: '', date: '', status: '', addr: '' };
        };

        const openDetail = (tin) => { if (window.openTaxDetail) window.openTaxDetail(tin); };

        return {
            headerFilters, hasHeaderFilter, filteredDisplayRows, formatNumber,
            resetHeaderFilters, openDetail
        };
    },
    template: `
    <div class="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden">
        <div v-if="hasHeaderFilter" class="px-3 py-1.5 bg-sky-50 border-b border-slate-300 flex items-center justify-between text-xs">
            <span class="text-sky-800 font-medium">Lọc ma trận: Hiển thị <b>{{ formatNumber(filteredDisplayRows.length) }}</b> / {{ formatNumber(rows.length) }} dòng</span>
            <button @click="resetHeaderFilters" class="text-sky-600 hover:text-sky-900 font-semibold underline text-[11px]">Xóa bộ lọc cột</button>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-800 border-collapse border-spacing-0">
                <thead class="bg-slate-100 text-slate-700 font-semibold border-b-2 border-slate-300 text-[11px] select-none">
                    <tr>
                        <th class="w-10 min-w-[40px] text-center bg-slate-200/80 text-slate-500 font-mono text-[10px] border-r border-b border-slate-300 py-1.5">#</th>
                        <th class="px-2.5 py-1.5 border-r border-b border-slate-300">Mã Số Thuế</th>
                        <th class="px-2.5 py-1.5 border-r border-b border-slate-300">Tên Doanh Nghiệp & SĐT</th>
                        <th class="px-2.5 py-1.5 border-r border-b border-slate-300">Mô Hình 3 Cấp (V3)</th>
                        <th class="px-2.5 py-1.5 border-r border-b border-slate-300">Mô Hình 2 Cấp (V2 Bỏ Huyện)</th>
                        <th class="px-2.5 py-1.5 border-r border-b border-slate-300">Ngày Cấp</th>
                        <th class="px-2.5 py-1.5 border-r border-b border-slate-300">Trạng Thái</th>
                        <th class="px-2.5 py-1.5 border-r border-b border-slate-300">Địa Chỉ Trụ Sở</th>
                    </tr>
                    <tr class="bg-slate-50 border-b-2 border-slate-300">
                        <th class="text-center font-mono text-slate-400 text-[10px] border-r border-b border-slate-300 bg-slate-100/60">fx</th>
                        <th class="p-1 border-r border-b border-slate-300"><input v-model="headerFilters.tin" placeholder="Lọc MST..." class="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"></th>
                        <th class="p-1 border-r border-b border-slate-300"><input v-model="headerFilters.name" placeholder="Lọc Tên/SĐT..." class="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"></th>
                        <th class="p-1 border-r border-b border-slate-300"><input v-model="headerFilters.v3" placeholder="Lọc Huyện/Tỉnh V3..." class="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"></th>
                        <th class="p-1 border-r border-b border-slate-300"><input v-model="headerFilters.v2" placeholder="Lọc Xã/Thuế V2..." class="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"></th>
                        <th class="p-1 border-r border-b border-slate-300"><input v-model="headerFilters.date" placeholder="Lọc Ngày..." class="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"></th>
                        <th class="p-1 border-r border-b border-slate-300"><input v-model="headerFilters.status" placeholder="Lọc Trạng thái..." class="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"></th>
                        <th class="p-1 border-r border-b border-slate-300"><input v-model="headerFilters.addr" placeholder="Lọc Địa chỉ..." class="w-full bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"></th>
                    </tr>
                </thead>
                <tbody class="divide-none text-[11px]">
                    <tr v-if="filteredDisplayRows.length === 0">
                        <td colspan="8" class="p-8 text-center text-slate-400 italic border-b border-slate-300">
                            {{ rows.length === 0 ? 'Vui lòng bấm \"Lọc Dữ Liệu\" để hiển thị ma trận.' : 'Không tìm thấy dòng nào khớp bộ lọc header.' }}
                        </td>
                    </tr>
                    <tr v-for="(row, idx) in filteredDisplayRows" :key="idx" class="hover:bg-sky-50/60 transition-colors">
                        <td class="w-10 min-w-[40px] text-center bg-slate-100/60 font-mono text-slate-400 text-[10px] select-none p-1 border-r border-b border-slate-200 font-medium">{{ idx + 1 }}</td>
                        <td class="px-2.5 py-1.5 border-r border-b border-slate-200 font-mono font-bold align-middle">
                            <button @click="openDetail(row[0])" class="text-indigo-600 hover:text-indigo-900 hover:underline flex items-center gap-1 font-mono transition text-[11px]">
                                <span>{{ row[0] }}</span><span class="text-[9px]">👁️</span>
                            </button>
                        </td>
                        <td class="px-2.5 py-1.5 border-r border-b border-slate-200 align-middle">
                            <div class="font-semibold text-slate-900 max-w-[200px] truncate text-[11px]" :title="row[1]">{{ row[1] }}</div>
                            <div v-if="row[11]" class="text-[10px] text-emerald-600 font-mono font-bold flex items-center gap-1" title="Số điện thoại đăng ký thuế">
                                <span>📞</span><span>{{ row[11] }}</span>
                            </div>
                        </td>
                        <td class="px-2.5 py-1.5 border-r border-b border-slate-200 align-middle">
                            <div class="font-medium text-slate-800 text-[11px]">{{ row[6] }}</div>
                            <div class="text-[10px] text-slate-400">{{ row[7] }}</div>
                        </td>
                        <td class="px-2.5 py-1.5 border-r border-b border-slate-200 align-middle">
                            <div class="font-semibold text-emerald-700 text-[11px]">{{ row[8] }}</div>
                            <div class="text-[10px] text-slate-500">{{ row[10] }}</div>
                        </td>
                        <td class="px-2.5 py-1.5 border-r border-b border-slate-200 text-slate-600 font-mono text-[10px] align-middle">{{ row[2] ? row[2].substring(0, 10) : '---' }}</td>
                        <td class="px-2.5 py-1.5 border-r border-b border-slate-200 align-middle">
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-medium" :class="row[3] && (row[3] === '00' || row[3].includes('đang hoạt động')) ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'">
                                {{ row[3] || 'Đang hoạt động' }}
                            </span>
                        </td>
                        <td class="px-2.5 py-1.5 border-r border-b border-slate-200 text-slate-600 max-w-xs truncate text-[11px] align-middle" :title="row[4]">{{ row[4] }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    `
};

window.FilterTable = FilterTable;
