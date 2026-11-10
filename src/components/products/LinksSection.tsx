import { useState } from 'react';
import { ArrowUpRightIcon, Link2Icon, PlusIcon, XIcon } from 'lucide-react';
import { EmptyLine, SectionCard } from './SectionCard';
import { createId } from '../../utils/id';
import type { ProductLink } from '../../types/portfolio';

const kinds: {id: ProductLink['kind'];label: string;}[] = [
{ id: 'live', label: 'Live' },
{ id: 'demo', label: 'Demo' },
{ id: 'docs', label: 'Docs' }];


interface LinksSectionProps {
  links: ProductLink[];
  onChange: (links: ProductLink[]) => void;
}

export function LinksSection({ links, onChange }: LinksSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProductLink[]>(links);

  const update = (id: string, patch: Partial<ProductLink>) =>
  setDraft((d) => d.map((l) => l.id === id ? { ...l, ...patch } : l));

  return (
    <SectionCard
      title="Solution & Demo Links"
      icon={Link2Icon}
      editing={editing}
      onEdit={() => {
        setDraft(links);
        setEditing(true);
      }}
      onSave={() => {
        onChange(draft.filter((l) => l.url.trim()));
        setEditing(false);
      }}
      onCancel={() => setEditing(false)}>
      
      {editing ?
      <div className="flex flex-col gap-3">
          {draft.map((l) =>
        <div key={l.id} className="flex flex-col gap-2 rounded-xl bg-canvas p-3">
              <div className="flex gap-2">
                <input aria-label="Link label" className="field" placeholder="Label" value={l.label} onChange={(e) => update(l.id, { label: e.target.value })} />
                <select aria-label="Link type" className="field w-28 shrink-0" value={l.kind} onChange={(e) => update(l.id, { kind: e.target.value as ProductLink['kind'] })}>
                  {kinds.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                </select>
                <button className="icon-btn shrink-0" aria-label="Remove link" onClick={() => setDraft((d) => d.filter((x) => x.id !== l.id))}>
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
              <input aria-label="URL" className="field" placeholder="https://" value={l.url} onChange={(e) => update(l.id, { url: e.target.value })} />
            </div>
        )}
          <button
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-brand hover:text-brand-700"
          onClick={() => setDraft((d) => [...d, { id: createId('l'), label: '', url: '', kind: 'demo' }])}>
          
            <PlusIcon className="h-4 w-4" /> Add link
          </button>
        </div> :
      links.length ?
      <ul className="flex flex-col gap-2">
          {links.map((l) =>
        <li key={l.id}>
              <a
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 transition-colors duration-150 hover:border-brand/40 hover:bg-brand-50">
            
                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand-700 group-hover:bg-white">{l.kind}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{l.label || l.url}</span>
                  <span className="block truncate text-xs text-muted">{l.url}</span>
                </span>
                <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-muted group-hover:text-brand" />
              </a>
            </li>
        )}
        </ul> :

      <EmptyLine>No solution or demo link yet.</EmptyLine>
      }
    </SectionCard>);

}