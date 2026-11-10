import type { ProductStatus } from '../types/portfolio';

export const phases: {
  id: ProductStatus;
  label: string;
  hint: string;
  dot: string;
  pill: string;
}[] = [
{ id: 'development', label: 'Development', hint: 'Building & validating', dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-700' },
{ id: 'introduction', label: 'Introduction', hint: 'First customers', dot: 'bg-accent', pill: 'bg-cyan-50 text-cyan-800' },
{ id: 'growth', label: 'Growth', hint: 'Rapid adoption', dot: 'bg-brand', pill: 'bg-brand-50 text-brand-700' },
{ id: 'maturity', label: 'Maturity', hint: 'Stable revenue', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-800' },
{ id: 'decline', label: 'Decline', hint: 'Shrinking demand', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800' },
{ id: 'scalability', label: 'Scalability', hint: 'Expanding markets', dot: 'bg-violet-500', pill: 'bg-violet-50 text-violet-800' }];