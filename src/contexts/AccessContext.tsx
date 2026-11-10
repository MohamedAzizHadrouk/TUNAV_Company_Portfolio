import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createId } from '../utils/id';

export const permissions = [
  { id: 'portfolio.edit', label: 'Edit portfolio', description: 'Create and change products, brand, files, and hardware.' },
  { id: 'sprints.manage', label: 'Manage sprints', description: 'Create sprints, update tasks, and edit sprint stories.' },
  { id: 'accounts.manage', label: 'Manage accounts', description: 'Create, edit, activate, and deactivate accounts.' },
  { id: 'roles.manage', label: 'Manage roles', description: 'Create roles and choose their permissions.' }
] as const;

export type Permission = typeof permissions[number]['id'];
export interface Role { id: string; name: string; description: string; permissions: Permission[]; system?: boolean }
export interface Account { id: string; name: string; email: string; roleId: string; active: boolean }
interface AccessState { roles: Role[]; accounts: Account[]; currentId: string }

const initial: AccessState = {
  roles: [
    { id: 'admin', name: 'Administrator', description: 'Full access to this workspace.', permissions: permissions.map((item) => item.id), system: true },
    { id: 'editor', name: 'Editor', description: 'Edit the portfolio and manage sprints.', permissions: ['portfolio.edit', 'sprints.manage'], system: true },
    { id: 'viewer', name: 'Viewer', description: 'Browse the portfolio without changing it.', permissions: [], system: true }
  ],
  accounts: [{ id: 'local-owner', name: 'Workspace owner', email: 'owner@local.workspace', roleId: 'admin', active: true }],
  currentId: 'local-owner'
};

interface AccessContextValue extends AccessState {
  currentAccount: Account;
  can: (permission: Permission) => boolean;
  switchAccount: (id: string) => void;
  saveAccount: (input: Omit<Account, 'id'> & { id?: string }) => string | null;
  deleteAccount: (id: string) => boolean;
  saveRole: (input: Omit<Role, 'id' | 'system'> & { id?: string }) => string | null;
  deleteRole: (id: string) => boolean;
}

const AccessContext = createContext<AccessContextValue | null>(null);
const storageKey = 'cp.v1.access';

function loadState(): AccessState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as AccessState;
    if (!Array.isArray(parsed.roles) || !Array.isArray(parsed.accounts)) return initial;
    const roles = parsed.roles.filter((role) => role && typeof role.id === 'string' && typeof role.name === 'string')
      .map((role) => ({ ...role, permissions: permissions.map((item) => item.id).filter((id) => role.permissions?.includes(id)) }));
    const accounts = parsed.accounts.filter((account) => account && typeof account.id === 'string' && typeof account.name === 'string' && typeof account.email === 'string' && roles.some((role) => role.id === account.roleId));
    const adminIds = new Set(roles.filter((role) => role.permissions.includes('accounts.manage') && role.permissions.includes('roles.manage')).map((role) => role.id));
    if (!accounts.some((account) => account.active && adminIds.has(account.roleId))) return initial;
    return { roles, accounts, currentId: accounts.some((account) => account.id === parsed.currentId && account.active) ? parsed.currentId : accounts.find((account) => account.active && adminIds.has(account.roleId))!.id };
  } catch { return initial; }
}

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccessState>(loadState);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* memory-only fallback */ } }, [state]);
  const currentAccount = state.accounts.find((account) => account.id === state.currentId && account.active) ?? state.accounts[0];
  const currentRole = state.roles.find((role) => role.id === currentAccount.roleId);
  const can = (permission: Permission) => currentRole?.permissions.includes(permission) ?? false;
  const hasOtherAdmin = (accounts: Account[], roles: Role[], excludedId: string) => accounts.some((account) => account.id !== excludedId && account.active && roles.find((role) => role.id === account.roleId)?.permissions.includes('accounts.manage') && roles.find((role) => role.id === account.roleId)?.permissions.includes('roles.manage'));

  const value = useMemo<AccessContextValue>(() => ({
    ...state, currentAccount, can,
    switchAccount(id) { if (state.accounts.some((account) => account.id === id && account.active)) setState((prev) => ({ ...prev, currentId: id })); },
    saveAccount(input) {
      if (!can('accounts.manage')) return null;
      const id = input.id ?? createId('account');
      const email = input.email.trim().toLowerCase();
      if (!input.name.trim() || !email || !state.roles.some((role) => role.id === input.roleId) || state.accounts.some((account) => account.id !== id && account.email.toLowerCase() === email)) return null;
      const previous = state.accounts.find((account) => account.id === id);
      if (previous && previous.active && state.roles.find((role) => role.id === previous.roleId)?.permissions.includes('accounts.manage') && state.roles.find((role) => role.id === previous.roleId)?.permissions.includes('roles.manage') && (!input.active || !state.roles.find((role) => role.id === input.roleId)?.permissions.includes('accounts.manage') || !state.roles.find((role) => role.id === input.roleId)?.permissions.includes('roles.manage')) && !hasOtherAdmin(state.accounts, state.roles, id)) return null;
      if (id === state.currentId && !input.active) return null;
      const account: Account = { id, name: input.name.trim(), email, roleId: input.roleId, active: input.active };
      setState((prev) => ({ ...prev, accounts: previous ? prev.accounts.map((item) => item.id === id ? account : item) : [...prev.accounts, account] }));
      return id;
    },
    deleteAccount(id) {
      if (!can('accounts.manage') || id === state.currentId) return false;
      const account = state.accounts.find((item) => item.id === id);
      if (!account || (account.active && !hasOtherAdmin(state.accounts, state.roles, id))) return false;
      setState((prev) => ({ ...prev, accounts: prev.accounts.filter((item) => item.id !== id) }));
      return true;
    },
    saveRole(input) {
      if (!can('roles.manage')) return null;
      const id = input.id ?? createId('role');
      const previous = state.roles.find((role) => role.id === id);
      if (!input.name.trim() || previous?.system || state.roles.some((role) => role.id !== id && role.name.toLowerCase() === input.name.trim().toLowerCase())) return null;
      const allowed = permissions.map((item) => item.id).filter((permission) => input.permissions.includes(permission));
      if (previous && state.accounts.some((account) => account.active && account.roleId === id) && previous.permissions.includes('accounts.manage') && previous.permissions.includes('roles.manage') && (!allowed.includes('accounts.manage') || !allowed.includes('roles.manage')) && !state.accounts.some((account) => account.active && account.roleId !== id && state.roles.find((role) => role.id === account.roleId)?.permissions.includes('accounts.manage') && state.roles.find((role) => role.id === account.roleId)?.permissions.includes('roles.manage'))) return null;
      const role: Role = { id, name: input.name.trim(), description: input.description.trim(), permissions: allowed };
      setState((prev) => ({ ...prev, roles: previous ? prev.roles.map((item) => item.id === id ? role : item) : [...prev.roles, role] }));
      return id;
    },
    deleteRole(id) {
      if (!can('roles.manage') || state.roles.find((role) => role.id === id)?.system || state.accounts.some((account) => account.roleId === id)) return false;
      setState((prev) => ({ ...prev, roles: prev.roles.filter((role) => role.id !== id) }));
      return true;
    }
  }), [state, currentAccount, currentRole]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const value = useContext(AccessContext);
  if (!value) throw new Error('useAccess must be used inside AccessProvider');
  return value;
}
