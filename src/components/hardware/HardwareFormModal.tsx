import { useEffect, useState } from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
import { Modal } from '../Modal';
import { Field } from '../Field';
import type { HardwareItem, Product } from '../../types/portfolio';

export type HardwareDraft = Pick<HardwareItem, 'title' | 'description' | 'purchasePrice' | 'assignments'>;

export function HardwareFormModal({ open, initial, products, onClose, onSubmit }: { open: boolean; initial: HardwareItem | null; products: Product[]; onClose: () => void; onSubmit: (values: HardwareDraft) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [productIds, setProductIds] = useState<string[]>(['']);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setDescription(initial?.description ?? '');
    setPurchasePrice(initial ? String(initial.purchasePrice) : '');
    const ids = initial?.assignments.map((assignment) => assignment.productId) ?? [];
    setProductIds(ids.length ? ids : ['']);
    setError('');
  }, [open, initial]);

  const submit = () => {
    const purchase = Number(purchasePrice.replace(',', '.'));
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!purchasePrice.trim() || !Number.isFinite(purchase) || purchase < 0) { setError('Enter a valid purchase price.'); return; }
    const ids = Array.from(new Set(productIds.filter(Boolean)));
    if (!ids.length) { setError('Choose at least one product.'); return; }
    onSubmit({ title: title.trim(), description: description.trim(), purchasePrice: purchase, assignments: ids.map((productId) => ({ productId })) });
  };

  const selectProduct = (index: number, id: string) => {
    if (id === '__all_products__') setProductIds(products.map((product) => product.id));
    else setProductIds((current) => current.map((value, i) => i === index ? id : value));
  };

  return <Modal open={open} size="lg" title={initial ? 'Edit hardware' : 'Add hardware'} onClose={onClose} footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}>{initial ? 'Save changes' : 'Add hardware'}</button></>}>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><Field label="Title" htmlFor="hw-title"><input id="hw-title" autoFocus className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Orbit T2 4G Tracker" /></Field></div>
      <div className="sm:col-span-2"><Field label="Description" htmlFor="hw-desc"><textarea id="hw-desc" rows={2} className="field" value={description} onChange={(event) => setDescription(event.target.value)} /></Field></div>
      <Field label="Purchase price (TND)" htmlFor="hw-purchase"><input id="hw-purchase" inputMode="decimal" className="field" value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} placeholder="0.000" /></Field>
      <div className="rounded-xl bg-canvas p-3 sm:col-span-2"><p className="mb-2 text-xs font-medium text-ink">Products</p><ul className="space-y-2">{productIds.map((id, index) => <li key={index} className="flex gap-2"><select aria-label={`Product ${index + 1}`} className="field" value={id} onChange={(event) => selectProduct(index, event.target.value)}><option value="">Choose a product…</option>{products.length > 0 && <option value="__all_products__">All Products</option>}{products.filter((product) => product.id === id || !productIds.includes(product.id)).map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><button type="button" className="icon-btn shrink-0" aria-label={`Remove product ${index + 1}`} disabled={productIds.length === 1} onClick={() => setProductIds((current) => current.filter((_, i) => i !== index))}><XIcon className="h-4 w-4" /></button></li>)}</ul>{productIds.length < products.length && <button type="button" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand" onClick={() => setProductIds((current) => [...current, ''])}><PlusIcon className="h-4 w-4" /> Add another product</button>}<p className="mt-2 text-xs text-muted">All Products selects every current product. Set selling prices in Sales Offers.</p></div>
      {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
    </div>
  </Modal>;
}
