import { useState } from 'react';
import { CheckIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useProduct } from '../../hooks/useProduct';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useAccess } from '../../contexts/AccessContext';
import { ProductNotFound } from '../../components/products/ProductNotFound';
import { ProductSubpage } from '../../components/products/ProductSubpage';
import { EmptyState } from '../../components/EmptyState';
import { SalesOfferModal, type SalesOfferDraft } from '../../components/sales/SalesOfferModal';
import { createId } from '../../utils/id';
import type { SalesOffer } from '../../types/portfolio';
import { formatOfferPrice } from '../../utils/currency';

const categories = [
  { id: 'subscription', label: 'Subscription Offer', description: 'Recurring access and service plans.' },
  { id: 'installation', label: 'Installation Offer', description: 'Setup, deployment, and onboarding services.' },
  { id: 'hardware', label: 'Hardware Offer', description: 'Selling prices for devices and equipment.' }
] as const;
type OfferType = typeof categories[number]['id'];

export function ProductSalesOffers() {
  const { product, patch } = useProduct();
  const { hardware } = usePortfolio();
  const { can } = useAccess();
  const [tab, setTab] = useState<OfferType>('subscription');
  const [editing, setEditing] = useState<SalesOffer | null>(null);
  const [creating, setCreating] = useState(false);

  if (!product) return <ProductNotFound />;
  const offers = product.salesOffers;
  const shown = offers.filter((offer) => (offer.type ?? 'subscription') === tab);
  const assignedHardware = hardware.filter((item) => item.assignments.some((assignment) => assignment.productId === product.id));
  const save = (values: SalesOfferDraft) => {
    if (editing) { patch({ salesOffers: offers.map((offer) => offer.id === editing.id ? { ...offer, ...values } : offer) }); setEditing(null); }
    else { patch({ salesOffers: [...offers, { ...values, id: createId('o') }] }); setCreating(false); }
  };

  return <ProductSubpage product={product} sectionId="sales-offers" actions={can('portfolio.edit') && <button className="btn-primary" onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" /> New offer</button>}>
    <div className="mb-5 grid gap-3 md:grid-cols-3">{categories.map((category) => <button key={category.id} type="button" aria-pressed={tab === category.id} onClick={() => setTab(category.id)} className={`rounded-xl border p-4 text-left transition-colors ${tab === category.id ? 'border-brand bg-brand-50' : 'border-line bg-white hover:border-brand/40'}`}><span className={`text-sm font-semibold ${tab === category.id ? 'text-brand-700' : 'text-ink'}`}>{category.label}</span><span className="mt-1 block text-xs text-muted">{category.description}</span><span className="mt-3 block text-xl font-semibold tabular-nums text-ink">{offers.filter((offer) => (offer.type ?? 'subscription') === category.id).length}</span></button>)}</div>
    {shown.length === 0 ? <EmptyState title={`No ${tab} offers yet`} description={tab === 'hardware' ? 'Add a hardware offer to set the selling price of an assigned device.' : `Create a ${tab} offer for this product.`} action={can('portfolio.edit') && <button className="btn-primary" onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" /> New offer</button>} /> : <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{shown.map((offer) => <li key={offer.id} className="flex flex-col rounded-2xl border border-line p-6"><div className="flex items-start justify-between gap-2"><h2 className="text-base font-semibold text-ink">{offer.plan}</h2>{can('portfolio.edit') && <div className="-mr-2 -mt-1 flex gap-0.5"><button className="icon-btn" aria-label={`Edit ${offer.plan}`} onClick={() => setEditing(offer)}><PencilIcon className="h-3.5 w-3.5" /></button><button className="icon-btn hover:text-red-600" aria-label={`Delete ${offer.plan}`} onClick={() => patch({ salesOffers: offers.filter((item) => item.id !== offer.id) })}><Trash2Icon className="h-3.5 w-3.5" /></button></div>}</div><p className="mt-1 min-h-[20px] text-sm text-muted">{offer.description}</p>{offer.hardwareId && <p className="mt-2 text-xs text-muted">Hardware: {assignedHardware.find((item) => item.id === offer.hardwareId)?.title ?? 'Unassigned item'}</p>}<p className="mt-5"><span className="text-3xl font-semibold tracking-tight text-brand">{formatOfferPrice(offer.price) || '—'}</span>{offer.billing && <span className="ml-1.5 text-sm text-muted">{offer.billing}</span>}</p><ul className="mt-5 flex flex-col gap-2 border-t border-line pt-5">{offer.includes.map((item) => <li key={item} className="flex gap-2 text-sm text-ink"><CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />{item}</li>)}{offer.includes.length === 0 && <li className="text-sm text-muted">No included items listed.</li>}</ul></li>)}</ul>}
    <SalesOfferModal open={creating || editing !== null} initial={editing} hardware={assignedHardware} defaultType={tab} onClose={() => { setCreating(false); setEditing(null); }} onSubmit={save} />
  </ProductSubpage>;
}
