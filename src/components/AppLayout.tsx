import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDaysIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, FilesIcon, HardDriveIcon, ImagesIcon, LayoutGridIcon, PaletteIcon, SettingsIcon, UsersIcon } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useAccess } from '../contexts/AccessContext';

const sections = [
  { label: 'Products', path: '/products', icon: LayoutGridIcon },
  { label: 'Agenda', path: '/agenda', icon: CalendarDaysIcon },
  { label: 'Client', path: '/clients', icon: UsersIcon },
  { label: 'Hardware', path: '/hardware', icon: HardDriveIcon },
  { label: 'Album', path: '/album', icon: ImagesIcon },
  { label: 'Brand Identity', path: '/brand', icon: PaletteIcon },
  { label: 'File', path: '/files', icon: FilesIcon },
  { label: 'Settings', path: '/settings', icon: SettingsIcon }
];

export function AppLayout() {
  const { brand } = usePortfolio();
  const access = useAccess();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('portfolio-sidebar-collapsed') === 'true');
  const [denied, setDenied] = useState(false);
  const initials = access.currentAccount.name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();

  useEffect(() => { localStorage.setItem('portfolio-sidebar-collapsed', String(collapsed)); }, [collapsed]);
  useEffect(() => {
    const show = () => setDenied(true);
    window.addEventListener('portfolio:permission-denied', show);
    return () => window.removeEventListener('portfolio:permission-denied', show);
  }, []);
  useEffect(() => {
    if (!denied) return;
    const timer = window.setTimeout(() => setDenied(false), 4500);
    return () => window.clearTimeout(timer);
  }, [denied]);

  return (
    <div className="flex min-h-screen bg-white">
      <aside className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-white transition-[width] duration-150 ${collapsed ? 'w-[68px]' : 'w-[232px]'}`} aria-label="Main menu">
        <div className={`flex h-[72px] items-center border-b border-line ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          {!collapsed && <div className="flex min-w-0 items-center gap-2.5"><img src={brand.logoUrl} alt="" className="h-8 w-8 object-contain" /><span className="truncate text-sm font-semibold text-ink">{brand.companyName}</span></div>}
          <button type="button" className="icon-btn shrink-0" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Sections">
          {sections.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} title={collapsed ? label : undefined} aria-label={label} className={({ isActive }) => `flex min-h-10 items-center rounded-lg px-3 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : 'gap-3'} ${isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-2">
          <label className={`relative flex items-center rounded-lg px-2 py-2 ${collapsed ? 'justify-center' : 'gap-2'}`} title={access.currentAccount.name}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">{initials}</span>
            {!collapsed && <><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-ink">{access.currentAccount.name}</span><span className="block truncate text-[11px] text-muted">{access.roles.find((role) => role.id === access.currentAccount.roleId)?.name}</span></span><ChevronDownIcon className="h-3.5 w-3.5 text-muted" /></>}
            <select className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Switch account" value={access.currentId} onChange={(event) => access.switchAccount(event.target.value)}>
              {access.accounts.filter((account) => account.active).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-5 sm:p-7">
        {denied && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Your role does not allow this change.</div>}
        {!access.can('portfolio.edit') && !access.can('sprints.manage') && <div className="mb-4 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-sm text-brand-700">You are viewing this workspace with read-only access. Switch to an account with edit permissions to make changes.</div>}
        <Outlet />
      </main>
    </div>
  );
}
