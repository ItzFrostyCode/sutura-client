'use client';

import React from 'react';
import Link from 'next/link';
import SearchServiceCard from '@/components/search/SearchServiceCard';
import type { SearchServiceResult } from '@/components/search/types';

interface ServiceRecommendationsSectionProps {
  fromSameShop: SearchServiceResult[];
  moreLikeThis: SearchServiceResult[];
  storeId: string;
  gate: (href: string) => string;
}

// The same layout as a design's page (CatalogRecommendationsSection.tsx): both lists are grids that grow downward,
// never a sideways rail. From the Same Shop: 2 columns on a phone, 5 from 600px. You May Also Like: 2 columns on a
// phone, 3 on a tablet, 6 on a desktop, as many rows as there are services. Cards are `fluid` so they fill their cell.
export default function ServiceRecommendationsSection({
  fromSameShop,
  moreLikeThis,
  storeId,
  gate,
}: ServiceRecommendationsSectionProps) {
  return (
    <>
      {fromSameShop.length > 0 && (
        <div className="bg-white border border-line">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="text-xs font-bold uppercase tracking-wider text-ink">From the Same Shop</span>
            <Link
              href={`/store/${storeId}?tab=services`}
              className="text-xs font-semibold text-taupe hover:underline"
            >
              See All &gt;
            </Link>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {fromSameShop.slice(0, 5).map((svc) => (
              <SearchServiceCard key={svc.id} service={svc} storeSlug={storeId} gate={gate} fluid />
            ))}
          </div>
        </div>
      )}

      {moreLikeThis.length > 0 && (
        <div>
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs font-bold uppercase tracking-widest text-ink-muted whitespace-nowrap">
              You May Also Like
            </span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {moreLikeThis.map((svc) => (
              <SearchServiceCard key={svc.id} service={svc} storeSlug={svc.store?.slug ?? storeId} gate={gate} fluid />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
