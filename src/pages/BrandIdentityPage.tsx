import { useState } from 'react';
import { HeartIcon, MessageSquareQuoteIcon, PencilIcon } from 'lucide-react';
import { usePortfolio } from '../contexts/PortfolioContext';
import { PageHeader } from '../components/PageHeader';
import { ListSection } from '../components/products/ListSection';
import { BrandColorsSection } from '../components/brand/BrandColorsSection';
import { BrandFontsSection } from '../components/brand/BrandFontsSection';
import { BrandBasicsModal } from '../components/brand/BrandBasicsModal';
import { BrandResourcesSection } from '../components/brand/BrandResourcesSection';
import type { BrandIdentity } from '../types/portfolio';

export function BrandIdentityPage() {
  const { brand, setBrand } = usePortfolio();
  const [editing, setEditing] = useState(false);
  const patch = (changes: Partial<BrandIdentity>) => setBrand((b) => ({ ...b, ...changes }));

  return (
    <div className="w-full">
      <PageHeader title="Brand Identity" description="The single source of truth for how your company looks and sounds." />

      <section aria-label="Logo and mission" className="mb-5 grid overflow-hidden rounded-2xl border border-line md:grid-cols-[320px_1fr]">
        <div className="flex items-center justify-center border-b border-line bg-white p-10 md:border-b-0 md:border-r">
          <img src={brand.logoUrl} alt={`${brand.companyName} logo`} className="h-40 w-40 object-contain" />
        </div>
        <div className="flex flex-col justify-center gap-4 p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-3xl font-semibold tracking-tight text-ink">{brand.companyName}</h2>
            <button className="btn-ghost" onClick={() => setEditing(true)}>
              <PencilIcon className="h-4 w-4" /> Edit
            </button>
          </div>
          <p className="max-w-2xl text-lg leading-relaxed text-muted">{brand.mission || 'Add your mission statement.'}</p>
          <div className="flex gap-1.5" aria-hidden>
            {brand.colors.map((c) =>
            <span key={c.id} className="h-2 w-10 rounded-full border border-line" style={{ background: c.hex }} />
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-4">
        <BrandColorsSection colors={brand.colors} onChange={(colors) => patch({ colors })} />
        <div className="grid gap-4 md:grid-cols-3">
          <BrandFontsSection fonts={brand.fonts} onChange={(fonts) => patch({ fonts })} />
          <ListSection title="Brand Values" icon={HeartIcon} items={brand.values} placeholder="Add a value" emptyText="No values defined." onChange={(values) => patch({ values })} />
          <ListSection title="Tone of Voice" icon={MessageSquareQuoteIcon} items={brand.voice} placeholder="Add a voice principle" emptyText="No voice principles." onChange={(voice) => patch({ voice })} />
        </div>
        <BrandResourcesSection resources={brand.resources} onChange={(resources) => patch({ resources })} />
      </div>

      <BrandBasicsModal
        open={editing}
        brand={brand}
        onClose={() => setEditing(false)}
        onSave={(values) => {
          patch(values);
          setEditing(false);
        }} />
      
    </div>);

}
