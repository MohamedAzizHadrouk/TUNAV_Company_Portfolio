import { useEffect, useState } from 'react';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { AssetInput } from '../AssetInput';
import { showcaseCategories } from '../../data/showcase';
import type { Asset, ShowcaseCategory, ShowcaseItem } from '../../types/portfolio';

export type ShowcaseDraft = Omit<ShowcaseItem, 'id' | 'addedAt'>;

interface ShowcaseItemModalProps {
  open: boolean;
  initial: ShowcaseItem | null;
  defaultCategory: ShowcaseCategory;
  onClose: () => void;
  onSubmit: (values: ShowcaseDraft) => void;
}

export function ShowcaseItemModal({ open, initial, defaultCategory, onClose, onSubmit }: ShowcaseItemModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ShowcaseCategory>(defaultCategory);
  const [asset, setAsset] = useState<Asset | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setCategory(initial?.category ?? defaultCategory);
    setAsset(initial?.asset ?? null);
  }, [open, initial, defaultCategory]);

  return (
    <Modal
      open={open}
      title={initial ? 'Edit showcase item' : 'Add to showcase'}
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
          className="btn-primary"
          disabled={!title.trim() || !asset?.value}
          onClick={() => asset && onSubmit({ title: title.trim(), description: description.trim(), category, asset })}>
          
            Save
          </button>
        </>
      }>
      
      <div className="flex flex-col gap-4">
        <Field label="Category" htmlFor="sc-cat">
          <select id="sc-cat" className="field" value={category} onChange={(e) => setCategory(e.target.value as ShowcaseCategory)}>
            {showcaseCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Title" htmlFor="sc-title">
          <input id="sc-title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Description" htmlFor="sc-desc">
          <textarea id="sc-desc" rows={2} className="field" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink">Resource</p>
          <AssetInput key={String(open)} id="sc-asset" kinds={['url', 'file']} value={asset} onChange={setAsset} />
        </div>
      </div>
    </Modal>);

}