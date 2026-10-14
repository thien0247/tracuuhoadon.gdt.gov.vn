/**
 * search-tab.js - Component tra cứu doanh nghiệp tức thời theo Mã Số Thuế và Tên Công Ty.
 */

const SearchTab = {
    props: {
        provinceConfigs: { type: Object, required: true }
    },
    setup(props) {
        const { ref } = Vue;

        const searchTin = ref('');
        const searchName = ref('');
        const searchProvKey = ref('');
        const searchRows = ref([]);
        const searchCount = ref(null);
        const searching = ref(false);

        const formatNumber = (n) => (n == null || isNaN(n)) ? '0' : Number(n).toLocaleString('vi-VN');

        const onSearch = async () => {
            if (!searchTin.value.trim() && !searchName.value.trim()) {
                alert('Vui lòng nhập Mã Số Thuế hoặc Tên Công Ty để tìm kiếm.');
                return;
            }
            searching.value = true;
            try {
                const data = await ApiClient.searchRecords({
                    tin: searchTin.value.trim(),
                    name: searchName.value.trim(),
                    province_key: searchProvKey.value
                });
                searchRows.value = data.rows || [];
                searchCount.value = data.count || 0;
            } catch (e) {
                alert('Lỗi tìm kiếm: ' + e);
            } finally {
                searching.value = false;
            }
        };

        const clearSearch = () => {
            searchTin.value = '';
            searchName.value = '';
            searchProvKey.value = '';
            searchRows.value = [];
            searchCount.value = null;
        };

        const openDetail = (tin) => {
            if (window.openTaxDetail) window.openTaxDetail(tin);
        };

        return {
            searchTin, searchName, searchProvKey,
            searchRows, searchCount, searching,
            formatNumber, onSearch, clearSearch, openDetail
        };
    },
    template: `
    <div class="space-y-6">
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 class="text-base font-bold text-slate-900">🔎 Tìm Kiếm Doanh Nghiệp</h2>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div class="md:col-span-1">
                    <label class="block text-xs font-semibold text-slate-600 mb-1">Mã số thuế:</label>
                    <input type="text" v-model="searchTin" @keyup.enter="onSearch" placeholder="VD: 0316341824"
                        class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500">
                </div>
                <div class="md:col-span-1">
                    <label class="block text-xs font-semibold text-slate-600 mb-1">Tên công ty:</label>
                    <input type="text" v-model="searchName" @keyup.enter="onSearch" placeholder="VD: CÔNG TY TNHH..."
                        class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500">
                </div>
                <div class="md:col-span-1">
                    <label class="block text-xs font-semibold text-slate-600 mb-1">Lọc theo tỉnh thành:</label>
                    <select v-model="searchProvKey"
                        class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500">
                        <option value="">-- Tất cả tỉnh --</option>
                        <option v-for="(prov, key) in provinceConfigs" :key="key" :value="key">{{ key }}</option>
                    </select>
                </div>
                <div class="flex items-end gap-2">
                    <button @click="onSearch" :disabled="searching"
                        class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-3 rounded-lg shadow-md shadow-indigo-100 transition-all text-xs disabled:opacity-50">
                        {{ searching ? 'Đang tìm...' : '🔍 Tìm Kiếm' }}
                    </button>
                    <button @click="clearSearch"
                        class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 px-3 rounded-lg transition-all text-xs">
                        ✖ Xóa
                    </button>
                </div>
            </div>

            <div v-if="searchCount !== null" class="text-xs font-semibold text-slate-600 pt-1">
                Tìm thấy <span class="text-indigo-600 font-bold">{{ formatNumber(searchCount) }}</span> kết quả.
                <span class="text-slate-400 font-normal">(Hiển thị tối đa 200 dòng)</span>
            </div>
        </div>

        <!-- Bảng kết quả tìm kiếm -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs text-slate-700">
                    <thead class="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                        <tr>
                            <th class="p-3.5">Mã Số Thuế</th>
                            <th class="p-3.5">Tên Doanh Nghiệp</th>
                            <th class="p-3.5">Ngày Đăng Ký</th>
                            <th class="p-3.5">Trạng Thái</th>
                            <th class="p-3.5">Địa Chỉ</th>
                            <th class="p-3.5">Cơ Quan Thuế</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-if="searchRows.length === 0">
                            <td colspan="6" class="p-6 text-center text-slate-400 italic">
                                {{ searchCount === null ? 'Nhập từ khóa và bấm Tìm Kiếm để xem kết quả.' : 'Không tìm thấy kết quả phù hợp.' }}
                            </td>
                        </tr>
                        <tr v-for="(row, idx) in searchRows" :key="idx" class="hover:bg-slate-50 transition-colors">
                            <td class="p-3.5 font-mono font-bold">
                                <button @click="openDetail(row[0])" title="Click để xem chi tiết đầy đủ mã số thuế này"
                                    class="text-indigo-600 hover:text-indigo-900 hover:underline flex items-center gap-1 group font-mono font-bold transition">
                                    <span>{{ row[0] }}</span>
                                    <span class="opacity-0 group-hover:opacity-100 text-[10px] bg-indigo-50 text-indigo-600 px-1 rounded border border-indigo-200 transition">👁️</span>
                                </button>
                            </td>
                            <td class="p-3.5 font-semibold text-slate-900">{{ row[1] }}</td>
                            <td class="p-3.5 text-slate-600 font-mono">{{ row[2] ? String(row[2]).substring(0, 10) : '' }}</td>
                            <td class="p-3.5">
                                <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {{ row[3] || 'Đang hoạt động' }}
                                </span>
                            </td>
                            <td class="p-3.5 text-slate-500 max-w-xs truncate">{{ row[4] }}</td>
                            <td class="p-3.5 text-slate-500 max-w-xs truncate">{{ row[5] }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `
};

window.SearchTab = SearchTab;
