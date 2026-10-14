import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Plus, Package } from 'lucide-react';
import { CatalogListItem, PublicService, PublicServicePackage, StoreProfile } from '../types';
import api from '@/lib/axios';
import { SHOWCASE_CATEGORIES } from '@/lib/serviceShowcase';
import PackageCardItem from '../services/PackageCardItem';
import ServiceRow from '../services/ServiceRow';
import FilterChips from '@/components/account/FilterChips';

interface StoreServicesTabProps {
  readonly services: PublicService[];
  readonly packages: PublicServicePackage[];
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

// A service the owner hasn't grouped yet still needs a chip to live under.
const groupOf = (s: PublicService) => s.showcase_category || 'custom_tailoring';

/**
 * The storefront Services tab, made for a phone: category chips, then each service of that category as a flat row (picture, name,
 * price, time — no card inside the page's own card) with a strip of its designs under it — tap a design for its page, "See all" for the service page with every design.
 * Designs live inside their service (catalog_items.service_id); designs not filed under one are not shown to customers.
 */
export default function StoreServicesTab({
  services,
  packages,
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

  const q = serviceSearch.toLowerCase().trim();
  const filteredServices = useMemo(() => services.filter((s) => {
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.service_type?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  }), [services, q]);

  const filteredPackages = packages.filter((pkg) => {
    if (!q) return true;
    return (
      pkg.name.toLowerCase().includes(q) ||
      pkg.description?.toLowerCase().includes(q) ||
      pkg.services.some((s) => s.name.toLowerCase().includes(q))
    );
  });

  // Only the groups this shop actually uses, in the canonical chip order.
  const groups = useMemo(
    () => SHOWCASE_CATEGORIES.filter((c) => filteredServices.some((s) => groupOf(s) === c.value)),
    [filteredServices],
  );
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const group = groups.find((g) => g.value === activeGroup) ?? groups[0] ?? null;
  const groupServices = group ? filteredServices.filter((s) => groupOf(s) === group.value) : [];

  const designsByService = useMemo(() => {
    const map = new Map<number, CatalogListItem[]>();
    catalogItems.forEach((item) => {
      if (item.service_id == null) return;
      map.set(item.service_id, [...(map.get(item.service_id) ?? []), item]);
    });
    return map;
  }, [catalogItems]);
  const serviceIds = useMemo(() => new Set(services.map((s) => s.id)), [services]);
  const looseDesigns = catalogItems.filter((i) => i.service_id == null || !serviceIds.has(i.service_id));

  // A deep-linked service (?highlight=…) opens on its own group.
  useEffect(() => {
    const target = services.find((s) => s.id === highlightedServiceId);
    if (target) setActiveGroup(groupOf(target));
  }, [highlightedServiceId, services]);

  const pickGroup = (value: string) => setActiveGroup(value);

  if (expandedServiceId) return null;

  if (services.length === 0 && packages.length === 0 && catalogItems.length === 0 && !catalogLoading) {
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
      {(serviceSearch || isOwnerViewingOwnStore) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {serviceSearch ? (
            <button type="button" onClick={() => setServiceSearch('')} className="flex h-9 items-center gap-1.5 rounded-full bg-sunken px-3.5 text-sm text-ink">
              &quot;{serviceSearch}&quot; <X size={14} aria-hidden="true" /><span className="sr-only">Clear search</span>
            </button>
          ) : <span />}
          {isOwnerViewingOwnStore && (
            <div className="flex shrink-0 items-center gap-2">
              {packages.length > 0 && (
                <Link href="/dashboard/services" className="flex h-11 items-center gap-1.5 rounded-full bg-sunken px-4 text-sm font-semibold text-ink">
                  <Package size={15} aria-hidden="true" /> Packages
                </Link>
              )}
              <button type="button" onClick={onAddService} className="flex h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white active:opacity-80">
                <Plus size={16} aria-hidden="true" /> Add Service
              </button>
            </div>
          )}
        </div>
      )}

      {groups.length > 0 && group ? (
        <section aria-labelledby="service-group-title">
          <p className="mobile-overline mb-1 text-ink-faint">Service categories</p>
          <FilterChips label="Service categories" active={group.value} onChange={pickGroup} options={groups.map((g) => ({ key: g.value, label: g.label }))} />
          <h2 id="service-group-title" className="mobile-h3 mt-4 text-ink">{group.label}</h2>
          <p className="mobile-caption text-ink-muted">{group.blurb}</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-x-8">
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
              />
            ))}
          </div>
        </section>
      ) : services.length > 0 ? (
        <p className="mobile-body-sm py-10 text-center text-ink-muted">No services matched &quot;{serviceSearch}&quot;.</p>
      ) : null}

      {filteredPackages.length > 0 && (
        <section aria-labelledby="combo-packages-title">
          <h2 id="combo-packages-title" className="mobile-h3 mb-3 text-ink">Combo packages</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredPackages.map((pkg) => <PackageCardItem key={`package-${pkg.id}`} pkg={pkg} storeId={storeId} />)}
          </div>
        </section>
      )}

      {/* Designs not filed under a service are not shown to customers (designs are browsed from inside a service). The owner is told. */}
      {isOwnerViewingOwnStore && looseDesigns.length > 0 && (
        <div className="mobile-body-sm flex items-start justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-amber-900">
          <span>{looseDesigns.length} design{looseDesigns.length === 1 ? ' is' : 's are'} not filed under a service, so customers don&apos;t see {looseDesigns.length === 1 ? 'it' : 'them'}.</span>
          <Link href="/dashboard/catalog" className="shrink-0 font-semibold underline">Fix in Catalog</Link>
        </div>
      )}
    </div>
  );
}
