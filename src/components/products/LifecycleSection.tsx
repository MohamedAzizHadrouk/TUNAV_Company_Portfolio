import { motion } from 'framer-motion';
import { ActivityIcon } from 'lucide-react';
import { phases } from '../../data/phases';
import type { ProductStatus } from '../../types/portfolio';

interface LifecycleSectionProps {
  status: ProductStatus;
  onChange: (status: ProductStatus) => void;
}

export function LifecycleSection({ status, onChange }: LifecycleSectionProps) {
  const activeIndex = phases.findIndex((p) => p.id === status);

  return (
    <section aria-label="Status of the product" className="rounded-xl border border-line bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ActivityIcon className="h-4 w-4 text-brand" aria-hidden />
          Status of the Product
        </h2>
        <p className="text-xs text-muted">Click a phase to update</p>
      </div>
      <div role="radiogroup" aria-label="Lifecycle phase" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {phases.map((p, i) => {
          const active = p.id === status;
          const passed = i < activeIndex;
          return (
            <button
              key={p.id}
              role="radio"
              aria-checked={active}
              onClick={() => onChange(p.id)}
              className={`relative flex flex-col items-start gap-0.5 overflow-hidden rounded-lg border px-2.5 py-2 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
              active ? 'border-brand bg-brand text-white' : 'border-line bg-white hover:border-brand/40'}`
              }>
              
              {active &&
              <motion.span
                layoutId="phase-active"
                className="absolute inset-0 bg-brand"
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                aria-hidden />

              }
              <span className={`relative text-[11px] font-medium tabular-nums ${active ? 'text-white/70' : passed ? 'text-brand' : 'text-muted'}`}>
                Phase {i + 1}
              </span>
              <span className={`relative whitespace-nowrap text-sm font-semibold ${active ? 'text-white' : 'text-ink'}`}>{p.label}</span>
              <span className={`relative text-xs ${active ? 'text-white/80' : 'text-muted'}`}>{p.hint}</span>
            </button>);

        })}
      </div>
    </section>);

}