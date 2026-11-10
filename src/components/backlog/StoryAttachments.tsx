import { useState } from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
import { AssetInput } from '../AssetInput';
import { AssetView } from '../AssetView';
import { createId } from '../../utils/id';
import type { Asset, StoryAttachment } from '../../types/portfolio';

interface StoryAttachmentsProps {
  attachments: StoryAttachment[];
  onChange: (attachments: StoryAttachment[]) => void;
}

export function StoryAttachments({ attachments, onChange }: StoryAttachmentsProps) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [asset, setAsset] = useState<Asset | null>(null);

  const add = () => {
    if (!asset?.value) return;
    onChange([...attachments, { id: createId('at'), label: label.trim() || asset.fileName || 'Document', asset }]);
    setLabel('');
    setAsset(null);
    setAdding(false);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-medium text-ink">Documents</h3>
        {!adding &&
        <button className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-700" onClick={() => setAdding(true)}>
            <PlusIcon className="h-3.5 w-3.5" /> Attach
          </button>
        }
      </div>

      {attachments.length === 0 && !adding &&
      <p className="text-sm text-muted">No documents attached. Add specs, mockups or references that describe this story.</p>
      }

      {attachments.length > 0 &&
      <ul className="flex flex-col gap-1.5">
          {attachments.map((a) =>
        <li key={a.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{a.label}</p>
                <AssetView asset={a.asset} />
              </div>
              <button className="icon-btn h-7 w-7 shrink-0" aria-label={`Remove ${a.label}`} onClick={() => onChange(attachments.filter((x) => x.id !== a.id))}>
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </li>
        )}
        </ul>
      }

      {adding &&
      <div className="mt-2 flex flex-col gap-2 rounded-lg bg-canvas p-3">
          <input aria-label="Document name" className="field" placeholder="Document name, e.g. Acceptance criteria" value={label} onChange={(e) => setLabel(e.target.value)} />
          <AssetInput id="story-attachment" kinds={['file', 'url']} value={asset} onChange={setAsset} />
          <div className="flex justify-end gap-2">
            <button className="rounded-md px-2.5 py-1 text-xs font-medium text-muted hover:text-ink" onClick={() => {setAdding(false);setAsset(null);setLabel('');}}>
              Cancel
            </button>
            <button className="btn-primary px-3 py-1 text-xs" disabled={!asset?.value} onClick={add}>Attach document</button>
          </div>
        </div>
      }
    </div>);

}