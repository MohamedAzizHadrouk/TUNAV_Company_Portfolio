import { useCallback, useState } from 'react';
import { DownloadIcon, PlusIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { DomainsPanel } from '../../pages/product/ProductDomains';
import { CapabilitiesPanel } from '../../pages/product/ProductCapabilities';
import { AsIsPanel } from '../capabilities/AsIsPanel';
import type { Product } from '../../types/portfolio';

// Work order: define the domains, record the As-is, then build the capability register from it.
const views = [
{ id: 'domains', label: 'Domains' },
{ id: 'as-is', label: 'As-is' },
{ id: 'register', label: 'Capability register' }] as const;

type View = (typeof views)[number]['id'];

function readView(value: string | null): View {
  return views.some((view) => view.id === value) ? value as View : 'domains';
}

export function CapabilitiesStage({ product, update }: { product: Product; update: (fn: (p: Product) => Product) => void }) {
  const [params, setParams] = useSearchParams();
  const view = readView(params.get('view'));
  const [askDomain, setAskDomain] = useState(false);
  const [askAsIs, setAskAsIs] = useState(false);
  const [askCapability, setAskCapability] = useState(false);
  const [askImport, setAskImport] = useState(false);
  const closeDomain = useCallback(() => setAskDomain(false), []);
  const closeAsIs = useCallback(() => setAskAsIs(false), []);
  const closeCapability = useCallback(() => setAskCapability(false), []);
  const closeImport = useCallback(() => setAskImport(false), []);

  const counts: Record<View, number> = {
    domains: product.domains.length,
    'as-is': product.asIs.length,
    register: product.capabilities.length
  };

  const openView = (next: View) => {
    const query = new URLSearchParams(params);
    query.set('view', next);
    setParams(query, { replace: true });
  };

  return <>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div role="tablist" aria-label="Capabilities" className="inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-canvas p-0.5">
        {views.map((item, index) => <button key={item.id} role="tab" aria-selected={view === item.id} onClick={() => openView(item.id)}
          className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${view === item.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
          <span className="text-xs tabular-nums opacity-60">{index + 1}</span>
          {item.label}
          <span className={`rounded-full px-1.5 text-xs tabular-nums ${view === item.id ? 'bg-brand-50 text-brand-700' : 'bg-white text-muted'}`}>{counts[item.id]}</span>
        </button>)}
      </div>
      <div className="flex flex-wrap gap-2">
        {view === 'domains' && <button className="btn-primary" onClick={() => setAskDomain(true)}><PlusIcon className="h-4 w-4" /> Add domain</button>}
        {view === 'as-is' && <button className="btn-primary" onClick={() => setAskAsIs(true)}><PlusIcon className="h-4 w-4" /> Add As-is capability</button>}
        {view === 'register' && <>
          <button className="btn-ghost" onClick={() => setAskImport(true)}><DownloadIcon className="h-4 w-4" /> Import from As-is</button>
          <button className="btn-primary" onClick={() => setAskCapability(true)}><PlusIcon className="h-4 w-4" /> New capability</button>
        </>}
      </div>
    </div>

    {view === 'domains' && <DomainsPanel product={product} update={update} openCreate={askDomain} onCreateOpened={closeDomain} />}
    {view === 'as-is' && <AsIsPanel product={product} update={update} openCreate={askAsIs} onCreateOpened={closeAsIs} />}
    {view === 'register' && <CapabilitiesPanel product={product} update={update} openCreate={askCapability} onCreateOpened={closeCapability} openImport={askImport} onImportOpened={closeImport} />}
  </>;
}
