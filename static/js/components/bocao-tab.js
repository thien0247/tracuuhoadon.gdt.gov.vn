/**
 * bocao-tab.js - Component quản lý, tra cứu và cào Bố Cáo Điện Tử (bocaodientu.dkkd.gov.vn).
 * Tích hợp sub-component BocaoAutoCrawl (tự động cào định kỳ 2h).
 */
const BocaoTab = {
    name: 'BocaoTab',
    components: {
        'bocao-auto-crawl': window.BocaoAutoCrawl
    },
    setup() {
        const { ref, computed, onMounted } = Vue;
        const records = ref([]), total = ref(0), page = ref(1), limit = ref(20);
        const loading = ref(false), crawling = ref(false), crawlMessage = ref(''), maxPages = ref(5);
        const filterType = ref(''), filterKeyword = ref(''), filterProvince = ref('');
        const stats = ref({ total_records: 0, types_breakdown: [], latest_pub_time: null });

        const formatNumber = (n) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');
        const totalPages = computed(() => Math.ceil(total.value / limit.value) || 1);

        const loadStats = async () => {
            try { stats.value = await ApiClient.getBocaoStats(); } catch (e) { console.error('Lỗi stats bố cáo:', e); }
        };

        const loadRecords = async (p = 1) => {
            page.value = p; loading.value = true;
            try {
                const res = await ApiClient.getBocaoRecords({
                    page: page.value, limit: limit.value,
                    keyword: filterKeyword.value, type: filterType.value, province: filterProvince.value
                });
                records.value = res.records || []; total.value = res.total || 0;
            } catch (e) { alert('Lỗi tải bố cáo: ' + (e.message || e)); }
            finally { loading.value = false; }
        };

        const handleCrawl = async (isAll = false) => {
            crawling.value = true; crawlMessage.value = '';
            try {
                const res = isAll ? await ApiClient.crawlAllBocao(maxPages.value || 5) : await ApiClient.crawlBocao();
                if (res.success) {
                    crawlMessage.value = isAll
                        ? `✅ Cào toàn bộ: ${res.pages_crawled} trang, ${res.total_found} tin (Mới: ${res.new_inserted}).`
                        : `✅ Cào trang 1: ${res.total_found} tin (Mới: ${res.new_inserted}).`;
                    await loadStats(); await loadRecords(1);
                } else { crawlMessage.value = `⚠️ Lỗi: ${res.error || 'Thất bại'}`; }
            } catch (e) { crawlMessage.value = `❌ Lỗi: ${e.message || e}`; }
            finally { crawling.value = false; }
        };

        const onAutoCrawled = async () => { await loadStats(); await loadRecords(1); };
        const openDetail = (tin) => { if (window.openTaxDetail) window.openTaxDetail(tin); };
        const openSolr = (q = '') => { if (window.openDkkdSearch) window.openDkkdSearch(q); };
        const getTypeBadgeClass = (t) => {
            if (!t) return 'bg-slate-100 text-slate-700';
            if (t.includes('Đăng ký mới')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            if (t.includes('thay đổi')) return 'bg-amber-50 text-amber-700 border-amber-200';
            if (t.includes('Giải thể') || t.includes('Thu hồi')) return 'bg-rose-50 text-rose-700 border-rose-200';
            return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        };

        onMounted(() => { loadStats(); loadRecords(1); });

        return {
            records, total, page, limit, loading, crawling, crawlMessage, maxPages,
            filterType, filterKeyword, filterProvince, stats, totalPages,
            formatNumber, loadStats, loadRecords, handleCrawl, onAutoCrawled, openDetail, openSolr, getTypeBadgeClass
        };
    },
    template: `
    <div class="space-y-4">
        <!-- Module Lập Lịch Auto Crawl Định Kỳ 2h -->
        <bocao-auto-crawl @crawled="onAutoCrawled" />

        <!-- Thẻ Thống Kê & Nút Cào Dữ Liệu Thủ Công -->
        <ai-component-badge name="BocaoControls" file="static/js/components/bocao-tab.js" module="Bố Cáo ĐKKD" desc="Thống kê và cào bố cáo thủ công">
            <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3">
                <div class="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-xl">📰</span>
                        <div>
                            <h2 class="text-sm font-bold text-slate-900">Bố Cáo Điện Tử Quốc Gia (bocaodientu.dkkd.gov.vn)</h2>
                            <p class="text-[11px] text-slate-500">Biến động doanh nghiệp thành lập mới, thay đổi, giải thể theo thời gian thực</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <button @click="openSolr('')" class="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition">🔍 Tra Cứu Solr</button>
                        <div class="flex items-center bg-slate-100 border border-slate-300 rounded-lg overflow-hidden">
                            <select v-model.number="maxPages" class="text-xs bg-transparent border-0 px-2 py-1 font-bold text-slate-700 focus:ring-0">
                                <option :value="3">3 trang</option><option :value="5">5 trang</option><option :value="10">10 trang</option>
                            </select>
                            <button @click="handleCrawl(true)" :disabled="crawling" class="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-1.5 px-3 transition disabled:opacity-50">
                                {{ crawling ? '⏳' : '⚡' }} Cào Hết
                            </button>
                        </div>
                        <button @click="handleCrawl(false)" :disabled="crawling" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition disabled:opacity-50">⚡ Trang 1</button>
                        <button @click="loadRecords(1); loadStats();" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-2 rounded-lg border border-slate-200 transition">↻</button>
                    </div>
                </div>

                <!-- Banner Thống Kê -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div class="text-slate-500 text-[10px] uppercase font-bold">Tổng Đã Cào</div>
                        <div class="text-base font-black text-indigo-700 font-mono">{{ formatNumber(stats.total_records) }}</div>
                    </div>
                    <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 col-span-2">
                        <div class="text-slate-500 text-[10px] uppercase font-bold">Thời Gian Bố Cáo Mới Nhất</div>
                        <div class="text-xs font-bold text-slate-800 font-mono truncate">{{ stats.latest_pub_time || 'Chưa có' }}</div>
                    </div>
                    <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div class="text-slate-500 text-[10px] uppercase font-bold">Trạng Thái Nguồn</div>
                        <div class="text-xs font-bold text-emerald-600">● Hoạt Động (200 OK)</div>
                    </div>
                </div>

                <div v-if="crawlMessage" class="p-2 text-xs rounded-lg font-medium" :class="crawlMessage.includes('thành công') ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'">
                    {{ crawlMessage }}
                </div>

                <!-- Bộ Lọc Bố Cáo -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1">
                    <input v-model="filterKeyword" @keyup.enter="loadRecords(1)" placeholder="Tìm MST hoặc Tên DN..." class="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500">
                    <select v-model="filterType" @change="loadRecords(1)" class="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500">
                        <option value="">-- Tất cả Loại Công Bố --</option>
                        <option value="Đăng ký mới">Đăng ký mới</option><option value="Đăng ký thay đổi">Đăng ký thay đổi</option>
                        <option value="Thông báo thay đổi">Thông báo thay đổi</option><option value="Giải thể">Giải thể</option><option value="Vi phạm">Vi phạm / Thu hồi</option>
                    </select>
                    <input v-model="filterProvince" @keyup.enter="loadRecords(1)" placeholder="Lọc theo Tỉnh/TP..." class="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500">
                    <button @click="loadRecords(1)" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow-sm transition">🔍 Lọc Dữ Liệu</button>
                </div>
            </div>
        </ai-component-badge>

        <!-- Bảng Dữ Liệu Bố Cáo -->
        <ai-component-badge name="BocaoTable" file="static/js/components/bocao-tab.js" module="Bố Cáo ĐKKD" desc="Bảng công bố doanh nghiệp quốc gia">
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs text-slate-700">
                        <thead class="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200 text-[10px]">
                            <tr>
                                <th class="p-2.5">Thời Gian Công Bố</th><th class="p-2.5">Mã Số Doanh Nghiệp</th>
                                <th class="p-2.5">Tên Doanh Nghiệp</th><th class="p-2.5">Địa Điểm</th><th class="p-2.5">Loại Công Bố</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 text-[11px]">
                            <tr v-if="loading"><td colspan="5" class="p-6 text-center text-slate-400 italic">Đang nạp dữ liệu bố cáo...</td></tr>
                            <tr v-else-if="records.length === 0"><td colspan="5" class="p-6 text-center text-slate-400 italic">Không tìm thấy bản ghi bố cáo nào.</td></tr>
                            <tr v-for="r in records" :key="r.id" class="hover:bg-slate-50 transition-colors">
                                <td class="p-2.5 font-mono text-slate-600 text-[10px] whitespace-nowrap">{{ r.pub_time ? r.pub_time.substring(0, 19).replace('T', ' ') : '---' }}</td>
                                <td class="p-2.5 font-mono font-bold">
                                    <div class="flex items-center gap-1.5">
                                        <button @click="openDetail(r.tin)" class="text-indigo-600 hover:text-indigo-900 hover:underline flex items-center gap-1" title="Xem GDT"><span>{{ r.tin }}</span><span class="text-[10px]">👁️</span></button>
                                        <button @click="openSolr(r.tin)" class="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200" title="Tra cứu Solr DKKD">DKKD</button>
                                    </div>
                                </td>
                                <td class="p-2.5 font-semibold text-slate-900 max-w-sm truncate" :title="r.company_name">{{ r.company_name }}</td>
                                <td class="p-2.5 text-slate-600 whitespace-nowrap">{{ r.province_name || '---' }}</td>
                                <td class="p-2.5"><span class="px-2 py-0.5 rounded-full text-[10px] font-medium border" :class="getTypeBadgeClass(r.announcement_type)">{{ r.announcement_type }}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Phân Trang -->
                <div v-if="totalPages > 1" class="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                    <span class="text-slate-500">Hiển thị <b>{{ records.length }}</b> / {{ formatNumber(total) }} bản ghi (Trang {{ page }} / {{ totalPages }})</span>
                    <div class="flex items-center gap-1.5">
                        <button @click="loadRecords(page - 1)" :disabled="page <= 1" class="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40">◀ Trước</button>
                        <button @click="loadRecords(page + 1)" :disabled="page >= totalPages" class="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40">Sau ▶</button>
                    </div>
                </div>
            </div>
        </ai-component-badge>
    </div>
    `
};

window.BocaoTab = BocaoTab;
