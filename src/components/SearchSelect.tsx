import { useMemo, useState } from 'react';

interface SearchSelectProps {
  id: string;
  label: string;
  value: string;
  options: {value: string;label: string;}[];
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
}

export function SearchSelect({ id, label, value, options, onChange, placeholder = 'Search', emptyText = 'Nothing matches' }: SearchSelectProps) {
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const filtered = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query]
  );

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-ink">{label}</label>
      <input
        id={id}
        className="field"
        placeholder={selected && !query ? selected.label : placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-controls={`${id}-results`} />
      
      <div id={`${id}-results`} className="max-h-36 overflow-y-auto rounded-lg border border-line">
        {filtered.length === 0 && <p className="px-2.5 py-2 text-sm text-muted">{emptyText}</p>}
        {filtered.map((option) =>
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => {
            onChange(option.value);
            setQuery('');
          }}
          className={`block w-full px-2.5 py-1.5 text-left text-sm ${
          option.value === value ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink hover:bg-canvas'}`
          }>
          
            {option.label}
          </button>
        )}
      </div>
      {selected && <p className="text-xs text-muted">Selected: {selected.label}</p>}
    </div>);

}
