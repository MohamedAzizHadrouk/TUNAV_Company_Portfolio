import {
  BookOpenIcon,
  FileSpreadsheetIcon,
  GraduationCapIcon,
  ImageIcon,
  MonitorPlayIcon,
  NewspaperIcon,
  PresentationIcon } from
'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ShowcaseCategory } from '../types/portfolio';

export const showcaseCategories: {id: ShowcaseCategory;label: string;icon: LucideIcon;}[] = [
{ id: 'tutorials', label: 'Product Tutorials', icon: GraduationCapIcon },
{ id: 'demos', label: 'Product Demos', icon: MonitorPlayIcon },
{ id: 'brochures', label: 'Brochures & Flyers', icon: NewspaperIcon },
{ id: 'datasheets', label: 'Product Datasheets', icon: FileSpreadsheetIcon },
{ id: 'guides', label: 'User Guides & Manuals', icon: BookOpenIcon },
{ id: 'presentations', label: 'Presentations', icon: PresentationIcon },
{ id: 'media', label: 'Media & Visuals', icon: ImageIcon }];