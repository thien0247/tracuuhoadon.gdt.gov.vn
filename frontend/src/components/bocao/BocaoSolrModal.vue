<!-- @id 01M4V0HMMG8PD5BJN27YKGX4WP -->
<!-- @related 01M4V0HMMJTV6V77PFNGJ4V8K7, 01M4V0HMMAGER9D326B643B5RY, 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA -->
<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm" @click.self="close">
    <AiBadge name="BocaoSolrModal" file="src/components/bocao/BocaoSolrModal.vue" module="Bố Cáo ĐKKD" desc="Modal tra cứu doanh nghiệp DKKD Solr" class="w-full max-w-3xl">
      <div class="bg-white dark:bg-slate-900 w-full rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
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
        <div class="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          <div class="flex gap-2">
            <input v-model="searchField" @keyup.enter="doSearch" placeholder="Nhập Mã số thuế hoặc Tên doanh nghiệp..."
                   class="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500">
            <button @click="doSearch" :disabled="loading || !searchField.trim()"
                    class="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5">
              <span v-if="loading" class="animate-spin">⏳</span>
              <span>{{ loading ? 'Đang tìm...' : 'Tra Cứu' }}</span>
            </button>
          </div>

          <div v-if="copyMsg" class="text-emerald-600 font-semibold text-center">{{ copyMsg }}</div>
          <div v-if="error" class="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">{{ error }}</div>

          <div v-if="loading" class="py-10 text-center text-slate-400 italic">Đang truy vấn Cổng ĐKKD...</div>
          <div v-else-if="hasSearched && results.length === 0 && !error" class="py-8 text-center text-slate-400 italic">
            Không tìm thấy doanh nghiệp phù hợp với từ khóa "{{ searchField }}".
          </div>

          <div v-for="(item, idx) in results" :key="idx" class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 hover:border-indigo-300 transition">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h4 class="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">{{ item.Name || 'Chưa có tên' }}</h4>
                <div v-if="item.Name_F" class="text-[11px] text-slate-500 italic">{{ item.Name_F }}</div>
                <div v-if="item.Short_Name" class="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">Tên viết tắt: {{ item.Short_Name }}</div>
              </div>
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">DKKD Solr</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">{{ item.Status || 'Đang hoạt động' }}</span>
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
              <div><span class="text-slate-500">Mã Số Thuế:</span> <b class="font-mono text-indigo-600 font-bold ml-1">{{ item.Enterprise_Gdt_Code || '---' }}</b></div>
              <div><span class="text-slate-500">Mã ĐKKD:</span> <b class="font-mono text-slate-800 dark:text-slate-200 font-bold ml-1">{{ item.Enterprise_Code || '---' }}</b></div>
              <div><span class="text-slate-500">ID Solr:</span> <b class="font-mono text-slate-600 dark:text-slate-400 ml-1">{{ item.Id || '---' }}</b></div>
              <div class="col-span-2 sm:col-span-3"><span class="text-slate-500">Người đại diện:</span> <b class="text-slate-800 dark:text-slate-200 ml-1">{{ item.Legal_First_Name || '---' }}</b></div>
              <div class="col-span-2 sm:col-span-3"><span class="text-slate-500">Mã địa bàn:</span> <span class="font-mono text-slate-700 dark:text-slate-300 ml-1">Tỉnh: {{ item.City_Id || '-' }} | Huyện: {{ item.District_Id || '-' }} | Xã: {{ item.Ward_Id || '-' }}</span></div>
              <div class="col-span-2 sm:col-span-3"><span class="text-slate-500">Địa chỉ trụ sở:</span> <span class="text-slate-800 dark:text-slate-200 ml-1 font-medium">{{ item.Ho_Address || '---' }}</span></div>
            </div>

            <div v-if="expandedRaw[idx]" class="mt-2 p-2.5 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto max-h-48 border border-slate-700">
              <pre>{{ JSON.stringify(item, null, 2) }}</pre>
            </div>

            <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex-wrap">
              <div class="flex items-center gap-1.5">
                <button @click="toggleRaw(idx)" class="px-2 py-1 text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 text-slate-700 dark:text-slate-200">
                  {{ expandedRaw[idx] ? '▲ Ẩn JSON' : '{ } JSON Gốc' }}
                </button>
                <button @click="copyText(JSON.stringify(item, null, 2), 'JSON')" class="px-2 py-1 text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 text-slate-700 dark:text-slate-200">📋 Chép JSON</button>
              </div>
              <div class="flex items-center gap-1.5">
                <button v-if="item.Enterprise_Gdt_Code" @click="copyText(item.Enterprise_Gdt_Code, 'MST')" class="px-2.5 py-1 text-[11px] font-semibold bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 text-slate-700 dark:text-slate-200">📋 Chép MST</button>
                <button v-if="item.Enterprise_Gdt_Code" @click="viewTaxDetail(item.Enterprise_Gdt_Code)" class="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-1">
                  <span>👁️ Xem Chi Tiết GDT</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="px-5 py-2.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end shrink-0">
          <button @click="close" class="px-4 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition">Đóng</button>
        </div>
      </div>
    </AiBadge>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import AiBadge from '../common/AiBadge.vue';
import { ApiClient } from '../../api/client';

const emit = defineEmits<{ (e: 'view-tax-detail', tin: string): void }>();

const isOpen = ref(false);
const loading = ref(false);
const searchField = ref('');
const results = ref<Record<string, string>[]>([]);
const error = ref<string | null>(null);
const hasSearched = ref(false);
const copyMsg = ref('');
const expandedRaw = ref<Record<number, boolean>>({});

const open = (query = '') => {
  isOpen.value = true;
  searchField.value = String(query || '').trim();
  error.value = null;
  expandedRaw.value = {};
  if (searchField.value) { doSearch(); }
  else { results.value = []; hasSearched.value = false; }
};

const close = () => { isOpen.value = false; };

const doSearch = async () => {
  const q = searchField.value.trim();
  if (!q) return;
  loading.value = true;
  error.value = null;
  hasSearched.value = true;
  try {
    const res = await ApiClient.searchDkkdOnline(q);
    if (res && res.success) {
      results.value = res.enterprises || [];
    } else {
      error.value = res?.error || 'Không thể tra cứu DKKD';
      results.value = [];
    }
  } catch (err: unknown) {
    error.value = 'Lỗi kết nối: ' + (err instanceof Error ? err.message : String(err));
    results.value = [];
  } finally { loading.value = false; }
};

const copyText = async (txt: string, label = '') => {
  if (!txt) return;
  try {
    await navigator.clipboard.writeText(txt);
    copyMsg.value = `✓ Đã chép ${label || txt}!`;
    setTimeout(() => { copyMsg.value = ''; }, 2000);
  } catch { copyMsg.value = 'Lỗi copy!'; }
};

const toggleRaw = (idx: number) => { expandedRaw.value[idx] = !expandedRaw.value[idx]; };
const viewTaxDetail = (tin: string) => { emit('view-tax-detail', tin); };

const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen.value) close(); };
onMounted(() => {
  (window as unknown as { openDkkdSearch?: (q: string) => void }).openDkkdSearch = open;
  window.addEventListener('keydown', onKeyDown);
});
onUnmounted(() => { window.removeEventListener('keydown', onKeyDown); });

defineExpose({ open, close });
</script>
