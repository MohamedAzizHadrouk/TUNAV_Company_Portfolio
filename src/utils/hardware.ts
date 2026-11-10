import { formatPrice } from './currency';
import type { Asset, HardwareCapability, HardwareDocument, HardwareItem, Product } from '../types/portfolio';

function isAsset(value: unknown): value is Asset {
  return !!value && typeof value === 'object' && 'kind' in value && 'value' in value && typeof value.value === 'string' && (value.kind === 'file' || value.kind === 'url' || value.kind === 'text');
}

export function normalizeHardware(value: unknown): HardwareItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') return [];
    const item = raw as HardwareItem;
    const documents: HardwareDocument[] = Array.isArray(item.documents) ? item.documents.filter((document) => document && typeof document.id === 'string' && isAsset(document.asset)).map((document) => ({ ...document, title: document.title || document.asset.fileName || 'Technical document', visibility: document.visibility === 'public' ? 'public' : 'private' })) : [];
    if (isAsset(item.document) && !documents.some((document) => document.id === `legacy-doc-${item.id}`)) documents.push({ id: `legacy-doc-${item.id}`, title: item.document.fileName || 'Technical document', asset: item.document, visibility: 'private' });
    const capabilities: HardwareCapability[] = (Array.isArray(item.capabilities) ? item.capabilities : []).map((capability) => {
      if (isAsset(capability.document) && !documents.some((document) => document.id === `legacy-cap-doc-${capability.id}`)) documents.push({ id: `legacy-cap-doc-${capability.id}`, title: `${capability.title} document`, asset: capability.document, visibility: capability.visibility === 'public' ? 'public' : 'private' });
      return { id: capability.id, title: capability.title, description: capability.description ?? '' };
    });
    return [{ ...item, document: null, documents, capabilities }];
  });
}

export function migrateHardwareOffers(products: Product[], hardware: HardwareItem[]): Product[] {
  const priced = hardware.flatMap((item) => item.assignments.flatMap((assignment) => assignment.salePrice == null ? [] : [{ item, assignment }]));
  if (!priced.length) return products;
  return products.map((product) => {
    const existing = product.salesOffers.map((offer) => {
      if (offer.type) return offer;
      const match = priced.find(({ assignment }) => assignment.productId === product.id && offer.billing.toLowerCase().includes('one-time') && offer.includes.some((value) => value.toLowerCase() === 'hardware') && Number(offer.price.replace(',', '.').replace(/[^\d.]/g, '')) === assignment.salePrice);
      return match ? { ...offer, type: 'hardware' as const, hardwareId: match.item.id } : offer;
    });
    const additions = priced.filter(({ item, assignment }) => assignment.productId === product.id && !existing.some((offer) => offer.id === `legacy-hardware-${product.id}-${item.id}` || (offer.type === 'hardware' && offer.hardwareId === item.id))).map(({ item, assignment }) => ({ id: `legacy-hardware-${product.id}-${item.id}`, type: 'hardware' as const, hardwareId: item.id, plan: item.title, price: formatPrice(assignment.salePrice!), billing: 'one-time', description: `Hardware offer for ${item.title}.`, includes: [item.title] }));
    return additions.length || existing.some((offer, index) => offer !== product.salesOffers[index]) ? { ...product, salesOffers: [...existing, ...additions] } : product;
  });
}
