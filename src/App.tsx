import { BrowserRouter, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { AccessProvider } from './contexts/AccessContext';
import { AppLayout } from './components/AppLayout';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { ProductFlow } from './pages/product/ProductFlow';
import { ProductHardware } from './pages/product/ProductHardware';
import { ProductSalesArguments } from './pages/product/ProductSalesArguments';
import { ProductSalesOffers } from './pages/product/ProductSalesOffers';
import { ProductShowcase } from './pages/product/ProductShowcase';
import { ProductDesignSystem } from './pages/product/ProductDesignSystem';
import { ProductLinks } from './pages/product/ProductLinks';
import { HardwarePage } from './pages/HardwarePage';
import { ProductAgenda } from './pages/product/ProductAgenda';
import { ProductIdeas } from './pages/product/ProductIdeas';
import { Settings } from './pages/Settings';
import { useAccess } from './contexts/AccessContext';
import type { ReactNode } from 'react';

function ProductGate({ section, children }: { section?: string; children: ReactNode }) {
  const { id } = useParams();
  const access = useAccess();
  if (!id || !access.canReadProduct(id) || (section && !access.canReadSection(id, section))) return <div className="rounded-xl border border-line bg-white p-6"><h1 className="text-lg font-semibold text-ink">Access not assigned</h1><p className="mt-1 text-sm text-muted">This product or section is not available to your account.</p></div>;
  return children;
}

function Restricted({ permission, children }: { permission: 'portfolio.edit' | 'hardware.manage' | 'accounts.manage'; children: ReactNode }) {
  const access = useAccess();
  return access.can(permission) || permission === 'hardware.manage' && access.can('portfolio.edit') ? children : <div className="rounded-xl border border-line bg-white p-6"><h1 className="text-lg font-semibold text-ink">Access not assigned</h1><p className="mt-1 text-sm text-muted">This section is not available to your account.</p></div>;
}

/** The old workflow pages now live inside Product flow. */
function FlowRedirect({ stage, view }: {stage: 'capabilities' | 'backlog' | 'sprints';view?: string;}) {
  const { id } = useParams();
  const [params] = useSearchParams();
  const next = new URLSearchParams(params);
  next.set('stage', stage);
  if (view) next.set('view', view);
  return <Navigate to={`/products/${id}/flow?${next.toString()}`} replace />;
}

export function App() {
  return (
    <AccessProvider><PortfolioProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductGate><ProductDetail /></ProductGate>} />
            <Route path="/products/:id/agenda" element={<ProductGate section="agenda"><ProductAgenda /></ProductGate>} />
            <Route path="/products/:id/ideas" element={<ProductGate section="ideas"><ProductIdeas /></ProductGate>} />
            <Route path="/products/:id/flow" element={<ProductGate section="flow"><ProductFlow /></ProductGate>} />
            <Route path="/products/:id/software" element={<FlowRedirect stage="capabilities" />} />
            <Route path="/products/:id/capabilities" element={<FlowRedirect stage="capabilities" view="register" />} />
            <Route path="/products/:id/domains" element={<FlowRedirect stage="capabilities" view="domains" />} />
            <Route path="/products/:id/gaps" element={<FlowRedirect stage="capabilities" view="register" />} />
            <Route path="/products/:id/backlog" element={<FlowRedirect stage="backlog" />} />
            <Route path="/products/:id/sprints" element={<FlowRedirect stage="sprints" />} />
            <Route path="/products/:id/hardware" element={<ProductGate section="hardware"><ProductHardware /></ProductGate>} />
            <Route path="/products/:id/sales-arguments" element={<ProductGate section="sales-arguments"><ProductSalesArguments /></ProductGate>} />
            <Route path="/products/:id/sales-offers" element={<ProductGate section="sales-offers"><ProductSalesOffers /></ProductGate>} />
            <Route path="/products/:id/showcase" element={<ProductGate section="showcase"><ProductShowcase /></ProductGate>} />
            <Route path="/products/:id/design-system" element={<ProductGate section="design-system"><ProductDesignSystem /></ProductGate>} />
            <Route path="/products/:id/links" element={<ProductGate section="links"><ProductLinks /></ProductGate>} />
            <Route path="/hardware" element={<Restricted permission="hardware.manage"><HardwarePage /></Restricted>} />
            <Route path="/settings" element={<Restricted permission="accounts.manage"><Settings /></Restricted>} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PortfolioProvider></AccessProvider>);

}
