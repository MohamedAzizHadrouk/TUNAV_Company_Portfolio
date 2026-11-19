import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { format } from 'date-fns';
import { usePortfolio } from '../contexts/PortfolioContext';
import { useProduct } from '../hooks/useProduct';
import { StatusPill } from '../components/StatusPill';
import { Modal } from '../components/Modal';
import { ProductNotFound } from '../components/products/ProductNotFound';
import { ProductFormModal, type ProductBasics } from '../components/products/ProductFormModal';
import { LifecycleSection } from '../components/products/LifecycleSection';
import { SectionTiles } from '../components/products/SectionTiles';
import { methodologies } from '../data/scrum';
import { useAccess } from '../contexts/AccessContext';

export function ProductDetail() {
  const navigate = useNavigate();
  const { setProducts, setHardware } = usePortfolio();
  const { can } = useAccess();
  const { product, patch } = useProduct();
  const [editingBasics, setEditingBasics] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!product) return <ProductNotFound />;

  const basics: ProductBasics = {
    name: product.name,
    tagline: product.tagline,
    category: product.category,
    status: product.status,
    methodology: product.methodology
  };
  const methodology = methodologies.find((m) => m.id === product.methodology) ?? methodologies[0];

  return (
    <div className="w-full">
      <Link to="/products" className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeftIcon className="h-4 w-4" /> All products
      </Link>

      <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-line border-l-4 border-l-brand bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-base font-semibold text-white shadow-lg shadow-brand/20">
            {product.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-brand-700">Product overview</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">{product.name}</h1>
              <StatusPill status={product.status} />
            </div>
            <p className="mt-1 text-sm text-muted">{product.tagline || 'No tagline yet'}</p>
            <p className="mt-1 text-xs text-muted">
              {product.category || 'Uncategorised'} · {methodology.label} framework · Updated {format(new Date(product.updatedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        {can('portfolio.edit') && <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => setEditingBasics(true)}>
            <PencilIcon className="h-4 w-4" /> Edit details
          </button>
          <button className="btn-ghost text-red-600 hover:bg-red-50" aria-label="Delete product" onClick={() => setConfirmDelete(true)}>
            <Trash2Icon className="h-4 w-4" />
          </button>
        </div>}
      </div>

      <div className="flex flex-col gap-3">
        {can('portfolio.edit') && <LifecycleSection status={product.status} onChange={(status) => patch({ status })} />}
        <SectionTiles product={product} />
      </div>

      <ProductFormModal
        open={editingBasics}
        title="Edit product details"
        initial={basics}
        onClose={() => setEditingBasics(false)}
        onSubmit={(values) => {
          patch(values);
          setEditingBasics(false);
        }} />
      

      <Modal
        open={confirmDelete}
        title="Delete product?"
        onClose={() => setConfirmDelete(false)}
        footer={
        <>
            <button className="btn-ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button
            className="btn-primary bg-red-600 hover:bg-red-700"
            onClick={() => {
              setHardware((prev) => prev.map((h) => ({ ...h, assignments: h.assignments.filter((a) => a.productId !== product.id) })));
              setProducts((prev) => prev.filter((p) => p.id !== product.id));
              navigate('/products');
            }}>
            
              Delete
            </button>
          </>
        }>
        
        <p className="text-sm text-muted">
          <span className="font-medium text-ink">{product.name}</span>, its backlog and all sections will be permanently removed. Linked hardware stays in the company inventory.
        </p>
      </Modal>
    </div>);

}
