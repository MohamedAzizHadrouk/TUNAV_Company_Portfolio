import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2Icon, PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useAccess } from '../contexts/AccessContext';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { HardwareFormModal, type HardwareDraft } from '../components/hardware/HardwareFormModal';
import { formatPrice } from '../utils/currency';
import { createId, today } from '../utils/id';
import type { HardwareItem } from '../types/portfolio';

export function HardwarePage() {
  const { hardware, setHardware, products } = usePortfolio();
  const { can } = useAccess();
  const canEdit = can('portfolio.edit');
  const [query, setQuery] = useState('');
  const [assignment, setAssignment] = useState<string>('all');
  const [editing, setEditing] = useState<HardwareItem | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(
    () =>
    hardware.filter((h) => {
      const matchAssign =
      assignment === 'all' || (
      assignment === 'company' ? h.assignments.length === 0 : h.assignments.some((a) => a.productId === assignment));
      return matchAssign && `${h.title} ${h.description}`.toLowerCase().includes(query.toLowerCase());
    }),
    [hardware, assignment, query]
  );

  const totalValue = hardware.reduce((n, h) => n + h.purchasePrice, 0);

  const save = (values: HardwareDraft) => {
    if (editing) {
      setHardware((prev) => prev.map((h) => h.id === editing.id ? { ...h, ...values } : h));
      setEditing(null);
    } else {
      setHardware((prev) => [{ ...values, id: createId('h'), addedAt: today() }, ...prev]);
      setCreating(false);
    }
  };

  return (
    <div className="w-full">
      <PageHeader
        title="Hardware"
        description={`${hardware.length} items · ${formatPrice(totalValue)} total purchase value. Link each item to one or more products.`}
        actions={
        canEdit && <button className="btn-primary" onClick={() => setCreating(true)}>
            <PlusIcon className="h-4 w-4" /> Add hardware
          </button>
        } />
      

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input aria-label="Search hardware" className="field pl-9" placeholder="Search hardware" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select aria-label="Filter by assignment" className="field sm:w-56" value={assignment} onChange={(e) => setAssignment(e.target.value)}>
          <option value="all">All assignments</option>
          <option value="company">Company</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {filtered.length === 0 ?
      <EmptyState title={hardware.length ? 'No matching hardware' : 'No hardware yet'} description={hardware.length ? 'Try another filter or search.' : 'Add your first item to start tracking.'} /> :

      <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Hardware</th>
                <th className="px-3 py-2 font-medium">Assigned to</th>
                <th className="px-3 py-2 text-right font-medium">Purchase price</th>
                <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((h) => {
              return (
                <tr key={h.id}>
                    <td className="max-w-xs px-3 py-2">
                      <p className="font-medium text-ink">{h.title}</p>
                      {h.description && <p className="truncate text-xs text-muted">{h.description}</p>}
                    </td>
                    <td className="px-3 py-2">
                      {h.assignments.length ?
                    <div className="flex flex-wrap gap-1.5">
                          {h.assignments.map((a) => {
                        const product = products.find((p) => p.id === a.productId);
                        if (!product) return null;
                        return (
                          <Link
                            key={a.productId}
                            to={`/products/${product.id}/hardware`}
                            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100">
                            
                                {product.name}
                              </Link>);

                      })}
                        </div> :

                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          <Building2Icon className="h-3 w-3" /> Company
                        </span>
                    }
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-ink">{formatPrice(h.purchasePrice)}</td>
                    <td className="px-3 py-2">
                      {canEdit && <div className="flex justify-end gap-1">
                        <button className="icon-btn" aria-label={`Edit ${h.title}`} onClick={() => setEditing(h)}><PencilIcon className="h-3.5 w-3.5" /></button>
                        <button className="icon-btn hover:text-red-600" aria-label={`Delete ${h.title}`} onClick={() => setHardware((prev) => prev.filter((x) => x.id !== h.id))}><Trash2Icon className="h-3.5 w-3.5" /></button>
                      </div>}
                    </td>
                  </tr>);

            })}
            </tbody>
          </table>
        </div>
      }

      {canEdit && <HardwareFormModal
        open={creating || editing !== null}
        initial={editing}
        products={products}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={save} />}
      
    </div>);

}
