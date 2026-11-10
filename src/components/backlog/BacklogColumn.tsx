import React, { useEffect, useRef, useState } from 'react';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';

export interface ColumnCheck {
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
}

export interface ColumnItem {
  id: string;
  title: string;
  meta: string;
  description?: string;
}

interface BacklogColumnProps {
  title: string;
  items: ColumnItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (title: string) => void;
  onUpdate?: (id: string, title: string, description: string) => void;
  onDelete: (id: string) => void;
  addPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
  checks?: Record<string, ColumnCheck>;
  onToggleCheck?: (id: string) => void;
}

export function BacklogColumn({ title, items, selectedId, onSelect, onAdd, onUpdate, onDelete, addPlaceholder, emptyText, disabled, checks, onToggleCheck }: BacklogColumnProps) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft('');
  };

  const startEdit = (item: ColumnItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description ?? '');
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editTitle.trim() || !onUpdate) return;
    onUpdate(editingId, editTitle.trim(), editDescription.trim());
    setEditingId(null);
  };

  return (
    <section aria-label={title} className="flex max-h-[560px] min-h-[280px] flex-col rounded-xl border border-line bg-white">
      <header className="flex items-center justify-between border-b border-line px-3 py-2">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <span className="text-xs tabular-nums text-muted">{items.length}</span>
      </header>
      <ul className="flex-1 overflow-y-auto p-1.5">
        {items.length === 0 && <li className="px-2 py-4 text-center text-xs text-muted">{emptyText}</li>}
        {items.map((item) => {
          const active = item.id === selectedId;
          if (editingId === item.id) {
            return (
              <li key={item.id} className="p-1">
                <form onSubmit={saveEdit} className="flex flex-col gap-1.5 rounded-lg bg-canvas p-2">
                  <input aria-label="Title" className="field" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                  <textarea aria-label="Description" className="field min-h-[52px]" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Description" />
                  <div className="flex justify-end gap-1">
                    <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={() => setEditingId(null)}>Cancel</button>
                    <button type="submit" className="btn-primary px-2 py-1 text-xs">Save</button>
                  </div>
                </form>
              </li>);

          }
          const check = checks?.[item.id];
          return (
            <li key={item.id} className="group relative flex items-start">
              {check && onToggleCheck &&
              <ColumnCheckbox
                label={`Select ${item.title}`}
                checked={check.checked}
                indeterminate={check.indeterminate}
                disabled={check.disabled}
                onChange={() => onToggleCheck(item.id)} />
              }
              <button
                onClick={() => onSelect(item.id)}
                aria-current={active}
                className={`min-w-0 flex-1 rounded-lg px-2.5 py-2 pr-14 text-left transition-colors duration-150 ${
                active ? 'bg-brand-50' : 'hover:bg-canvas'}`
                }>
                
                <p className={`text-sm font-medium ${active ? 'text-brand-700' : 'text-ink'}`}>{item.title}</p>
                {item.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{item.description}</p>}
                <p className="mt-0.5 text-xs text-muted">{item.meta}</p>
              </button>
              <div className="absolute right-1 top-1.5 flex opacity-0 focus-within:opacity-100 group-hover:opacity-100">
                {onUpdate &&
                <button className="icon-btn h-7 w-7" aria-label={`Edit ${item.title}`} onClick={() => startEdit(item)}>
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                }
                <button
                  className="icon-btn h-7 w-7 hover:text-red-600"
                  aria-label={`Delete ${item.title}`}
                  onClick={() => {
                    if (window.confirm(`Delete “${item.title}”? Child items are removed. Linked capabilities stay, without this backlog link.`)) onDelete(item.id);
                  }}>
                  
                  <Trash2Icon className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>);

        })}
      </ul>
      <form onSubmit={submit} className="flex items-center gap-1 border-t border-line p-1.5">
        <input
          aria-label={addPlaceholder}
          className="field border-transparent bg-canvas"
          placeholder={addPlaceholder}
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)} />
        
        <button type="submit" className="icon-btn shrink-0 text-brand" aria-label={addPlaceholder} disabled={disabled}>
          <PlusIcon className="h-4 w-4" />
        </button>
      </form>
    </section>);

}

function ColumnCheckbox({ label, checked, indeterminate, disabled, onChange }: {
  label: string;
  checked: boolean;
  indeterminate: boolean;
  disabled: boolean;
  onChange: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      className="mt-3 ml-1 shrink-0"
      checked={checked}
      disabled={disabled}
      onChange={onChange} />);

}
