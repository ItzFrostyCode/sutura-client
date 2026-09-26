'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Scissors, Store, Star, ChevronRight } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { isStoreOpen } from '@/lib/storeStatus';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import { SearchServiceResult, RelatedStore, SearchActiveTab } from './types';
import ServiceCarouselRow from './ServiceCarouselRow';
import SearchServiceCard from './SearchServiceCard';

interface SearchServicesTabProps {
  readonly services: SearchServiceResult[];
  readonly servicesLoading: boolean;
  readonly servicesTotal: number;
  readonly stores: RelatedStore[];
  readonly activeTab: SearchActiveTab;
  readonly effectiveQ: string;
  readonly gate: (href: string) => string;
}

export default function SearchServicesTab({
  services,
  servicesLoading,
  servicesTotal,
  stores,
  activeTab,
  effectiveQ,
  gate,
}: SearchServicesTabProps) {
  if (activeTab !== 'services' && (activeTab !== 'all' || (!servicesLoading && services.length === 0))) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Scissors size={17} className="text-taupe shrink-0" />
          <h2 className="text-base font-bold text-ink">Tailoring Services</h2>
        </div>
        <span className="text-xs text-ink-muted font-medium">{servicesTotal}</span>
      </div>

      {servicesLoading ? (
        // Mirrors the real store row + service-card carousel below, so
        // nothing shifts size once the real content swaps in.
        <div className="divide-y divide-line border-t border-line">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="py-3.5 space-y-3 animate-pulse">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-sunken shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-20 bg-sunken rounded" />
                  <div className="h-3.5 w-2/3 bg-sunken rounded" />
                  <div className="h-2.5 w-1/3 bg-sunken rounded" />
                </div>
              </div>
              <div className="h-3 w-24 bg-sunken rounded" />
              <div className="flex gap-3 overflow-hidden">
                {Array.from({ length: 3 }).map((__, j) => (
                  <div
                    key={j}
                    className="w-[70%] min-w-[220px] max-w-[270px] sm:w-[250px] md:w-[270px] shrink-0 border border-line bg-surface"
                  >
                    <div className="aspect-4/3 bg-sunken" />
                    <div className="p-2.5 space-y-1.5">
                      <div className="h-2.5 w-1/3 bg-sunken rounded" />
                      <div className="h-3.5 w-3/4 bg-sunken rounded" />
                      <div className="h-3 w-1/2 bg-sunken rounded mt-1.5 pt-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="bg-transparent border-y border-line px-4 py-10 text-center">
          <Scissors size={28} className="mx-auto mb-2 text-ink-faint" />
          <p className="text-sm font-semibold text-ink">No Services Found</p>
          <p className="mt-1 text-xs text-ink-muted">No tailoring services matched your search.</p>
        </div>
      ) : (() => {
        const storeOrder: number[] = [];
        const storeMap: Record<number, SearchServiceResult[]> = {};
        for (const svc of services) {
          const sid = svc.store?.id ?? 0;
          if (!storeMap[sid]) {
            storeMap[sid] = [];
            storeOrder.push(sid);
          }
          storeMap[sid].push(svc);
        }

        if (stores && stores.length > 0) {
          storeOrder.sort((a, b) => {
            const storeA = stores.find((s) => s.id === a);
            const storeB = stores.find((s) => s.id === b);
            const distA = storeA?.distance_km ?? 99999;
            const distB = storeB?.distance_km ?? 99999;
            return distA - distB;
          });
        }

        return (
          <div className="divide-y divide-line border-t border-line">
            {storeOrder.map((storeId, storeIndex) => {
              const storeServices = storeMap[storeId];
              const matchedStore = stores.find((s) => s.id === storeId);
              const rawStore = storeServices[0]?.store;
              const storeInfo = matchedStore || rawStore;
              const storeName = storeInfo?.name || 'Tailoring Store';
              const storeSlug = storeInfo?.slug || (rawStore as { slug?: string })?.slug || String(storeId);
              const storeHref = gate(
                `/store/${storeSlug}?tab=services${effectiveQ.trim() ? `&q=${encodeURIComponent(effectiveQ.trim())}` : ''}`
              );
              const logoSrc = storeInfo?.logo_path || (storeInfo as { banner_path?: string | null })?.banner_path;
              const distKm = matchedStore?.distance_km != null ? matchedStore.distance_km : null;
              const branch = storeInfo?.branches?.[0];
              const districtText = branch?.district || branch?.city || 'Davao City';
              const ownerName = storeInfo?.owner?.name;
              const operatingHours = storeInfo?.operating_hours;
              const isFeatured =
                (storeInfo as { subscription_plan?: string })?.subscription_plan === 'premium' ||
                (storeInfo as { is_featured?: boolean })?.is_featured;
              const rating = matchedStore?.reviews_avg_rating;
              const reviewsCount = matchedStore?.reviews_count;

              return (
                <div key={storeId} className="border-b border-line border-x-0 rounded-none px-0 py-3.5 space-y-3">
                  {/* Store row */}
                  <Link href={storeHref} className="flex items-center justify-between gap-3 group active:opacity-80">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <StoreLogoAvatar
                        src={logoSrc}
                        name={storeName}
                        isOpen={isStoreOpen(operatingHours)}
                        className="w-14 h-14 rounded-full border border-line bg-sunken"
                        textClassName="text-base font-bold text-taupe"
                      />
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {distKm != null ? (
                            <span className="text-[10px] font-extrabold uppercase tracking-wide text-taupe">
                              {storeIndex === 0 ? `NEAREST · ${distKm.toFixed(1)} km` : `${distKm.toFixed(1)} km`}
                            </span>
                          ) : isFeatured ? (
                            <span className="text-[10px] font-extrabold uppercase tracking-wide text-taupe">
                              ★ FEATURED STORE
                            </span>
                          ) : (
                            <span className="text-[10px] font-extrabold uppercase tracking-wide text-taupe">
                              DAVAO CITY
                            </span>
                          )}
                          {rating ? (
                            <span className="text-[10px] font-bold text-ink-muted flex items-center gap-0.5">
                              <Star size={10} className="fill-current text-taupe" />
                              {Number(rating).toFixed(1)} ({reviewsCount ?? 0})
                            </span>
                          ) : null}
                        </div>
                        <h3 className="text-[15px] font-bold text-ink truncate leading-tight group-hover:text-taupe transition-colors">
                          {storeName}
                        </h3>
                        <p className="text-[11px] text-ink-muted truncate">
                          {ownerName ? `by ${ownerName}` : 'by Tailoring Master'}
                        </p>
                        <p className="text-[11px] text-ink-faint truncate">
                          {districtText} · Davao City
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-ink-faint group-hover:text-ink transition-colors shrink-0" />
                  </Link>

                  {/* Service carousel header */}
                  {storeServices.length > 0 && (
                    <div className="px-0.5 pt-0.5">
                      <span className="text-[11px] font-bold text-ink">
                        {effectiveQ.trim()
                          ? `${storeServices.length} matching service${storeServices.length === 1 ? '' : 's'}`
                          : `Services (${storeServices.length})`}
                      </span>
                    </div>
                  )}

                  {/* Service cards carousel */}
                  <ServiceCarouselRow>
                    {storeServices.map((service) => (
                      <SearchServiceCard
                        key={service.id}
                        service={service}
                        storeSlug={storeSlug}
                        gate={gate}
                      />
                    ))}
                  </ServiceCarouselRow>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}
