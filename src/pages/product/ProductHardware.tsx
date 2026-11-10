import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ChevronRightIcon, DownloadIcon, FileTextIcon, LockKeyholeIcon, PencilIcon, PlusIcon, ServerIcon, Trash2Icon } from 'lucide-react';
import { useProduct } from '../../hooks/useProduct';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { useAccess } from '../../contexts/AccessContext';
import { ProductNotFound } from '../../components/products/ProductNotFound';
import { ProductSubpage } from '../../components/products/ProductSubpage';
import { EmptyState } from '../../components/EmptyState';
import { AssetView } from '../../components/AssetView';
import { Modal } from '../../components/Modal';
import { HardwareCapabilityModal, type CapabilityInput } from '../../components/hardware/HardwareCapabilityModal';
import { HardwareDocumentModal, type DocumentInput } from '../../components/hardware/HardwareDocumentModal';
import { ImportHardwareCapabilitiesModal } from '../../components/hardware/ImportHardwareCapabilitiesModal';
import { createId } from '../../utils/id';
import type { HardwareCapability, HardwareDocument } from '../../types/portfolio';

export function ProductHardware() {
  const { product } = useProduct();
  const { hardware, setHardware } = usePortfolio();
  const { can } = useAccess();
  const canEdit = can('portfolio.edit');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addingCapability, setAddingCapability] = useState(false);
  const [editingCapability, setEditingCapability] = useState<HardwareCapability | null>(null);
  const [importing, setImporting] = useState(false);
  const [addingDocument, setAddingDocument] = useState(false);
  const [editingDocument, setEditingDocument] = useState<HardwareDocument | null>(null);
  const [removing, setRemoving] = useState<{ kind: 'capability' | 'document'; id: string; title: string } | null>(null);
  const [notice, setNotice] = useState('');

  if (!product) return <ProductNotFound />;
  const assigned = hardware.filter((item) => item.assignments.some((assignment) => assignment.productId === product.id));
  const selected = assigned.find((item) => item.id === selectedId) ?? null;
  const saveCapabilities = (id: string, values: CapabilityInput[]) => {
    setHardware((current) => current.map((item) => item.id === id ? { ...item, capabilities: [...(item.capabilities ?? []), ...values.map((value) => ({ ...value, id: createId('hw-cap') }))] } : item));
    setNotice(`${values.length} ${values.length === 1 ? 'capability' : 'capabilities'} added.`);
  };
  const saveDocuments = (id: string, values: DocumentInput[]) => {
    setHardware((current) => current.map((item) => item.id === id ? { ...item, documents: [...(item.documents ?? []), ...values.map((value) => ({ ...value, id: createId('hw-doc') }))] } : item));
    setNotice(`${values.length} ${values.length === 1 ? 'document' : 'documents'} added.`);
  };

  return <ProductSubpage product={product} sectionId="hardware">
    {notice && <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
    {!selected ? <>
      <div className="mb-5 rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-muted">Hardware assigned to <strong className="text-ink">{product.name}</strong>. Select a card to view its capabilities and technical documents. Assign hardware from the <Link to="/hardware" className="font-medium text-brand hover:text-brand-700">Hardware menu</Link>.</div>
      {assigned.length === 0 ? <EmptyState title="No hardware assigned" description="Assign an item to this product from the Hardware menu." action={<Link to="/hardware" className="btn-primary">Go to Hardware</Link>} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{assigned.map((item) => <button key={item.id} type="button" onClick={() => { setSelectedId(item.id); setNotice(''); }} className="group flex min-h-56 flex-col rounded-2xl border border-line bg-white p-5 text-left transition-[border-color,box-shadow] hover:border-brand/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"><div className="flex items-start justify-between gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><ServerIcon className="h-5 w-5" /></span><span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-muted">{item.capabilities?.length ?? 0} {(item.capabilities?.length ?? 0) === 1 ? 'capability' : 'capabilities'}</span></div><h2 className="mt-4 text-base font-semibold text-ink group-hover:text-brand">{item.title}</h2><p className="mt-1 line-clamp-2 text-sm text-muted">{item.description || 'No hardware description yet.'}</p><div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-xs text-muted"><span>{item.documents?.length ?? 0} {(item.documents?.length ?? 0) === 1 ? 'document' : 'documents'}</span><span className="flex items-center gap-1 font-medium text-brand">View details <ChevronRightIcon className="h-3.5 w-3.5" /></span></div></button>)}</div>}
    </> : <>
      <button type="button" onClick={() => { setSelectedId(null); setNotice(''); }} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-700"><ArrowLeftIcon className="h-4 w-4" /> All assigned hardware</button>
      <div className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><ServerIcon className="h-6 w-6" /></div><div><h2 className="text-xl font-semibold text-ink">{selected.title}</h2><p className="mt-1 text-sm text-muted">{selected.description || 'No hardware description yet.'}</p></div></div>

      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink">Capabilities</h3>
            <p className="text-sm text-muted">{selected.capabilities?.length ?? 0} recorded for this hardware item.</p>
          </div>
          {canEdit && <div className="flex flex-wrap gap-2">
            <button className="btn-ghost" onClick={() => setImporting(true)}><DownloadIcon className="h-4 w-4" /> Import capabilities</button>
            <button className="btn-primary" onClick={() => setAddingCapability(true)}><PlusIcon className="h-4 w-4" /> Add capability</button>
          </div>}
        </div>
        {!(selected.capabilities?.length) ?
          <EmptyBlock title="No capabilities yet" description={canEdit ? 'Add or import capabilities to describe what this hardware can do.' : 'Capabilities will appear here when added.'} /> :
          <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line bg-canvas text-xs font-medium text-muted">
                <tr>
                  <th scope="col" className="w-1/3 px-4 py-3 font-medium">Title</th>
                  <th scope="col" className="px-4 py-3 font-medium">Description</th>
                  {canEdit && <th scope="col" className="w-24 px-4 py-3 text-right font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {selected.capabilities.map((capability) => <tr key={capability.id}>
                  <th scope="row" className="px-4 py-3 align-top font-medium text-ink">{capability.title}</th>
                  <td className="whitespace-pre-wrap px-4 py-3 align-top text-muted">{capability.description || '—'}</td>
                  {canEdit && <td className="px-4 py-2 text-right align-top">
                    <div className="flex justify-end gap-1">
                      <button className="icon-btn" aria-label={`Edit ${capability.title}`} onClick={() => setEditingCapability(capability)}><PencilIcon className="h-4 w-4" /></button>
                      <button className="icon-btn hover:text-red-600" aria-label={`Delete ${capability.title}`} onClick={() => setRemoving({ kind: 'capability', id: capability.id, title: capability.title })}><Trash2Icon className="h-4 w-4" /></button>
                    </div>
                  </td>}
                </tr>)}
              </tbody>
            </table>
          </div>}
      </section>

      <section className="mt-7"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold text-ink">Technical documents</h3><p className="text-sm text-muted">Add files or links and choose who can view each one.</p></div>{canEdit && <button className="btn-primary" onClick={() => setAddingDocument(true)}><PlusIcon className="h-4 w-4" /> Add document</button>}</div>{!(selected.documents?.length) ? <EmptyBlock title="No technical documents yet" description={canEdit ? 'Add a file or URL and set it to public or private.' : 'Documents will appear here when added.'} /> : <div className="mt-4 grid gap-3 lg:grid-cols-2">{selected.documents.map((document) => <article key={document.id} className="rounded-xl border border-line bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-2"><FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><div className="min-w-0"><h4 className="font-semibold text-ink">{document.title}</h4><div className="mt-2">{document.visibility === 'public' || canEdit ? <AssetView asset={document.asset} /> : <span className="inline-flex items-center gap-1 text-sm text-muted"><LockKeyholeIcon className="h-4 w-4" /> Private document</span>}</div></div></div><span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${document.visibility === 'public' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-muted'}`}>{document.visibility === 'public' ? 'Public' : 'Private'}</span></div>{canEdit && <div className="mt-3 flex justify-end gap-1 border-t border-line pt-2"><button className="icon-btn" aria-label={`Edit ${document.title}`} onClick={() => setEditingDocument(document)}><PencilIcon className="h-4 w-4" /></button><button className="icon-btn hover:text-red-600" aria-label={`Delete ${document.title}`} onClick={() => setRemoving({ kind: 'document', id: document.id, title: document.title })}><Trash2Icon className="h-4 w-4" /></button></div>}</article>)}</div>}</section>
      <p className="mt-5 text-xs text-muted">Capabilities and documents belong to this hardware item and appear in every product where it is assigned. Private files are hidden from viewers in this local MVP.</p>

      {addingCapability && <HardwareCapabilityModal onClose={() => setAddingCapability(false)} onSave={(values) => { saveCapabilities(selected.id, values); setAddingCapability(false); }} />}
      {editingCapability && <HardwareCapabilityModal key={editingCapability.id} initial={editingCapability} onClose={() => setEditingCapability(null)} onSave={(values) => { setHardware((current) => current.map((item) => item.id === selected.id ? { ...item, capabilities: (item.capabilities ?? []).map((capability) => capability.id === editingCapability.id ? { ...capability, ...values[0] } : capability) } : item)); setEditingCapability(null); setNotice('Capability updated.'); }} />}
      {importing && <ImportHardwareCapabilitiesModal target={selected} hardware={hardware} onClose={() => setImporting(false)} onImport={(values) => { saveCapabilities(selected.id, values); setImporting(false); }} />}
      {addingDocument && <HardwareDocumentModal onClose={() => setAddingDocument(false)} onSave={(values) => { saveDocuments(selected.id, values); setAddingDocument(false); }} />}
      {editingDocument && <HardwareDocumentModal key={editingDocument.id} initial={editingDocument} onClose={() => setEditingDocument(null)} onSave={(values) => { setHardware((current) => current.map((item) => item.id === selected.id ? { ...item, documents: (item.documents ?? []).map((document) => document.id === editingDocument.id ? { ...document, ...values[0] } : document) } : item)); setEditingDocument(null); setNotice('Document updated.'); }} />}
      <Modal open={!!removing} title={`Delete ${removing?.kind ?? 'item'}`} onClose={() => setRemoving(null)} footer={<><button className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button><button className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => { if (!removing) return; setHardware((current) => current.map((item) => item.id === selected.id ? removing.kind === 'capability' ? { ...item, capabilities: (item.capabilities ?? []).filter((capability) => capability.id !== removing.id) } : { ...item, documents: (item.documents ?? []).filter((document) => document.id !== removing.id) } : item)); setNotice(`${removing.kind === 'capability' ? 'Capability' : 'Document'} deleted.`); setRemoving(null); }}>Delete</button></>}><p className="text-sm text-muted">Delete <strong className="text-ink">{removing?.title}</strong> from this hardware item?</p></Modal>
    </>}
  </ProductSubpage>;
}

function EmptyBlock({ title, description }: { title: string; description: string }) { return <div className="mt-4 rounded-xl border border-dashed border-line bg-canvas px-5 py-8 text-center"><FileTextIcon className="mx-auto h-6 w-6 text-muted" /><p className="mt-2 text-sm font-medium text-ink">{title}</p><p className="mt-1 text-sm text-muted">{description}</p></div>; }
