import { useState } from 'react';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { format } from 'date-fns';
import { useProduct } from '../../hooks/useProduct';
import { ProductNotFound } from '../../components/products/ProductNotFound';
import { ProductSubpage } from '../../components/products/ProductSubpage';
import { AssetView } from '../../components/AssetView';
import { ShowcaseItemModal, type ShowcaseDraft } from '../../components/showcase/ShowcaseItemModal';
import { showcaseCategories } from '../../data/showcase';
import { isImageAsset } from '../../utils/file';
import { createId, today } from '../../utils/id';
import type { ShowcaseCategory, ShowcaseItem } from '../../types/portfolio';

export function ProductShowcase() {
  const { product, patch } = useProduct();
  const [category, setCategory] = useState<ShowcaseCategory | 'all'>('all');
  const [editing, setEditing] = useState<ShowcaseItem | null>(null);
  const [creating, setCreating] = useState(false);

  if (!product) return <ProductNotFound />;
  const items = product.showcase;
  const visible = category === 'all' ? items : items.filter((i) => i.category === category);
  const activeCategory = showcaseCategories.find((c) => c.id === category);

  const save = (values: ShowcaseDraft) => {
    if (editing) {
      patch({ showcase: items.map((i) => i.id === editing.id ? { ...i, ...values } : i) });
      setEditing(null);
    } else {
      patch({ showcase: [{ ...values, id: createId('sc'), addedAt: today() }, ...items] });
      setCreating(false);
    }
  };

  return (
    <ProductSubpage
      product={product}
      sectionId="showcase"
      actions={<button className="btn-primary" onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" /> Add resource</button>}>
      
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Showcase categories" className="flex gap-1 overflow-x-auto lg:flex-col">
          {[{ id: 'all' as const, label: 'All resources', icon: null }, ...showcaseCategories].map((c) => {
            const count = c.id === 'all' ? items.length : items.filter((i) => i.category === c.id).length;
            const active = category === c.id;
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                aria-current={active}
                className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors duration-150 ${
                active ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-canvas hover:text-ink'}`
                }>
                
                {Icon ? <Icon className="h-4 w-4" aria-hidden /> : <span className="h-4 w-4" aria-hidden />}
                <span className="flex-1">{c.label}</span>
                <span className="text-xs tabular-nums opacity-70">{count}</span>
              </button>);

          })}
        </nav>

        <div>
          {visible.length === 0 ?
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line px-4 py-10 text-center">
              <p className="text-sm font-semibold text-ink">No {activeCategory ? activeCategory.label.toLowerCase() : 'resources'} yet</p>
              <p className="mt-1 text-sm text-muted">Add a link or upload a file.</p>
              <button className="btn-primary mt-3" onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" /> Add resource</button>
            </div> :

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((item) => {
              const cat = showcaseCategories.find((c) => c.id === item.category) ?? showcaseCategories[0];
              const CatIcon = cat.icon;
              const image = isImageAsset(item.asset);
              return (
                <li key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-line">
                    {image ?
                  <img src={item.asset.value} alt={item.title} className="aspect-video w-full object-cover" /> :

                  <div className="flex aspect-video items-center justify-center bg-canvas">
                        <CatIcon className="h-8 w-8 text-brand" aria-hidden />
                      </div>
                  }
                    <div className="flex flex-1 flex-col p-4">
                      <p className="text-[11px] font-medium text-brand">{cat.label}</p>
                      <h3 className="mt-1 text-sm font-semibold text-ink">{item.title}</h3>
                      {item.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>}
                      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                        <div className="min-w-0"><AssetView asset={item.asset} /></div>
                        <div className="flex shrink-0 gap-0.5">
                          <button className="icon-btn" aria-label={`Edit ${item.title}`} onClick={() => setEditing(item)}><PencilIcon className="h-3.5 w-3.5" /></button>
                          <button className="icon-btn hover:text-red-600" aria-label={`Delete ${item.title}`} onClick={() => patch({ showcase: items.filter((x) => x.id !== item.id) })}><Trash2Icon className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                      <p className="mt-2 text-[11px] text-muted">Added {format(new Date(item.addedAt), 'MMM d, yyyy')}</p>
                    </div>
                  </li>);

            })}
            </ul>
          }
        </div>
      </div>

      <ShowcaseItemModal
        open={creating || editing !== null}
        initial={editing}
        defaultCategory={category === 'all' ? 'tutorials' : category}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={save} />
      
    </ProductSubpage>);

}