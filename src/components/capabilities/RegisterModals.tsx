import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { AssetView } from '../AssetView';
import { CapabilityStatusBadge } from './CapabilityBadges';
import { capabilityStatuses } from '../../data/capabilities';
import { capabilityDomainIds, domainNames, resolvedLinks } from '../../utils/capabilities';
import type { AsIsItem, Backlog, Capability, CapabilityStatus, Domain } from '../../types/portfolio';

/* ---------- Import from As-is ---------- */

export function ImportAsIsModal({ asIs, capabilities, domains, productId, onClose, onImport }: {
  asIs: AsIsItem[];
  capabilities: Capability[];
  domains: Domain[];
  productId: string;
  onClose: () => void;
  onImport: (rows: {item: AsIsItem;domainId: string;}[]) => void;
}) {
  const imported = new Set(capabilities.map((capability) => capability.asIsId).filter(Boolean));
  const available = asIs.filter((item) => !imported.has(item.id));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [domainFor, setDomainFor] = useState<Record<string, string>>({});
  const fallback = domains[0]?.id ?? '';
  const allSelected = available.length > 0 && available.every((item) => selected.has(item.id));

  const toggle = (id: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);else next.add(id);
    return next;
  });

  const setAllDomains = (id: string) => setDomainFor(Object.fromEntries(available.map((item) => [item.id, id])));

  const submit = () => onImport(available.filter((item) => selected.has(item.id)).map((item) => ({ item, domainId: domainFor[item.id] || fallback })));

  return (
    <Modal
      open
      size="xl"
      title="Import from As-is"
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!selected.size || !domains.length} onClick={submit}>
            Import {selected.size || ''} {selected.size === 1 ? 'capability' : 'capabilities'}
          </button>
        </>
      }>
      {domains.length === 0 ?
      <p className="text-sm text-muted">
          Each imported capability needs a domain. <Link to={`/products/${productId}/flow?stage=capabilities&view=domains`} className="font-medium text-brand hover:text-brand-700" onClick={onClose}>Add a domain</Link> first.
        </p> :
      asIs.length === 0 ?
      <p className="text-sm text-muted">The As-is list is empty. Add what the product already does in the As-is tab first.</p> :
      available.length === 0 ?
      <p className="text-sm text-muted">Every As-is capability is already in the register.</p> :

      <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">Imported capabilities enter the register as <span className="font-medium text-ink">Implemented</span>. Choose the domain for each one.</p>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-canvas px-3 py-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-ink">
              <input type="checkbox" className="h-4 w-4 accent-brand" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(available.map((item) => item.id)))} />
              Select all ({available.length})
            </label>
            <label className="flex items-center gap-2 text-xs text-muted">
              Set every domain to
              <select aria-label="Domain for all" className="field w-48 py-1" defaultValue="" onChange={(e) => e.target.value && setAllDomains(e.target.value)}>
                <option value="" disabled>Choose…</option>
                {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
              </select>
            </label>
          </div>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {available.map((item) =>
          <li key={item.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
                <label className="flex min-w-0 flex-1 items-start gap-2">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-brand" checked={selected.has(item.id)} onChange={() => toggle(item.id)} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink">{item.title}</span>
                    {item.description && <span className="line-clamp-1 text-xs text-muted">{item.description}</span>}
                  </span>
                </label>
                <select aria-label={`Domain for ${item.title}`} className="field sm:w-52" value={domainFor[item.id] || fallback} onChange={(e) => setDomainFor((current) => ({ ...current, [item.id]: e.target.value }))}>
                  {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
                </select>
              </li>
          )}
          </ul>
          {imported.size > 0 && <p className="text-xs text-muted">{asIs.length - available.length} already in the register and hidden here.</p>}
        </div>
      }
    </Modal>);

}

/* ---------- Change status ---------- */

/** Moving away from Implemented (to partial or not implemented) needs a clarification. */
function needsClarification(from: CapabilityStatus, to: CapabilityStatus): boolean {
  return from === 'implemented' && (to === 'partial' || to === 'not-started');
}

