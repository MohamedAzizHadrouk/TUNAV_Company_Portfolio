import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeftIcon, DownloadIcon, EyeIcon, PencilIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import { CapabilityStatusBadge } from './CapabilityBadges';
import { capabilityStatuses } from '../../data/capabilities';
import { domainNames, inDomain } from '../../utils/capabilities';
import type { Capability, CapabilityStatus, Domain } from '../../types/portfolio';

interface RegisterViewProps {
  capabilities: Capability[];
  domains: Domain[];
  hasAsIs: boolean;
  initialDomainId?: string;
  onView: (c: Capability) => void;
  onChangeStatus: (c: Capability) => void;
  onEdit: (c: Capability) => void;
  onDelete: (c: Capability) => void;
  onCreate: () => void;
  onImport: () => void;
}

export function RegisterView({ capabilities, domains, hasAsIs, initialDomainId = 'all', onView, onChangeStatus, onEdit, onDelete, onCreate, onImport }: RegisterViewProps) {
  const [query, setQuery] = useState('');
  const [domainId, setDomainId] = useState(initialDomainId);
  const [status, setStatus] = useState<CapabilityStatus | 'all'>('all');

  useEffect(() => {
    setDomainId(initialDomainId);
  }, [initialDomainId]);

  const filtered = useMemo(
    () =>
    capabilities.filter(
      (c) =>
      (domainId === 'all' || inDomain(c, domainId)) &&
      (status === 'all' || c.status === status) &&
      `${c.name} ${c.description}`.toLowerCase().includes(query.trim().toLowerCase())
    ),
    [capabilities, domainId, status, query]
  );

  if (!capabilities.length) {
    return (
      <EmptyState
        title="The capability register is empty"
        description="Import capabilities from the As-is list, or add a new capability that is not implemented yet."
        action={
        <div className="flex flex-wrap justify-center gap-2">
            {hasAsIs && <button className="btn-ghost" onClick={onImport}><DownloadIcon className="h-4 w-4" /> Import from As-is</button>}
            <button className="btn-primary" onClick={onCreate}>New capability</button>
          </div>
        } />);

  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input aria-label="Search capabilities" className="field pl-8" placeholder="Search capabilities" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select aria-label="Filter by domain" className="field sm:w-52" value={domainId} onChange={(e) => setDomainId(e.target.value)}>
          <option value="all">All domains</option>
          {domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
        </select>
        <select aria-label="Filter by status" className="field sm:w-52" value={status} onChange={(e) => setStatus(e.target.value as CapabilityStatus | 'all')}>
          <option value="all">All statuses</option>
          {capabilityStatuses.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-canvas text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Capability</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.length === 0 &&
            <tr><td colSpan={4} className="px-3 py-6 text-center text-sm text-muted">No capabilities match these filters.</td></tr>
            }
            {filtered.map((capability) => {
              const removed = capability.status === 'removed';
              return (
                <tr key={capability.id} className={`align-top ${removed ? 'bg-canvas/60' : ''}`}>
                  <td className="px-3 py-2.5">
                    <button className={`text-left font-medium hover:text-brand ${removed ? 'text-muted line-through' : 'text-ink'}`} onClick={() => onView(capability)}>{capability.name}</button>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      {domainNames(domains, capability).map((name) => <span key={name} className="rounded-full bg-canvas px-1.5 py-px font-medium text-ink/70">{name}</span>)}
                      {capability.asIsId && <span className="rounded-full bg-brand-50 px-1.5 py-px font-medium text-brand-700">From As-is</span>}
                    </p>
                  </td>
                  <td className="max-w-[380px] px-3 py-2.5 text-muted">
                    <p className="line-clamp-2">{capability.description || '—'}</p>
                    {capability.statusNote && capability.status !== 'implemented' &&
                    <p className="mt-1 line-clamp-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">{capability.statusNote}</p>
                    }
                  </td>
                  <td className="px-3 py-2.5"><CapabilityStatusBadge status={capability.status} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button className="icon-btn" title="View more" aria-label={`View more about ${capability.name}`} onClick={() => onView(capability)}><EyeIcon className="h-3.5 w-3.5" /></button>
                      <button className="icon-btn" title="Change status" aria-label={`Change status of ${capability.name}`} onClick={() => onChangeStatus(capability)}><ArrowRightLeftIcon className="h-3.5 w-3.5" /></button>
                      <button className="icon-btn" title="Modify" aria-label={`Modify ${capability.name}`} onClick={() => onEdit(capability)}><PencilIcon className="h-3.5 w-3.5" /></button>
                      <button className="icon-btn hover:text-red-600" title="Delete" aria-label={`Delete ${capability.name}`} onClick={() => onDelete(capability)}><Trash2Icon className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>
    </div>);

}
