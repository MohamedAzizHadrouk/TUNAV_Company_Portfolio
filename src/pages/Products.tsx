import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { format } from 'date-fns';
import { usePortfolio } from '../contexts/PortfolioContext';
import { PageHeader } from '../components/PageHeader';
import { StatusPill } from '../components/StatusPill';
import { EmptyState } from '../components/EmptyState';
import { ProductFormModal, type ProductBasics } from '../components/products/ProductFormModal';
import { phases } from '../data/phases';
import { createId, today } from '../utils/id';
import { createEmptyBacklog, flattenStories } from '../utils/backlog';
import { useAccess } from '../contexts/AccessContext';
import { defaultDomains } from '../data/capabilities';
import type { Product, ProductStatus } from '../types/portfolio';

export function Products() {
  const { products, setProducts } = usePortfolio();
  const { can } = useAccess();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<ProductStatus | 'all'>('all');
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () =>
    products.filter(
      (p) =>
      (phase === 'all' || p.status === phase) &&
      `${p.name} ${p.tagline} ${p.category}`.toLowerCase().includes(query.toLowerCase())
    ),
    [products, phase, query]
  );

  const create = (values: ProductBasics) => {
    const product: Product = {
      id: createId('p'),
      ...values,
      updatedAt: today(),
      backlog: createEmptyBacklog(),
      domains: defaultDomains.map((domain) => ({ ...domain })),
      asIs: [],
      capabilities: [],
      salesArguments: [],
      salesOffers: [],
      designSystem: { colors: [], typography: '', figmaUrl: '', notes: '' },
      links: [],
      showcase: []
    };
    setProducts((prev) => [product, ...prev]);
    setCreating(false);
    navigate(`/products/${product.id}`);
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Products"
        description="Every product in your portfolio, with its capabilities, sales material and lifecycle phase."
        actions={
        can('portfolio.edit') && <button className="btn-primary" onClick={() => setCreating(true)}>
            <PlusIcon className="h-4 w-4" /> New product
          </button>
        } />
      

      {/* Lifecycle distribution doubles as the phase filter */}
      <div className="mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-7">
        <PhaseButton active={phase === 'all'} onClick={() => setPhase('all')} label="All" count={products.length} />
        {phases.map((p) =>
        <PhaseButton
          key={p.id}
          active={phase === p.id}
          onClick={() => setPhase(p.id)}
          label={p.label}
          dot={p.dot}
          count={products.filter((x) => x.status === p.id).length} />

        )}
      </div>

      <div className="relative mb-6 max-w-sm">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          aria-label="Search products"
          className="field pl-9"
          placeholder="Search products"
          value={query}
          onChange={(e) => setQuery(e.target.value)} />
        
      </div>

      {filtered.length === 0 ?
      <EmptyState
        title={products.length ? 'No products match' : 'No products yet'}
        description={products.length ? 'Try another phase or search term.' : 'Add your first product to start building your portfolio.'}
        action={!products.length && can('portfolio.edit') && <button className="btn-primary" onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" /> New product</button>} /> :


      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) =>
        <li key={p.id}>
              <Link
            to={`/products/${p.id}`}
            className="group flex h-full flex-col rounded-2xl border border-line bg-white p-5 transition-[border-color,box-shadow] duration-150 hover:border-brand/40 hover:shadow-[0_4px_20px_-8px_rgba(10,61,255,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
            
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <StatusPill status={p.status} />
                </div>
                <h2 className="mt-4 text-base font-semibold text-ink group-hover:text-brand">{p.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{p.tagline || 'No tagline yet'}</p>
                <div className="mt-4 grid grid-cols-4 gap-1" aria-label="Scrum phases">
                  {[
                    ['1 · Stories', flattenStories(p.backlog).length],
                    ['2 · Plan', flattenStories(p.backlog).filter((entry) => entry.story.sprintId).length],
                    ['3 · Tasks', p.backlog.sprints.reduce((count, sprint) => count + sprint.tasks.length, 0)],
                    ['4 · Versions', p.backlog.sprints.filter((sprint) => sprint.increment).length]
                  ].map(([label, count]) => <div key={label} className="rounded-lg bg-canvas px-2 py-2 text-center"><span className="block text-[10px] font-medium text-muted">{label}</span><strong className="text-sm text-ink">{count}</strong></div>)}
                </div>
                <div className="mt-auto flex items-center justify-between pt-5 text-xs text-muted">
                  <span>{p.category || 'Uncategorised'}</span>
                  <span>
                    Scrum · {storyCount(p)} stories · {format(new Date(p.updatedAt), 'MMM d')}
                  </span>
                </div>
              </Link>
            </li>
        )}
        </ul>
      }

      {can('portfolio.edit') && <ProductFormModal open={creating} title="New product" onClose={() => setCreating(false)} onSubmit={create} />}
    </div>);

}

function PhaseButton({ active, onClick, label, count, dot }: {active: boolean;onClick: () => void;label: string;count: number;dot?: string;}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-start gap-1 px-4 py-3 text-left transition-colors duration-150 ${active ? 'bg-brand-50' : 'bg-white hover:bg-canvas'}`}>
      
      <span className={`flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${active ? 'text-brand-700' : 'text-muted'}`}>
        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden />}
        {label}
      </span>
      <span className={`text-xl font-semibold tabular-nums ${active ? 'text-brand-700' : 'text-ink'}`}>{count}</span>
    </button>);

}

function storyCount(p: Product): number {
  return flattenStories(p.backlog).length;
}
