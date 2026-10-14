// @id 01M4W0CMMN0000000000000003
// @related 01M4W0TYPE0000000000000001, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';

interface OptionItem {
  value: string;
  label: string;
}

interface MultiSelectProps {
  value?: string[];
  options?: unknown[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  onChange?: (val: string[]) => void;
}

const norm = (s: unknown) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function MultiSelect({
  value = [],
  options = [],
  placeholder = 'Chọn hoặc tìm kiếm...',
  disabled = false,
  loading = false,
  onChange
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const normalizedOpts = useMemo<OptionItem[]>(() => {
    return (options || []).map((o) => {
      if (typeof o === 'string') return { value: o, label: o };
      const item = o as Record<string, unknown>;
      return {
        value: String(item.code ?? item.value ?? ''),
        label: String(item.name ?? item.label ?? '')
      };
    });
  }, [options]);

  const filtered = useMemo(() => {
    if (!search) return normalizedOpts;
    const q = norm(search);
    return normalizedOpts.filter((o) => norm(o.label).includes(q) || norm(o.value).includes(q));
  }, [normalizedOpts, search]);

  const labelMap = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    normalizedOpts.forEach((o) => { m[o.value] = o.label; });
    return m;
  }, [normalizedOpts]);

  const isSelected = (val: string) => value.includes(val);

  const toggle = (val: string) => {
    const next = isSelected(val) ? value.filter((v) => v !== val) : [...value, val];
    onChange?.(next);
  };

  const selectAll = () => {
    const vals = new Set(value);
    filtered.forEach((o) => vals.add(o.value));
    onChange?.(Array.from(vals));
  };

  const deselectAll = () => {
    const remove = new Set(filtered.map((o) => o.value));
    onChange?.(value.filter((v) => !remove.has(v)));
  };

  const removeTag = (val: string) => {
    onChange?.(value.filter((v) => v !== val));
  };

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const visibleTags = value.slice(0, 3);
  const extraCount = Math.max(0, value.length - 3);

  return (
    <div ref={rootRef} className="relative inline-block w-full">
      <button
        type="button"
        onClick={() => {
          if (disabled || loading) return;
          setOpen((p) => !p);
          setTimeout(() => inputRef.current?.focus(), 20);
        }}
        disabled={disabled || loading}
        className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-left transition focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {value.length > 0 ? (
          <span className="text-slate-700 dark:text-slate-200">
            Đã chọn
            <span className="inline-flex items-center justify-center bg-indigo-600 text-white rounded-full px-1.5 min-w-[18px] text-[10px] font-semibold ml-1">
              {value.length}
            </span>
          </span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <svg className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-1 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {visibleTags.map((val) => (
            <span key={val} className="inline-flex items-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full px-2 py-0.5 text-[10px] leading-tight max-w-[140px]">
              <span className="truncate">{labelMap[val] || val}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); removeTag(val); }} className="ml-1 hover:text-indigo-900 dark:hover:text-white focus:outline-none">&times;</button>
            </span>
          ))}
          {extraCount > 0 && <span className="text-[10px] text-slate-500 self-center">+{extraCount} khác</span>}
        </div>
      )}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-1.5">
            <input ref={inputRef} value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Tìm kiếm..." className="w-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 text-slate-800 dark:text-slate-100" />
          </div>
          <div className="flex gap-1 px-1.5 pb-1">
            <button type="button" onClick={selectAll} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 transition">Chọn tất cả</button>
            <button type="button" onClick={deselectAll} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 transition">Bỏ tất cả</button>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && <li className="px-3 py-2 text-xs text-slate-400 text-center">Không tìm thấy</li>}
            {filtered.map((opt) => (
              <li key={opt.value} onClick={() => toggle(opt.value)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-xs select-none text-slate-800 dark:text-slate-200">
                <input type="checkbox" checked={isSelected(opt.value)} readOnly className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-400 pointer-events-none" />
                <span className="truncate">{opt.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
