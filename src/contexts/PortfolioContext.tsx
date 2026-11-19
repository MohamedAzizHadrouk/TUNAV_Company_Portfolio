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
  const { can, currentAccount, canReadProduct, canReadCard, canWriteSection, canWriteCard } = useAccess();
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
      .map((item) => ({ id: item.id, title: item.title, type: item.type, date: item.date, time: typeof item.time === 'string' ? item.time : '', location: typeof item.location === 'string' ? item.location : '', description: typeof item.description === 'string' ? item.description : '', productId: typeof item.productId === 'string' ? item.productId : null, sprintId: typeof item.sprintId === 'string' ? item.sprintId : null })) : []
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

  const visibleProducts = currentAccount.roleId !== 'admin' && Array.isArray(currentAccount.assignments) ? products.filter((product) => canReadProduct(product.id)).map((product): Product => {
    const visible = (id: string) => canReadCard(product.id, id);
    const epics = product.backlog.epics.flatMap((epic) => {
      const features = epic.features.flatMap((feature) => {
        const stories = feature.stories.filter((story) => visible(story.id) || Boolean(story.sprintId && visible(story.sprintId)));
        return visible(feature.id) || stories.length ? [{ ...feature, stories }] : [];
      });
      return visible(epic.id) || features.length ? [{ ...epic, features }] : [];
    });
    const visibleStories = epics.flatMap((epic) => epic.features.flatMap((feature) => feature.stories));
    const visibleStoryIds = new Set(visibleStories.map((story) => story.id));
    return { ...product,
      capabilities: product.capabilities.filter((item) => visible(item.id)),
      backlog: { ...product.backlog, epics,
        sprints: product.backlog.sprints.filter((sprint) => visible(sprint.id) || (!currentAccount.assignments?.find((item) => item.productId === product.id)?.cards?.[sprint.id] && visibleStories.some((story) => story.sprintId === sprint.id))).map((sprint) => ({ ...sprint, tasks: sprint.tasks.filter((task) => visibleStoryIds.has(task.storyId)) })),
        subBacklogs: product.backlog.subBacklogs.map((item) => ({ ...item, storyIds: item.storyIds.filter((id) => visibleStoryIds.has(id)) })).filter((item) => item.storyIds.length > 0)
      }
    };
  }) : products;
  const routeProductId = window.location.pathname.split('/')[2] ?? '';
  const routeStage = new URLSearchParams(window.location.search).get('stage');
  const routeSection = window.location.pathname.split('/')[3] ?? '';
  const visitorWrite = canWriteSection(routeProductId, routeSection === 'flow' ? 'flow' : routeSection) || (routeSection === 'flow' && visibleProducts.find((product) => product.id === routeProductId)?.backlog.epics.some((epic) => [epic.id, ...epic.features.flatMap((feature) => [feature.id, ...feature.stories.map((story) => story.id)])].some((id) => canWriteCard(routeProductId, id)))) || (routeSection === 'flow' && visibleProducts.find((product) => product.id === routeProductId)?.capabilities.some((item) => canWriteCard(routeProductId, item.id))) || (routeSection === 'flow' && visibleProducts.find((product) => product.id === routeProductId)?.backlog.sprints.some((item) => canWriteCard(routeProductId, item.id)));
  const flowWrite = routeStage === 'sprints' ? can('sprints.manage') || can('tasks.uiux.manage') || can('tasks.conception.manage') || can('tasks.development.manage') || can('increment.manage') || can('sprints.create') : routeStage === 'backlog' ? can('backlog.manage') || can('subbacklogs.manage') : can('capabilities.manage');
  const sectionRoleWrite = !Array.isArray(currentAccount.assignments) && (routeSection === 'design-system' && can('design-system.manage') || routeSection === 'showcase' && can('showcase.manage') || ['sales-arguments', 'sales-offers'].includes(routeSection) && can('sales.manage'));
  return (
    <PortfolioContext.Provider
      value={{ products: visibleProducts, albums, brand, hardware, library, events, clients,
        setProducts: (value) => { if (can('portfolio.edit') || visitorWrite || sectionRoleWrite || (routeSection === 'flow' && flowWrite) || (routeSection === 'ideas' && !Array.isArray(currentAccount.assignments) && can('ideas.submit'))) setProducts(value); else denied(); },
        setAlbums: (value) => { if (can('portfolio.edit')) setAlbums(value); else denied(); },
        setBrand: (value) => { if (can('portfolio.edit')) setBrand(value); else denied(); },
        setHardware: (value) => { if (can('portfolio.edit') || (window.location.pathname === '/hardware' && can('hardware.manage')) || (!Array.isArray(currentAccount.assignments) && can('hardware.manage')) || canWriteSection(routeProductId, 'hardware')) setHardware(value); else denied(); },
        setLibrary: (value) => { if (can('portfolio.edit')) setLibrary(value); else denied(); },
        setEvents: (value) => { if (can('portfolio.edit') || (routeSection === 'agenda' && ((!Array.isArray(currentAccount.assignments) && can('sprints.manage')) || canWriteSection(routeProductId, 'agenda')))) setEvents(value); else denied(); },
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
