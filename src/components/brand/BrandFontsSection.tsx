import { useState } from 'react';
import { PlusIcon, TypeIcon, XIcon } from 'lucide-react';
import { SectionCard, EmptyLine } from '../products/SectionCard';
import { createId } from '../../utils/id';
import type { BrandFont } from '../../types/portfolio';

interface BrandFontsSectionProps {
  fonts: BrandFont[];
  onChange: (fonts: BrandFont[]) => void;
}

export function BrandFontsSection({ fonts, onChange }: BrandFontsSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BrandFont[]>(fonts);
  const update = (id: string, patch: Partial<BrandFont>) => setDraft((d) => d.map((f) => f.id === id ? { ...f, ...patch } : f));

  return (
    <SectionCard
      title="Typography"
      icon={TypeIcon}
      editing={editing}
      onEdit={() => {
        setDraft(fonts);
        setEditing(true);
      }}
      onSave={() => {
        onChange(draft.filter((f) => f.name.trim()));
        setEditing(false);
      }}
      onCancel={() => setEditing(false)}>
      
      {editing ?
      <div className="flex flex-col gap-2">
          {draft.map((f) =>
        <div key={f.id} className="flex items-center gap-2">
              <input aria-label="Font name" className="field" placeholder="Font" value={f.name} onChange={(e) => update(f.id, { name: e.target.value })} />
              <input aria-label="Usage" className="field" placeholder="Usage" value={f.usage} onChange={(e) => update(f.id, { usage: e.target.value })} />
              <button className="icon-btn shrink-0" aria-label="Remove font" onClick={() => setDraft((d) => d.filter((x) => x.id !== f.id))}>
                <XIcon className="h-4 w-4" />
              </button>
            </div>
        )}
          <button className="mt-1 inline-flex items-center gap-1.5 self-start text-sm font-medium text-brand hover:text-brand-700" onClick={() => setDraft((d) => [...d, { id: createId('f'), name: '', usage: '' }])}>
            <PlusIcon className="h-4 w-4" /> Add font
          </button>
        </div> :
      fonts.length ?
      <ul className="flex flex-col divide-y divide-line">
          {fonts.map((f) =>
        <li key={f.id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-2xl font-semibold text-ink" style={{ fontFamily: `'${f.name}', sans-serif` }}>Aa</p>
              <p className="text-sm font-medium text-ink">{f.name}</p>
              <p className="text-xs text-muted">{f.usage}</p>
            </li>
        )}
        </ul> :

      <EmptyLine>No typefaces defined.</EmptyLine>
      }
    </SectionCard>);

}