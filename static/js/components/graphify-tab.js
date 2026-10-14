/**
 * graphify-tab.js - Trực quan hóa Đồ Thị Kiến Trúc (Knowledge Graph) mã nguồn.
 * Hỗ trợ chuyển đổi: Mạng lưới tương tác (graph.html), Cây phân cấp (GRAPH_TREE.html), Báo cáo (GRAPH_REPORT.md).
 */

const GraphifyTab = {
    setup() {
        const { ref, onMounted } = Vue;

        const currentView = ref('graph');
        const stats = ref({ nodes: 929, edges: 1858, communities: 68, status: 'ready' });
        const reportContent = ref('');
        const isRefreshing = ref(false);
        const refreshMessage = ref('');
        const iframeKey = ref(0);

        const viewUrls = {
            graph: '/graphify-out/graph.html',
            tree: '/graphify-out/GRAPH_TREE.html'
        };

        const loadStats = async () => {
            try {
                const res = await fetch('/api/graphify/stats');
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'ready') stats.value = data;
                }
            } catch (err) {
                console.warn('[GraphifyTab] Khong the tai thong ke do thi:', err);
            }
        };

        const loadReport = async () => {
            try {
                const res = await fetch('/api/graphify/report');
                if (res.ok) reportContent.value = await res.text();
            } catch (err) {
                reportContent.value = 'Lỗi khi tải báo cáo GRAPH_REPORT.md: ' + err.message;
            }
        };

        const setView = (v) => {
            currentView.value = v;
            if (v === 'report' && !reportContent.value) loadReport();
        };

        const openInNewTab = () => {
            const url = viewUrls[currentView.value] || '/graphify-out/graph.html';
            window.open(url, '_blank');
        };

        const triggerRefresh = async () => {
            if (isRefreshing.value) return;
            isRefreshing.value = true;
            refreshMessage.value = 'Đang quét lại cú pháp AST toàn bộ codebase...';
            try {
                const res = await fetch('/api/graphify/refresh', { method: 'POST' });
                if (res.ok) {
                    setTimeout(async () => {
                        await loadStats();
                        if (currentView.value === 'report') await loadReport();
                        iframeKey.value += 1;
                        isRefreshing.value = false;
                        refreshMessage.value = 'Đã làm mới đồ thị thành công!';
                        setTimeout(() => { refreshMessage.value = ''; }, 3000);
                    }, 4000);
                }
            } catch (err) {
                isRefreshing.value = false;
                refreshMessage.value = 'Lỗi làm mới: ' + err.message;
            }
        };

        onMounted(() => {
            loadStats();
        });

        return {
            currentView, stats, reportContent, isRefreshing, refreshMessage,
            iframeKey, viewUrls, setView, openInNewTab, triggerRefresh
        };
    },
    template: `
    <div class="space-y-4">
        <!-- 1. HEADER THANH ĐIỀU KHIỂN & CHỈ SỐ NHANH -->
        <div class="card-glass p-3 rounded-2xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-sm">
                    🕸️
                </div>
                <div>
                    <div class="flex items-center gap-2">
                        <h2 class="text-sm font-bold text-[var(--text-primary)]">Đồ Thị Kiến Trúc Mã Nguồn (Graphify)</h2>
                        <span class="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                            97% AST Extracted
                        </span>
                    </div>
                    <div class="flex items-center gap-3 text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                        <span>Nodes: <strong class="text-[var(--text-primary)]">{{ stats.nodes }}</strong></span>
                        <span>Edges: <strong class="text-[var(--text-primary)]">{{ stats.edges }}</strong></span>
                        <span>Cụm: <strong class="text-[var(--text-primary)]">{{ stats.communities }}</strong></span>
                    </div>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <!-- VIEW SWITCH BUTTONS -->
                <div class="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
                    <button @click="setView('graph')" :class="currentView === 'graph' ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
                        class="px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5">
                        <span>🌐</span><span>Mạng Lưới</span>
                    </button>
                    <button @click="setView('tree')" :class="currentView === 'tree' ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
                        class="px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5">
                        <span>🌳</span><span>Cây D3</span>
                    </button>
                    <button @click="setView('report')" :class="currentView === 'report' ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'"
                        class="px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5">
                        <span>📑</span><span>Báo Cáo</span>
                    </button>
                </div>

                <!-- ACTIONS -->
                <button @click="triggerRefresh" :disabled="isRefreshing" title="Quét lại cú pháp AST"
                    class="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5">
                    <span :class="isRefreshing ? 'animate-spin' : ''">🔄</span>
                    <span class="hidden sm:inline">{{ isRefreshing ? 'Đang quét...' : 'Làm Mới AST' }}</span>
                </button>
                <button @click="openInNewTab" title="Mở đồ thị toàn màn hình trong tab mới"
                    class="p-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold rounded-xl transition">
                    <span>↗️</span>
                </button>
            </div>
        </div>

        <!-- THÔNG BÁO TIẾN TRÌNH QUÉT -->
        <div v-if="refreshMessage" class="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-2">
            <span>ℹ️</span><span>{{ refreshMessage }}</span>
        </div>

        <!-- 2. KHUNG HIỂN THỊ CHÍNH (IFRAME HOẶC BÁO CÁO REPORT) -->
        <div class="relative w-full rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
            <iframe v-if="currentView === 'graph' || currentView === 'tree'"
                :key="iframeKey"
                :src="viewUrls[currentView]"
                class="w-full h-[calc(100vh-215px)] min-h-[580px] border-0 rounded-2xl bg-white"
                allow="fullscreen"
                title="Graphify Visualizer">
            </iframe>

            <div v-else class="w-full h-[calc(100vh-215px)] min-h-[580px] overflow-y-auto p-5 md:p-6 font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-secondary)] whitespace-pre-wrap leading-relaxed">
                {{ reportContent || 'Đang nạp nội dung báo cáo kiến trúc...' }}
            </div>
        </div>
    </div>
    `
};

window.GraphifyTab = GraphifyTab;
