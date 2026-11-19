import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, HardDriveIcon, LayoutGridIcon, SettingsIcon, SparklesIcon } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useAccess } from '../contexts/AccessContext';

const sections = [
  { label: 'Products', path: '/products', icon: LayoutGridIcon },
  { label: 'Hardware', path: '/hardware', icon: HardDriveIcon }
];

const productPages: Record<string, string> = {
  flow: 'Product flow', agenda: 'Agenda', ideas: 'Idea Gate', hardware: 'Hardware',
  'sales-arguments': 'Sales arguments', 'sales-offers': 'Sales offers', showcase: 'Showcase',
  'design-system': 'Design system', links: 'Links'
};

export function AppLayout() {
  const { brand, products } = usePortfolio();
  const access = useAccess();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('portfolio-sidebar-collapsed') === 'true');
  const [denied, setDenied] = useState(false);
  const initials = access.currentAccount.name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('').toUpperCase();
  const parts = location.pathname.split('/').filter(Boolean);
  const product = parts[0] === 'products' ? products.find((item) => item.id === parts[1]) : undefined;
  const sectionName = parts[0] === 'hardware' ? 'Hardware inventory' : parts[0] === 'settings' ? 'Settings' : parts[2] ? productPages[parts[2]] ?? 'Product' : product?.name ?? 'Products';

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
    <div className="flex min-h-screen bg-canvas">
      <aside className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-line bg-white shadow-[4px_0_28px_-24px_rgba(63,63,63,0.35)] transition-[width] duration-150 ${collapsed ? 'w-[72px]' : 'w-[232px] max-sm:w-[72px]'}`} aria-label="Main menu">
        <div className={`flex h-[84px] items-center border-b border-line max-sm:justify-center ${collapsed ? 'justify-center px-2' : 'justify-between px-4 max-sm:px-2'}`}>
          {!collapsed && <div className="flex min-w-0 items-center gap-2.5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50"><img src={brand.logoUrl} alt="" className="h-8 w-8 object-contain" /></span><span className="min-w-0 max-sm:hidden"><span className="block truncate text-sm font-semibold text-ink">{brand.companyName}</span><span className="block text-xs font-medium uppercase tracking-[0.08em] text-muted">Workspace</span></span></div>}
          <button type="button" className="icon-btn shrink-0 max-sm:hidden" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2.5" aria-label="Sections">
          {!collapsed && <p className="px-3 pb-2 pt-5 text-xs font-semibold uppercase tracking-[0.08em] text-muted max-sm:hidden">Explore</p>}
          {sections.filter((item) => item.path !== '/hardware' || access.can('portfolio.edit') || access.can('hardware.manage')).map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path} title={collapsed ? label : undefined} aria-label={label} className={({ isActive }) => `flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors max-sm:justify-center ${collapsed ? 'justify-center' : 'gap-3'} ${isActive ? 'bg-brand-50 text-brand-700 shadow-[inset_3px_0_0_#0848FE]' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {!collapsed && <span className="truncate max-sm:hidden">{label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-line p-2.5">
          {access.can('accounts.manage') && <NavLink to="/settings" title={collapsed ? 'Settings' : undefined} aria-label="Settings" className={({ isActive }) => `flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors max-sm:justify-center ${collapsed ? 'justify-center' : 'gap-3'} ${isActive ? 'bg-brand-50 text-brand-700 shadow-[inset_3px_0_0_#0848FE]' : 'text-muted hover:bg-canvas hover:text-ink'}`}>
            <SettingsIcon className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {!collapsed && <span className="max-sm:hidden">Settings</span>}
          </NavLink>}
          <div className="my-1 border-t border-line" />
          <label className={`relative flex items-center rounded-lg px-2 py-2 max-sm:justify-center ${collapsed ? 'justify-center' : 'gap-2'}`} title={access.currentAccount.name}>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">{initials}</span>
            {!collapsed && <><span className="min-w-0 flex-1 max-sm:hidden"><span className="block truncate text-xs font-semibold text-ink">{access.currentAccount.name}</span><span className="block truncate text-[11px] text-muted">{access.roles.find((role) => role.id === access.currentAccount.roleId)?.name}</span></span><ChevronDownIcon className="h-3.5 w-3.5 text-muted max-sm:hidden" /></>}
            <select className="absolute inset-0 h-full w-full cursor-pointer opacity-0" aria-label="Switch account" value={access.currentId} onChange={(event) => access.switchAccount(event.target.value)}>
              {access.accounts.filter((account) => account.active).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
            </select>
          </label>
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="flex min-h-[84px] items-center justify-between gap-3 border-b border-line bg-white px-5 sm:px-8">
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Portfolio workspace</p><p className="mt-1 truncate text-sm font-semibold text-ink">{product && parts.length > 2 ? `${product.name}  /  ${sectionName}` : sectionName}</p></div>
          <span className="hidden items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 sm:inline-flex"><SparklesIcon className="h-3.5 w-3.5" aria-hidden /> {brand.companyName.trim().toUpperCase() === 'TUNAV' ? 'One intelligent ecosystem' : 'Product workspace'}</span>
        </header>
        <div className="mx-auto w-full max-w-[1660px] px-5 py-6 sm:px-8 sm:py-8">
        {denied && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Your role does not allow this change.</div>}
        <Outlet />
        </div>
      </main>
    </div>
  );
}
