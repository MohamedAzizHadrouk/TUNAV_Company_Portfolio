import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2Icon, EyeIcon, MailIcon, PencilIcon, PhoneIcon, PlusIcon, SearchIcon, Trash2Icon, UploadIcon, UsersIcon, XIcon } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useAccess } from '../contexts/AccessContext';
import { PageHeader } from '../components/PageHeader';
import { Modal } from '../components/Modal';
import { createId } from '../utils/id';
import { MAX_FILE_BYTES, readFileAsDataUrl } from '../utils/file';
import type { ClientContact, CompanyClient, Product } from '../types/portfolio';

type ClientDraft = Omit<CompanyClient, 'id'>;
const validEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function ClientsPage() {
  const { clients, setClients, products } = usePortfolio();
  const { can } = useAccess();
  const canEdit = can('portfolio.edit');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<CompanyClient | null>(null);
  const [viewing, setViewing] = useState<CompanyClient | null>(null);
  const [removing, setRemoving] = useState<CompanyClient | null>(null);
  const needle = query.trim().toLowerCase();
  const visible = clients.filter((client) => !needle || [client.name, client.email, client.contact, client.description,
    ...client.contacts.flatMap((contact) => [contact.person, contact.role]),
    ...client.productIds.map((id) => products.find((product) => product.id === id)?.name ?? '')
  ].some((value) => value.toLowerCase().includes(needle))).sort((a, b) => a.name.localeCompare(b.name));

  const save = (draft: ClientDraft) => {
    if (editing) {
      setClients((current) => current.map((client) => client.id === editing.id ? { ...draft, id: editing.id } : client));
      setEditing(null);
    } else {
      setClients((current) => [...current, { ...draft, id: createId('client') }]);
      setAdding(false);
    }
  };

  return (
    <div className="w-full">
      <PageHeader title="Client" description="Client contacts and the products they use." actions={canEdit && <button type="button" className="btn-primary" onClick={() => setAdding(true)}><PlusIcon className="h-4 w-4" /> Add client</button>} />

      {clients.length > 0 && <div className="relative mb-4 w-full sm:w-80">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input aria-label="Search clients" className="field pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clients" />
      </div>}

      {clients.length === 0 ? <div className="rounded-2xl border border-dashed border-line bg-canvas px-6 py-12 text-center">
        <UsersIcon className="mx-auto h-8 w-8 text-brand" />
        <h2 className="mt-3 text-base font-semibold text-ink">No clients yet</h2>
        <p className="mt-1 text-sm text-muted">Add a client to keep their contacts and products together.</p>
        {canEdit && <button type="button" className="btn-ghost mt-4" onClick={() => setAdding(true)}><PlusIcon className="h-4 w-4" /> Add your first client</button>}
      </div> : visible.length === 0 ? <p className="rounded-xl border border-dashed border-line px-4 py-5 text-sm text-muted">No clients match your search.</p> : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line bg-canvas text-xs text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Logo</th>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 font-medium">Email</th>
                <th scope="col" className="px-4 py-3 font-medium">Contact</th>
                <th scope="col" className="px-4 py-3 font-medium">Products</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((client) => <tr key={client.id}>
                <td className="px-4 py-3"><ClientLogo name={client.name} logoUrl={client.logoUrl} /></td>
                <td className="px-4 py-3 font-medium text-ink">{client.name}</td>
                <td className="px-4 py-3">{client.email ? <a className="text-brand hover:underline" href={`mailto:${client.email}`}>{client.email}</a> : <span className="text-muted">—</span>}</td>
                <td className="px-4 py-3">{client.contact ? <a className="whitespace-nowrap text-ink hover:text-brand" href={`tel:${client.contact}`}>{client.contact}</a> : <span className="text-muted">—</span>}</td>
                <td className="px-4 py-3"><ProductNames ids={client.productIds} products={products} /></td>
                <td className="px-4 py-3"><div className="flex justify-end gap-1">
                  <button type="button" className="icon-btn" aria-label={`Details for ${client.name}`} title="Details" onClick={() => setViewing(client)}><EyeIcon className="h-4 w-4" /></button>
                  {canEdit && <>
                    <button type="button" className="icon-btn" aria-label={`Edit ${client.name}`} title="Edit" onClick={() => setEditing(client)}><PencilIcon className="h-4 w-4" /></button>
                    <button type="button" className="icon-btn hover:text-red-600" aria-label={`Delete ${client.name}`} title="Delete" onClick={() => setRemoving(client)}><Trash2Icon className="h-4 w-4" /></button>
                  </>}
                </div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      )}

      {(adding || editing) && <ClientDialog key={editing?.id ?? 'new'} client={editing} products={products} onClose={() => { setAdding(false); setEditing(null); }} onSave={save} />}
      <Modal open={Boolean(viewing)} title={viewing?.name ?? 'Client details'} size="lg" onClose={() => setViewing(null)} footer={canEdit && viewing && <button type="button" className="btn-primary" onClick={() => { setEditing(viewing); setViewing(null); }}><PencilIcon className="h-4 w-4" /> Edit client</button>}>
        {viewing && <div className="space-y-5 text-sm">
          <div className="flex items-center gap-3"><ClientLogo name={viewing.name} logoUrl={viewing.logoUrl} size="large" /><span className="text-base font-semibold text-ink">{viewing.name}</span></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><p className="text-xs font-medium text-muted">Email</p>{viewing.email ? <a className="mt-1 inline-flex items-center gap-2 text-brand hover:underline" href={`mailto:${viewing.email}`}><MailIcon className="h-4 w-4" /> {viewing.email}</a> : <p className="mt-1 text-ink">—</p>}</div>
            <div><p className="text-xs font-medium text-muted">Contact</p>{viewing.contact ? <a className="mt-1 inline-flex items-center gap-2 text-brand hover:underline" href={`tel:${viewing.contact}`}><PhoneIcon className="h-4 w-4" /> {viewing.contact}</a> : <p className="mt-1 text-ink">—</p>}</div>
          </div>
          <div><p className="mb-1 text-xs font-medium text-muted">Products</p><ProductNames ids={viewing.productIds} products={products} linked /></div>
          <div><p className="mb-1 text-xs font-medium text-muted">Description</p><p className="whitespace-pre-line text-ink">{viewing.description || 'No description added.'}</p></div>
          <div><h3 className="mb-2 font-semibold text-ink">Additional contacts</h3>
            {viewing.contacts.length === 0 ? <p className="text-muted">No additional contacts.</p> : <ul className="space-y-2">{viewing.contacts.map((contact) => <li key={contact.id} className="rounded-xl border border-line p-3">
              <p className="font-medium text-ink">{contact.person}{contact.role && <span className="ml-2 font-normal text-muted">· {contact.role}</span>}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">{contact.email && <a className="text-brand hover:underline" href={`mailto:${contact.email}`}>{contact.email}</a>}{contact.phone && <a className="text-brand hover:underline" href={`tel:${contact.phone}`}>{contact.phone}</a>}</div>
            </li>)}</ul>}
          </div>
        </div>}
      </Modal>
      <Modal open={Boolean(removing)} title="Delete client" onClose={() => setRemoving(null)} footer={<>
        <button type="button" className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
        <button type="button" className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => { if (removing) setClients((current) => current.filter((client) => client.id !== removing.id)); setRemoving(null); }}>Delete</button>
      </>}><p className="text-sm text-muted">Delete <span className="font-medium text-ink">{removing?.name}</span> and its contact details?</p></Modal>
    </div>
  );
}

