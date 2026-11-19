import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createId } from '../utils/id';

export const permissions = [
  { id: 'portfolio.edit', label: 'Edit portfolio', description: 'Create and change products, brand, files, and hardware.' },
  { id: 'sprints.manage', label: 'Manage sprints', description: 'Create sprints, update tasks, and edit sprint stories.' },
  { id: 'capabilities.manage', label: 'Manage capabilities', description: 'Create and update domains, As-is items, and capabilities.' },
  { id: 'backlog.manage', label: 'Manage backlog', description: 'Create and update epics, features, and user stories.' },
  { id: 'tasks.uiux.manage', label: 'UI/UX tasks', description: 'Add, update, and validate UI/UX tasks.' },
  { id: 'tasks.conception.manage', label: 'Conception tasks', description: 'Add, update, and validate conception tasks and ADRs.' },
  { id: 'tasks.development.manage', label: 'Development tasks', description: 'Add, update, and validate development tasks.' },
  { id: 'increment.manage', label: 'Sprint increments', description: 'Add or import and validate sprint increments.' },
  { id: 'subbacklogs.manage', label: 'Sub-product backlogs', description: 'Create and update sub-product backlogs.' },
  { id: 'sprints.create', label: 'Start sprints', description: 'Create and edit sprints.' },
  { id: 'ideas.submit', label: 'Submit ideas', description: 'Share product, domain, and capability ideas.' },
  { id: 'design-system.manage', label: 'Manage design system', description: 'Edit a product’s design system.' },
  { id: 'showcase.manage', label: 'Manage showcase', description: 'Add and update product showcase resources.' },
  { id: 'hardware.manage', label: 'Manage hardware', description: 'Manage hardware equipment and technical documents.' },
  { id: 'sales.manage', label: 'Manage sales material', description: 'Edit sales arguments and offers.' },
  { id: 'accounts.manage', label: 'Manage accounts', description: 'Create, edit, activate, and deactivate accounts.' },
  { id: 'roles.manage', label: 'Manage roles', description: 'Create roles and choose their permissions.' }
] as const;

export type Permission = typeof permissions[number]['id'];
export type AccessLevel = 'none' | 'read' | 'write';
export interface ProductAssignment { productId: string; sections: Record<string, AccessLevel>; cards: Record<string, AccessLevel> }
export interface Role { id: string; name: string; description: string; permissions: Permission[]; system?: boolean }
export interface Account { id: string; name: string; email: string; roleId: string; active: boolean; permissions?: Permission[]; grants?: Permission[]; assignments?: ProductAssignment[] }
interface AccessState { version: 2; roles: Role[]; accounts: Account[]; currentId: string }

const initial: AccessState = {
  version: 2,
  roles: [
    { id: 'admin', name: 'Administrator', description: 'Full access to this workspace.', permissions: permissions.map((item) => item.id), system: true },
    { id: 'viewer', name: 'Viewer', description: 'Read invited products and cards, and submit ideas.', permissions: ['ideas.submit'], system: true },
    { id: 'product-owner', name: 'Product owner', description: 'Manage capabilities and the product backlog.', permissions: ['capabilities.manage', 'backlog.manage', 'subbacklogs.manage'], system: true },
    { id: 'dev-lead', name: 'Dev Lead', description: 'Manage development, sprints, and increments.', permissions: ['tasks.development.manage', 'increment.manage', 'subbacklogs.manage', 'sprints.create'], system: true },
    { id: 'uiux-designer', name: 'UI/UX designer', description: 'Manage UI/UX tasks, design systems, and showcases.', permissions: ['tasks.uiux.manage', 'design-system.manage', 'showcase.manage'], system: true },
    { id: 'technical-manager', name: 'Technical Manager', description: 'Manage hardware equipment and technical documents.', permissions: ['hardware.manage'], system: true },
    { id: 'it-manager', name: 'IT Manager', description: 'Manage conception tasks and validate ADRs.', permissions: ['tasks.conception.manage'], system: true },
    { id: 'commercial-manager', name: 'Commercial Manager', description: 'Manage sales arguments and offers.', permissions: ['sales.manage'], system: true }
  ],
  accounts: [{ id: 'local-owner', name: 'Workspace owner', email: 'owner@local.workspace', roleId: 'admin', active: true }],
  currentId: 'local-owner'
};

