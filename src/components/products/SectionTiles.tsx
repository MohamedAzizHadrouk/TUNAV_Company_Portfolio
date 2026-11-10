import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { usePortfolio } from '../../contexts/PortfolioContext';
import { productSections, type ProductSectionId } from '../../data/sections';
import { showcaseCategories } from '../../data/showcase';
import type { Product } from '../../types/portfolio';
import { formatOfferPrice } from '../../utils/currency';

const tileClass =
'group flex h-full flex-col rounded-xl border border-line bg-white p-3 transition-[border-color,box-shadow] duration-150 hover:border-brand/40 hover:shadow-[0_4px_20px_-8px_rgba(10,61,255,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40';

export function SectionTiles({ product }: {product: Product;}) {
  const { hardware } = usePortfolio();
  const base = `/products/${product.id}`;
  const productHardware = hardware.filter((h) => h.assignments.some((a) => a.productId === product.id));
  const showcaseCats = showcaseCategories.filter((c) => product.showcase.some((i) => i.category === c.id));

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      <Link to={`${base}/flow`} className={`${tileClass} md:col-span-2 lg:col-span-3`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Product flow</h2>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">Open flow <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></span>
        </div>
        <p className="mt-1 text-sm text-muted">Capabilities → Backlog → Sprints &amp; tasks → Realised</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ['Capabilities', product.capabilities.length],
            ['Epics', product.backlog.epics.length],
            ['Sprints', product.backlog.sprints.length],
            ['Realised', product.backlog.sprints.filter((sprint) => sprint.increment).length]
          ].map(([label, count]) => <div key={label} className="rounded-lg bg-canvas px-3 py-2"><span className="block text-[11px] text-muted">{label}</span><strong className="text-lg tabular-nums text-ink">{count}</strong></div>)}
        </div>
      </Link>
      
      <Tile
        id="hardware"
        to={`${base}/hardware`}
        metric={productHardware.length}
        unit={productHardware.length === 1 ? 'item' : 'items'}
        preview={productHardware.length ? `${productHardware.reduce((n, h) => n + (h.capabilities?.length ?? 0), 0)} hardware capabilities` : 'Assign hardware from the company inventory'} />
      
      <Tile
        id="sales-arguments"
        to={`${base}/sales-arguments`}
        metric={product.salesArguments.length}
        unit="arguments"
        preview={product.salesArguments[0]?.title ?? 'Add your first selling point'} />
      
      <Tile
        id="sales-offers"
        to={`${base}/sales-offers`}
        metric={product.salesOffers.length}
        unit="offers"
        preview={product.salesOffers.length ? product.salesOffers.map((o) => `${o.plan} ${formatOfferPrice(o.price)}`).join(' · ') : 'Define plans and pricing'} />
      
      <Tile
        id="showcase"
        to={`${base}/showcase`}
        metric={product.showcase.length}
        unit="resources"
        preview={showcaseCats.length ? showcaseCats.map((c) => c.label).join(', ') : 'Tutorials, demos, brochures, datasheets…'} />
      
      <Tile
        id="design-system"
        to={`${base}/design-system`}
        metric={product.designSystem.colors.length}
        unit="colors"
        preview={product.designSystem.typography || 'Document colors and typography'}>
        
        {product.designSystem.colors.length > 0 &&
        <div className="mt-2 flex gap-1" aria-hidden>
            {product.designSystem.colors.slice(0, 6).map((c, i) =>
          <span key={`${c}-${i}`} className="h-5 w-5 rounded-full border border-line" style={{ background: c }} />
          )}
          </div>
        }
      </Tile>
      <Tile
        id="links"
        to={`${base}/links`}
        metric={product.links.length}
        unit="links"
        preview={product.links.length ? product.links.map((l) => l.label).join(' · ') : 'Add the live solution or demo link'} />
      
    </div>);

}

interface TileProps {
  id: ProductSectionId;
  to: string;
  metric: number;
  unit: string;
  preview: string;
  className?: string;
  children?: React.ReactNode;
}

function Tile({ id, to, metric, unit, preview, className = '', children }: TileProps) {
  const section = productSections.find((s) => s.id === id) ?? productSections[0];
  const Icon = section.icon;
  return (
    <Link to={to} className={`${tileClass} ${className}`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Icon className="h-4 w-4 text-brand" aria-hidden /> {section.label}
        </span>
        <ArrowRightIcon className="h-4 w-4 text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden />
      </div>
      <p className="mt-2">
        <span className="text-xl font-semibold tabular-nums text-ink">{metric}</span>
        <span className="ml-1.5 text-sm text-muted">{unit}</span>
      </p>
      {children}
      <p className="mt-auto line-clamp-2 pt-2 text-sm text-muted">{preview}</p>
    </Link>);

}
