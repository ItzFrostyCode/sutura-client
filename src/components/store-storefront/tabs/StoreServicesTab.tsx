import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { CatalogListItem, PublicService, StoreProfile } from '../types';
import api from '@/lib/axios';
import { groupsOf, groupsOfServices, inGroup } from '@/lib/storefrontGroups';
import ServiceRow from '../services/ServiceRow';
import ServiceCategoryPage from '../services/ServiceCategoryPage';

interface StoreServicesTabProps {
  readonly services: PublicService[];
  readonly catalogItems: CatalogListItem[];
  readonly catalogLoading: boolean;
  readonly storeId: string;
  readonly expandedServiceId: number | null;
  readonly highlightedServiceId: number | null;
  readonly serviceSearch: string;
  readonly setServiceSearch: (s: string) => void;
  readonly isOwnerViewingOwnStore: boolean;
  readonly onAddService: () => void;
  readonly onEditService: (id: number) => void;
  readonly onDeleteService: (id: number) => void;
  readonly onDeleteDesign: (id: number) => void;
  readonly user: { id: number } | null;
  readonly store?: StoreProfile | null;
  /** Inside the map panel: links keep ?embed=1. */
  readonly embedded?: boolean;
}

/**
 * A shop's Services tab, the same on a phone, a tablet and desktop:
 *   [ 🔍 Search this shop's services … ] [ ⚙ ]   ← the round button opens the full-page Service Categories
 *   (chosen category, removable)
 *   services — each a flat row with its designs under it
 *
 * A search NEVER hides services (shop owners' request: someone who searched "barong" on the Map still has to see
 * everything the shop does). Matching services come first under "Matches …", the rest follow under
 * "Other services from this shop". Only a category the customer picks narrows the list, and it says so.
 * Designs live inside their service (catalog_items.service_id); designs not filed under one are not shown to customers.
 */
