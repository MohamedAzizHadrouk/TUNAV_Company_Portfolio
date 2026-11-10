import { useState } from 'react';
import { CheckIcon, CopyIcon, DropletIcon, PlusIcon, XIcon } from 'lucide-react';
import { SectionCard, EmptyLine } from '../products/SectionCard';
import { createId } from '../../utils/id';
import type { BrandColor } from '../../types/portfolio';

interface BrandColorsSectionProps {
  colors: BrandColor[];
  onChange: (colors: BrandColor[]) => void;
}

export function BrandColorsSection({ colors, onChange }: BrandColorsSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BrandColor[]>(colors);
  const [copied, setCopied] = useState<string | null>(null);

  const update = (id: string, patch: Partial<BrandColor>) => setDraft((d) => d.map((c) => c.id === id ? { ...c, ...patch } : c));

  const copy = (c: BrandColor) => {
    navigator.clipboard?.writeText(c.hex).catch(() => undefined);
    setCopied(c.id);
    window.setTimeout(() => setCopied(null), 1400);
  };

  return (
    <SectionCard
      title="Color Palette"
      icon={DropletIcon}
      editing={editing}
      onEdit={() => {
        setDraft(colors);
        setEditing(true);
      }}
      onSave={() => {
        onChange(draft);
        setEditing(false);
      }}
      onCancel={() => setEditing(false)}>
      
      {editing ?
      <div className="flex flex-col gap-2">
          {draft.map((c) =>
        <div key={c.id} className="flex items-center gap-2">
              <input type="color" aria-label="Color" value={c.hex} onChange={(e) => update(c.id, { hex: e.target.value.toUpperCase() })} className="h-9 w-10 shrink-0 cursor-pointer rounded border border-line" />
              <input aria-label="Color name" className="field" value={c.name} placeholder="Name" onChange={(e) => update(c.id, { name: e.target.value })} />
              <input aria-label="Color role" className="field" value={c.role} placeholder="Role" onChange={(e) => update(c.id, { role: e.target.value })} />
              <button className="icon-btn shrink-0" aria-label="Remove color" onClick={() => setDraft((d) => d.filter((x) => x.id !== c.id))}>
                <XIcon className="h-4 w-4" />
              </button>
            </div>
        )}
          <button className="mt-1 inline-flex items-center gap-1.5 self-start text-sm font-medium text-brand hover:text-brand-700" onClick={() => setDraft((d) => [...d, { id: createId('c'), name: '', hex: '#0A3DFF', role: '' }])}>
            <PlusIcon className="h-4 w-4" /> Add color
          </button>
        </div> :
      colors.length ?
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {colors.map((c) =>
        <li key={c.id} className="overflow-hidden rounded-xl border border-line">
              <div className="h-24" style={{ background: c.hex }} />
              <div className="flex items-start justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{c.name || 'Unnamed'}</p>
                  <p className="text-xs text-muted">{c.role} · <span className="font-mono">{c.hex}</span></p>
                </div>
                <button className="icon-btn -mr-1 -mt-1 h-7 w-7 shrink-0" aria-label={`Copy ${c.hex}`} onClick={() => copy(c)}>
                  {copied === c.id ? <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> : <CopyIcon className="h-3.5 w-3.5" />}
                </button>
              </div>
            </li>
        )}
        </ul> :

      <EmptyLine>No brand colors defined.</EmptyLine>
      }
    </SectionCard>);

}