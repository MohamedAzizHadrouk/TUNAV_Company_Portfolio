import { phases } from '../data/phases';
import type { ProductStatus } from '../types/portfolio';

export function StatusPill({ status }: {status: ProductStatus;}) {
  const phase = phases.find((p) => p.id === status) ?? phases[0];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${phase.pill}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${phase.dot}`} aria-hidden />
      {phase.label} Phase
    </span>);

}