export default function StoreServicesTab({
  services,
  catalogItems,
  catalogLoading,
  storeId,
  expandedServiceId,
  highlightedServiceId,
  serviceSearch,
  setServiceSearch,
  isOwnerViewingOwnStore,
  onAddService,
  onEditService,
  onDeleteService,
  onDeleteDesign,
  user,
  embedded = false,
}: StoreServicesTabProps) {
  const router = useRouter();
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // expandedServiceId is still set by useStoreStorefront.ts's own ?service_id=/?service= deep-link effects — those open
  // the service's own page rather than rendering a detail view inside this tab.
  useEffect(() => {
    if (expandedServiceId) router.replace(`/store/${storeId}/service/${expandedServiceId}`);
  }, [expandedServiceId, storeId, router]);

  const designsByService = useMemo(() => {
    const map = new Map<number, CatalogListItem[]>();
    catalogItems.forEach((item) => {
      if (item.service_id == null) return;
      map.set(item.service_id, [...(map.get(item.service_id) ?? []), item]);
    });
    return map;
  }, [catalogItems]);

  // Same match rule as the Map's results (the server's matching_service_ids): the service's own name or category, or
  // one of its designs ("tuxedo" finds Bespoke Suit). Used to ORDER the list, never to hide.
  const q = serviceSearch.toLowerCase().trim();
  const matches = (s: PublicService) =>
    s.name.toLowerCase().includes(q) ||
    Boolean(s.category?.toLowerCase().includes(q)) ||
    (designsByService.get(s.id) ?? []).some((d) => d.name.toLowerCase().includes(q) || d.garment_type?.toLowerCase().includes(q));

  const groups = useMemo(() => groupsOfServices(services), [services]);
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const group = groups.find((g) => g.value === activeGroup) ?? null;
  const inCategory = activeGroup === 'all' || !group ? services : services.filter((s) => inGroup(s, group.value));
  const matched = q ? inCategory.filter(matches) : [];
  const others = q ? inCategory.filter((s) => !matches(s)) : inCategory;

  const serviceIds = useMemo(() => new Set(services.map((s) => s.id)), [services]);
  const looseDesigns = catalogItems.filter((i) => i.service_id == null || !serviceIds.has(i.service_id));

  // A deep-linked service (?highlight=…) opens on its own group.
  useEffect(() => {
    const target = services.find((s) => s.id === highlightedServiceId);
    if (target) setActiveGroup(groupsOf(target)[0].value);
  }, [highlightedServiceId, services]);

  // Arrived from a search (e.g. "barong" on the Map): once the services have drawn, scroll down by itself so the
  // search bar sits at the top in its sticky spot with the matching services right under it. Once per arrival — typing
  // in the box afterwards does not jump the page.
  const arrivedWithSearch = useRef(Boolean(serviceSearch.trim()));
  useEffect(() => {
    if (!arrivedWithSearch.current || services.length === 0) return;
    arrivedWithSearch.current = false;
    const timer = setTimeout(() => document.getElementById('shop-services')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
    return () => clearTimeout(timer);
  }, [services.length]);

  const scrollToList = () => {
    setTimeout(() => document.getElementById('service-list-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const pickGroup = (value: string) => {
    setActiveGroup(value);
    setCategoriesOpen(false);
    scrollToList();
  };

  const categoryOptions = useMemo(() => [
    { key: 'all', label: 'All services', count: services.length },
    ...groups.map((g) => ({ key: g.value, label: g.label, count: services.filter((s) => inGroup(s, g.value)).length })),
  ], [groups, services]);

  if (expandedServiceId) return null;

  if (services.length === 0 && catalogItems.length === 0 && !catalogLoading) {
    return (
      <div className="py-16 text-center">
        <p className="mobile-body-sm text-ink-muted">No services listed yet.</p>
      </div>
    );
  }

  const openService = (id: number) => {
    if (user) api.post('/recently-viewed', { type: 'service', id }).catch(() => {});
  };

  const row = (service: PublicService) => (
    <ServiceRow
      key={service.id}
      service={service}
      storeId={storeId}
      designs={designsByService.get(service.id) ?? []}
      designsLoading={catalogLoading}
      onOpen={() => openService(service.id)}
      canManage={isOwnerViewingOwnStore}
      onEdit={onEditService}
      onDelete={onDeleteService}
      onDeleteDesign={onDeleteDesign}
      embedded={embedded}
      isHighlighted={service.id === highlightedServiceId}
    />
  );

  return (
    <div className="space-y-6">
      {isOwnerViewingOwnStore && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onAddService} className="flex h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white active:opacity-80">
            <Plus size={16} aria-hidden="true" /> Add Service
          </button>
        </div>
      )}

      {services.length > 0 && (
        <section id="shop-services" aria-labelledby="service-list-title" className="scroll-mt-2">
          {/* Search (left to middle) + the round filter button (right). The only thing pinned while scrolling the services
              (just under the site's top bar), so the customer can search or change the category from anywhere. */}
          <div className="sticky top-[var(--topbar-h,0px)] z-20 -mx-4 flex items-center gap-2 border-b border-line bg-surface px-4 py-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
            <form role="search" onSubmit={(e) => { e.preventDefault(); scrollToList(); }} className="flex h-12 min-w-0 flex-1 items-center rounded-full border border-line bg-surface pl-4 focus-within:border-ink">
              <Search size={18} className="shrink-0 text-ink-muted" aria-hidden />
              <label htmlFor="shop-service-search" className="sr-only">Search this shop&apos;s services</label>
              <input
                id="shop-service-search"
                type="search"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search services"
                className="h-full min-w-0 flex-1 bg-transparent px-2 text-base text-ink placeholder:text-ink-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {serviceSearch && (
                <button type="button" onClick={() => setServiceSearch('')} aria-label="Clear search" className="flex h-11 w-11 shrink-0 items-center justify-center text-ink-muted hover:text-ink">
                  <X size={18} aria-hidden />
                </button>
              )}
            </form>
            <button
              type="button"
              onClick={() => setCategoriesOpen(true)}
              aria-label={activeGroup === 'all' ? 'Service categories' : `Service categories, ${group?.label} chosen`}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:border-ink"
            >
              <SlidersHorizontal size={20} aria-hidden />
              {activeGroup !== 'all' && <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-taupe-dark" aria-hidden />}
            </button>
          </div>

          {/* The chosen category, so the narrowed list is never a mystery; one tap brings everything back. */}
          {activeGroup !== 'all' && group && (
            <div className="mt-3 flex">
              <button type="button" onClick={() => setActiveGroup('all')} className="flex h-11 items-center gap-2 rounded-full bg-ink pl-4 pr-3 text-sm font-semibold text-white">
                {group.label} <X size={16} aria-label="Show all services" />
              </button>
            </div>
          )}

          <div id="service-list-top" className="scroll-mt-28" />

          {q && (
            <>
              <h2 id="service-list-title" className="mobile-h3 mt-5 font-semibold text-ink">
                {matched.length > 0 ? `Matches “${serviceSearch.trim()}”` : `No service matches “${serviceSearch.trim()}”`}
              </h2>
              {matched.length > 0 && <div className="mt-4 grid grid-cols-1 gap-6">{matched.map(row)}</div>}
            </>
          )}

          {others.length > 0 && (
            <>
              <h2 id={q ? undefined : 'service-list-title'} className="mobile-h3 mt-6 font-semibold text-ink">
                {q ? 'Other services from this shop' : activeGroup === 'all' ? 'All services' : group?.label}
              </h2>
              {!q && activeGroup !== 'all' && group?.blurb && <p className="mobile-body-sm text-ink-muted">{group.blurb}</p>}
              <div className="mt-4 grid grid-cols-1 gap-6">{others.map(row)}</div>
            </>
          )}
        </section>
      )}

      <ServiceCategoryPage open={categoriesOpen} active={activeGroup} options={categoryOptions} onPick={pickGroup} onClose={() => setCategoriesOpen(false)} />

      {/* Designs not filed under a service are not shown to customers (designs are browsed from inside a service). The owner is told. */}
      {isOwnerViewingOwnStore && looseDesigns.length > 0 && (
        <div className="mobile-body-sm flex items-start justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
          <span>{looseDesigns.length} design{looseDesigns.length === 1 ? ' is' : 's are'} not filed under a service, so customers don&apos;t see {looseDesigns.length === 1 ? 'it' : 'them'}.</span>
          <Link href="/dashboard/catalog" className="shrink-0 font-semibold underline">Fix these designs</Link>
        </div>
      )}
    </div>
  );
}
