import React, { useState } from 'react';
import { CheckIcon, PencilIcon, PlusIcon, ShieldCheckIcon, Trash2Icon, UsersIcon } from 'lucide-react';
import { useAccess, permissions, type Account, type Permission, type Role } from '../contexts/AccessContext';
import { Modal } from '../components/Modal';

export function Settings() {
  const access = useAccess();
  const [tab, setTab] = useState<'accounts' | 'roles'>('accounts');
  const [accountForm, setAccountForm] = useState<Account | 'new' | null>(null);
  const [roleForm, setRoleForm] = useState<Role | 'new' | null>(null);
  const [notice, setNotice] = useState('');
  const [removing, setRemoving] = useState<{ type: 'account' | 'role'; id: string; name: string } | null>(null);
  const canAccounts = access.can('accounts.manage');
  const canRoles = access.can('roles.manage');

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="rounded-2xl border border-line bg-gradient-to-br from-brand-50 via-white to-white p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">Workspace settings</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">People & access</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">Manage who can edit the portfolio and how each role works. Changes are saved in this browser for the MVP.</p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm">
          <p className="text-xs text-muted">Current account</p>
          <p className="font-semibold text-ink">{access.currentAccount.name}</p>
          <p className="text-xs text-muted">{access.roles.find((role) => role.id === access.currentAccount.roleId)?.name}</p>
        </div>
      </div>
    </div>

    <div className="grid gap-3 sm:grid-cols-3">
      <Stat icon={<UsersIcon className="h-4 w-4" />} label="Accounts" value={access.accounts.length} />
      <Stat icon={<CheckIcon className="h-4 w-4" />} label="Active accounts" value={access.accounts.filter((account) => account.active).length} />
      <Stat icon={<ShieldCheckIcon className="h-4 w-4" />} label="Roles" value={access.roles.length} />
    </div>

    <div className="overflow-hidden rounded-2xl border border-line bg-white">
      <div className="flex flex-col gap-4 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Settings sections" className="inline-flex rounded-xl bg-canvas p-1">
          {(['accounts', 'roles'] as const).map((item) => <button key={item} role="tab" aria-selected={tab === item} onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === item ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{item === 'accounts' ? 'Accounts' : 'Roles & permissions'}</button>)}
        </div>
        {tab === 'accounts' && canAccounts && <button className="btn-primary" onClick={() => setAccountForm('new')}><PlusIcon className="h-4 w-4" /> Add account</button>}
        {tab === 'roles' && canRoles && <button className="btn-primary" onClick={() => setRoleForm('new')}><PlusIcon className="h-4 w-4" /> Create role</button>}
      </div>
      {notice && <p role="status" className="mx-4 mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
      {tab === 'accounts' ? <div className="p-4 sm:p-5">
        <div className="mb-4"><h2 className="font-semibold text-ink">Team accounts</h2><p className="text-sm text-muted">Assign a role to each person. Only active accounts appear in the account switcher.</p></div>
        <div className="divide-y divide-line rounded-xl border border-line">
          {access.accounts.map((account) => <div key={account.id} className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">{initials(account.name)}</div>
            <div className="min-w-40 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-ink">{account.name}</p>{account.id === access.currentId && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">You</span>}</div><p className="break-all text-xs text-muted">{account.email}</p></div>
            <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink">{access.roles.find((role) => role.id === account.roleId)?.name}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${account.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-muted'}`}>{account.active ? 'Active' : 'Inactive'}</span>
            {canAccounts && <div className="flex gap-1"><button className="icon-btn" aria-label={`Edit ${account.name}`} onClick={() => setAccountForm(account)}><PencilIcon className="h-4 w-4" /></button><button className="icon-btn hover:text-red-600" aria-label={`Delete ${account.name}`} disabled={account.id === access.currentId} onClick={() => setRemoving({ type: 'account', id: account.id, name: account.name })}><Trash2Icon className="h-4 w-4" /></button></div>}
          </div>)}
        </div>
      </div> : <div className="p-4 sm:p-5">
        <div className="mb-4"><h2 className="font-semibold text-ink">Roles & permissions</h2><p className="text-sm text-muted">Built-in roles provide a starting point. Create a custom role for a different set of permissions.</p></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{access.roles.map((role) => <div key={role.id} className="flex flex-col rounded-xl border border-line p-4">
          <div className="flex items-start justify-between gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><ShieldCheckIcon className="h-4 w-4" /></div><span className="text-xs text-muted">{access.accounts.filter((account) => account.roleId === role.id).length} accounts</span></div>
          <h3 className="mt-3 font-semibold text-ink">{role.name}</h3><p className="mt-1 min-h-10 text-sm text-muted">{role.description || 'Custom access role'}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{role.permissions.length ? role.permissions.map((permission) => <span key={permission} className="rounded-md bg-canvas px-2 py-1 text-[11px] text-ink">{permissions.find((item) => item.id === permission)?.label}</span>) : <span className="text-xs text-muted">View only</span>}</div>
          <div className="mt-auto flex items-center justify-between border-t border-line pt-4 text-xs text-muted"><span>{role.system ? 'Built-in role' : 'Custom role'}</span>{canRoles && !role.system && <div className="flex gap-1"><button className="icon-btn" aria-label={`Edit ${role.name}`} onClick={() => setRoleForm(role)}><PencilIcon className="h-4 w-4" /></button><button className="icon-btn hover:text-red-600" aria-label={`Delete ${role.name}`} disabled={access.accounts.some((account) => account.roleId === role.id)} onClick={() => setRemoving({ type: 'role', id: role.id, name: role.name })}><Trash2Icon className="h-4 w-4" /></button></div>}</div>
        </div>)}</div>
        <div className="mt-5 overflow-x-auto"><h3 className="mb-2 text-sm font-semibold text-ink">Permission comparison</h3><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b border-line text-xs text-muted"><th className="py-2 font-medium">Permission</th>{access.roles.map((role) => <th key={role.id} className="px-3 py-2 text-center font-medium">{role.name}</th>)}</tr></thead><tbody>{permissions.map((permission) => <tr key={permission.id} className="border-b border-line last:border-0"><td className="py-2.5 text-ink">{permission.label}</td>{access.roles.map((role) => <td key={role.id} className="px-3 py-2.5 text-center">{role.permissions.includes(permission.id) ? <CheckIcon className="mx-auto h-4 w-4 text-emerald-600" aria-label="Allowed" /> : <span className="text-muted" aria-label="Not allowed">—</span>}</td>)}</tr>)}</tbody></table></div>
      </div>}
    </div>
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">MVP note: accounts and permissions are stored only in this browser. Account switching is for preview and testing; it is not secure authentication or shared access across devices.</p>
    <AccountModal key={accountForm === 'new' ? 'new' : accountForm?.id ?? 'closed'} account={accountForm} roles={access.roles} onClose={() => setAccountForm(null)} onSave={(input) => { const result = access.saveAccount(input); if (result) { setNotice(input.id ? 'Account updated.' : 'Account created.'); setAccountForm(null); } return !!result; }} />
    <RoleModal key={roleForm === 'new' ? 'new' : roleForm?.id ?? 'closed'} role={roleForm} onClose={() => setRoleForm(null)} onSave={(input) => { const result = access.saveRole(input); if (result) { setNotice(input.id ? 'Role updated.' : 'Role created.'); setRoleForm(null); } return !!result; }} />
    <Modal open={!!removing} title={`Delete ${removing?.type ?? 'item'}`} onClose={() => setRemoving(null)} footer={<><button className="btn-ghost" onClick={() => setRemoving(null)}>Cancel</button><button className="btn-primary bg-red-600 hover:bg-red-700" onClick={() => { if (!removing) return; const ok = removing.type === 'account' ? access.deleteAccount(removing.id) : access.deleteRole(removing.id); setNotice(ok ? `${removing.type === 'account' ? 'Account' : 'Role'} deleted.` : 'This item cannot be deleted while it is in use or is the last administrator.'); setRemoving(null); }}>Delete</button></>}><p className="text-sm text-muted">Delete <strong className="text-ink">{removing?.name}</strong> from this browser?</p></Modal>
  </div>;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <div className="flex items-center gap-3 rounded-xl border border-line bg-white p-4"><div className="rounded-lg bg-brand-50 p-2.5 text-brand-700">{icon}</div><div><p className="text-xs text-muted">{label}</p><p className="text-xl font-semibold text-ink">{value}</p></div></div>; }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join(''); }

function AccountModal({ account, roles, onClose, onSave }: { account: Account | 'new' | null; roles: Role[]; onClose: () => void; onSave: (input: Omit<Account, 'id'> & { id?: string }) => boolean }) {
  const existing = account && account !== 'new' ? account : null;
  const [name, setName] = useState(existing?.name ?? ''); const [email, setEmail] = useState(existing?.email ?? ''); const [roleId, setRoleId] = useState(existing?.roleId ?? 'viewer'); const [active, setActive] = useState(existing?.active ?? true); const [error, setError] = useState('');
  const submit = () => { if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError('Enter a name and a valid email address.'); return; } if (!onSave({ id: existing?.id, name, email, roleId, active })) setError('Could not save. Check for a duplicate email or keep one active administrator.'); };
  return <Modal open={!!account} title={existing ? 'Edit account' : 'Add account'} onClose={onClose} footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}>Save account</button></>}><div className="space-y-4"><label className="block text-sm font-medium text-ink">Full name<input className="field mt-1.5" autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label><label className="block text-sm font-medium text-ink">Email<input className="field mt-1.5" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="block text-sm font-medium text-ink">Role<select className="field mt-1.5" value={roleId} onChange={(event) => setRoleId(event.target.value)}>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label><label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Active account</label>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</div></Modal>;
}

