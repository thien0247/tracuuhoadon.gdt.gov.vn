// @id 01M4W0CMMN0000000000000002
// @related 01M4W0CMMN0000000000000001, 01M4W0H00K0000000000000006
'use client';
import React, { useState } from 'react';
import { useInspector } from '@/hooks/useInspector';

export default function AiInspector() {
  const { selectedComponent, closeInspector } = useInspector();
  const [copied, setCopied] = useState(false);

  if (!selectedComponent) return null;

  const copyPrompt = async () => {
    const promptText = `Tôi muốn chỉnh sửa component ${selectedComponent.name} tại tệp ${selectedComponent.file} (Module: ${selectedComponent.module}${selectedComponent.ulid ? `, ULID: ${selectedComponent.ulid}` : ''}).`;
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy error:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) closeInspector(); }}
    >
      <div className="bg-[#1e1b4b] border border-purple-500 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        <div className="flex items-center justify-between px-5 py-3.5 bg-purple-700/80 border-b border-purple-500/50">
          <div className="flex items-center gap-2">
            <span className="text-base">🔬</span>
            <span className="font-mono font-bold text-sm text-white">&lt;{selectedComponent.name} /&gt;</span>
          </div>
          <button onClick={closeInspector} className="text-slate-300 hover:text-white transition p-1 text-lg font-bold">&times;</button>
        </div>
        <div className="p-5 space-y-3.5 text-xs">
          <div>
            <span className="text-purple-300 font-semibold uppercase tracking-wider block mb-1">Đường dẫn tệp nguồn:</span>
            <code className="block bg-slate-900/90 text-cyan-300 px-3 py-2 rounded-lg font-mono text-xs border border-purple-900/60 select-all">{selectedComponent.file}</code>
          </div>
          {selectedComponent.ulid && (
            <div>
              <span className="text-purple-300 font-semibold uppercase tracking-wider block mb-1">Mã Định Danh Bất Biến (ULID):</span>
              <code className="block bg-slate-900/90 text-amber-300 px-3 py-1.5 rounded-lg font-mono text-xs border border-purple-900/60 select-all">{selectedComponent.ulid}</code>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-purple-300 font-semibold uppercase tracking-wider block mb-1">Module:</span>
              <div className="bg-slate-900/60 px-3 py-1.5 rounded-lg border border-purple-900/40 text-slate-200 font-medium">{selectedComponent.module}</div>
            </div>
            <div>
              <span className="text-purple-300 font-semibold uppercase tracking-wider block mb-1">Cấu trúc:</span>
              <div className="bg-slate-900/60 px-3 py-1.5 rounded-lg border border-purple-900/40 text-emerald-300 font-medium">Next.js 14 App Router (TSX)</div>
            </div>
          </div>
          <div>
            <span className="text-purple-300 font-semibold uppercase tracking-wider block mb-1">Mô tả vai trò:</span>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-purple-900/40 text-slate-300 leading-relaxed">{selectedComponent.desc}</div>
          </div>
        </div>
        <div className="px-5 py-3 bg-slate-950/60 border-t border-purple-900/60 flex items-center justify-end gap-2">
          <button onClick={() => void copyPrompt()} className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-sm flex items-center gap-1.5">
            <span>📋</span><span>{copied ? 'Đã sao chép!' : 'Sao chép Prompt yêu cầu sửa'}</span>
          </button>
          <button onClick={closeInspector} className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition font-medium">Đóng</button>
        </div>
      </div>
    </div>
  );
}
