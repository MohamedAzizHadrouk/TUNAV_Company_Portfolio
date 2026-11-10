import { useEffect, useState } from 'react';
import { PencilIcon, PlusIcon, Trash2Icon, XIcon } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { AssetInput } from '../AssetInput';
import { AssetView } from '../AssetView';
import { createId, today } from '../../utils/id';
import type { Asset, AsIsItem, Product } from '../../types/portfolio';

interface AsIsPanelProps {
  product: Product;
  update: (fn: (p: Product) => Product) => void;
  openCreate: boolean;
  onCreateOpened: () => void;
}

/** The As-is owner lists what the product already does. Everything here counts as implemented. */
export function AsIsPanel({ product, update, openCreate, onCreateOpened }: AsIsPanelProps) {
  const [editing, setEditing] = useState<AsIsItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<AsIsItem | null>(null);
  const [notice, setNotice] = useState('');
  const imported = new Set(product.capabilities.map((capability) => capability.asIsId).filter(Boolean));

  useEffect(() => {
    if (!openCreate) return;
    setEditing(null);
    setCreating(true);
    onCreateOpened();
  }, [openCreate, onCreateOpened]);

  const save = (values: Pick<AsIsItem, 'title' | 'description' | 'documents'>) => {
    if (editing) {
      update((p) => ({ ...p, asIs: p.asIs.map((item) => item.id === editing.id ? { ...item, ...values } : item) }));
      setNotice('As-is capability updated.');
    } else {
      update((p) => ({ ...p, asIs: [...p.asIs, { ...values, id: createId('asis'), addedAt: today() }] }));
      setNotice('As-is capability added.');
    }
    setEditing(null);
    setCreating(false);
  };

  const remove = () => {
    if (!removing) return;
    const id = removing.id;
    update((p) => ({ ...p, asIs: p.asIs.filter((item) => item.id !== id) }));
    setRemoving(null);
    setNotice('As-is capability deleted. Capabilities already imported into the register were kept.');
  };

  return (
    <>
      {notice && <p role="status" className="mb-3 text-sm text-emerald-700">{notice}</p>}
      <p className="mb-3 text-sm text-muted">What the product already does today. The As-is owner fills this in; every entry counts as implemented and can be imported into the capability register.</p>

      {product.asIs.length === 0 ?
      <EmptyState
        title="No As-is capabilities yet"
        description="Record each capability that is already in place, with a description and optional documents."
        action={<button className="btn-primary" onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" /> Add As-is capability</button>} /> :

      <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Capability</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Documents</th>
                <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {product.asIs.map((item) =>
            <tr key={item.id} className="align-top">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="mt-1 flex flex-wrap gap-1">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />Implemented</span>
                      {imported.has(item.id) && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">In register</span>}
                    </p>
                  </td>
                  <td className="max-w-[360px] px-3 py-2.5 text-muted"><p className="line-clamp-3 whitespace-pre-line">{item.description || '—'}</p></td>
                  <td className="max-w-[240px] px-3 py-2.5">
                    {item.documents.length === 0 ?
                <span className="text-muted">—</span> :
                <ul className="flex flex-col gap-1">{item.documents.map((doc, index) => <li key={index} className="min-w-0"><AssetView asset={doc} /></li>)}</ul>
                }
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button className="icon-btn" aria-label={`Edit ${item.title}`} onClick={() => setEditing(item)}><PencilIcon className="h-3.5 w-3.5" /></button>
                      <button className="icon-btn hover:text-red-600" aria-label={`Delete ${item.title}`} onClick={() => setRemoving(item)}><Trash2Icon className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
            )}
            </tbody>
          </table>
        </div>
      }

      {(creating || editing) &&
      <AsIsModal initial={editing} onClose={() => { setCreating(false); setEditing(null); }} onSubmit={save} />
      }

      <Modal
        open={removing !== null}
        title="Delete As-is capability"
        onClose={() => setRemoving(null)}
        footer={
        <>
            <button className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
            <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={remove}>Delete</button>
          </>
        }>
        <p className="text-sm text-muted">
          Delete <span className="font-medium text-ink">{removing?.title}</span> and its documents? Capabilities already imported into the register stay there.
        </p>
      </Modal>
    </>);

}

function AsIsModal({ initial, onClose, onSubmit }: {
  initial: AsIsItem | null;
  onClose: () => void;
  onSubmit: (values: Pick<AsIsItem, 'title' | 'description' | 'documents'>) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [documents, setDocuments] = useState<Asset[]>(initial?.documents ?? []);
  const [pending, setPending] = useState<Asset | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [error, setError] = useState('');

  const addDocument = () => {
    if (!pending) return;
    setDocuments((current) => [...current, pending]);
    setPending(null);
    setInputKey((key) => key + 1);
  };

  const submit = () => {
    if (!title.trim()) {
      setError('Enter the capability title.');
      return;
    }
    // A document picked but not yet added with the button still counts.
    onSubmit({ title: title.trim(), description: description.trim(), documents: pending ? [...documents, pending] : documents });
  };

  return (
    <Modal
      open
      size="lg"
      title={initial ? 'Edit As-is capability' : 'Add As-is capability'}
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit}>{initial ? 'Save changes' : 'Add capability'}</button>
        </>
      }>
      <div className="flex flex-col gap-3">
        <Field label="Capability title" htmlFor="asis-title">
          <input id="asis-title" autoFocus className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Live GPS position every 2 seconds" />
        </Field>
        <Field label="Description" htmlFor="asis-description">
          <textarea id="asis-description" className="field min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What the product does today" />
        </Field>
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink">Documents <span className="font-normal text-muted">(optional, one or more)</span></p>
          {documents.length > 0 &&
          <ul className="mb-2 flex flex-col gap-1.5">
              {documents.map((doc, index) =>
            <li key={index} className="flex items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-1.5">
                  <span className="min-w-0 truncate"><AssetView asset={doc} /></span>
                  <button type="button" className="icon-btn shrink-0" aria-label="Remove document" onClick={() => setDocuments((current) => current.filter((_, i) => i !== index))}><XIcon className="h-3.5 w-3.5" /></button>
                </li>
            )}
            </ul>
          }
          <AssetInput key={inputKey} id="asis-document" value={pending} onChange={setPending} kinds={['url', 'file']} />
          <button type="button" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand disabled:text-muted" disabled={!pending} onClick={addDocument}>
            <PlusIcon className="h-4 w-4" /> Add document
          </button>
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>);

}
