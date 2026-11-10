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
import { AlbumPage } from './pages/AlbumPage';
import { BrandIdentityPage } from './pages/BrandIdentityPage';
import { HardwarePage } from './pages/HardwarePage';
import { FilesPage } from './pages/FilesPage';
import { AgendaPage } from './pages/AgendaPage';
import { ClientsPage } from './pages/ClientsPage';
import { Settings } from './pages/Settings';

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
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/products/:id/flow" element={<ProductFlow />} />
            <Route path="/products/:id/software" element={<FlowRedirect stage="capabilities" />} />
            <Route path="/products/:id/capabilities" element={<FlowRedirect stage="capabilities" view="register" />} />
            <Route path="/products/:id/domains" element={<FlowRedirect stage="capabilities" view="domains" />} />
            <Route path="/products/:id/gaps" element={<FlowRedirect stage="capabilities" view="register" />} />
            <Route path="/products/:id/backlog" element={<FlowRedirect stage="backlog" />} />
            <Route path="/products/:id/sprints" element={<FlowRedirect stage="sprints" />} />
            <Route path="/products/:id/hardware" element={<ProductHardware />} />
            <Route path="/products/:id/sales-arguments" element={<ProductSalesArguments />} />
            <Route path="/products/:id/sales-offers" element={<ProductSalesOffers />} />
            <Route path="/products/:id/showcase" element={<ProductShowcase />} />
            <Route path="/products/:id/design-system" element={<ProductDesignSystem />} />
            <Route path="/products/:id/links" element={<ProductLinks />} />
            <Route path="/album" element={<AlbumPage />} />
            <Route path="/brand" element={<BrandIdentityPage />} />
            <Route path="/hardware" element={<HardwarePage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PortfolioProvider></AccessProvider>);

}