export function StatusModal({ capability, onClose, onSubmit }: {
  capability: Capability;
  onClose: () => void;
  onSubmit: (status: CapabilityStatus, note: string) => void;
}) {
  const [status, setStatus] = useState<CapabilityStatus>(capability.status);
  const [note, setNote] = useState(capability.statusNote ?? '');
  const [error, setError] = useState('');
  const required = needsClarification(capability.status, status);

  const submit = () => {
    if (required && !note.trim()) {
      setError('Describe what is missing so the team understands why this capability is no longer fully implemented.');
      return;
    }
    onSubmit(status, note.trim());
  };

  return (
    <Modal
      open
      title="Change status"
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className={`btn-primary ${status === 'removed' ? 'bg-red-600 hover:bg-red-700' : ''}`} disabled={status === capability.status && note.trim() === (capability.statusNote ?? '')} onClick={submit}>
            {status === 'removed' ? 'Remove capability' : 'Save status'}
          </button>
        </>
      }>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted"><span className="font-medium text-ink">{capability.name}</span> · currently <CapabilityStatusBadge status={capability.status} /></p>
        <div role="radiogroup" aria-label="New status" className="grid gap-2 sm:grid-cols-2">
          {capabilityStatuses.map((item) =>
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={status === item.id}
            onClick={() => { setStatus(item.id); setError(''); }}
            className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm font-medium transition-colors duration-150 ${
            status === item.id ? item.id === 'removed' ? 'border-red-500 bg-red-50 text-ink' : 'border-brand bg-brand-50 text-ink' : 'border-line text-muted hover:text-ink'}`
            }>
              <span className={`h-2 w-2 shrink-0 rounded-full ${item.dot}`} aria-hidden />
              {item.label}
            </button>
          )}
        </div>
        {status === 'removed' && <p className="text-xs text-muted">Removed capabilities stay in the register, crossed out, and no longer count towards coverage.</p>}
        <Field
          label={required ? 'Clarification (required)' : status === 'removed' ? 'Reason for removing (optional)' : 'Clarification (optional)'}
          htmlFor="cap-status-note">
          <textarea
            id="cap-status-note"
            className="field min-h-[88px]"
            value={note}
            onChange={(e) => { setNote(e.target.value); setError(''); }}
            placeholder={required ? 'What does not work, or is missing, compared with the As-is description?' : 'Add context for this status'} />
        </Field>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>);

}

/* ---------- View more ---------- */

export function CapabilityDetailsModal({ capability, domains, asIs, backlog, productId, onClose, onChangeStatus, onEdit }: {
  capability: Capability;
  domains: Domain[];
  asIs: AsIsItem[];
  backlog: Backlog;
  productId: string;
  onClose: () => void;
  onChangeStatus: () => void;
  onEdit: () => void;
}) {
  const source = capability.asIsId ? asIs.find((item) => item.id === capability.asIsId) : undefined;
  const links = resolvedLinks(backlog, capability);
  const row = (label: string, children: ReactNode) =>
  <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-ink">{children}</dd>
    </div>;


  return (
    <Modal
      open
      size="lg"
      title={capability.name}
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onChangeStatus}>Change status</button>
          <button className="btn-primary" onClick={onEdit}>Modify</button>
        </>
      }>
      <dl className="flex flex-col gap-3">
        {row('Status', <CapabilityStatusBadge status={capability.status} />)}
        {capability.statusNote && row(capability.status === 'removed' ? 'Reason' : 'Clarification', <p className="whitespace-pre-line rounded-md bg-amber-50 px-2 py-1.5 text-amber-900">{capability.statusNote}</p>)}
        {row(capabilityDomainIds(capability).length > 1 ? 'Domains' : 'Domain', <span className="flex flex-wrap gap-1">{domainNames(domains, capability).map((name) => <span key={name} className="rounded-full bg-canvas px-2 py-0.5 text-xs font-medium">{name}</span>)}</span>)}
        {row('Description', <p className="whitespace-pre-line">{capability.description || <span className="text-muted">No description</span>}</p>)}
        {row('Source', capability.asIsId ?
          source ? <span>Imported from As-is · <span className="font-medium">{source.title}</span></span> : <span className="text-muted">Imported from an As-is entry that was since deleted</span> :
          <span className="text-muted">Added directly to the register</span>)}
        {source && source.description && source.description !== capability.description && row('As-is description', <p className="whitespace-pre-line text-muted">{source.description}</p>)}
        {row('Documents', (() => {
          const docs = [...(source?.documents ?? []), ...(capability.evidence && !source?.documents.length ? [capability.evidence] : [])];
          return docs.length ? <ul className="flex flex-col gap-1">{docs.map((doc, index) => <li key={index} className="min-w-0"><AssetView asset={doc} /></li>)}</ul> : <span className="text-muted">None</span>;
        })())}
        {links.length > 0 && row('Linked backlog',
          <ul className="flex flex-col gap-0.5">
            {links.map((link) =>
            <li key={link.feature?.id ?? link.epic.id}>
                <Link to={link.feature ? `/products/${productId}/flow?stage=backlog&feature=${link.feature.id}` : `/products/${productId}/flow?stage=backlog`} className="text-brand hover:text-brand-700" onClick={onClose}>
                  {link.feature ? `${link.epic.title} › ${link.feature.title}` : link.epic.title}
                </Link>
              </li>
            )}
          </ul>
        )}
      </dl>
    </Modal>);

}
