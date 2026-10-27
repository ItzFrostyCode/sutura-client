import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Plus, Package } from 'lucide-react';
import { CatalogListItem, PublicService, PublicServicePackage, StoreProfile } from '../types';
import api from '@/lib/axios';
import { SHOWCASE_CATEGORIES } from '@/lib/serviceShowcase';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import PackageCardItem from '../services/PackageCardItem';
import ServiceCategoryCard from '../services/ServiceCategoryList';
import ServiceCategoryModal from '../services/ServiceCategoryModal';
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
 * The storefront Services tab: one card per category the shop uses (Uniform…);
 * "View Catalog" opens a dialog listing that category's services (PNP Uniform)
 * with booking and details. Designs live inside their service
 * (catalog_items.service_id); any not linked to one sit under "More designs".
 */
export default function StoreServicesTab({
  services,
  packages,
  catalogItems,
  catalogLoading,
  storeId,
  expandedServiceId,
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

  // Every category this shop uses (canonical order), each with its services.
  const groups = useMemo(
    () => SHOWCASE_CATEGORIES
      .map((c) => ({ value: c.value, label: c.label, services: filteredServices.filter((s) => groupOf(s) === c.value) }))
      .filter((g) => g.services.length > 0),
    [filteredServices],
  );

  const serviceIds = useMemo(() => new Set(services.map((s) => s.id)), [services]);
  const looseDesigns = catalogItems.filter((i) => i.service_id == null || !serviceIds.has(i.service_id));

  // "View Catalog" on a category card opens that category's services in a dialog.
  const [openGroupValue, setOpenGroupValue] = useState<string | null>(null);
  const openGroup = groups.find((g) => g.value === openGroupValue) ?? null;

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

      {groups.length > 0 ? (
        <section aria-labelledby="service-categories-title">
          <h2 id="service-categories-title" className="text-display text-2xl text-ink">Service Categories</h2>
          <p className="mt-1 mb-5 text-sm text-ink-muted">Open a category to see its services.</p>
          <ShowcaseCarousel label="Service categories" resetKey={groups.length}>
            {groups.map((g) => (
              <ServiceCategoryCard key={g.value} group={g} onViewCatalog={() => setOpenGroupValue(g.value)} />
            ))}
          </ShowcaseCarousel>

          <ServiceCategoryModal
            group={openGroup}
            onClose={() => setOpenGroupValue(null)}
            storeId={storeId}
            onOpenService={(id) => {
              if (user) api.post('/recently-viewed', { type: 'service', id }).catch(() => {});
            }}
            canManage={isOwnerViewingOwnStore}
            onEdit={(id) => { setOpenGroupValue(null); onEditService(id); }}
            onDelete={(id) => { setOpenGroupValue(null); onDeleteService(id); }}
          />
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
