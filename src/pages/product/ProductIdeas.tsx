import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, LightbulbIcon, PlusIcon } from 'lucide-react';
import { useAccess } from '../../contexts/AccessContext';
import { useProduct } from '../../hooks/useProduct';
import { ProductNotFound } from '../../components/products/ProductNotFound';
import { createId } from '../../utils/id';
import type { ProductIdea } from '../../types/portfolio';

type Scope = ProductIdea['scope'];

export function ProductIdeas() {
  const { product, update } = useProduct();
  const { can, canWriteSection, currentAccount } = useAccess();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<Scope>('product');
  const [domainId, setDomainId] = useState('');
  const [capabilityId, setCapabilityId] = useState('');
  const [filter, setFilter] = useState<'all' | Scope>('all');
  const [notice, setNotice] = useState('');

  if (!product) return <ProductNotFound />;

  const domains = product.domains;
  const capabilities = product.capabilities.filter((capability) => !domainId || capability.domainId === domainId || capability.domainIds?.includes(domainId));
  const ideas = [...(product.ideas ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const visible = ideas.filter((idea) => filter === 'all' || idea.scope === filter);
  const canSubmit = canWriteSection(product.id, 'ideas') || (can('ideas.submit') && (!Array.isArray(currentAccount.assignments) || currentAccount.roleId === 'admin'));
  const valid = title.trim() && description.trim() && (scope === 'product' || domainId && (scope === 'domain' || capabilityId));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || !valid) return;
    const idea: ProductIdea = {
      id: createId('idea'), title: title.trim(), description: description.trim(), scope,
      domainId: scope === 'product' ? null : domainId,
      capabilityId: scope === 'capability' ? capabilityId : null,
      authorName: currentAccount.name, createdAt: new Date().toISOString()
    };
    update((current) => ({ ...current, ideas: [idea, ...(current.ideas ?? [])] }));
    setTitle('');
    setDescription('');
    setScope('product');
    setDomainId('');
    setCapabilityId('');
    setNotice('Idea added to this product.');
  };

  const scopeLabel = (idea: ProductIdea) => {
    if (idea.scope === 'product') return product.name;
    const domain = domains.find((item) => item.id === idea.domainId);
    if (idea.scope === 'domain') return domain?.name ?? 'Domain removed';
    return `${domain?.name ?? 'Domain removed'} · ${product.capabilities.find((item) => item.id === idea.capabilityId)?.name ?? 'Capability removed'}`;
  };

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="rounded-2xl border border-line border-l-4 border-l-brand bg-white p-5 sm:p-7">
      <Link to={`/products/${product.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"><ArrowLeftIcon className="h-4 w-4" /> Back to {product.name}</Link>
      <div className="mt-3 flex items-start gap-3"><span className="rounded-xl bg-brand-50 p-3 text-brand-700"><LightbulbIcon className="h-6 w-6" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Shape what comes next</p><h1 className="text-2xl font-semibold text-ink sm:text-[28px]">Idea Gate</h1><p className="mt-1 text-sm text-muted">Collect inspiration for {product.name}, its domains, and capabilities. Ideas are suggestions for future product work.</p></div></div>
    </div>

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(290px,0.85fr)_minmax(0,1.15fr)]">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm" aria-label="Share an idea">
        <h2 className="text-base font-semibold text-ink">Share an idea</h2>
        <p className="mt-1 text-xs text-muted">Choose where it belongs, then describe what you have in mind.</p>
        {notice && <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
        <form onSubmit={submit} className="mt-5 space-y-4">
          <div><label htmlFor="idea-scope" className="mb-1.5 block text-sm font-medium text-ink">Idea for</label><select id="idea-scope" className="field" value={scope} onChange={(event) => { setScope(event.target.value as Scope); setDomainId(''); setCapabilityId(''); }}><option value="product">Whole product</option><option value="domain">A domain</option><option value="capability">A capability</option></select></div>
          {scope !== 'product' && <div><label htmlFor="idea-domain" className="mb-1.5 block text-sm font-medium text-ink">Domain</label><select id="idea-domain" className="field" value={domainId} onChange={(event) => { setDomainId(event.target.value); setCapabilityId(''); }} required><option value="">Select a domain</option>{domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}</select>{domains.length === 0 && <p className="mt-1 text-xs text-muted">Add a domain in the capability register first.</p>}</div>}
          {scope === 'capability' && <div><label htmlFor="idea-capability" className="mb-1.5 block text-sm font-medium text-ink">Capability</label><select id="idea-capability" className="field" value={capabilityId} onChange={(event) => setCapabilityId(event.target.value)} required><option value="">Select a capability</option>{capabilities.map((capability) => <option key={capability.id} value={capability.id}>{capability.name}</option>)}</select></div>}
          <div><label htmlFor="idea-title" className="mb-1.5 block text-sm font-medium text-ink">Idea title</label><input id="idea-title" className="field" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="What could improve?" required /></div>
          <div><label htmlFor="idea-description" className="mb-1.5 block text-sm font-medium text-ink">Describe the idea</label><textarea id="idea-description" className="field min-h-32 resize-y" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} placeholder="Describe the problem, opportunity, or possible approach…" required /></div>
          <p className="text-xs text-muted">Shared as {currentAccount.name}.</p>
          <button type="submit" disabled={!canSubmit || !valid} className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"><PlusIcon className="h-4 w-4" /> Add idea</button>
          {!canSubmit && <p className="text-xs text-muted">Your role cannot submit ideas.</p>}
        </form>
      </section>

      <section className="min-w-0" aria-label="Product ideas">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-ink">Ideas <span className="text-muted">· {ideas.length}</span></h2><p className="text-xs text-muted">Browse ideas to inspire future backlog work.</p></div><div className="flex flex-wrap gap-1" role="group" aria-label="Filter ideas">{(['all', 'product', 'domain', 'capability'] as const).map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${filter === item ? 'bg-brand text-white' : 'bg-canvas text-muted hover:text-ink'}`}>{item === 'all' ? 'All' : item}</button>)}</div></div>
        {visible.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-line bg-canvas px-5 py-12 text-center"><LightbulbIcon className="mx-auto h-7 w-7 text-muted" /><p className="mt-3 text-sm font-medium text-ink">{ideas.length ? 'No ideas in this category' : 'No ideas yet'}</p><p className="mt-1 text-xs text-muted">{ideas.length ? 'Choose another filter to explore ideas.' : 'Share the first idea for this product.'}</p></div> : <ul className="mt-4 space-y-3">{visible.map((idea) => <li key={idea.id} className="rounded-xl border border-line bg-white p-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">{idea.scope}</span><span className="min-w-0 truncate text-xs text-muted">{scopeLabel(idea)}</span></div><h3 className="mt-2 text-sm font-semibold text-ink">{idea.title}</h3><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">{idea.description}</p><p className="mt-3 border-t border-line pt-2 text-xs text-muted">{idea.authorName} · <time dateTime={idea.createdAt}>{new Date(idea.createdAt).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></p></li>)}</ul>}
      </section>
    </div>
  </div>;
}
