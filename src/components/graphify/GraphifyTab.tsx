// @id 01M4W0GRPH0000000000000001
// @related 01M4W0APJC0000000000000001, 01M4W0TYPE0000000000000001
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ApiClient } from '@/api/client';

type ViewType = 'graph' | 'tree' | 'report';
const viewUrls: Record<'graph' | 'tree', string> = {
  graph: '/graphify-out/graph.html',
  tree: '/graphify-out/GRAPH_TREE.html'
};

export default function GraphifyTab() {
  const [currentView, setCurrentView] = useState<ViewType>('graph');
  const [stats, setStats] = useState<{ nodes: number; edges: number; communities: number; status?: string }>({
    nodes: 929, edges: 1858, communities: 68, status: 'ready'
  });
  const [reportContent, setReportContent] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

  const loadStats = useCallback(async () => {
    try {
      const data = (await ApiClient.getGraphifyStats()) as typeof stats;
      if (data && data.status === 'ready') setStats(data);
    } catch { /* ignore */ }
  }, []);

  const loadReport = useCallback(async () => {
    try {
      setReportContent(await ApiClient.getGraphifyReport());
    } catch (err: unknown) {
      setReportContent('Lỗi khi tải báo cáo GRAPH_REPORT.md: ' + String(err));
    }
  }, []);

  useEffect(() => { void loadStats(); }, [loadStats]);

  const setView = (v: ViewType) => {
    setCurrentView(v);
    if (v === 'report' && !reportContent) void loadReport();
  };

  const openInNewTab = () => {
    const url = viewUrls[currentView as 'graph' | 'tree'] || '/graphify-out/graph.html';
    window.open(url, '_blank');
  };

  const triggerRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setRefreshMessage('Đang quét lại cú pháp AST toàn bộ codebase...');
    try {
      await ApiClient.refreshGraphify();
      setTimeout(async () => {
        await loadStats();
        if (currentView === 'report') await loadReport();
        setIframeKey((k) => k + 1);
        setIsRefreshing(false);
        setRefreshMessage('Đã làm mới đồ thị thành công!');
        setTimeout(() => setRefreshMessage(''), 3000);
      }, 4000);
    } catch (err: unknown) {
      setIsRefreshing(false);
      setRefreshMessage('Lỗi làm mới: ' + String(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="card-glass p-3 rounded-2xl border border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl shadow-sm">🕸️</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Đồ Thị Kiến Trúc Mã Nguồn (Graphify)</h2>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">97% AST Extracted</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
              <span>Nodes: <strong className="text-[var(--text-primary)]">{stats.nodes}</strong></span>
              <span>Edges: <strong className="text-[var(--text-primary)]">{stats.edges}</strong></span>
              <span>Cụm: <strong className="text-[var(--text-primary)]">{stats.communities}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)]">
            <button onClick={() => setView('graph')} className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${currentView === 'graph' ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><span>🌐</span><span>Mạng Lưới</span></button>
            <button onClick={() => setView('tree')} className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${currentView === 'tree' ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><span>🌳</span><span>Cây D3</span></button>
            <button onClick={() => setView('report')} className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${currentView === 'report' ? 'bg-[var(--vnpt-blue)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><span>📑</span><span>Báo Cáo</span></button>
          </div>

          <button onClick={() => void triggerRefresh()} disabled={isRefreshing} title="Quét lại cú pháp AST" className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5">
            <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
            <span className="hidden sm:inline">{isRefreshing ? 'Đang quét...' : 'Làm Mới AST'}</span>
          </button>
          <button onClick={openInNewTab} title="Mở đồ thị toàn màn hình trong tab mới" className="p-1.5 bg-[var(--bg-card)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold rounded-xl transition">
            <span>↗️</span>
          </button>
        </div>
      </div>

      {refreshMessage && (
        <div className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-2">
          <span>ℹ️</span><span>{refreshMessage}</span>
        </div>
      )}

      <div className="relative w-full rounded-2xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
        {currentView === 'graph' || currentView === 'tree' ? (
          <iframe
            key={iframeKey}
            src={viewUrls[currentView]}
            className="w-full h-[calc(100vh-215px)] min-h-[580px] border-0 rounded-2xl bg-white"
            allow="fullscreen"
            title="Graphify Visualizer"
          />
        ) : (
          <div className="w-full h-[calc(100vh-215px)] min-h-[580px] overflow-y-auto p-5 md:p-6 font-mono text-xs text-[var(--text-primary)] bg-[var(--bg-secondary)] whitespace-pre-wrap leading-relaxed">
            {reportContent || 'Đang nạp nội dung báo cáo kiến trúc...'}
          </div>
        )}
      </div>
    </div>
  );
}
