import React, { useEffect, useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { phases } from '../../data/phases';
import { methodologies } from '../../data/scrum';
import type { Methodology, ProductStatus } from '../../types/portfolio';

export interface ProductBasics {
  name: string;
  tagline: string;
  category: string;
  status: ProductStatus;
  methodology: Methodology;
}

interface ProductFormModalProps {
  open: boolean;
  title: string;
  initial?: ProductBasics;
  onClose: () => void;
  onSubmit: (values: ProductBasics) => void;
}

const empty: ProductBasics = { name: '', tagline: '', category: '', status: 'development', methodology: 'scrum' };

export function ProductFormModal({ open, title, initial, onClose, onSubmit }: ProductFormModalProps) {
  const [values, setValues] = useState<ProductBasics>(initial ?? empty);
  const [error, setError] = useState('');

  // Reset only when the modal opens — `initial` may be a fresh object each render.
  useEffect(() => {
    if (open) {
      setValues(initial ?? empty);
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) {
      setError('Product name is required.');
      return;
    }
    onSubmit({ ...values, name: values.name.trim() });
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" type="submit" form="product-form">Save product</button>
        </>
      }>
      
      <form id="product-form" onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Product name" htmlFor="pf-name">
          <input id="pf-name" className="field" value={values.name} autoFocus
          onChange={(e) => setValues({ ...values, name: e.target.value })} placeholder="e.g. Orbit Fleet" />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </Field>
        <Field label="Tagline" htmlFor="pf-tagline">
          <input id="pf-tagline" className="field" value={values.tagline}
          onChange={(e) => setValues({ ...values, tagline: e.target.value })} placeholder="One sentence describing the product" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="pf-category">
            <input id="pf-category" className="field" value={values.category}
            onChange={(e) => setValues({ ...values, category: e.target.value })} placeholder="SaaS, Hardware…" />
          </Field>
          <Field label="Status" htmlFor="pf-status">
            <select id="pf-status" className="field" value={values.status}
            onChange={(e) => setValues({ ...values, status: e.target.value as ProductStatus })}>
              {phases.map((p) =>
              <option key={p.id} value={p.id}>{p.label} Phase</option>
              )}
            </select>
          </Field>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-ink">Development methodology</legend>
          <div role="radiogroup" className="flex flex-col gap-2">
            {methodologies.map((m) => {
              const selected = values.methodology === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setValues({ ...values, methodology: m.id })}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors duration-150 ${
                  selected ? 'border-brand bg-brand-50' : 'border-line hover:border-brand/40'}`
                  }>
                  
                  <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${selected ? 'bg-brand text-white' : 'border border-line'}`}>
                    {selected && <CheckIcon className="h-3 w-3" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{m.label} framework</span>
                    <span className="block text-xs text-muted">{m.description}</span>
                  </span>
                </button>);

            })}
          </div>
        </fieldset>
      </form>
    </Modal>);

}