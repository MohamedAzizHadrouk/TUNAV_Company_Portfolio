import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '../../components/Modal';
import { CapabilityModal, type CapabilityDraft } from '../../components/capabilities/CapabilityModal';
import { RegisterView } from '../../components/capabilities/RegisterView';
import { CapabilityDetailsModal, ImportAsIsModal, StatusModal } from '../../components/capabilities/RegisterModals';
import { activeCapabilities, coverage, withDomains } from '../../utils/capabilities';
import { capabilityStatuses } from '../../data/capabilities';
import { createId } from '../../utils/id';
import type { AsIsItem, Capability, CapabilityStatus, Product } from '../../types/portfolio';

interface CapabilitiesPanelProps {
  product: Product;
  update: (fn: (p: Product) => Product) => void;
  openCreate: boolean;
  onCreateOpened: () => void;
  openImport: boolean;
  onImportOpened: () => void;
}

export function CapabilitiesPanel({ product, update, openCreate, onCreateOpened, openImport, onImportOpened }: CapabilitiesPanelProps) {
  const [params] = useSearchParams();
  const [editing, setEditing] = useState<Capability | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [statusFor, setStatusFor] = useState<Capability | null>(null);
  const [removing, setRemoving] = useState<Capability | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!openCreate) return;
    setEditing(null);
    setCreating(true);
    onCreateOpened();
  }, [openCreate, onCreateOpened]);

  useEffect(() => {
    if (!openImport) return;
    setImporting(true);
    onImportOpened();
  }, [openImport, onImportOpened]);

  const caps = product.capabilities;
  const active = activeCapabilities(caps);
  const pct = coverage(caps);
  const domainParam = params.get('domain') ?? 'all';
  const viewing = viewingId ? caps.find((capability) => capability.id === viewingId) ?? null : null;
  const countOf = (status: CapabilityStatus) => caps.filter((c) => c.status === status).length;

  const patch = (id: string, changes: Partial<Capability>) =>
  update((p) => ({ ...p, capabilities: p.capabilities.map((capability) => capability.id === id ? { ...capability, ...changes } : capability) }));

  const save = (values: CapabilityDraft) => {
    const { domainIds, ...rest } = values;
    if (editing) {
      patch(editing.id, { ...rest, ...withDomains(domainIds) });
      setEditing(null);
      setNotice('Capability updated.');
    } else {
      update((p) => ({
        ...p,
        capabilities: [...p.capabilities, { ...rest, ...withDomains(domainIds), id: createId('cap'), notes: '', status: 'not-started', evidence: null, confidence: 'medium', links: [], asIsId: null, statusNote: '' }]
      }));
      setCreating(false);
      setNotice('Capability added as Not Implemented.');
    }
  };

  const importRows = (rows: {item: AsIsItem;domainId: string;}[]) => {
    update((p) => ({
      ...p,
      capabilities: [...p.capabilities, ...rows.map(({ item, domainId }): Capability => ({
        id: createId('cap'),
        ...withDomains([domainId]),
        name: item.title,
        description: item.description,
        notes: '',
        status: 'implemented',
        evidence: item.documents[0] ?? null,
        confidence: 'medium',
        links: [],
        asIsId: item.id,
        statusNote: ''
      }))]
    }));
    setImporting(false);
    setNotice(`${rows.length} ${rows.length === 1 ? 'capability' : 'capabilities'} imported from As-is.`);
  };

  const changeStatus = (status: CapabilityStatus, note: string) => {
    if (!statusFor) return;
    patch(statusFor.id, { status, statusNote: note });
    setNotice(`${statusFor.name} is now ${capabilityStatuses.find((item) => item.id === status)?.label ?? status}.`);
    setStatusFor(null);
  };

  const remove = () => {
    if (!removing) return;
    const id = removing.id;
    update((p) => ({ ...p, capabilities: p.capabilities.filter((capability) => capability.id !== id) }));
    setRemoving(null);
    setNotice('Capability deleted. Linked backlog items were kept.');
  };

  return (
    <>
      {notice && <p role="status" className="mb-3 text-sm text-emerald-700">{notice}</p>}

      {caps.length > 0 &&
      <div className="mb-3 flex flex-col gap-2 rounded-xl bg-canvas px-3 py-2.5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-[200px]">
            <p className="text-sm text-ink">
              <span className="text-2xl font-semibold tabular-nums">{pct}%</span>
              <span className="text-muted"> capability coverage</span>
            </p>
            {active.length > 0 &&
          <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                <div className="bg-emerald-500" style={{ width: `${countOf('implemented') / active.length * 100}%` }} />
                <div className="bg-amber-500" style={{ width: `${countOf('partial') / active.length * 100}%` }} />
              </div>
          }
          </div>
          <p className="flex flex-wrap gap-x-3 text-sm text-muted md:justify-end">
            {capabilityStatuses.map((item) => <span key={item.id}><span className="font-semibold text-ink">{countOf(item.id)}</span> {item.label.toLowerCase()}</span>)}
          </p>
        </div>
      }

      <RegisterView
        capabilities={caps}
        domains={product.domains}
        hasAsIs={product.asIs.length > 0}
        initialDomainId={product.domains.some((domain) => domain.id === domainParam) ? domainParam : 'all'}
        onView={(capability) => setViewingId(capability.id)}
        onChangeStatus={setStatusFor}
        onEdit={setEditing}
        onDelete={setRemoving}
        onCreate={() => setCreating(true)}
        onImport={() => setImporting(true)} />

      <CapabilityModal
        open={creating || editing !== null}
        initial={editing}
        domains={product.domains}
        productId={product.id}
        defaultDomainId={product.domains.some((domain) => domain.id === domainParam) ? domainParam : undefined}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={save} />

      {importing &&
      <ImportAsIsModal asIs={product.asIs} capabilities={caps} domains={product.domains} productId={product.id} onClose={() => setImporting(false)} onImport={importRows} />
      }

      {statusFor && <StatusModal capability={statusFor} onClose={() => setStatusFor(null)} onSubmit={changeStatus} />}

      {viewing &&
      <CapabilityDetailsModal
        capability={viewing}
        domains={product.domains}
        asIs={product.asIs}
        backlog={product.backlog}
        productId={product.id}
        onClose={() => setViewingId(null)}
        onChangeStatus={() => { setViewingId(null); setStatusFor(viewing); }}
        onEdit={() => { setViewingId(null); setEditing(viewing); }} />
      }

      <Modal
        open={removing !== null}
        title="Delete capability"
        onClose={() => setRemoving(null)}
        footer={
        <>
            <button className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
            <button className="btn-primary bg-red-600 hover:bg-red-700" onClick={remove}>Delete capability</button>
          </>
        }>
        <p className="text-sm text-muted">
          Delete <span className="font-medium text-ink">{removing?.name}</span> from the register for good? To reject it but keep a record, use Change status → Removed instead. Epics, features and user stories stay in the backlog.
        </p>
      </Modal>
    </>);

}
