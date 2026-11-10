import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { Field } from '../../components/Field';
import { EmptyState } from '../../components/EmptyState';
import { capabilityDomainIds, domainNameTaken, inDomain, withDomains } from '../../utils/capabilities';
import { createId } from '../../utils/id';
import type { Domain, Product } from '../../types/portfolio';

interface DomainsPanelProps {
  product: Product;
  update: (fn: (p: Product) => Product) => void;
  openCreate: boolean;
  onCreateOpened: () => void;
}

export function DomainsPanel({ product, update, openCreate, onCreateOpened }: DomainsPanelProps) {
  const [editing, setEditing] = useState<Domain | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<Domain | null>(null);
  const [reassignTo, setReassignTo] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!openCreate) return;
    setEditing(null);
    setCreating(true);
    onCreateOpened();
  }, [openCreate, onCreateOpened]);

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
  };

  const save = (values: {name: string;description: string;}) => {
    if (editing) {
      update((p) => ({
        ...p,
        domains: p.domains.map((domain) => domain.id === editing.id ? { ...domain, ...values } : domain)
      }));
      setEditing(null);
      setNotice('Domain updated. Capabilities keep this domain.');
    } else {
      update((p) => ({
        ...p,
        domains: [...p.domains, { id: createId('dom'), ...values }]
      }));
      setCreating(false);
      setNotice('Domain created.');
    }
  };

  const remove = () => {
    if (!removing) return;
    const count = orphansOf(removing.id);
    if (count > 0 && !reassignTo) return;
    update((p) => ({
      ...p,
      domains: p.domains.filter((domain) => domain.id !== removing.id),
      capabilities: p.capabilities.map((capability) => {
        if (!inDomain(capability, removing.id)) return capability;
        const rest = capabilityDomainIds(capability).filter((id) => id !== removing.id);
        return { ...capability, ...withDomains(rest.length ? rest : [reassignTo]) };
      })
    }));
    setRemoving(null);
    setNotice(count > 0 ? 'Capabilities were reassigned and the domain was deleted.' : 'Domain deleted.');
  };

  const countFor = (id: string) => product.capabilities.filter((capability) => inDomain(capability, id)).length;
  // Capabilities that would be left without any domain if this one is deleted.
  const orphansOf = (id: string) => product.capabilities.filter((capability) => { const ids = capabilityDomainIds(capability); return ids.length === 1 && ids[0] === id; }).length;
  const removingCount = removing ? orphansOf(removing.id) : 0;
  const otherDomains = product.domains.filter((domain) => domain.id !== removing?.id);

  return (
    <>
      {notice && <p role="status" className="mb-3 text-sm text-emerald-700">{notice}</p>}

      {product.domains.length === 0 ?
      <EmptyState
        title="No domains yet"
        description="Domains group capabilities. Create one before you register capabilities."
        action={<button className="btn-primary" onClick={startCreate}><PlusIcon className="h-4 w-4" /> Add Domain</button>} /> :


      <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Domain</th>
                <th className="px-3 py-2 font-medium">Description</th>
                <th className="px-3 py-2 font-medium">Capabilities</th>
                <th className="px-3 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {product.domains.map((domain) => {
              const count = countFor(domain.id);
              return (
                <tr key={domain.id} className="hover:bg-canvas">
                    <td className="px-3 py-2 font-medium text-ink">
                      <Link to={`/products/${product.id}/flow?stage=capabilities&view=register&domain=${domain.id}`} className="hover:text-brand">{domain.name}</Link>
                    </td>
                    <td className="px-3 py-2 text-muted">{domain.description || '—'}</td>
                    <td className="px-3 py-2 tabular-nums">
                      <Link to={`/products/${product.id}/flow?stage=capabilities&view=register&domain=${domain.id}`} className="text-brand hover:text-brand-700">
                        {count}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <button className="icon-btn" aria-label={`Edit ${domain.name}`} onClick={() => { setCreating(false); setEditing(domain); }}><PencilIcon className="h-3.5 w-3.5" /></button>
                        <button className="icon-btn hover:text-red-600" aria-label={`Delete ${domain.name}`} onClick={() => { setReassignTo(''); setRemoving(domain); }}><Trash2Icon className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>);

            })}
            </tbody>
          </table>
        </div>
      }

      <DomainForm
        open={creating || editing !== null}
        initial={editing}
        domains={product.domains}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSubmit={save} />
      

      <Modal
        open={removing !== null}
        title="Delete domain"
        onClose={() => setRemoving(null)}
        footer={
        <>
            <button className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
            <button className="btn-primary bg-red-600 hover:bg-red-700" disabled={removingCount > 0 && !reassignTo} onClick={remove}>
              {removingCount > 0 ? 'Reassign and delete' : 'Delete domain'}
            </button>
          </>
        }>
        
        {removingCount === 0 ?
        <p className="text-sm text-muted">Delete <span className="font-medium text-ink">{removing?.name}</span>? It has no capabilities.</p> :
        otherDomains.length === 0 ?
        <p className="text-sm text-muted">{removingCount} {removingCount === 1 ? 'capability belongs' : 'capabilities belong'} only to this domain. Create another domain before deleting it, so those capabilities can be reassigned.</p> :

        <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              <span className="font-medium text-ink">{removing?.name}</span> has {removingCount} {removingCount === 1 ? 'capability' : 'capabilities'} with no other domain. Move them to another domain before this one is deleted. Capabilities that also have other domains simply lose this one.
            </p>
            <Field label="Reassign capabilities to" htmlFor="reassign-domain">
              <select id="reassign-domain" className="field" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
                <option value="">Choose a domain</option>
                {otherDomains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
              </select>
            </Field>
          </div>
        }
      </Modal>
    </>);

}

function DomainForm({ open, initial, domains, onClose, onSubmit }: {
  open: boolean;
  initial: Domain | null;
  domains: Domain[];
  onClose: () => void;
  onSubmit: (values: {name: string;description: string;}) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setDescription(initial?.description ?? '');
    setError('');
  }, [open, initial]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a domain name.');
      return;
    }
    if (domainNameTaken(domains, trimmed, initial?.id)) {
      setError('A domain with this name already exists.');
      return;
    }
    onSubmit({ name: trimmed, description: description.trim() });
  };

  return (
    <Modal
      open={open}
      title={initial ? 'Edit domain' : 'Add domain'}
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={submit}>{initial ? 'Save domain' : 'Add domain'}</button>
        </>
      }>
      
      <div className="flex flex-col gap-3">
        <Field label="Name" htmlFor="domain-name">
          <input id="domain-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Payments" />
        </Field>
        <Field label="Description" htmlFor="domain-description">
          <textarea id="domain-description" className="field min-h-[72px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this domain covers" />
        </Field>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
      </div>
    </Modal>);

}
