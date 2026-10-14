/**
 * filter-tab.js - Component lọc MST song song Mô hình 2 Cấp (HTKK V2) & 3 Cấp (V3), chuẩn hóa CQT & Thuế cơ sở.
 */
const FilterTab = {
    name: 'FilterTab',
    components: { 'multi-select-combobox': window.MultiSelectCombobox, 'filter-table': window.FilterTable },
    props: { provinceConfigs: { type: Object, required: true } },
    setup(props) {
        const { ref, onMounted } = Vue;
        const modelMode = ref('v2'), filterFromDate = ref(''), filterToDate = ref(''), filterRows = ref([]), filterCount = ref(null);
        const filterV2Prov = ref([]), filterV2Comm = ref([]), filterV2Tax = ref([]);
        const filterV3Prov = ref([]), filterV3Dist = ref([]), filterV3Comm = ref([]), filterV3Tax = ref([]);
        const filtering = ref(false), loadingOptions = ref(false), showExportMenu = ref(false);
        const provsV2 = ref([]), commsV2 = ref([]), taxsV2 = ref([]), provsV3 = ref([]), distsV3 = ref([]), commsV3 = ref([]), taxsV3 = ref([]);
        const formatNumber = (n) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

        const loadOptionsV2 = async (provCode = '') => {
            loadingOptions.value = true;
            try {
                const res = await ApiClient.getFilterOptions({ model: 'v2', province_code: provCode });
                if (!provCode) provsV2.value = res.provinces || [];
                commsV2.value = res.communes || []; taxsV2.value = res.taxOffices || [];
            } catch { commsV2.value = []; taxsV2.value = []; }
            finally { loadingOptions.value = false; }
        };

        const loadOptionsV3 = async (provCode = '') => {
            loadingOptions.value = true;
            try {
                const res = await ApiClient.getFilterOptions({ model: 'v3', province_code: provCode });
                if (!provCode) provsV3.value = res.provinces || [];
                distsV3.value = res.districts || []; commsV3.value = []; taxsV3.value = res.taxOffices || [];
            } catch { distsV3.value = []; commsV3.value = []; taxsV3.value = []; }
            finally { loadingOptions.value = false; }
        };

        const loadCommunesV3 = async (provCode = '', distCode = '') => {
            if (!distCode) { commsV3.value = []; return; }
            try {
                const res = await ApiClient.getFilterOptions({ model: 'v3', province_code: provCode, district_code: distCode });
                commsV3.value = res.communes || [];
            } catch { commsV3.value = []; }
        };

        const onV2ProvChange = () => { filterV2Comm.value = []; filterV2Tax.value = []; loadOptionsV2(filterV2Prov.value[0] || ''); onFilter(); };
        const onV3ProvChange = () => { filterV3Dist.value = []; filterV3Comm.value = []; filterV3Tax.value = []; loadOptionsV3(filterV3Prov.value[0] || ''); onFilter(); };
        const onV3DistChange = () => { filterV3Comm.value = []; loadCommunesV3(filterV3Prov.value[0] || '', filterV3Dist.value[0] || ''); onFilter(); };

        const onFilter = async () => {
            filtering.value = true;
            try {
                const payload = { from_date: filterFromDate.value, to_date: filterToDate.value, model_mode: modelMode.value };
                if (modelMode.value === 'v2') {
                    payload.v2_province_codes = filterV2Prov.value;
                    payload.v2_commune_codes = filterV2Comm.value;
                    payload.v2_tax_office_codes = filterV2Tax.value;
                } else {
                    payload.v3_province_codes = filterV3Prov.value;
                    payload.v3_district_codes = filterV3Dist.value;
                    payload.v3_commune_names = filterV3Comm.value;
                    payload.pay_taxo_ids = filterV3Tax.value;
                }
                const data = await ApiClient.filterRecords(payload);
                filterRows.value = data.rows || [];
                filterCount.value = data.count || 0;
            } catch (e) { alert('Lỗi lọc: ' + (e.message || e)); }
            finally { filtering.value = false; }
        };

        const resetAllFilters = () => {
            filterV2Prov.value = []; filterV2Comm.value = []; filterV2Tax.value = [];
            filterV3Prov.value = []; filterV3Dist.value = []; filterV3Comm.value = []; filterV3Tax.value = [];
            filterFromDate.value = ''; filterToDate.value = '';
            loadOptionsV2(''); loadOptionsV3(''); onFilter();
        };

        const onExport = (format) => {
            showExportMenu.value = false;
            const provs = modelMode.value === 'v2' ? filterV2Prov.value : filterV3Prov.value;
            const comms = modelMode.value === 'v2' ? filterV2Comm.value : filterV3Comm.value;
            const taxs = modelMode.value === 'v2' ? filterV2Tax.value : filterV3Tax.value;
            const args = [provs, filterFromDate.value, filterToDate.value, comms, taxs];
            const url = format === 'xlsx' ? ApiClient.getExportXlsxUrl(...args) : ApiClient.getExportUrl(...args);
            window.open(url, '_blank');
        };

        const exportCurrentCsv = () => {
            showExportMenu.value = false;
            if (!filterRows.value.length) return;
            const headers = ['Mã Số Thuế', 'Tên Doanh Nghiệp', 'Số Điện Thoại', 'Ngày Cấp MST', 'Trạng Thái', 'Địa Chỉ Trụ Sở', 'Cơ Quan Thuế GDT (V3)', 'Huyện Cũ (V3)', 'Tỉnh Cũ (V3)', 'Tỉnh Mới (V2)', 'Xã Mới (V2)', 'Thuế Cơ Sở (V2)'];
            const lines = [headers.join(',')];
            for (const r of filterRows.value) {
                const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
                lines.push([esc(r[0]), esc(r[1]), esc(r[11]), esc(r[2]), esc(r[3]), esc(r[4]), esc(r[5]), esc(r[6]), esc(r[7]), esc(r[8]), esc(r[9]), esc(r[10])].join(','));
            }
            const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
            link.download = `mst_export_${Date.now()}.csv`; link.click(); URL.revokeObjectURL(link.href);
        };
        onMounted(() => { loadOptionsV2(''); loadOptionsV3(''); onFilter(); });

        return {
            modelMode, filterV2Prov, filterV2Comm, filterV2Tax, filterV3Prov, filterV3Dist, filterV3Comm, filterV3Tax,
            filterFromDate, filterToDate, filterRows, filterCount, filtering, loadingOptions, showExportMenu,
            provsV2, commsV2, taxsV2, provsV3, distsV3, commsV3, taxsV3, formatNumber, onV2ProvChange, onV3ProvChange, onV3DistChange,
            onFilter, resetAllFilters, onExport, exportCurrentCsv
        };
    },
    template: `
    <div class="space-y-4">
        <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div class="flex items-center gap-2">
                    <span class="text-base">🔍</span>
                    <span class="text-sm font-bold text-slate-900">Bộ Lọc Doanh Nghiệp Đa Cấp</span>
                    <div class="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold ml-2">
                        <button @click="modelMode = 'v2'; onFilter()" :class="modelMode === 'v2' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'" class="px-2.5 py-1 rounded-md transition flex items-center gap-1"><span>🏛️</span><span>Mô hình 2 Cấp (Mới)</span></button>
                        <button @click="modelMode = 'v3'; onFilter()" :class="modelMode === 'v3' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'" class="px-2.5 py-1 rounded-md transition flex items-center gap-1"><span>🏢</span><span>Mô hình 3 Cấp (Cũ)</span></button>
                    </div>
                </div>
                <button @click="resetAllFilters" class="text-xs text-slate-500 hover:text-indigo-600 font-medium transition">↻ Đặt lại</button>
            </div>
            <div v-if="modelMode === 'v2'" class="grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100/60">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">1. Tỉnh / Thành phố Mới (V2):</label>
                    <multi-select-combobox v-model="filterV2Prov" :options="provsV2" placeholder="Chọn tỉnh mới (35 tỉnh)..." @change="onV2ProvChange" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">2. Xã Mới (V2 - Đã Bỏ Huyện):</label>
                    <multi-select-combobox v-model="filterV2Comm" :options="commsV2" placeholder="Chọn xã mới..." :disabled="loadingOptions" :loading="loadingOptions" @change="onFilter" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">3. Mạng Lưới Thuế Cơ Sở (V2):</label>
                    <multi-select-combobox v-model="filterV2Tax" :options="taxsV2" placeholder="Chọn thuế cơ sở phụ trách..." :disabled="loadingOptions" :loading="loadingOptions" @change="onFilter" />
                </div>
            </div>
            <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-2 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/60">
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">1. Tỉnh / TP Cũ (V3):</label>
                    <multi-select-combobox v-model="filterV3Prov" :options="provsV3" placeholder="Chọn tỉnh cũ (64 tỉnh)..." @change="onV3ProvChange" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">2. Quận / Huyện (V3):</label>
                    <multi-select-combobox v-model="filterV3Dist" :options="distsV3" placeholder="Chọn quận/huyện..." :disabled="loadingOptions" :loading="loadingOptions" @change="onV3DistChange" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">3. Xã / Phường Cũ (V3):</label>
                    <multi-select-combobox v-model="filterV3Comm" :options="commsV3" placeholder="Chọn xã/phường..." :disabled="loadingOptions || !filterV3Dist.length" :loading="loadingOptions" @change="onFilter" />
                </div>
                <div>
                    <label class="block text-xs font-semibold text-slate-700 mb-1">4. Cơ Quan Thuế GDT:</label>
                    <multi-select-combobox v-model="filterV3Tax" :options="taxsV3" placeholder="Chọn Chi cục / Cục Thuế..." :disabled="loadingOptions" :loading="loadingOptions" @change="onFilter" />
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-5 gap-2.5 pt-1">
                <div><label class="block text-xs font-semibold text-slate-600 mb-1">Từ ngày ĐKKD:</label><input type="date" v-model="filterFromDate" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"></div>
                <div><label class="block text-xs font-semibold text-slate-600 mb-1">Đến ngày ĐKKD:</label><input type="date" v-model="filterToDate" class="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"></div>
                <div class="flex items-end gap-2 col-span-3">
                    <button @click="onFilter" :disabled="filtering" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition text-xs disabled:opacity-50">{{ filtering ? 'Đang lọc...' : '🔍 Lọc Dữ Liệu' }}</button>
                    <div class="relative">
                        <button @click="showExportMenu = !showExportMenu" :disabled="filterRows.length === 0" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition text-xs disabled:opacity-50 flex items-center gap-1"><span>💾</span><span>Xuất File (kèm SĐT) ▾</span></button>
                        <div v-if="showExportMenu" class="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 text-xs">
                            <button @click="onExport('csv')" class="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"><span>📄</span> Xuất CSV Toàn Bộ (kèm SĐT)</button>
                            <button @click="onExport('xlsx')" class="w-full text-left px-3 py-2 hover:bg-emerald-50 text-emerald-700 font-semibold flex items-center gap-2"><span>📊</span> Xuất Excel XLSX Toàn Bộ (kèm SĐT)</button>
                            <div class="border-t border-slate-100 my-1"></div>
                            <button @click="exportCurrentCsv" class="w-full text-left px-3 py-2 hover:bg-indigo-50 text-indigo-700 flex items-center gap-2"><span>⚡</span> Tải Nhanh 500 Dòng Xem Trước (CSV)</button>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="filterCount !== null" class="text-xs font-semibold text-slate-600 pt-1 flex items-center justify-between flex-wrap gap-2">
                <div>Tìm thấy <span class="text-indigo-600 font-bold font-mono">{{ formatNumber(filterCount) }}</span> kết quả. <span class="text-slate-400 font-normal">(Xem trước tối đa 500 dòng • Kèm cột SĐT & V2/V3)</span></div>
                <div class="text-[11px] font-medium" :class="modelMode === 'v2' ? 'text-indigo-700' : 'text-emerald-700'">Chế độ: {{ modelMode === 'v2' ? '🏛️ Mô hình 2 Cấp (Mới HTKK V2)' : '🏢 Mô hình 3 Cấp (Cũ HTKK V3)' }}</div>
            </div>
        </div>
        <filter-table :rows="filterRows" :loading="filtering" />
    </div>
    `
};
window.FilterTab = FilterTab;
