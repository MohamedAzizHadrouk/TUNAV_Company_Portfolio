import { useEffect, useState } from 'react';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { AssetInput } from '../AssetInput';
import type { SalesArgument } from '../../types/portfolio';

export type SalesArgumentDraft = Omit<SalesArgument, 'id'>;

interface SalesArgumentModalProps {
  open: boolean;
  initial: SalesArgument | null;
  onClose: () => void;
  onSubmit: (values: SalesArgumentDraft) => void;
}

const empty: SalesArgumentDraft = { title: '', description: '', proof: null };

export function SalesArgumentModal({ open, initial, onClose, onSubmit }: SalesArgumentModalProps) {
  const [values, setValues] = useState<SalesArgumentDraft>(empty);

  useEffect(() => {
    if (open) setValues(initial ? { title: initial.title, description: initial.description, proof: initial.proof } : empty);
  }, [open, initial]);

  return (
    <Modal
      open={open}
      title={initial ? 'Edit sales argument' : 'New sales argument'}
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!values.title.trim()} onClick={() => onSubmit({ ...values, title: values.title.trim() })}>Save</button>
        </>
      }>
      
      <div className="flex flex-col gap-4">
        <Field label="Title" htmlFor="sa-title">
          <input id="sa-title" autoFocus className="field" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} placeholder="e.g. Cuts fuel costs by 18%" />
        </Field>
        <Field label="Description" htmlFor="sa-desc">
          <textarea id="sa-desc" rows={3} className="field" value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
        </Field>
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink">Proof of concept</p>
          <AssetInput key={String(open)} id="sa-proof" value={values.proof} onChange={(proof) => setValues({ ...values, proof })} placeholder="Customer result, metric, testimonial…" />
        </div>
      </div>
    </Modal>);

}