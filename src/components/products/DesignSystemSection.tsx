import { useState } from 'react';
import { ExternalLinkIcon, LayersIcon, PlusIcon, XIcon } from 'lucide-react';
import { EmptyLine, SectionCard } from './SectionCard';
import { Field } from '../Field';
import type { ProductDesignSystem } from '../../types/portfolio';

interface DesignSystemSectionProps {
  value: ProductDesignSystem;
  onChange: (value: ProductDesignSystem) => void;
}

export function DesignSystemSection({ value, onChange }: DesignSystemSectionProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProductDesignSystem>(value);
  const [hex, setHex] = useState('#0A3DFF');

  const isEmpty = !value.colors.length && !value.typography && !value.notes && !value.figmaUrl;

  return (
    <SectionCard
      title="Design System"
      icon={LayersIcon}
      editing={editing}
      onEdit={() => {
        setDraft(value);
        setEditing(true);
      }}
      onSave={() => {
        onChange(draft);
        setEditing(false);
      }}
      onCancel={() => setEditing(false)}>
      
      {editing ?
      <div className="flex flex-col gap-4">
          <div>
            <p className="mb-1.5 text-xs font-medium text-ink">Colors</p>
            <div className="flex flex-wrap items-center gap-2">
              {draft.colors.map((c, i) =>
            <span key={`${c}-${i}`} className="inline-flex items-center gap-1.5 rounded-full border border-line py-1 pl-1 pr-2 text-xs">
                  <span className="h-4 w-4 rounded-full border border-line" style={{ background: c }} />
                  {c}
                  <button aria-label={`Remove ${c}`} onClick={() => setDraft({ ...draft, colors: draft.colors.filter((_, j) => j !== i) })}>
                    <XIcon className="h-3 w-3 text-muted" />
                  </button>
                </span>
            )}
              <span className="inline-flex items-center gap-1">
                <input type="color" aria-label="Pick color" value={hex} onChange={(e) => setHex(e.target.value)} className="h-7 w-7 cursor-pointer rounded border border-line" />
                <button className="icon-btn text-brand" aria-label="Add color" onClick={() => setDraft({ ...draft, colors: [...draft.colors, hex.toUpperCase()] })}>
                  <PlusIcon className="h-4 w-4" />
                </button>
              </span>
            </div>
          </div>
          <Field label="Typography" htmlFor="ds-type">
            <input id="ds-type" className="field" value={draft.typography} onChange={(e) => setDraft({ ...draft, typography: e.target.value })} />
          </Field>
          <Field label="Figma / design file URL" htmlFor="ds-figma">
            <input id="ds-figma" className="field" value={draft.figmaUrl} onChange={(e) => setDraft({ ...draft, figmaUrl: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="Guidelines" htmlFor="ds-notes">
            <textarea id="ds-notes" rows={3} className="field" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </Field>
        </div> :
      isEmpty ?
      <EmptyLine>No design system documented.</EmptyLine> :

      <div className="flex flex-col gap-4">
          {value.colors.length > 0 &&
        <div className="flex overflow-hidden rounded-lg border border-line">
              {value.colors.map((c, i) =>
          <div key={`${c}-${i}`} className="flex-1">
                  <div className="h-10" style={{ background: c }} />
                  <p className="truncate px-2 py-1 text-[11px] font-medium text-muted">{c}</p>
                </div>
          )}
            </div>
        }
          {value.typography &&
        <p className="text-sm text-ink"><span className="text-muted">Type · </span>{value.typography}</p>
        }
          {value.notes && <p className="text-sm text-muted">{value.notes}</p>}
          {value.figmaUrl &&
        <a href={value.figmaUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-brand hover:text-brand-700">
              Open design file <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
        }
        </div>
      }
    </SectionCard>);

}