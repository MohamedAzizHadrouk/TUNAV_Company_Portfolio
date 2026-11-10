import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from 'lucide-react';
import { sectionById, type ProductSectionId } from '../../data/sections';
import type { Product } from '../../types/portfolio';

interface ProductSubpageProps {
  product: Product;
  sectionId: ProductSectionId;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function ProductSubpage({ product, sectionId, actions, children }: ProductSubpageProps) {
  const section = sectionById(sectionId);
  return (
    <div className="w-full">
      <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1.5 text-sm text-muted">
        <Link to="/products" className="hover:text-ink">Products</Link>
        <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
        <Link to={`/products/${product.id}`} className="hover:text-ink">{product.name}</Link>
        <ChevronRightIcon className="h-3.5 w-3.5" aria-hidden />
        <span className="text-ink">{section.label}</span>
      </nav>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold tracking-tight text-ink">{section.label}</h1>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </div>);
}
