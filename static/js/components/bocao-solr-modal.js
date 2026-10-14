/**
 * bocao-solr-modal.js - Modal tra cứu dữ liệu doanh nghiệp trực tuyến qua DKKD Solr API.
 */
const BocaoSolrModal = {
    name: 'BocaoSolrModal',
    setup() {
        const { ref, onMounted, onUnmounted } = Vue;
        const isOpen = ref(false), loading = ref(false), searchField = ref('');
        const results = ref([]), error = ref(null), hasSearched = ref(false), copyMsg = ref(''), expandedRaw = ref({});

        const open = (query = '') => {
            isOpen.value = true; searchField.value = String(query || '').trim();
            error.value = null; expandedRaw.value = {};
            if (searchField.value) { doSearch(); }
            else { results.value = []; hasSearched.value = false; }
        };

        const close = () => { isOpen.value = false; };

        const doSearch = async () => {
            const q = searchField.value.trim();
            if (!q) return;
            loading.value = true; error.value = null; hasSearched.value = true;
            try {
                const res = await ApiClient.searchDkkdOnline(q);
                if (res && res.success) {
                    results.value = res.enterprises || [];
                } else {
                    error.value = res?.error || 'Không thể tra cứu DKKD';
                    results.value = [];
                }
            } catch (err) {
                error.value = 'Lỗi kết nối: ' + (err.message || err);
                results.value = [];
            } finally { loading.value = false; }
        };

        const copyText = async (txt, label = '') => {
            if (!txt) return;
            try {
                await navigator.clipboard.writeText(txt);
                copyMsg.value = `✓ Đã chép ${label || txt}!`;
                setTimeout(() => { copyMsg.value = ''; }, 2000);
            } catch { copyMsg.value = 'Lỗi copy!'; }
        };

        const toggleRaw = (idx) => { expandedRaw.value[idx] = !expandedRaw.value[idx]; };
        const viewTaxDetail = (tin) => { if (window.openTaxDetail) window.openTaxDetail(tin); };

        const onKeyDown = (e) => { if (e.key === 'Escape' && isOpen.value) close(); };
        onMounted(() => { window.openDkkdSearch = open; window.addEventListener('keydown', onKeyDown); });
        onUnmounted(() => { window.removeEventListener('keydown', onKeyDown); });

        return {
            isOpen, loading, searchField, results, error, hasSearched, copyMsg, expandedRaw,
            open, close, doSearch, copyText, toggleRaw, viewTaxDetail
        };
    },
    template: `
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm" @click.self="close">
        <ai-component-badge name="BocaoSolrModal" file="static/js/components/bocao-solr-modal.js" module="Bố Cáo ĐKKD" desc="Modal tra cứu doanh nghiệp DKKD Solr" class="w-full max-w-3xl">
            <div class="bg-white w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                <!-- Header -->
                <div class="px-5 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white flex items-center justify-between shrink-0">
                    <div class="flex items-center space-x-2.5">
                        <span class="text-xl">🔍</span>
                        <div>
                            <h3 class="text-sm font-bold">Tra Cứu Doanh Nghiệp Trực Tuyến (DKKD Solr)</h3>
                            <p class="text-[11px] text-indigo-200">Truy vấn realtime từ Cổng Đăng ký kinh doanh quốc gia</p>
                        </div>
                    </div>
                    <button @click="close" class="text-slate-300 hover:text-white text-lg font-bold">✕</button>
                </div>

                <!-- Body -->
                <div class="p-4 overflow-y-auto space-y-3 flex-1">
                    <!-- Search Box -->
                    <div class="flex gap-2">
                        <input v-model="searchField" @keyup.enter="doSearch" placeholder="Nhập Mã số thuế hoặc Tên doanh nghiệp..."
                               class="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500">
                        <button @click="doSearch" :disabled="loading || !searchField.trim()"
                                class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5">
                            <span v-if="loading" class="animate-spin">⏳</span>
                            <span>{{ loading ? 'Đang tìm...' : 'Tra Cứu' }}</span>
                        </button>
                    </div>

                    <div v-if="copyMsg" class="text-xs text-emerald-600 font-semibold text-center">{{ copyMsg }}</div>
                    <div v-if="error" class="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">{{ error }}</div>

                    <!-- Results List -->
                    <div v-if="loading" class="py-10 text-center text-slate-400 text-xs italic">Đang truy vấn Cổng ĐKKD...</div>
                    <div v-else-if="hasSearched && results.length === 0 && !error" class="py-8 text-center text-slate-400 text-xs italic">
                        Không tìm thấy doanh nghiệp phù hợp với từ khóa "{{ searchField }}".
                    </div>

                    <div v-for="(item, idx) in results" :key="idx" class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs hover:border-indigo-300 transition">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <h4 class="font-bold text-slate-900 text-sm leading-snug">{{ item.Name || 'Chưa có tên' }}</h4>
                                <div v-if="item.Name_F" class="text-[11px] text-slate-500 italic">{{ item.Name_F }}</div>
                                <div v-if="item.Short_Name" class="text-[11px] text-indigo-700 font-semibold">Tên viết tắt: {{ item.Short_Name }}</div>
                            </div>
                            <div class="flex items-center gap-1.5 shrink-0">
                                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">DKKD Solr</span>
                                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">{{ item.Status || 'Đang hoạt động' }}</span>
                            </div>
                        </div>

                        <!-- Thuộc tính chi tiết -->
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                            <div><span class="text-slate-500">Mã Số Thuế:</span> <b class="font-mono text-indigo-700 font-bold ml-1">{{ item.Enterprise_Gdt_Code || '---' }}</b></div>
                            <div><span class="text-slate-500">Mã ĐKKD:</span> <b class="font-mono text-slate-800 font-bold ml-1">{{ item.Enterprise_Code || '---' }}</b></div>
                            <div><span class="text-slate-500">ID Solr:</span> <b class="font-mono text-slate-700 ml-1">{{ item.Id || '---' }}</b></div>
                            <div class="col-span-2 sm:col-span-3"><span class="text-slate-500">Người đại diện:</span> <b class="text-slate-900 ml-1">{{ item.Legal_First_Name || '---' }}</b></div>
                            <div class="col-span-2 sm:col-span-3"><span class="text-slate-500">Mã địa bàn DKKD:</span> <span class="font-mono text-slate-700 ml-1">Tỉnh: {{ item.City_Id || '-' }} | Huyện: {{ item.District_Id || '-' }} | Xã: {{ item.Ward_Id || '-' }}</span></div>
                            <div class="col-span-2 sm:col-span-3"><span class="text-slate-500">Địa chỉ trụ sở:</span> <span class="text-slate-800 ml-1 font-medium">{{ item.Ho_Address || '---' }}</span></div>
                            <div v-if="item.Ho_Address_F" class="col-span-2 sm:col-span-3"><span class="text-slate-500">Địa chỉ tiếng Anh:</span> <span class="text-slate-600 italic ml-1">{{ item.Ho_Address_F }}</span></div>
                        </div>

                        <!-- Khối xem JSON Thô -->
                        <div v-if="expandedRaw[idx]" class="mt-2 p-2.5 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto max-h-48 border border-slate-700">
                            <pre>{{ JSON.stringify(item, null, 2) }}</pre>
                        </div>

                        <!-- Action buttons -->
                        <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 flex-wrap">
                            <div class="flex items-center gap-1.5">
                                <button @click="toggleRaw(idx)" class="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700">
                                    {{ expandedRaw[idx] ? '▲ Ẩn JSON' : '{ } JSON Gốc' }}
                                </button>
                                <button @click="copyText(JSON.stringify(item, null, 2), 'JSON')" class="px-2 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700">📋 Chép JSON</button>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <button v-if="item.Enterprise_Gdt_Code" @click="copyText(item.Enterprise_Gdt_Code, 'MST')" class="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700">📋 Chép MST</button>
                                <button v-if="item.Enterprise_Gdt_Code" @click="viewTaxDetail(item.Enterprise_Gdt_Code)" class="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-1">
                                    <span>👁️ Xem Chi Tiết GDT</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                    <button @click="close" class="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition">Đóng</button>
                </div>
            </div>
        </ai-component-badge>
    </div>
    `
};

window.BocaoSolrModal = BocaoSolrModal;
