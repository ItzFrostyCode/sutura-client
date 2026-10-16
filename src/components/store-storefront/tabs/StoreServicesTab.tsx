import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CatalogListItem, PublicService, StoreProfile } from '../types';
import api from '@/lib/axios';
import { groupsOf, groupsOfServices, inGroup } from '@/lib/storefrontGroups';
import ServiceRow from '../services/ServiceRow';
import FilterChips from '@/components/account/FilterChips';

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
 * The storefront Services tab, made for a phone: category chips, then each service of that category as a flat row (picture, name,
 * price, time — no card inside the page's own card) with a strip of its designs under it — tap a design for its page, "See all" for the service page with every design.
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
  store,
  embedded = false,
}: StoreServicesTabProps) {
  const router = useRouter();

  // expandedServiceId is still set by useStoreStorefront.ts's own
  // ?service_id=/?service= deep-link effects — those open the service's
  // own page rather than rendering a detail view inside this tab.
  useEffect(() => {
    if (expandedServiceId) {
      router.replace(`/store/${storeId}/service/${expandedServiceId}`);
    }
  }, [expandedServiceId, storeId, router]);

  const designsByService = useMemo(() => {
    const map = new Map<number, CatalogListItem[]>();
    catalogItems.forEach((item) => {
      if (item.service_id == null) return;
      map.set(item.service_id, [...(map.get(item.service_id) ?? []), item]);
    });
    return map;
  }, [catalogItems]);

  // Same rule as the search list (the server's matching_service_ids): the service's own name or category, or one of
  // its designs ("tuxedo" finds Bespoke Suit). Not the description, so a broad service that only mentions the word
  // is not offered as a match.
  const q = serviceSearch.toLowerCase().trim();
  const filteredServices = useMemo(() => services.filter((s) => {
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      (designsByService.get(s.id) ?? []).some((d) => d.name.toLowerCase().includes(q) || d.garment_type?.toLowerCase().includes(q))
    );
  }), [services, q, designsByService]);

  // Only the groups this shop's services fall under — the landing page's garment categories, in its order.
  const groups = useMemo(() => groupsOfServices(filteredServices), [filteredServices]);
  const [activeGroup, setActiveGroup] = useState<string>('all');

  const isSearching = Boolean(q);
  const showAll = activeGroup === 'all';
  const group = groups.find((g) => g.value === activeGroup) ?? null;
  const groupServices = showAll
    ? filteredServices
    : (group ? filteredServices.filter((s) => inGroup(s, group.value)) : []);

  const serviceIds = useMemo(() => new Set(services.map((s) => s.id)), [services]);
  const looseDesigns = catalogItems.filter((i) => i.service_id == null || !serviceIds.has(i.service_id));

  // A deep-linked service (?highlight=…) opens on its own group.
  useEffect(() => {
    const target = services.find((s) => s.id === highlightedServiceId);
    if (target) setActiveGroup(groupsOf(target)[0].value);
  }, [highlightedServiceId, services]);

  // When search query changes, reset activeGroup to 'all'
  useEffect(() => {
    setActiveGroup('all');
  }, [q]);

  // Auto-scroll to service categories when searching so matching services are immediately in view
  useEffect(() => {
    if (q) {
      const timer = setTimeout(() => {
        const el = document.getElementById('service-categories-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [q]);

  const pickGroup = (value: string) => {
    setActiveGroup(value);
    if (typeof window !== 'undefined') {
      const el = document.getElementById('service-group-title');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const categoryOptions = useMemo(() => [
    { key: 'all', label: isSearching ? `All (${filteredServices.length})` : 'All' },
    ...groups.map((g) => {
      const count = filteredServices.filter((s) => inGroup(s, g.value)).length;
      return {
        key: g.value,
        label: isSearching ? `${g.label} (${count})` : g.label,
      };
    }),
  ], [groups, filteredServices, isSearching]);

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

  return (
    <div className="space-y-6">
      {isOwnerViewingOwnStore && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={onAddService} className="flex h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white active:opacity-80">
            <Plus size={16} aria-hidden="true" /> Add Service
          </button>
        </div>
      )}

      {filteredServices.length > 0 ? (
        <section id="service-categories-section" aria-labelledby="service-group-title" className="scroll-mt-4">
          <p className="mobile-overline mb-1 text-ink-faint">Service categories</p>
          <FilterChips
            label="Service categories"
            active={activeGroup}
            onChange={pickGroup}
            options={categoryOptions}
          />
          <h2 id="service-group-title" className="mobile-h3 mt-4 scroll-mt-28 text-ink">
            {showAll
              ? (isSearching
                  ? `${filteredServices.length} Matching Service${filteredServices.length === 1 ? '' : 's'}`
                  : 'All Services')
              : (group?.label ?? 'Services')}
          </h2>
          <p className="mobile-caption text-ink-muted">
            {showAll
              ? (isSearching
                  ? `Showing services matching "${serviceSearch}"`
                  : 'Browse all services offered by this shop')
              : (group?.blurb ?? '')}
          </p>
          {/* Always 1 column on all screen sizes per user request */}
          <div className="mt-4 grid grid-cols-1 gap-6">
            {groupServices.map((service) => (
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
            ))}
          </div>
        </section>
      ) : services.length > 0 ? (
        <p className="mobile-body-sm py-10 text-center text-ink-muted">No services matched &quot;{serviceSearch}&quot;.</p>
      ) : null}

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
