import { useEffect, useState } from 'react';
import { Modal } from '../Modal';
import { Field } from '../Field';
import type { HardwareItem, SalesOffer } from '../../types/portfolio';
import { formatOfferPrice } from '../../utils/currency';

export type SalesOfferDraft = Omit<SalesOffer, 'id'>;

interface SalesOfferModalProps {
  open: boolean;
  initial: SalesOffer | null;
  hardware: HardwareItem[];
  defaultType?: NonNullable<SalesOffer['type']>;
  onClose: () => void;
  onSubmit: (values: SalesOfferDraft) => void;
}

export function SalesOfferModal({ open, initial, hardware, defaultType = 'subscription', onClose, onSubmit }: SalesOfferModalProps) {
  const [type, setType] = useState<NonNullable<SalesOffer['type']>>('subscription');
  const [hardwareId, setHardwareId] = useState('');
  const [plan, setPlan] = useState('');
  const [price, setPrice] = useState('');
  const [billing, setBilling] = useState('');
  const [description, setDescription] = useState('');
  const [includes, setIncludes] = useState('');

  useEffect(() => {
    if (!open) return;
    setType(initial?.type ?? defaultType);
    setHardwareId(initial?.hardwareId ?? '');
    setPlan(initial?.plan ?? '');
    setPrice(initial ? formatOfferPrice(initial.price) : '');
    setBilling(initial?.billing ?? '');
    setDescription(initial?.description ?? '');
    setIncludes(initial?.includes.join('\n') ?? '');
  }, [open, initial, defaultType]);

  return (
    <Modal
      open={open}
      title={initial ? 'Edit offer' : 'New offer'}
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
          className="btn-primary"
          disabled={!plan.trim()}
          onClick={() =>
          onSubmit({
            type,
            hardwareId: type === 'hardware' ? hardwareId || null : null,
            plan: plan.trim(),
            price: formatOfferPrice(price),
            billing: billing.trim(),
            description: description.trim(),
            includes: includes.split('\n').map((l) => l.trim()).filter(Boolean)
          })
          }>
          
            Save offer
          </button>
        </>
      }>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Offer type" htmlFor="of-type"><select id="of-type" className="field" value={type} onChange={(event) => setType(event.target.value as NonNullable<SalesOffer['type']>)}><option value="subscription">Subscription Offer</option><option value="installation">Installation Offer</option><option value="hardware">Hardware Offer</option></select></Field></div>
        {type === 'hardware' && <div className="sm:col-span-2"><Field label="Hardware item — optional" htmlFor="of-hardware"><select id="of-hardware" className="field" value={hardwareId} onChange={(event) => { const id = event.target.value; setHardwareId(id); if (!plan.trim()) setPlan(hardware.find((item) => item.id === id)?.title ?? ''); }}><option value="">Choose hardware…</option>{hardware.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field></div>}
        <div className="sm:col-span-2">
          <Field label="Plan name" htmlFor="of-plan">
            <input id="of-plan" autoFocus className="field" value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="e.g. Business" />
          </Field>
        </div>
        <Field label="Price (TND)" htmlFor="of-price">
          <input id="of-price" className="field" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="19 TND or Custom" />
        </Field>
        <Field label="Billing" htmlFor="of-billing">
          <input id="of-billing" className="field" value={billing} onChange={(e) => setBilling(e.target.value)} placeholder="per user / month" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Description" htmlFor="of-desc">
            <input id="of-desc" className="field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Who this offer is for" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="What's included" htmlFor="of-includes" hint="One item per line.">
            <textarea id="of-includes" rows={4} className="field" value={includes} onChange={(e) => setIncludes(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>);

}