function RoleModal({ role, onClose, onSave }: { role: Role | 'new' | null; onClose: () => void; onSave: (input: Omit<Role, 'id' | 'system'> & { id?: string }) => boolean }) {
  const existing = role && role !== 'new' ? role : null;
  const [name, setName] = useState(existing?.name ?? ''); const [description, setDescription] = useState(existing?.description ?? ''); const [selected, setSelected] = useState<Permission[]>(existing?.permissions ?? []); const [error, setError] = useState('');
  const toggle = (permission: Permission) => setSelected((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);
  return <Modal open={!!role} title={existing ? 'Edit role' : 'Create role'} onClose={onClose} size="lg" footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={() => { if (!name.trim()) { setError('Enter a role name.'); return; } if (!onSave({ id: existing?.id, name, description, permissions: selected })) setError('Could not save. Choose a unique name and keep one active administrator.'); }}>Save role</button></>}><div className="space-y-4"><label className="block text-sm font-medium text-ink">Role name<input className="field mt-1.5" autoFocus value={name} onChange={(event) => setName(event.target.value)} /></label><label className="block text-sm font-medium text-ink">Description<textarea className="field mt-1.5 min-h-16" value={description} onChange={(event) => setDescription(event.target.value)} /></label><div><p className="text-sm font-medium text-ink">Permissions</p><p className="mb-2 text-xs text-muted">Browsing the portfolio is available to every active account.</p><div className="space-y-2">{permissions.map((permission) => <label key={permission.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 hover:bg-canvas"><input className="mt-1" type="checkbox" checked={selected.includes(permission.id)} onChange={() => toggle(permission.id)} /><span><span className="block text-sm font-medium text-ink">{permission.label}</span><span className="block text-xs text-muted">{permission.description}</span></span></label>)}</div></div>{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</div></Modal>;
}
