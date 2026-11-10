import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from '../Modal';
import { Field } from '../Field';
import { MultiSelect } from '../MultiSelect';
import { capabilityDomainIds } from '../../utils/capabilities';
import type { Capability, Domain } from '../../types/portfolio';

export type CapabilityDraft = {
  domainIds: string[];
  name: string;
  description: string;
};

interface CapabilityModalProps {
  open: boolean;
  initial: Capability | null;
  domains: Domain[];
  productId: string;
  defaultDomainId?: string;
  onClose: () => void;
  onSubmit: (values: CapabilityDraft) => void;
}

/** Create a new (not implemented) capability, or modify an existing one. Status is changed separately. */
export function CapabilityModal({ open, initial, domains, productId, defaultDomainId, onClose, onSubmit }: CapabilityModalProps) {
  const [domainIds, setDomainIds] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const known = new Set(domains.map((domain) => domain.id));
    const fallback = defaultDomainId ?? domains[0]?.id;
    setDomainIds(initial ? capabilityDomainIds(initial).filter((id) => known.has(id)) : fallback ? [fallback] : []);
    setName(initial?.name ?? '');
    setDescription(initial?.description ?? '');
    setError('');
  }, [open, initial, defaultDomainId, domains]);

  const submit = () => {
    if (!name.trim()) {
      setError('Enter a capability name.');
      return;
    }
    if (!domainIds.length) {
      setError('Choose at least one domain.');
      return;
    }
    onSubmit({ domainIds, name: name.trim(), description: description.trim() });
  };

  return (
    <Modal
      open={open}
      size="lg"
      title={initial ? 'Modify capability' : 'New capability'}
      onClose={onClose}
      footer={
      <>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!domains.length} onClick={submit}>{initial ? 'Save changes' : 'Add capability'}</button>
        </>
      }>

      {domains.length === 0 ?
      <p className="text-sm text-muted">
          Capabilities need a domain. <Link to={`/products/${productId}/flow?stage=capabilities&view=domains`} className="font-medium text-brand hover:text-brand-700" onClick={onClose}>Add a domain</Link> first.
        </p> :

      <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Capability" htmlFor="cap-name">
              <input id="cap-name" autoFocus className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Multi-stop route optimisation" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <MultiSelect
              id="cap-domains"
              label="Domains"
              values={domainIds}
              options={domains.map((domain) => ({ value: domain.id, label: domain.name, hint: domain.description || undefined }))}
              onChange={(next) => { setDomainIds(next); setError(''); }}
              placeholder="Select one or more domains"
              searchPlaceholder="Search domains"
              emptyText="No domain matches" />
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="cap-description">
              <textarea id="cap-description" className="field min-h-[96px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this capability should do" />
            </Field>
          </div>
          {!initial && <p className="text-xs text-muted sm:col-span-2">New capabilities start as Not Implemented. Use Change status in the register to move them on.</p>}
          {error && <p className="text-sm text-red-600 sm:col-span-2" role="alert">{error}</p>}
        </div>
      }
    </Modal>);

}
