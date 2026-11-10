import { useState } from 'react';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useProduct } from '../../hooks/useProduct';
import { ProductNotFound } from '../../components/products/ProductNotFound';
import { ProductSubpage } from '../../components/products/ProductSubpage';
import { EmptyState } from '../../components/EmptyState';
import { AssetView } from '../../components/AssetView';
import { SalesArgumentModal, type SalesArgumentDraft } from '../../components/sales/SalesArgumentModal';
import { createId } from '../../utils/id';
import type { SalesArgument } from '../../types/portfolio';

export function ProductSalesArguments() {
  const { product, patch } = useProduct();
  const [editing, setEditing] = useState<SalesArgument | null>(null);
  const [creating, setCreating] = useState(false);

  if (!product) return <ProductNotFound />;
  const items = product.salesArguments;

  const save = (values: SalesArgumentDraft) => {
    if (editing) {
      patch({ salesArguments: items.map((a) => a.id === editing.id ? { ...a, ...values } : a) });
      setEditing(null);
    } else {
      patch({ salesArguments: [...items, { ...values, id: createId('sa') }] });
      setCreating(false);
    }
  };

  return (
    <ProductSubpage
      product={product}
      sectionId="sales-arguments"
      actions={<button className="btn-primary" onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" /> New argument</button>}>
      
      {items.length === 0 ?
      <EmptyState title="No sales arguments yet" description="Add the reasons customers choose this product, each with a proof of concept." /> :

      <ul className="divide-y divide-line rounded-2xl border border-line">
          {items.map((a) =>
        <li key={a.id} className="grid gap-5 p-6 md:grid-cols-[1fr_340px]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-ink">{a.title}</h2>
                  {a.description && <p className="mt-1 text-sm leading-relaxed text-muted">{a.description}</p>}
                </div>
                <div className="flex shrink-0 gap-1 md:hidden">
                  <RowActions onEdit={() => setEditing(a)} onDelete={() => patch({ salesArguments: items.filter((x) => x.id !== a.id) })} />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className={`min-w-0 flex-1 rounded-xl px-4 py-3 ${a.proof ? 'bg-brand-50' : 'border border-dashed border-line'}`}>
                  <p className={`mb-1 text-[11px] font-semibold ${a.proof ? 'text-brand-700' : 'text-muted'}`}>Proof of concept</p>
                  {a.proof ? <AssetView asset={a.proof} /> : <p className="text-sm text-muted">Not provided yet</p>}
                </div>
                <div className="hidden shrink-0 gap-1 md:flex">
                  <RowActions onEdit={() => setEditing(a)} onDelete={() => patch({ salesArguments: items.filter((x) => x.id !== a.id) })} />
                </div>
              </div>
            </li>
        )}
        </ul>
      }

      <SalesArgumentModal
        open={creating || editing !== null}
        initial={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={save} />
      
    </ProductSubpage>);

}

function RowActions({ onEdit, onDelete }: {onEdit: () => void;onDelete: () => void;}) {
  return (
    <>
      <button className="icon-btn" aria-label="Edit argument" onClick={onEdit}><PencilIcon className="h-3.5 w-3.5" /></button>
      <button className="icon-btn hover:text-red-600" aria-label="Delete argument" onClick={onDelete}><Trash2Icon className="h-3.5 w-3.5" /></button>
    </>);

}