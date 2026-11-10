import { capabilityStatuses, confidenceLevels } from '../../data/capabilities';
import type { CapabilityStatus, ValidationConfidence } from '../../types/portfolio';

export function CapabilityStatusBadge({ status }: {status: CapabilityStatus;}) {
  const s = capabilityStatuses.find((x) => x.id === status) ?? capabilityStatuses[2];
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${s.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>);

}

export function ConfidenceMeter({ confidence }: {confidence: ValidationConfidence;}) {
  const c = confidenceLevels.find((x) => x.id === confidence) ?? confidenceLevels[2];
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap" aria-label={`${c.label} validation confidence`}>
      <span className="flex items-end gap-0.5" aria-hidden>
        {[1, 2, 3].map((n) =>
        <span key={n} className={`w-1 rounded-sm ${n <= c.bars ? c.bar : 'bg-line'}`} style={{ height: 4 + n * 3 }} />
        )}
      </span>
      <span className={`text-xs font-medium ${c.tone}`}>{c.label}</span>
    </span>);

}