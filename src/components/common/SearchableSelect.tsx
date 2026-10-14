// @id 01M4W0CMMN0000000000000004
// @related 01M4W0TYPE0000000000000001, 01M4V0FH069WB44ZWJCRPYR4FA
'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';

interface OptionItem {
  value: string | number;
  label: string;
}

interface SearchableSelectProps {
  value?: string | number;
  options?: unknown[];
  placeholder?: string;
  allLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  onChange?: (val: string | number) => void;
}

const norm = (s: unknown) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function SearchableSelect({
  value = '',
  options = [],
  placeholder = 'Chọn hoặc tìm kiếm...',
  allLabel = '',
  disabled = false,
  loading = false,
  onChange
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const normOptions = useMemo<OptionItem[]>(() => {
    return (options || []).map((opt) => {
      if (typeof opt === 'string' || typeof opt === 'number') return { value: opt, label: String(opt) };
      const o = opt as Record<string, unknown>;
      const val = (o.name ?? o.value ?? o.code ?? '') as string | number;
      const lbl = (o.name ?? o.label ?? o.code ?? '') as string;
      return { value: val, label: String(lbl) };
    });
  }, [options]);

  const selectedLabel = useMemo(() => {
    if (!value) return allLabel || placeholder;
    const found = normOptions.find((o) => String(o.value) === String(value));
    return found ? found.label : String(value);
  }, [value, allLabel, placeholder, normOptions]);

  const filteredList = useMemo(() => {
    const q = norm(search.trim());
    if (!q) return normOptions;
    return normOptions.filter((o) => norm(o.label).includes(q) || norm(o.value).includes(q));
  }, [normOptions, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const selectItem = (val: string | number) => {
    onChange?.(val);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => {
          if (disabled || loading) return;
          setIsOpen((p) => {
            if (!p) {
              setSearch('');
              setTimeout(() => inputRef.current?.focus(), 20);
            }
            return !p;
          });
        }}
        disabled={disabled || loading}
        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-left flex items-center justify-between transition focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <span className={`truncate ${value ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-500'}`}>
          {loading ? 'Đang nạp dữ liệu...' : selectedLabel}
        </span>
        <span className="text-slate-400 text-[10px] ml-1 flex-shrink-0">▼</span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-1.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <input ref={inputRef} value={search} onChange={(e) => setSearch(e.target.value)} type="text" placeholder="Gõ để tìm nhanh..." className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="overflow-y-auto max-h-48 py-1 text-xs divide-y divide-slate-50 dark:divide-slate-700/50">
            {allLabel && (
              <div onClick={() => selectItem('')} className={`px-3 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer font-semibold text-indigo-700 dark:text-indigo-400 flex items-center justify-between ${!value ? 'bg-indigo-50 dark:bg-indigo-950/40' : ''}`}>
                <span>{allLabel}</span>
                {!value && <span className="text-indigo-600 font-bold">✓</span>}
              </div>
            )}
            {filteredList.length === 0 && <div className="px-3 py-2 text-center text-slate-400 italic">Không tìm thấy kết quả</div>}
            {filteredList.map((item) => (
              <div key={String(item.value)} onClick={() => selectItem(item.value)} className={`px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer text-slate-800 dark:text-slate-200 flex items-center justify-between ${String(value) === String(item.value) ? 'bg-indigo-50 dark:bg-indigo-950/40 font-medium text-indigo-700 dark:text-indigo-400' : ''}`}>
                <span className="truncate">{item.label}</span>
                {String(value) === String(item.value) && <span className="text-indigo-600 font-bold text-xs">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