interface AccessContextValue extends AccessState {
  currentAccount: Account;
  can: (permission: Permission) => boolean;
  canReadProduct: (productId: string) => boolean;
  canReadSection: (productId: string, sectionId: string) => boolean;
  canWriteSection: (productId: string, sectionId: string) => boolean;
  canReadCard: (productId: string, cardId: string) => boolean;
  canWriteCard: (productId: string, cardId: string) => boolean;
  switchAccount: (id: string) => void;
  saveAccount: (input: Omit<Account, 'id'> & { id?: string }) => string | null;
  deleteAccount: (id: string) => boolean;
  saveRole: (input: Omit<Role, 'id' | 'system'> & { id?: string }) => string | null;
  deleteRole: (id: string) => boolean;
}

const AccessContext = createContext<AccessContextValue | null>(null);
const storageKey = 'cp.v1.access';

function accountPermissions(account: Account, roles: Role[]): Permission[] {
  if (Array.isArray(account.permissions)) return permissions.map((item) => item.id).filter((permission) => account.permissions?.includes(permission));
  const rolePermissions = roles.find((role) => role.id === account.roleId)?.permissions ?? [];
  return permissions.map((item) => item.id).filter((permission) => rolePermissions.includes(permission) || account.grants?.includes(permission));
}

function hasAdminAccess(account: Account, roles: Role[]): boolean {
  const allowed = accountPermissions(account, roles);
  return account.active && allowed.includes('accounts.manage') && allowed.includes('roles.manage');
}

