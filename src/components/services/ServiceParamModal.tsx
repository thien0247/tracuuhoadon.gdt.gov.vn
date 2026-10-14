// @id 01M4W0SVCS0000000000000004
// @related 01M4W0SVCS0000000000000001, 01M4W0TYPE0000000000000002
'use client';
import React, { useState, useEffect, useMemo } from 'react';

export interface ParamDef {
  key: string;
  label: string;
  type: 'select' | 'number' | 'boolean' | 'string';
  defaultValue: unknown;
  description: string;
  options?: Array<{ label: string; value: string | number | boolean }>;
  min?: number;
  max?: number;
  step?: number;
}

export interface ModalServiceItem {
  id: string;
  name: string;
  supportedActions: string[];
  parameters?: ParamDef[];
}

interface ServiceParamModalProps {
  show: boolean;
  service: ModalServiceItem | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (action: string, params: Record<string, unknown>) => void;
}

export default function ServiceParamModal({
  show, service, loading = false, onClose, onSubmit
}: ServiceParamModalProps) {
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!service || !service.parameters) {
      setFormValues({});
      return;
    }
    const init: Record<string, unknown> = {};
    for (const p of service.parameters) init[p.key] = p.defaultValue;
    setFormValues(init);
  }, [service]);

  const actionButtons = useMemo(() => {
    if (!service) return [];
    const acts = service.supportedActions || [];
    const list = [];
    if (acts.includes('trigger')) list.push({ key: 'trigger', label: '⚡ Kích Hoạt', color: 'bg-amber-600 hover:bg-amber-500' });
    if (acts.includes('test_connection')) list.push({ key: 'test_connection', label: '🩺 Kiểm Tra', color: 'bg-purple-600 hover:bg-purple-500' });
    if (acts.includes('start')) list.push({ key: 'start', label: '▶ Bắt Đầu', color: 'bg-emerald-600 hover:bg-emerald-500' });
    if (acts.includes('restart')) list.push({ key: 'restart', label: '🔄 Khởi Động Lại', color: 'bg-indigo-600 hover:bg-indigo-500' });
    return list.length ? list : [{ key: 'apply', label: 'Áp Dụng', color: 'bg-[var(--vnpt-blue)]' }];
  }, [service]);

  if (!show || !service) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="card-glass bg-[var(--bg-card)] rounded-2xl max-w-md w-full border border-[var(--border-color)] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Tham Số: {service.name}</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Tùy biến tham số gọi và kích hoạt dịch vụ</p>
            </div>
          </div>
          <button onClick={onClose} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-lg">✕</button>
        </div>

        <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
          {(service.parameters || []).map((param) => (
            <div key={param.key} className="space-y-1">
              <label className="block text-xs font-semibold text-[var(--text-primary)]">{param.label}</label>
              <p className="text-[10px] text-[var(--text-muted)]">{param.description}</p>

              {param.type === 'select' ? (
                <select
                  value={String(formValues[param.key] ?? '')}
                  onChange={(e) => setFormValues((p) => ({ ...p, [param.key]: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--vnpt-blue)]"
                >
                  {(param.options || []).map((opt) => (
                    <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                  ))}
                </select>
              ) : param.type === 'number' ? (
                <input
                  type="number"
                  value={Number(formValues[param.key] ?? 0)}
                  onChange={(e) => setFormValues((p) => ({ ...p, [param.key]: Number(e.target.value) }))}
                  min={param.min} max={param.max} step={param.step}
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--vnpt-blue)]"
                />
              ) : param.type === 'boolean' ? (
                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={Boolean(formValues[param.key])}
                    onChange={(e) => setFormValues((p) => ({ ...p, [param.key]: e.target.checked }))}
                    className="rounded text-[var(--vnpt-blue)] focus:ring-0 w-4 h-4"
                  />
                  <span className="text-xs text-[var(--text-secondary)]">Kích hoạt tùy chọn này</span>
                </label>
              ) : (
                <input
                  type="text"
                  value={String(formValues[param.key] ?? '')}
                  onChange={(e) => setFormValues((p) => ({ ...p, [param.key]: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:outline-hidden focus:border-[var(--vnpt-blue)]"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)] gap-2">
          <button onClick={onClose} type="button" className="px-3 py-1.5 rounded-xl border border-[var(--border-color)] text-xs font-semibold hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">Hủy</button>
          <div className="flex items-center gap-1.5">
            {actionButtons.map((act) => (
              <button key={act.key} onClick={() => onSubmit(act.key, { ...formValues })} disabled={loading} className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm transition disabled:opacity-40 ${act.color}`}>
                {act.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