function ClientLogo({ name, logoUrl, size = 'small' }: { name: string; logoUrl: string; size?: 'small' | 'large' }) {
  const sizeClass = size === 'large' ? 'h-16 w-16' : 'h-10 w-10';
  return <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-white ${sizeClass}`}>
    {logoUrl ? <img src={logoUrl} alt={`${name} logo`} className="h-full w-full object-contain p-1" /> : <Building2Icon className="h-5 w-5 text-muted" aria-hidden />}
  </div>;
}

function ProductNames({ ids, products, linked = false }: { ids: string[]; products: Product[]; linked?: boolean }) {
  const selected = ids.map((id) => products.find((product) => product.id === id)).filter((product): product is Product => Boolean(product));
  if (!selected.length) return <span className="text-muted">—</span>;
  return <div className="flex flex-wrap gap-1">{selected.map((product) => linked ? <Link key={product.id} to={`/products/${product.id}`} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 hover:bg-brand-100">{product.name}</Link> : <span key={product.id} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{product.name}</span>)}</div>;
}

function ClientDialog({ client, products, onClose, onSave }: {
  client: CompanyClient | null;
  products: Product[];
  onClose: () => void;
  onSave: (draft: ClientDraft) => void;
}) {
  const [name, setName] = useState(client?.name ?? '');
  const [logoUrl, setLogoUrl] = useState(client?.logoUrl ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [contact, setContact] = useState(client?.contact ?? '');
  const [description, setDescription] = useState(client?.description ?? '');
  const [productIds, setProductIds] = useState(client?.productIds ?? []);
  const [contacts, setContacts] = useState<ClientContact[]>(client?.contacts ?? []);
  const [error, setError] = useState('');

  const updateContact = (id: string, changes: Partial<ClientContact>) => setContacts((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
  const onLogoFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Choose an image file for the logo.'); return; }
    if (file.size > MAX_FILE_BYTES) { setError('Logo image must be under 2 MB.'); return; }
    try {
      setLogoUrl(await readFileAsDataUrl(file));
      setError('');
    } catch {
      setError('Could not read the logo image. Try another file.');
    }
  };
  const save = () => {
    if (!name.trim()) { setError('Enter a client name.'); return; }
    if (!validEmail(email.trim()) || contacts.some((item) => !item.person.trim() || !validEmail(item.email.trim()))) {
      setError('Check the email addresses and enter a name for each additional contact.');
      return;
    }
    onSave({ name: name.trim(), logoUrl, email: email.trim(), contact: contact.trim(), description: description.trim(), productIds, contacts: contacts.map((item) => ({ ...item, person: item.person.trim(), role: item.role.trim(), email: item.email.trim(), phone: item.phone.trim() })) });
  };

  return <Modal open title={client ? 'Edit client' : 'Add client'} size="xl" onClose={onClose} footer={<>
    <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
    <button type="button" className="btn-primary" onClick={save}>{client ? 'Save client' : 'Add client'}</button>
  </>}>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <ClientLogo name={name || 'Client'} logoUrl={logoUrl} size="large" />
        <label className="btn-ghost cursor-pointer"><UploadIcon className="h-4 w-4" /> {logoUrl ? 'Replace logo' : 'Upload logo'}
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => { void onLogoFile(event.target.files?.[0]); event.target.value = ''; }} />
        </label>
        {logoUrl && <button type="button" className="btn-ghost" onClick={() => setLogoUrl('')}><XIcon className="h-4 w-4" /> Remove logo</button>}
        <span className="text-xs text-muted">Image, max 2 MB</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink">Name <span className="text-red-600">*</span><input className="field mt-1.5" autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Client name" /></label>
        <label className="block text-sm font-medium text-ink">Email<input type="email" className="field mt-1.5" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="contact@example.com" /></label>
        <label className="block text-sm font-medium text-ink">Contact phone<input type="tel" className="field mt-1.5" value={contact} onChange={(event) => setContact(event.target.value)} placeholder="+216" /></label>
        <div className="sm:col-span-2"><p className="mb-2 text-sm font-medium text-ink">Products</p>
          {products.length === 0 ? <p className="text-sm text-muted">No products available yet.</p> : <div className="grid max-h-44 gap-2 overflow-y-auto rounded-xl border border-line p-3 sm:grid-cols-2">{products.map((product) => <label key={product.id} className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={productIds.includes(product.id)} onChange={(event) => setProductIds((current) => event.target.checked ? [...current, product.id] : current.filter((id) => id !== product.id))} /> {product.name}</label>)}</div>}
        </div>
        <label className="block text-sm font-medium text-ink sm:col-span-2">Description<textarea className="field mt-1.5 min-h-24" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="About this client" /></label>
      </div>

      <div className="border-t border-line pt-4">
        <div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-ink">Additional contacts</h3><p className="mt-0.5 text-xs text-muted">People, roles, emails, and phone numbers at this client.</p></div><button type="button" className="btn-ghost" onClick={() => setContacts((current) => [...current, { id: createId('contact'), person: '', role: '', email: '', phone: '' }])}><PlusIcon className="h-4 w-4" /> Add contact</button></div>
        <div className="mt-3 space-y-3">{contacts.map((item, index) => <div key={item.id} className="rounded-xl border border-line p-3">
          <div className="mb-2 flex items-center justify-between"><p className="text-xs font-semibold text-muted">Contact {index + 1}</p><button type="button" className="icon-btn hover:text-red-600" aria-label={`Remove contact ${index + 1}`} onClick={() => setContacts((current) => current.filter((contact) => contact.id !== item.id))}><Trash2Icon className="h-4 w-4" /></button></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-ink">Person<input className="field mt-1" value={item.person} onChange={(event) => updateContact(item.id, { person: event.target.value })} /></label>
            <label className="text-xs font-medium text-ink">Role<input className="field mt-1" value={item.role} onChange={(event) => updateContact(item.id, { role: event.target.value })} /></label>
            <label className="text-xs font-medium text-ink">Email<input type="email" className="field mt-1" value={item.email} onChange={(event) => updateContact(item.id, { email: event.target.value })} /></label>
            <label className="text-xs font-medium text-ink">Phone number<input type="tel" className="field mt-1" value={item.phone} onChange={(event) => updateContact(item.id, { phone: event.target.value })} /></label>
          </div>
        </div>)}</div>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  </Modal>;
}