function loadState(): AccessState {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<AccessState>;
    if (!Array.isArray(parsed.roles) || !Array.isArray(parsed.accounts)) return initial;
    const stored = parsed.roles.filter((role) => role && typeof role.id === 'string' && typeof role.name === 'string' && (!['editor', 'visitor'].includes(role.id) || parsed.accounts!.some((account) => account.roleId === role.id)));
    const roles = [...stored.map((role) => ({ ...role, name: initial.roles.find((item) => item.id === role.id)?.name ?? role.name, description: initial.roles.find((item) => item.id === role.id)?.description ?? role.description, permissions: permissions.map((item) => item.id).filter((id) => role.permissions?.includes(id) || (['admin', 'editor'].includes(role.id) && initial.roles.find((item) => item.id === 'admin')?.permissions.includes(id) && (role.id === 'admin' || !['accounts.manage', 'roles.manage'].includes(id))) || initial.roles.find((item) => item.id === role.id)?.permissions.includes(id)) })), ...initial.roles.filter((role) => !stored.some((item) => item.id === role.id))];
    const accounts = parsed.accounts.filter((account) => account && typeof account.id === 'string' && typeof account.name === 'string' && typeof account.email === 'string' && roles.some((role) => role.id === account.roleId)).map((account) => parsed.version === 2 || ['admin', 'visitor'].includes(account.roleId) ? account : { ...account, assignments: undefined });
    if (!accounts.some((account) => hasAdminAccess(account, roles))) return initial;
    return { version: 2, roles, accounts, currentId: accounts.some((account) => account.id === parsed.currentId && account.active) ? parsed.currentId! : accounts.find((account) => hasAdminAccess(account, roles))!.id };
  } catch { return initial; }
}

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccessState>(loadState);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* memory-only fallback */ } }, [state]);
  const currentAccount = state.accounts.find((account) => account.id === state.currentId && account.active) ?? state.accounts[0];
  const can = (permission: Permission) => accountPermissions(currentAccount, state.roles).includes(permission);
  const assignment = (productId: string) => currentAccount.assignments?.find((item) => item.productId === productId);
  const scoped = currentAccount.roleId !== 'admin' && Array.isArray(currentAccount.assignments);
  const canReadProduct = (productId: string) => !scoped || Boolean(assignment(productId));
  const canReadSection = (productId: string, sectionId: string) => !scoped || ['read', 'write'].includes(assignment(productId)?.sections?.[sectionId] ?? '') || (sectionId === 'flow' && Object.values(assignment(productId)?.cards ?? {}).some((level) => level === 'read' || level === 'write'));
  const canWriteSection = (productId: string, sectionId: string) => scoped && assignment(productId)?.sections?.[sectionId] === 'write';
  const canReadCard = (productId: string, cardId: string) => {
    if (!scoped) return true;
    const item = assignment(productId);
    if (!item) return false;
    const level = item.cards?.[cardId];
    if (level) return level === 'read' || level === 'write';
    return currentAccount.roleId !== 'visitor' && ['read', 'write'].includes(item.sections?.flow ?? '');
  };
  const canWriteCard = (productId: string, cardId: string) => {
    if (!scoped) return false;
    const item = assignment(productId);
    if (!item) return false;
    const level = item.cards?.[cardId];
    return level ? level === 'write' : item.sections?.flow === 'write' || currentAccount.roleId === 'product-owner' && item.sections?.flow === 'read';
  };
  const hasOtherAdmin = (accounts: Account[], roles: Role[], excludedId: string) => accounts.some((account) => account.id !== excludedId && hasAdminAccess(account, roles));

  const value = useMemo<AccessContextValue>(() => ({
    ...state, currentAccount, can, canReadProduct, canReadSection, canWriteSection, canReadCard, canWriteCard,
    switchAccount(id) { if (state.accounts.some((account) => account.id === id && account.active)) setState((prev) => ({ ...prev, currentId: id })); },
    saveAccount(input) {
      if (!can('accounts.manage')) return null;
      const id = input.id ?? createId('account');
      const email = input.email.trim().toLowerCase();
      if (!input.name.trim() || !email || !state.roles.some((role) => role.id === input.roleId) || state.accounts.some((account) => account.id !== id && account.email.toLowerCase() === email)) return null;
      const previous = state.accounts.find((account) => account.id === id);
      if (id === state.currentId && !input.active) return null;
      const rolePermissions = state.roles.find((role) => role.id === input.roleId)?.permissions ?? [];
      const selected = permissions.map((item) => item.id).filter((permission) => (input.permissions ?? rolePermissions).includes(permission));
      const assignments = input.roleId !== 'admin' ? (input.assignments ?? []).filter((item) => item && typeof item.productId === 'string').map((item) => ({ productId: item.productId, sections: item.sections ?? {}, cards: item.cards ?? {} })) : [];
      const account: Account = { id, name: input.name.trim(), email, roleId: input.roleId, active: input.active, permissions: selected, assignments };
      if (previous && hasAdminAccess(previous, state.roles) && !hasAdminAccess(account, state.roles) && !hasOtherAdmin(state.accounts, state.roles, id)) return null;
      setState((prev) => ({ ...prev, accounts: previous ? prev.accounts.map((item) => item.id === id ? account : item) : [...prev.accounts, account] }));
      return id;
    },
    deleteAccount(id) {
      if (!can('accounts.manage') || id === state.currentId) return false;
      const account = state.accounts.find((item) => item.id === id);
      if (!account || (hasAdminAccess(account, state.roles) && !hasOtherAdmin(state.accounts, state.roles, id))) return false;
      setState((prev) => ({ ...prev, accounts: prev.accounts.filter((item) => item.id !== id) }));
      return true;
    },
    saveRole(input) {
      if (!can('roles.manage')) return null;
      const id = input.id ?? createId('role');
      const previous = state.roles.find((role) => role.id === id);
      if (!input.name.trim() || previous?.system || state.roles.some((role) => role.id !== id && role.name.toLowerCase() === input.name.trim().toLowerCase())) return null;
      const allowed = permissions.map((item) => item.id).filter((permission) => input.permissions.includes(permission));
      const role: Role = { id, name: input.name.trim(), description: input.description.trim(), permissions: allowed };
      const nextRoles = previous ? state.roles.map((item) => item.id === id ? role : item) : [...state.roles, role];
      if (!state.accounts.some((account) => hasAdminAccess(account, nextRoles))) return null;
      setState((prev) => ({ ...prev, roles: nextRoles }));
      return id;
    },
    deleteRole(id) {
      if (!can('roles.manage') || state.roles.find((role) => role.id === id)?.system || state.accounts.some((account) => account.roleId === id)) return false;
      setState((prev) => ({ ...prev, roles: prev.roles.filter((role) => role.id !== id) }));
      return true;
    }
  }), [state, currentAccount]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const value = useContext(AccessContext);
  if (!value) throw new Error('useAccess must be used inside AccessProvider');
  return value;
}
