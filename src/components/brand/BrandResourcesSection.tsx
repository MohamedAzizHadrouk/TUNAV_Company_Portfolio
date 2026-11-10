import { useState } from 'react';
import { FileTextIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { AssetInput } from '../AssetInput';
import { AssetView } from '../AssetView';
import { Modal } from '../Modal';
import { createId } from '../../utils/id';
import type { Asset, BrandResource } from '../../types/portfolio';

interface Props {
  resources: BrandResource[];
  onChange: (resources: BrandResource[]) => void;
}

export function BrandResourcesSection({ resources, onChange }: Props) {
  const [editing, setEditing] = useState<BrandResource | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<BrandResource | null>(null);

  const save = (title: string, asset: Asset) => {
    if (editing) {
      onChange(resources.map((resource) => resource.id === editing.id ? { ...resource, title, asset } : resource));
      setEditing(null);
    } else {
      onChange([...resources, { id: createId('brand-resource'), title, asset }]);
      setAdding(false);
    }
  };

  return (
    <section aria-label="Brand documents and links" className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <FileTextIcon className="h-4 w-4 text-brand" /> Brand documents & links
          </h2>
          <p className="mt-1 text-sm text-muted">Keep brand guidelines, assets, and reference links together.</p>
        </div>
        <button type="button" className="btn-ghost" onClick={() => setAdding(true)}>
          <PlusIcon className="h-4 w-4" /> Add document or link
        </button>
      </div>

      {resources.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-line bg-canvas px-4 py-5 text-sm text-muted">
          No brand documents or links yet.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
          {resources.map((resource) => (
            <li key={resource.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{resource.title}</p>
                <div className="mt-1"><AssetView asset={resource.asset} /></div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" className="icon-btn" aria-label={`Edit ${resource.title}`} onClick={() => setEditing(resource)}><PencilIcon className="h-4 w-4" /></button>
                <button type="button" className="icon-btn hover:text-red-600" aria-label={`Delete ${resource.title}`} onClick={() => setRemoving(resource)}><Trash2Icon className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(adding || editing) && (
        <ResourceDialog
          key={editing?.id ?? 'new'}
          resource={editing}
          onClose={() => { setAdding(false); setEditing(null); }}
          onSave={save}
        />
      )}
      <Modal
        open={Boolean(removing)}
        title="Delete brand resource"
        onClose={() => setRemoving(null)}
        footer={<>
          <button type="button" className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
          <button type="button" className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => {
            if (removing) onChange(resources.filter((resource) => resource.id !== removing.id));
            setRemoving(null);
          }}>Delete</button>
        </>}
      >
        <p className="text-sm text-muted">Delete {removing?.title}?</p>
      </Modal>
    </section>
  );
}

function ResourceDialog({ resource, onClose, onSave }: {
  resource: BrandResource | null;
  onClose: () => void;
  onSave: (title: string, asset: Asset) => void;
}) {
  const [title, setTitle] = useState(resource?.title ?? '');
  const [asset, setAsset] = useState<Asset | null>(resource?.asset ?? null);
  const [error, setError] = useState('');

  const save = () => {
    if (!title.trim() || !asset?.value.trim()) {
      setError('Add a title and choose a document or enter a URL.');
      return;
    }
    if (asset.kind === 'url') {
      try {
        const url = new URL(asset.value.trim());
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
      } catch {
        setError('Enter a valid http:// or https:// URL.');
        return;
      }
    }
    onSave(title.trim(), asset.kind === 'url' ? { ...asset, value: asset.value.trim() } : asset);
  };

  return (
    <Modal
      open
      title={resource ? 'Edit brand document or link' : 'Add brand document or link'}
      onClose={onClose}
      footer={<>
        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={save}>Save</button>
      </>}
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Title</span>
          <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Brand guidelines" />
        </label>
        <div className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-ink">Document or URL</span>
          <AssetInput id="brand-resource-asset" kinds={['file', 'url']} value={asset} onChange={setAsset} />
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
