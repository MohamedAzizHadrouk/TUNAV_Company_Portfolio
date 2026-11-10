import { useState } from "react";
import { PlusIcon, XIcon, type LucideIcon } from "lucide-react";
import { EmptyLine, SectionCard } from "./SectionCard";
interface ListSectionProps {
  title: string;
  icon: LucideIcon;
  items: string[];
  placeholder: string;
  emptyText: string;
  onChange: (items: string[]) => void;
}
export function ListSection({
  title,
  icon,
  items,
  placeholder,
  emptyText,
  onChange
}: ListSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(items);
  const [input, setInput] = useState('');
  const start = () => {
    setDraft(items);
    setInput('');
    setEditing(true);
  };
  const add = () => {
    if (!input.trim()) return;
    setDraft((d) => [...d, input.trim()]);
    setInput('');
  };
  const save = () => {
    const pending = input.trim() ? [...draft, input.trim()] : draft;
    onChange(pending);
    setEditing(false);
  };
  return <SectionCard title={title} icon={icon} editing={editing} onEdit={start} onSave={save} onCancel={() => setEditing(false)}>
      {editing ? <div className="flex flex-col gap-2">
          {draft.map((item, i) => <div key={i} className="flex items-center gap-2">
              <input aria-label={`${title} item ${i + 1}`} className="field" value={item} onChange={(e) => setDraft((d) => d.map((x, j) => j === i ? e.target.value : x))} />
              <button className="icon-btn shrink-0" aria-label="Remove item" onClick={() => setDraft((d) => d.filter((_, j) => j !== i))}>
                <XIcon className="h-4 w-4" />
              </button>
            </div>)}
          <div className="flex items-center gap-2">
            <input aria-label={`Add to ${title}`} className="field" placeholder={placeholder} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }} />
            <button className="icon-btn shrink-0 text-brand" aria-label="Add item" onClick={add}>
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div> : items.length ? <ul className="flex flex-col gap-2">
          {items.map((item, i) => <li key={i} className="flex gap-2.5 text-sm text-ink">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
              {item}
            </li>)}
        </ul> : <EmptyLine>{emptyText}</EmptyLine>}
    </SectionCard>;
}
