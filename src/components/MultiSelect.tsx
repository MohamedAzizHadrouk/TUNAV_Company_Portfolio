import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, ChevronDownIcon, SearchIcon, XIcon } from 'lucide-react';

export interface MultiOption {
  value: string;
  label: string;
  hint?: string;
}

interface MultiSelectProps {
  id: string;
  label: string;
  values: string[];
  options: MultiOption[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

/** A searchable list field where one or more options can be ticked. Selected items show as removable chips. */
export function MultiSelect({ id, label, values, options, onChange, placeholder = 'Select…', searchPlaceholder = 'Search', emptyText = 'Nothing matches' }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = values.map((value) => options.find((option) => option.value === value)).filter((option): option is MultiOption => !!option);
  const needle = query.trim().toLowerCase();
  const filtered = useMemo(
    () => options.filter((option) => !needle || option.label.toLowerCase().includes(needle) || (option.hint ?? '').toLowerCase().includes(needle)),
    [options, needle]
  );
  const toggle = (value: string) => onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);

  return (
    <div ref={root} onKeyDown={(event) => { if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); } }}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-ink">{label}</label>
        {selected.length > 0 && <button type="button" className="text-xs font-medium text-muted hover:text-ink" onClick={() => onChange([])}>Clear all</button>}
      </div>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="field mt-1.5 flex min-h-[38px] items-center justify-between gap-2 text-left">
        <span className={selected.length ? 'text-ink' : 'text-slate-400'}>
          {selected.length ? `${selected.length} selected` : placeholder}
        </span>
        <ChevronDownIcon className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {selected.length > 0 &&
      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={`${label}, selected`}>
          {selected.map((option) =>
        <li key={option.value} className="flex max-w-full items-center gap-1 rounded-full bg-brand-50 py-0.5 pl-2.5 pr-1 text-xs text-brand-700">
              <span className="truncate" title={option.label}>{option.label}</span>
              <button type="button" className="rounded-full p-0.5 hover:bg-brand-100" aria-label={`Remove ${option.label}`} onClick={() => toggle(option.value)}>
                <XIcon className="h-3 w-3" />
              </button>
            </li>
        )}
        </ul>
      }

      {open &&
      <div className="mt-2 rounded-lg border border-line bg-white shadow-sm">
          <div className="relative border-b border-line p-1.5">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input autoFocus aria-label={searchPlaceholder} className="field border-transparent bg-canvas pl-8" placeholder={searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <ul role="listbox" aria-multiselectable="true" aria-label={label} className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 && <li className="px-2.5 py-3 text-center text-xs text-muted">{emptyText}</li>}
            {filtered.map((option) => {
            const on = values.includes(option.value);
            return (
              <li key={option.value} role="option" aria-selected={on}>
                  <button type="button" onClick={() => toggle(option.value)} className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm ${on ? 'bg-brand-50' : 'hover:bg-canvas'}`}>
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? 'border-brand bg-brand text-white' : 'border-line bg-white'}`} aria-hidden>
                      {on && <CheckIcon className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-ink">{option.label}</span>
                      {option.hint && <span className="block text-xs text-muted">{option.hint}</span>}
                    </span>
                  </button>
                </li>);
          })}
          </ul>
          <div className="flex items-center justify-between border-t border-line px-3 py-1.5">
            <span className="text-xs text-muted">{selected.length} selected</span>
            <button type="button" className="text-xs font-semibold text-brand hover:underline" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      }
    </div>);
}
