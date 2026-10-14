/**
 * tax-detail-modal.js - Modal chi tiết MST & Đối chiếu Địa bàn HTKK 3 cấp và 2 cấp cải cách.
 */
const TaxDetailModal = {
    setup() {
        const { ref, onMounted, onUnmounted } = Vue;
        const isOpen = ref(false), loading = ref(false), enriching = ref(false);
        const tin = ref(''), record = ref(null), error = ref(null), copyMsg = ref('');

        const fmtDate = (d) => (!d || d === 'None') ? 'Chưa có' : (String(d).trim().substring(0, 10));
        const masothueUrl = (q) => `https://masothue.com/Search/?type=auto&q=${encodeURIComponent(q || '')}`;

        const open = async (targetTin) => {
            if (!targetTin) return;
            tin.value = String(targetTin).trim();
            isOpen.value = true; loading.value = true; error.value = null; record.value = null; copyMsg.value = '';
            try { record.value = await ApiClient.getRecordDetail(tin.value); }
            catch (err) { error.value = 'Không tìm thấy dữ liệu: ' + (err.message || err); }
            finally { loading.value = false; }
        };
        const close = () => { isOpen.value = false; };

        const copyTin = async () => {
            if (!tin.value) return;
            try { await navigator.clipboard.writeText(tin.value); copyMsg.value = '✓ Đã chép!'; setTimeout(() => { copyMsg.value = ''; }, 2000); }
            catch { copyMsg.value = 'Lỗi copy!'; }
        };

        const copyAllSummary = async () => {
            if (!record.value) return;
            const r = record.value;
            const m = r.htkk_mapping;
            const text = [`MST: ${r.tin || tin.value}`, `Tên: ${r.norm_name || 'N/A'}`, `Loại: ${r.org_type || 'N/A'}`, `Địa chỉ: ${r.address || r.tran_addr || 'N/A'}`, `3 Cấp: ${m?.v3?.provinceName || ''} - ${m?.v3?.districtName || ''} | ${m?.v3?.taxOfficeName || ''}`, `2 Cấp (Bỏ Huyện): ${m?.v2?.provinceName || ''} | ${m?.v2?.taxOfficeName || ''}`].join('\n');
            try { await navigator.clipboard.writeText(text); copyMsg.value = '✓ Đã chép thông tin!'; setTimeout(() => { copyMsg.value = ''; }, 2000); }
            catch { copyMsg.value = 'Lỗi copy!'; }
        };

        const triggerEnrich = async () => {
            if (!tin.value) return;
            enriching.value = true;
            try {
                const res = await ApiClient.enrichRecord(tin.value);
                if (res && record.value) {
                    record.value.org_type = res.org_type; record.value.address = res.address;
                    record.value.tax_department = res.tax_department; copyMsg.value = '✓ Đã bổ sung!';
                    setTimeout(() => { copyMsg.value = ''; }, 2500);
                }
            } catch { copyMsg.value = 'Lỗi bổ sung!'; setTimeout(() => { copyMsg.value = ''; }, 2000); }
            finally { enriching.value = false; }
        };

        const onKeyDown = (e) => { if (e.key === 'Escape' && isOpen.value) close(); };
        onMounted(() => { window.openTaxDetail = open; window.addEventListener('keydown', onKeyDown); });
        onUnmounted(() => { window.removeEventListener('keydown', onKeyDown); });

        return { isOpen, loading, enriching, tin, record, error, copyMsg, fmtDate, masothueUrl, open, close, copyTin, copyAllSummary, triggerEnrich };
    },
    template: `
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm" @click.self="close">
        <ai-component-badge name="TaxDetailModal" file="static/js/components/tax-detail-modal.js" module="Tax Detail" desc="Modal xem chi tiết MST" class="w-full max-w-3xl">
            <div class="bg-white w-full rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                <!-- Header -->
            <div class="px-5 py-3 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 text-white flex items-center justify-between shrink-0">
                <div class="flex items-center space-x-3">
                    <div class="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold">🏢</div>
                    <div>
                        <div class="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Chi Tiết Người Nộp Thuế & Phân Cấp HTKK</div>
                        <div class="text-base font-extrabold font-mono text-amber-300 flex items-center gap-2">
                            <span>{{ tin }}</span>
                            <button @click="copyTin" class="text-xs bg-white/15 hover:bg-white/25 px-2 py-0.5 rounded text-white font-sans transition">📋 Copy</button>
                            <a v-if="tin" :href="masothueUrl(tin)" target="_blank" class="text-xs bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded font-sans transition">🔍 Masothue ↗</a>
                            <span v-if="copyMsg" class="text-xs text-emerald-300 font-sans font-semibold animate-pulse">{{ copyMsg }}</span>
                        </div>
                    </div>
                </div>
                <button @click="close" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition">✕</button>
            </div>

            <!-- Body -->
            <div class="p-5 overflow-y-auto space-y-3.5 text-xs">
                <div v-if="loading" class="py-12 text-center text-slate-500 space-y-3">
                    <div class="inline-block w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p class="font-medium">Đang truy vấn cơ sở dữ liệu cho MST {{ tin }}...</p>
                </div>
                <div v-else-if="error" class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold">⚠️ {{ error }}</div>
                <div v-else-if="record" class="space-y-3">
                    <!-- Tên & Trạng Thái Banner -->
                    <div class="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 space-y-1">
                        <div class="flex items-center justify-between">
                            <div class="text-[10px] font-bold text-indigo-700 uppercase">Tên Người Nộp Thuế</div>
                            <a v-if="record.norm_name" :href="masothueUrl(record.norm_name)" target="_blank" class="text-[11px] text-indigo-600 hover:underline">Tìm theo tên ↗</a>
                        </div>
                        <div class="text-sm font-bold text-slate-900 leading-snug">{{ record.norm_name || 'CHƯA CẬP NHẬT TÊN' }}</div>
                        <div class="pt-1 flex flex-wrap gap-2 items-center">
                            <span v-if="record.org_type" class="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-blue-100 text-blue-800 border border-blue-200">🏢 {{ record.org_type }}</span>
                            <span class="px-2.5 py-0.5 rounded-full font-semibold text-[11px]" :class="record.status === '00' || (record.status_name && record.status_name.includes('đang hoạt động')) ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'">
                                {{ record.status_name || 'Đang hoạt động' }}
                            </span>
                            <span class="text-slate-400 font-mono text-[10px]">(Mã huyện: {{ record.tran_dist }} | Mã CQT: {{ record.pay_taxo_id }})</span>
                        </div>
                    </div>

                    <!-- THẺ ĐỐI CHIẾU MÔ HÌNH HÀNH CHÍNH & THUẾ HTKK -->
                    <div v-if="record.htkk_mapping" class="bg-slate-900 text-white rounded-xl p-3.5 space-y-2.5 shadow-md">
                        <div class="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                            <div class="font-bold flex items-center gap-1.5 text-amber-300">
                                <span>🗺️</span><span class="tracking-wide">Đối Chiếu Địa Bàn & Mạng Lưới Thuế HTKK</span>
                            </div>
                            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                                Match: {{ record.htkk_mapping.matchedBy }}
                            </span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                            <!-- Cột 1: Mô hình 3 cấp (Có Huyện) -->
                            <div class="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700 space-y-1.5">
                                <div class="font-bold text-sky-300 flex items-center justify-between pb-1 border-b border-slate-700">
                                    <span>🏛️ Mô hình 3 Cấp (Hiện hành)</span>
                                    <span class="text-[10px] bg-sky-950 text-sky-200 px-1.5 rounded border border-sky-800">Có Huyện</span>
                                </div>
                                <div><span class="text-slate-400">Tỉnh / Thành phố:</span> <b class="text-white ml-1">{{ record.htkk_mapping.v3.provinceName }}</b> <span class="text-slate-500 font-mono">({{ record.htkk_mapping.v3.provinceCode }})</span></div>
                                <div><span class="text-slate-400">Quận / Huyện:</span> <b class="text-white ml-1">{{ record.htkk_mapping.v3.districtName }}</b> <span class="text-slate-500 font-mono">({{ record.htkk_mapping.v3.districtCode }})</span></div>
                                <div><span class="text-slate-400">Xã / Phường:</span> <span class="text-slate-200 ml-1">{{ record.htkk_mapping.v3.communeName || 'Theo địa chỉ trụ sở' }}</span></div>
                                <div class="pt-1 border-t border-slate-700/60"><span class="text-slate-400">Cơ quan thuế:</span> <b class="text-amber-200 block truncate">{{ record.htkk_mapping.v3.taxOfficeName }}</b></div>
                            </div>

                            <!-- Cột 2: Mô hình 2 cấp (Bỏ Huyện) -->
                            <div class="bg-indigo-950/50 rounded-lg p-2.5 border border-indigo-800/60 space-y-1.5">
                                <div class="font-bold text-emerald-300 flex items-center justify-between pb-1 border-b border-indigo-800/60">
                                    <span>🚀 Mô hình 2 Cấp (Cải cách)</span>
                                    <span class="text-[10px] bg-rose-950 text-rose-300 px-1.5 rounded border border-rose-800 font-semibold">ĐÃ BỎ CẤP HUYỆN</span>
                                </div>
                                <div><span class="text-slate-400">Tỉnh mới sau sáp nhập:</span> <b class="text-white ml-1">{{ record.htkk_mapping.v2.provinceName }}</b> <span class="text-slate-500 font-mono">({{ record.htkk_mapping.v2.provinceCode }})</span></div>
                                <div><span class="text-slate-400">Cấp trung gian:</span> <span class="text-rose-400 font-semibold ml-1">Bãi bỏ hoàn toàn cấp Quận/Huyện</span></div>
                                <div><span class="text-slate-400">Xã / Phường mới:</span> <span class="text-slate-200 ml-1">{{ record.htkk_mapping.v2.communeName || record.htkk_mapping.v3.communeName || 'Theo địa bàn' }}</span></div>
                                <div class="pt-1 border-t border-indigo-800/60"><span class="text-slate-400">Thuế cơ sở phụ trách:</span> <b class="text-emerald-300 block truncate">{{ record.htkk_mapping.v2.taxOfficeName || 'Thuế cơ sở cấp Tỉnh' }}</b></div>
                            </div>
                        </div>
                    </div>

                    <!-- 2 Cột Thông Tin Gốc -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5">
                            <div class="font-bold text-slate-700 flex items-center gap-1 pb-1 border-b border-slate-200"><span>📍</span><span>Trụ Sở & Ngành Nghề</span></div>
                            <div><span class="text-slate-500 block">Địa chỉ chuẩn hóa:</span><span class="font-semibold text-slate-800">{{ record.address || record.tran_addr || 'Chưa cập nhật' }}</span></div>
                            <div><span class="text-slate-500 block">Ngành nghề:</span><span class="font-medium text-slate-700">{{ record.econ_name || 'Hộ KD / Doanh Nghiệp' }}</span></div>
                            <div class="text-[11px]"><span class="text-slate-500">Điện thoại:</span> <b class="text-slate-700">{{ record.tran_tel && record.tran_tel !== 'None' ? record.tran_tel : '---' }}</b></div>
                        </div>
                        <div class="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5">
                            <div class="font-bold text-slate-700 flex items-center gap-1 pb-1 border-b border-slate-200"><span>🏛️</span><span>CQT Quản Lý & Đăng Ký</span></div>
                            <div><span class="text-slate-500 block">CQT quản lý:</span><span class="font-semibold text-slate-800">{{ record.tax_department || record.pay_taxo_name || 'N/A' }}</span></div>
                            <div class="grid grid-cols-2 gap-1 text-[11px]">
                                <div><span class="text-slate-500 block">Ngày cấp ĐKKD:</span> <b class="text-indigo-700 font-mono">{{ fmtDate(record.regi_date) }}</b></div>
                                <div><span class="text-slate-500 block">Ngày thay đổi:</span> <b class="text-slate-700 font-mono">{{ fmtDate(record.chan_date) }}</b></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="px-5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div class="flex items-center gap-2 flex-wrap">
                    <button @click="copyAllSummary" :disabled="!record" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-600 hover:text-white transition disabled:opacity-40">📋 Sao Chép</button>
                    <button @click="triggerEnrich" :disabled="!record || enriching" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-600 hover:text-white transition flex items-center gap-1 disabled:opacity-50"><span :class="enriching ? 'animate-spin' : ''">⚡</span><span>{{ enriching ? 'Đang bổ sung...' : 'Bổ sung Xinvoice' }}</span></button>
                    <a v-if="tin" :href="masothueUrl(tin)" target="_blank" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition flex items-center gap-1"><span>🔍 Masothue ↗</span></a>
                </div>
                <button @click="close" class="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition">Đóng</button>
            </div>
        </div>
        </ai-component-badge>
    </div>
    `
};

window.TaxDetailModal = TaxDetailModal;
