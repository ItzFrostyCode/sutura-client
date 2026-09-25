import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Plus } from 'lucide-react';
import { PublicService, PublicServicePackage } from '../types';
import api from '@/lib/axios';
import ServiceCardItem from '../services/ServiceCardItem';
import PackageCardItem from '../services/PackageCardItem';

interface StoreServicesTabProps {
  readonly services: PublicService[];
  readonly packages: PublicServicePackage[];
  readonly storeId: string;
  readonly expandedServiceId: number | null;
  readonly highlightedServiceId: number | null;
  readonly serviceSearch: string;
  readonly setServiceSearch: (s: string) => void;
  readonly isOwnerViewingOwnStore: boolean;
  readonly onAddService: () => void;
  readonly onSelectPackage: (pkg: PublicServicePackage) => void;
  readonly user: { id: number } | null;
}

export default function StoreServicesTab({
  services,
  packages,
  storeId,
  expandedServiceId,
  highlightedServiceId,
  serviceSearch,
  setServiceSearch,
  isOwnerViewingOwnStore,
  onAddService,
  onSelectPackage,
  user,
}: StoreServicesTabProps) {
  const router = useRouter();

  // expandedServiceId is still set by useStoreStorefront.ts's own
  // ?service_id=/?service= deep-link effects — this used to swap in
  // ServiceDetailView inline here; now it redirects to that service's own
  // page instead, so the deep-link behavior is preserved without this tab
  // needing to render the detail view itself any more.
  useEffect(() => {
    if (expandedServiceId) {
      router.push(`/store/${storeId}/service/${expandedServiceId}`);
    }
  }, [expandedServiceId, storeId, router]);

  if (expandedServiceId) return null;

  if (services.length === 0 && packages.length === 0) {
    return (
      <div className="text-center py-16 bg-surface rounded-2xl border border-line p-6 shadow-xs">
        <p className="mobile-body-sm text-ink-muted">No services listed yet.</p>
      </div>
    );
  }

  const q = serviceSearch.toLowerCase().trim();
  const filteredServices = services.filter((s) => {
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q) ||
      s.service_type?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q)
    );
  });

  const filteredPackages = packages.filter((pkg) => {
    if (!q) return true;
    return (
      pkg.name.toLowerCase().includes(q) ||
      pkg.description?.toLowerCase().includes(q) ||
      pkg.services.some((s) => s.name.toLowerCase().includes(q))
    );
  });

  const totalFilteredCount = filteredServices.length + filteredPackages.length;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="mobile-caption text-ink-muted whitespace-nowrap">
            Showing {totalFilteredCount} services.
          </span>
          {serviceSearch && (
            <button
              type="button"
              onClick={() => setServiceSearch('')}
              className="flex items-center gap-1 border border-line bg-canvas px-2.5 py-1 rounded-full text-xs font-medium text-ink-body hover:border-taupe hover:text-taupe transition-colors shrink-0 cursor-pointer"
            >
              <span>&quot;{serviceSearch}&quot;</span>
              <X size={12} />
            </button>
          )}
        </div>
        {isOwnerViewingOwnStore && (
          <button
            type="button"
            onClick={onAddService}
            className="min-h-[44px] flex items-center gap-1.5 bg-taupe hover:bg-taupe/90 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shrink-0 cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <Plus size={16} /> Add Service
          </button>
        )}
      </div>

      {totalFilteredCount === 0 ? (
        <div className="text-center py-16 bg-surface border border-line rounded-2xl p-6 text-ink-muted mobile-body-sm shadow-xs">
          No services or packages matched &quot;{serviceSearch}&quot;.
        </div>
      ) : (
        // Fixed column counts (not auto-fill/minmax) so cards always fill
        // edge-to-edge and align flush with the page's left/right margins —
        // auto-fill left an uneven gap on the right whenever the container
        // width didn't divide evenly into the card's max size.
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredServices.map((service) => (
            <ServiceCardItem
              key={`service-${service.id}`}
              service={service}
              isHighlighted={highlightedServiceId === service.id}
              onSelect={(id) => {
                if (user) {
                  api.post('/recently-viewed', { type: 'service', id }).catch(() => {});
                }
                router.push(`/store/${storeId}/service/${id}`);
              }}
            />
          ))}

          {filteredPackages.map((pkg) => (
            <PackageCardItem key={`package-${pkg.id}`} pkg={pkg} onSelect={onSelectPackage} />
          ))}
        </div>
      )}
    </div>
  );
}
