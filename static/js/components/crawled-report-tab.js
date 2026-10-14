const CrawledReportTab = {
    props: { provinceConfigs: { type: Object, default: () => ({}) } },
    setup(props) {
        const { ref, computed, onMounted } = Vue;
        const period = ref('day'), timeField = ref('scraped_at'), selectedProvince = ref('all'), datePreset = ref('30d');
        const chartType = ref('bar'), loading = ref(false), syncing = ref(false);
        const stats = ref({ summary: { total_records: 0, peak_period: null, peak_count: 0, avg_per_period: 0, period_count: 0 }, timeline: [], top_provinces: [] });
        const tooltip = ref({ visible: false, x: 0, y: 0, label: '', count: 0 });

        const formatNum = (v) => Number(v || 0).toLocaleString('vi-VN');
        const compactNum = (n) => n >= 1e6 ? (n/1e6).toFixed(1) + 'M' : (n >= 1e3 ? (n/1e3).toFixed(1) + 'k' : String(n));
        const provinceList = computed(() => Object.entries(props.provinceConfigs || {}).map(([name, cfg]) => ({
            key: name.toLowerCase().replace(/\s+/g, '_'), name, prefix: cfg.prefix
        })).sort((a, b) => a.name.localeCompare(b.name)));
        const todayCount = computed(() => stats.value?.timeline?.find(t => t.period === new Date().toISOString().split('T')[0])?.count || 0);

        const kpiCards = computed(() => [
            { t: timeField.value === 'regi_date' ? 'Tổng Doanh Nghiệp ĐKKD' : 'Tổng MST Quét Được', v: formatNum(stats.value.summary.total_records), s: timeField.value === 'regi_date' ? 'Bảng regi_stats_daily' : 'Bảng crawl_stats_daily', c: 'text-[var(--vnpt-blue)]' },
            { t: timeField.value === 'regi_date' ? 'Hôm Nay (ĐKKD Mới)' : 'Hôm Nay (Quét Mới)', v: `${formatNum(todayCount.value)} MST`, s: 'Ghi nhận trong ngày', c: 'text-emerald-600' },
            { t: 'Kỳ Cao Điểm Nhất', v: stats.value.summary.peak_period || '---', s: `${formatNum(stats.value.summary.peak_count)} MST`, c: 'text-purple-600' },
            { t: 'Trung Bình / Kỳ', v: formatNum(stats.value.summary.avg_per_period), s: `${stats.value.summary.period_count} mốc`, c: 'text-amber-600' }
        ]);

        const fetchStats = async () => {
            loading.value = true;
            try {
                let fromDate = '';
                const d = new Date(), days = { '7d': 7, '30d': 30, '90d': 90 }[datePreset.value];
                if (days) { d.setDate(d.getDate() - days); fromDate = d.toISOString().split('T')[0]; }
                const q = new URLSearchParams({ period: period.value, time_field: timeField.value, province_key: selectedProvince.value, ...(fromDate ? { from_date: fromDate } : {}) });
                const res = await fetch(`/api/reports/crawl-stats?${q.toString()}`);
                if (!res.ok) throw new Error('Failed');
                stats.value = await res.json();
            } catch (err) { console.error(err); } finally { loading.value = false; }
        };

        const syncStats = async () => {
            syncing.value = true;
            try { const res = await fetch('/api/reports/sync-stats', { method: 'POST' }); if (res.ok) await fetchStats(); }
            catch (e) { console.error(e); } finally { syncing.value = false; }
        };

        const chartData = computed(() => {
            const list = stats.value?.timeline || [];
            if (!list.length) return { points: [], maxVal: 1, linePath: '' };
            const maxVal = Math.max(...list.map(t => t.count), 1), w = 760, h = 180, padX = 25, padY = 25;
            const step = (w - padX * 2) / Math.max(list.length, 1);
            const points = list.map((item, idx) => ({
                ...item, x: padX + idx * step + step / 2, y: h - padY - Math.max((item.count / maxVal) * (h - padY * 2), 3),
                barH: Math.max((item.count / maxVal) * (h - padY * 2), 3), width: Math.max(Math.min(step * 0.75, 28), 6),
                shortLabel: item.label.length >= 5 ? item.label.slice(0, 5) : item.label
            }));
            return { points, maxVal, linePath: points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') };
        });

        const showTip = (evt, item) => {
            const r = evt.currentTarget.getBoundingClientRect();
            tooltip.value = { visible: true, x: r.left + r.width / 2, y: r.top - 8, label: item.label, count: item.count };
        };

        const exportCsv = () => {
            const rows = [['Ngày / Mốc', 'Số Lượng MST', 'Tỷ Lệ (%)']];
            const tot = stats.value.summary.total_records || 1;
            stats.value.timeline.forEach(t => rows.push([t.label, t.count, ((t.count / tot) * 100).toFixed(2)]));
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.join(',')).join('\n')], { type: 'text/csv;charset=utf-8;' }));
            a.download = `san_luong_mst_${timeField.value}_${period.value}_${selectedProvince.value}.csv`; a.click();
        };

        onMounted(() => { fetchStats(); });
        return {
            period, timeField, selectedProvince, datePreset, chartType, loading, syncing, stats, tooltip,
            kpiCards, provinceList, formatNum, compactNum, fetchStats, syncStats, chartData, showTip, exportCsv
        };
    },
    template: `
    <div class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div v-for="c in kpiCards" :key="c.t" class="card-glass p-3 rounded-xl border border-[var(--border-color)]">
                <div class="text-[10px] font-semibold text-[var(--text-muted)] uppercase">{{ c.t }}</div>
                <div class="text-xl font-black mt-0.5 font-mono truncate" :class="c.c">{{ c.v }}</div>
                <div class="text-[10px] text-[var(--text-muted)] font-mono">{{ c.s }}</div>
            </div>
        </div>
        <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2.5">
            <div class="flex flex-wrap items-center gap-2">
                <div class="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold">
                    <button @click="timeField = 'scraped_at'; fetchStats()" :class="timeField === 'scraped_at' ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'" class="px-2 py-1 rounded transition">🕒 Ngày Quét</button>
                    <button @click="timeField = 'regi_date'; fetchStats()" :class="timeField === 'regi_date' ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'" class="px-2 py-1 rounded transition">🏢 Ngày ĐKKD</button>
                </div>
                <div class="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)] text-xs font-semibold">
                    <button v-for="p in [{k:'day', l:'📅 Ngày'}, {k:'month', l:'📆 Tháng'}, {k:'year', l:'🗓️ Năm'}]" :key="p.k"
                        @click="period = p.k; fetchStats()" :class="period === p.k ? 'bg-[var(--vnpt-blue)] text-white shadow' : 'text-[var(--text-secondary)]'"
                        class="px-2.5 py-1 rounded transition">{{ p.l }}</button>
                </div>
                <select v-model="selectedProvince" @change="fetchStats" class="text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1 font-medium text-[var(--text-primary)]">
                    <option value="all">🌐 Toàn Quốc (62 Tỉnh)</option>
                    <option v-for="pr in provinceList" :key="pr.key" :value="pr.key">({{ pr.prefix }}) {{ pr.name }}</option>
                </select>
            </div>
            <div class="flex items-center gap-2">
                <div class="flex items-center space-x-1">
                    <button v-for="ps in [{k:'7d', l:'7d'}, {k:'30d', l:'30d'}, {k:'90d', l:'90d'}, {k:'all', l:'All'}]" :key="ps.k"
                        @click="datePreset = ps.k; fetchStats()" :class="datePreset === ps.k ? 'bg-[var(--vnpt-blue)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)]'"
                        class="px-2 py-1 text-xs font-medium rounded-lg transition">{{ ps.l }}</button>
                </div>
                <div class="flex bg-[var(--bg-secondary)] p-0.5 rounded-lg border border-[var(--border-color)] text-xs">
                    <button @click="chartType = 'bar'" :class="chartType === 'bar' ? 'bg-[var(--vnpt-blue)] text-white' : 'text-[var(--text-secondary)]'" class="px-2 py-0.5 rounded">📊</button>
                    <button @click="chartType = 'line'" :class="chartType === 'line' ? 'bg-[var(--vnpt-blue)] text-white' : 'text-[var(--text-secondary)]'" class="px-2 py-0.5 rounded">📈</button>
                </div>
                <button @click="syncStats" :disabled="syncing" class="px-2 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg flex items-center gap-1 transition"><span :class="syncing ? 'animate-spin' : ''">⚡</span><span>Đồng Bộ</span></button>
                <button @click="fetchStats" :disabled="loading" class="px-2.5 py-1 text-xs font-semibold bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:opacity-90 flex items-center gap-1 transition"><span :class="loading ? 'animate-spin' : ''">🔄</span><span>Tải Lại</span></button>
            </div>
        </div>
        <div class="card-glass p-3 rounded-xl border border-[var(--border-color)] space-y-2">
            <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-1 text-xs">
                <span class="font-bold uppercase tracking-wider text-[var(--text-primary)]">📈 Biểu Đồ Sản Lượng MST ({{ timeField === 'regi_date' ? 'Ngày ĐKKD' : 'Ngày Quét' }} - {{ chartData.points.length }} mốc)</span>
                <span class="font-mono text-[var(--text-muted)]">Đỉnh: <b class="text-[var(--vnpt-blue)]">{{ formatNum(chartData.maxVal) }}</b> MST</span>
            </div>
            <div class="relative w-full h-48 flex items-center justify-center overflow-x-auto">
                <svg v-if="chartData.points.length" viewBox="0 0 760 180" class="w-full h-full select-none" preserveAspectRatio="none">
                    <line x1="20" y1="155" x2="745" y2="155" stroke="currentColor" class="text-slate-300 dark:text-slate-700" stroke-width="1"/>
                    <line x1="20" y1="85" x2="745" y2="85" stroke="currentColor" class="text-slate-200 dark:text-slate-800" stroke-dasharray="4" stroke-width="1"/>
                    <g v-if="chartType === 'bar'"><g v-for="p in chartData.points" :key="p.period">
                        <rect :x="p.x - p.width/2" :y="p.y" :width="p.width" :height="p.barH" rx="2" class="fill-blue-500 hover:fill-blue-600 transition-all cursor-pointer opacity-90 hover:opacity-100" @mouseenter="showTip($event, p)" @mouseleave="tooltip.visible = false"/>
                        <text :x="p.x" :y="Math.max(p.y - 4, 10)" text-anchor="middle" class="text-[7.5px] fill-blue-600 dark:fill-blue-400 font-mono font-bold">{{ compactNum(p.count) }}</text>
                        <text :x="p.x" y="168" text-anchor="middle" class="text-[7.5px] fill-slate-500 font-mono">{{ p.shortLabel }}</text>
                    </g></g>
                    <g v-else><path :d="chartData.linePath" fill="none" stroke="#2563eb" stroke-width="2.5"/><g v-for="p in chartData.points" :key="p.period"><circle :cx="p.x" :cy="p.y" r="3.5" class="fill-blue-600 stroke-white stroke-2 hover:r-5 cursor-pointer" @mouseenter="showTip($event, p)" @mouseleave="tooltip.visible = false"/><text :x="p.x" :y="Math.max(p.y - 6, 10)" text-anchor="middle" class="text-[7.5px] fill-blue-600 font-mono font-bold">{{ compactNum(p.count) }}</text><text :x="p.x" y="168" text-anchor="middle" class="text-[7.5px] fill-slate-500 font-mono">{{ p.shortLabel }}</text></g></g>
                </svg>
                <div v-else class="text-xs text-[var(--text-muted)] py-10"><span>📭 Chưa có dữ liệu trong khoảng thời gian đã chọn</span></div>
            </div>
            <div v-if="tooltip.visible" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }" class="fixed -translate-x-1/2 -translate-y-full z-50 pointer-events-none bg-slate-900 text-white text-xs py-1.5 px-3 rounded-lg shadow-xl font-mono text-center">
                <div class="font-bold text-amber-300">📅 {{ timeField === 'regi_date' ? 'Ngày ĐKKD' : 'Ngày Quét' }}: {{ tooltip.label }}</div>
                <div class="font-bold text-blue-200">⚡ Số lượng: {{ formatNum(tooltip.count) }} MST</div>
            </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div class="lg:col-span-8 card-glass p-3 rounded-xl border border-[var(--border-color)] space-y-2">
                <div class="flex items-center justify-between pb-1 border-b border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] uppercase">
                    <span>📋 Bảng Số Liệu ({{ timeField === 'regi_date' ? 'Ngày ĐKKD' : 'Ngày Quét' }} - {{ stats.timeline.length }} mốc)</span>
                    <button @click="exportCsv" class="px-2 py-0.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-500 transition flex items-center gap-1 shadow-sm"><span>📥 Xuất CSV</span></button>
                </div>
                <div class="overflow-x-auto max-h-64 overflow-y-auto">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-semibold uppercase sticky top-0">
                            <tr><th class="p-1.5">{{ timeField === 'regi_date' ? 'Ngày ĐKKD' : 'Ngày Quét' }}</th><th class="p-1.5 text-right">Số Lượng MST</th><th class="p-1.5 text-right">Tỷ Trọng</th><th class="p-1.5 w-28">Tiến Độ</th></tr>
                        </thead>
                        <tbody class="divide-y divide-[var(--border-color)]">
                            <tr v-for="row in (stats.timeline || []).slice().reverse()" :key="row.period" class="hover:bg-[var(--bg-secondary)] transition">
                                <td class="p-1.5 font-mono font-bold text-[var(--text-primary)]">📅 {{ row.label }}</td>
                                <td class="p-1.5 text-right font-mono font-extrabold text-blue-600 dark:text-blue-400">{{ formatNum(row.count) }} MST</td>
                                <td class="p-1.5 text-right font-mono text-[var(--text-muted)]">{{ ((row.count / (stats.summary.total_records || 1)) * 100).toFixed(1) }}%</td>
                                <td class="p-1.5"><div class="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]"><div class="bg-[var(--vnpt-blue)] h-full rounded-full" :style="{ width: Math.min((row.count / (chartData.maxVal || 1)) * 100, 100) + '%' }"></div></div></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="lg:col-span-4 card-glass p-3 rounded-xl border border-[var(--border-color)] space-y-2">
                <div class="flex items-center justify-between pb-1 border-b border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] uppercase">
                    <span>🏆 Top Tỉnh Thành</span><span class="text-[10px] text-[var(--text-muted)]">Tỷ lệ %</span>
                </div>
                <div class="space-y-1 max-h-64 overflow-y-auto pr-1">
                    <div v-for="(prov, idx) in stats.top_provinces" :key="prov.prefix" class="space-y-0.5">
                        <div class="flex items-center justify-between text-xs">
                            <span class="font-medium text-[var(--text-primary)] truncate"><b class="font-mono text-[var(--vnpt-blue)]">#{{ idx + 1 }}</b> {{ prov.province_name }} ({{ prov.prefix }})</span>
                            <span class="font-mono font-bold">{{ formatNum(prov.count) }} <span class="text-[10px] text-[var(--text-muted)]">({{ prov.percentage }}%)</span></span>
                        </div>
                        <div class="w-full bg-[var(--bg-secondary)] h-1.5 rounded-full overflow-hidden"><div class="bg-[var(--vnpt-blue)] h-full rounded-full transition-all" :style="{ width: prov.percentage + '%' }"></div></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `
};

window.CrawledReportTab = CrawledReportTab;
