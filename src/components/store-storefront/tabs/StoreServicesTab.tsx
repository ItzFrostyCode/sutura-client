import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Plus, Package } from 'lucide-react';
import { CatalogListItem, PublicService, PublicServicePackage, StoreProfile } from '../types';
import api from '@/lib/axios';
import { SHOWCASE_CATEGORIES } from '@/lib/serviceShowcase';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import PackageCardItem from '../services/PackageCardItem';
import ServiceShowcaseCard from '../services/ServiceShowcaseCard';
import ShowcaseCarousel from '../services/ShowcaseCarousel';
import { toCatalogItemResult } from '../services/catalogItemResult';

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
}

// A service the owner hasn't grouped yet still needs a chip to live under.
const groupOf = (s: PublicService) => s.showcase_category || 'custom_tailoring';

/**
 * The storefront Services tab: "Service Categories" chips → that group's
 * services in a carousel → "View Catalog" opens the chosen service's catalog
 * designs in a second carousel below. Designs live inside their service
 * (catalog_items.service_id); any not linked to one sit under "More designs".
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

  const [openServiceId, setOpenServiceId] = useState<number | null>(null);
  const openService = groupServices.find((s) => s.id === openServiceId) ?? null;
  const openDesigns = openService ? designsByService.get(openService.id) ?? [] : [];

  // A deep-linked service (?highlight=…) opens on its own group.
  useEffect(() => {
    const target = services.find((s) => s.id === highlightedServiceId);
    if (target) setActiveGroup(groupOf(target));
  }, [highlightedServiceId, services]);

  const pickGroup = (value: string) => {
    setActiveGroup(value);
    setOpenServiceId(null);
  };

  const toggleCatalog = (id: number) => {
    const next = openServiceId === id ? null : id;
    setOpenServiceId(next);
    if (next !== null) {
      requestAnimationFrame(() => {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.getElementById('service-catalog')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
      });
    }
  };

  if (expandedServiceId) return null;

  if (services.length === 0 && packages.length === 0 && catalogItems.length === 0 && !catalogLoading) {
    return (
      <div className="text-center py-16 bg-surface rounded-2xl border border-line p-6">
        <p className="mobile-body-sm text-ink-muted">No services listed yet.</p>
      </div>
    );
  }

  const designCard = (item: CatalogListItem) => (
    <div key={item.id} className="w-[46%] min-[600px]:w-[31.5%] lg:w-[23.6%] shrink-0 snap-start flex">
      <CatalogItemCard item={toCatalogItemResult(item, storeId, store)} canManage={isOwnerViewingOwnStore} onDelete={onDeleteDesign} />
    </div>
  );

  return (
    <div className="space-y-10">
      {(serviceSearch || isOwnerViewingOwnStore) && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {serviceSearch && (
              <button
                type="button"
                onClick={() => setServiceSearch('')}
                className="flex items-center gap-1 border border-line bg-canvas px-2.5 py-1 rounded-full text-xs font-medium text-ink-body hover:border-taupe hover:text-taupe transition-colors shrink-0 cursor-pointer"
              >
                <span>&quot;{serviceSearch}&quot;</span>
                <X size={12} aria-hidden="true" />
                <span className="sr-only">Clear search</span>
              </button>
            )}
          </div>
          {isOwnerViewingOwnStore && (
            <div className="flex items-center gap-2 shrink-0">
              {packages.length > 0 && (
                <Link
                  href="/dashboard/services"
                  className="min-h-11 flex items-center gap-1.5 bg-canvas hover:bg-sunken border border-line text-ink-body text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Package size={14} aria-hidden="true" /> Manage Packages
                </Link>
              )}
              <button
                type="button"
                onClick={onAddService}
                className="min-h-11 flex items-center gap-1.5 bg-taupe hover:bg-taupe/90 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer active:scale-[0.98]"
              >
                <Plus size={16} aria-hidden="true" /> Add Service
              </button>
            </div>
          )}
        </div>
      )}

      {groups.length > 0 && group ? (
        <section aria-labelledby="service-group-title">
          <div role="group" aria-label="Service categories" className="mb-6">
            <p className="text-sm font-medium text-ink mb-2">Service Categories</p>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {groups.map((g) => {
                const active = g.value === group.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => pickGroup(g.value)}
                    aria-pressed={active}
                    className={`min-h-10 shrink-0 rounded-full border px-5 text-sm transition-colors duration-200 cursor-pointer ${
                      active ? 'border-ink bg-[#EFE6DA] font-semibold text-ink' : 'border-line-strong bg-surface text-ink-body hover:border-ink'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          <h2 id="service-group-title" className="text-display text-2xl sm:text-3xl text-ink">{group.label} Services</h2>
          <p className="mt-1 mb-5 text-sm text-ink-muted">{group.blurb}</p>

          <ShowcaseCarousel label={`${group.label} services`} resetKey={`${group.value}-${groupServices.length}`}>
            {groupServices.map((service) => (
              <ServiceShowcaseCard
                key={service.id}
                service={service}
                href={`/store/${storeId}/service/${service.id}`}
                designCount={designsByService.get(service.id)?.length ?? 0}
                catalogOpen={openServiceId === service.id}
                onViewCatalog={() => toggleCatalog(service.id)}
                onOpen={() => {
                  if (user) api.post('/recently-viewed', { type: 'service', id: service.id }).catch(() => {});
                }}
                canManage={isOwnerViewingOwnStore}
                onEdit={onEditService}
                onDelete={onDeleteService}
              />
            ))}
          </ShowcaseCarousel>

          {openService && (
            <div id="service-catalog" aria-live="polite" className="mt-8 scroll-mt-28 border-t border-line pt-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-display text-xl sm:text-2xl text-ink">{openService.name} — Catalog</h3>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {catalogLoading ? 'Loading designs…' : `${openDesigns.length} ${openDesigns.length === 1 ? 'design' : 'designs'}. Tap one to see sizes, fabric and booking.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenServiceId(null)}
                  className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg border border-line px-3 text-sm text-ink-body hover:border-ink cursor-pointer"
                >
                  <X size={15} aria-hidden="true" /> Close
                </button>
              </div>
              {catalogLoading ? null : openDesigns.length > 0 ? (
                <ShowcaseCarousel label={`${openService.name} designs`} resetKey={openService.id}>
                  {openDesigns.map(designCard)}
                </ShowcaseCarousel>
              ) : (
                <div className="rounded-xl border border-line bg-surface px-5 py-8 text-center">
                  <p className="font-semibold text-ink">No designs for this service yet.</p>
                  <p className="mt-1 text-sm text-ink-muted">You can still book it — the shop will go over the design with you.</p>
                  <Link
                    href={`/store/${storeId}/service/${openService.id}`}
                    className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-ink px-5 text-sm font-semibold text-white hover:bg-black"
                  >
                    See service &amp; book
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>
      ) : services.length > 0 ? (
        <div className="text-center py-12 bg-surface border border-line rounded-2xl p-6 text-ink-muted mobile-body-sm">
          No services matched &quot;{serviceSearch}&quot;.
        </div>
      ) : null}

      {filteredPackages.length > 0 && (
        <section aria-labelledby="combo-packages-title">
          <h2 id="combo-packages-title" className="text-display text-2xl text-ink mb-4">Combo Packages</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredPackages.map((pkg) => (
              <PackageCardItem key={`package-${pkg.id}`} pkg={pkg} storeId={storeId} />
            ))}
          </div>
        </section>
      )}

      {!q && looseDesigns.length > 0 && (
        <section aria-labelledby="more-designs-title">
          <h2 id="more-designs-title" className="text-display text-2xl text-ink">More designs</h2>
          <p className="mt-1 mb-5 text-sm text-ink-muted">Designs this shop hasn&rsquo;t filed under a service yet.</p>
          <ShowcaseCarousel label="More designs" resetKey={looseDesigns.length}>
            {looseDesigns.map(designCard)}
          </ShowcaseCarousel>
        </section>
      )}
    </div>
  );
}
