import React, { createContext, useContext, useEffect, useState } from 'react';
import { products as seedProducts } from '../data/products';
import { albums as seedAlbums } from '../data/albums';
import { brand as seedBrand } from '../data/brand';
import { hardware as seedHardware } from '../data/hardware';
import { migrateProducts } from '../utils/migrate';
import { emptyCompanyLibrary, normalizeCompanyLibrary } from '../data/files';
import { migrateHardwareOffers, normalizeHardware } from '../utils/hardware';
import { formatOfferPrice } from '../utils/currency';
import type { Album, BrandIdentity, CompanyClient, CompanyEvent, CompanyLibrary, HardwareItem, Product } from '../types/portfolio';
import { useAccess } from './AccessContext';

interface PortfolioState {
  products: Product[];
  albums: Album[];
  brand: BrandIdentity;
  hardware: HardwareItem[];
  library: CompanyLibrary;
  events: CompanyEvent[];
  clients: CompanyClient[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setAlbums: React.Dispatch<React.SetStateAction<Album[]>>;
  setBrand: React.Dispatch<React.SetStateAction<BrandIdentity>>;
  setHardware: React.Dispatch<React.SetStateAction<HardwareItem[]>>;
  setLibrary: React.Dispatch<React.SetStateAction<CompanyLibrary>>;
  setEvents: React.Dispatch<React.SetStateAction<CompanyEvent[]>>;
  setClients: React.Dispatch<React.SetStateAction<CompanyClient[]>>;
}

const PortfolioContext = createContext<PortfolioState | null>(null);

export function PortfolioProvider({ children }: {children: React.ReactNode;}) {
  const { can } = useAccess();
  const denied = () => window.dispatchEvent(new Event('portfolio:permission-denied'));
  const [products, setProducts] = usePersisted<Product[]>('cp.v5.products', seedProducts, {
    legacyKey: 'cp.v4.products',
    normalize: (value) => migrateProducts(value).map((product) => ({
      ...product,
      salesOffers: product.salesOffers.map((offer) => ({ ...offer, price: formatOfferPrice(offer.price) }))
    }))
  });
  const [albums, setAlbums] = usePersisted<Album[]>('cp.v2.albums', seedAlbums);
  const [brand, setBrand] = usePersisted<BrandIdentity>('cp.v2.brand', seedBrand, {
    normalize: (value) => ({ ...seedBrand, ...(value && typeof value === 'object' ? value : {}), resources: Array.isArray((value as Partial<BrandIdentity> | null)?.resources) ? (value as BrandIdentity).resources : [] })
  });
  const [hardware, setHardware] = usePersisted<HardwareItem[]>('cp.v4.hardware', normalizeHardware(seedHardware), { legacyKey: 'cp.v3.hardware', normalize: normalizeHardware });
  const [library, setLibrary] = usePersisted<CompanyLibrary>('cp.v1.files', emptyCompanyLibrary, { normalize: normalizeCompanyLibrary });
  const [events, setEvents] = usePersisted<CompanyEvent[]>('cp.v1.events', [], {
    normalize: (value) => Array.isArray(value) ? value.filter((item): item is CompanyEvent =>
      Boolean(item && typeof item === 'object' && typeof item.id === 'string' && typeof item.title === 'string' && typeof item.type === 'string' && typeof item.date === 'string'))
      .map((item) => ({ id: item.id, title: item.title, type: item.type, date: item.date, time: typeof item.time === 'string' ? item.time : '', location: typeof item.location === 'string' ? item.location : '', description: typeof item.description === 'string' ? item.description : '', productId: typeof item.productId === 'string' ? item.productId : null })) : []
  });
  const [clients, setClients] = usePersisted<CompanyClient[]>('cp.v1.clients', [], {
    normalize: (value) => Array.isArray(value) ? value.flatMap((item) => {
      if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.name !== 'string') return [];
      const client = item as CompanyClient;
      return [{
        id: client.id,
        name: client.name,
        logoUrl: typeof client.logoUrl === 'string' ? client.logoUrl : '',
        email: typeof client.email === 'string' ? client.email : '',
        contact: typeof client.contact === 'string' ? client.contact : '',
        description: typeof client.description === 'string' ? client.description : '',
        productIds: Array.isArray(client.productIds) ? client.productIds.filter((id): id is string => typeof id === 'string') : [],
        contacts: Array.isArray(client.contacts) ? client.contacts.flatMap((contact) => {
          if (!contact || typeof contact !== 'object' || typeof contact.id !== 'string') return [];
          return [{ id: contact.id, person: typeof contact.person === 'string' ? contact.person : '', role: typeof contact.role === 'string' ? contact.role : '', email: typeof contact.email === 'string' ? contact.email : '', phone: typeof contact.phone === 'string' ? contact.phone : '' }];
        }) : []
      }];
    }) : []
  });

  useEffect(() => {
    try { if (window.localStorage.getItem('cp.v1.hardware-offers-migrated') === '1') return; } catch { /* continue in memory */ }
    const priced = hardware.flatMap((item) => item.assignments.flatMap((assignment) => assignment.salePrice == null ? [] : [{ item, assignment }]));
    if (priced.length) {
      setProducts((current) => migrateHardwareOffers(current, hardware));
      setHardware((current) => current.map((item) => ({ ...item, assignments: item.assignments.map(({ productId }) => ({ productId })) })));
    }
    try { window.localStorage.setItem('cp.v1.hardware-offers-migrated', '1'); } catch { /* memory-only fallback */ }
  }, []);

  return (
    <PortfolioContext.Provider
      value={{ products, albums, brand, hardware, library, events, clients,
        setProducts: (value) => { if ((window.location.pathname.endsWith('/sprints') || (window.location.pathname.endsWith('/flow') && new URLSearchParams(window.location.search).get('stage') === 'sprints')) ? can('sprints.manage') : can('portfolio.edit')) setProducts(value); else denied(); },
        setAlbums: (value) => { if (can('portfolio.edit')) setAlbums(value); else denied(); },
        setBrand: (value) => { if (can('portfolio.edit')) setBrand(value); else denied(); },
        setHardware: (value) => { if (can('portfolio.edit')) setHardware(value); else denied(); },
        setLibrary: (value) => { if (can('portfolio.edit')) setLibrary(value); else denied(); },
        setEvents: (value) => { if (can('portfolio.edit')) setEvents(value); else denied(); },
        setClients: (value) => { if (can('portfolio.edit')) setClients(value); else denied(); } }}>
      
      {children}
    </PortfolioContext.Provider>);

}

export function usePortfolio(): PortfolioState {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used inside PortfolioProvider');
  return ctx;
}

function usePersisted<T>(key: string, initial: T, options?: {legacyKey?: string;normalize?: (value: unknown) => T;}) {
  const [value, setValue] = useState<T>(() => {
    const read = (raw: string) => options?.normalize ? options.normalize(JSON.parse(raw)) : JSON.parse(raw) as T;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) return read(raw);
      if (options?.legacyKey) {
        const legacy = window.localStorage.getItem(options.legacyKey);
        if (legacy) return read(legacy);
      }
      return initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {

      /* storage full or unavailable — keep in memory */}
  }, [key, value]);
  return [value, setValue] as const;
}
