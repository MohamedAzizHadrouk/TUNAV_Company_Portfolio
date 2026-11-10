import {
  CpuIcon,
  LayersIcon,
  Link2Icon,
  MegaphoneIcon,
  PresentationIcon,
  TagIcon } from
  'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ProductSectionId =
'hardware' |
'sales-arguments' |
'sales-offers' |
'showcase' |
'design-system' |
'links';

export type SectionGroup = 'workflow' | 'portfolio';

export const productSections: {
  id: ProductSectionId;
  label: string;
  short: string;
  icon: LucideIcon;
  description: string;
  group: SectionGroup;
}[] = [
{ id: 'hardware', label: 'Hardware Capability', short: 'Hardware', icon: CpuIcon, description: 'Assigned hardware, capabilities, and public or private technical documents.', group: 'portfolio' },
{ id: 'sales-arguments', label: 'Sales Arguments', short: 'Arguments', icon: MegaphoneIcon, description: 'Why customers buy — every argument backed by a proof of concept.', group: 'portfolio' },
{ id: 'sales-offers', label: 'Sales Offer', short: 'Offers', icon: TagIcon, description: 'Subscription, installation, and hardware offers with selling prices.', group: 'portfolio' },
{ id: 'showcase', label: 'Product Showcase', short: 'Showcase', icon: PresentationIcon, description: 'Tutorials, demos, brochures, datasheets, guides, presentations and visuals.', group: 'portfolio' },
{ id: 'design-system', label: 'Design System', short: 'Design', icon: LayersIcon, description: 'Colors, typography and guidelines for this product.', group: 'portfolio' },
{ id: 'links', label: 'Solution & Demo Links', short: 'Links', icon: Link2Icon, description: 'Where to see the live solution and demos.', group: 'portfolio' }];

export function sectionById(id: ProductSectionId) {
  return productSections.find((section) => section.id === id) ?? productSections[0];
}
