import type { BrandIdentity } from '../types/portfolio';

export const LOGO_URL = "/ChatGPT_Image_Sep_4,_2026,_10_17_13_AM.png";


export const brand: BrandIdentity = {
  companyName: 'Your Company',
  logoUrl: LOGO_URL,
  mission: 'We build connected software and hardware that help businesses move faster, see further and grow with confidence.',
  colors: [
  { id: 'c1', name: 'Royal Blue', hex: '#0A3DFF', role: 'Primary' },
  { id: 'c2', name: 'Sky Cyan', hex: '#0BC5F2', role: 'Accent' },
  { id: 'c3', name: 'Deep Ink', hex: '#0B1220', role: 'Text' },
  { id: 'c4', name: 'White', hex: '#FFFFFF', role: 'Background' }],

  fonts: [
  { id: 'f1', name: 'Inter', usage: 'Headings & interface' },
  { id: 'f2', name: 'Inter', usage: 'Body copy, 16px' }],

  values: ['Clarity over complexity', 'Build for the long run', 'Customers first'],
  voice: ['Confident, never arrogant', 'Plain language', 'Optimistic and precise'],
  resources: []
};
