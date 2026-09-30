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

// Mirrors CatalogRecommendationsSection.tsx's "From The Same Shop" bordered
// card + "You May Also Like" divider/grid pattern, reusing SearchServiceCard
// (the app's one canonical service tile) the same way Catalog reuses its own
// canonical CatalogItemCard.
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
          <div className="p-3 flex gap-2.5 overflow-x-auto hide-scrollbar">
            {fromSameShop.slice(0, 8).map((svc) => (
              <SearchServiceCard key={svc.id} service={svc} storeSlug={storeId} gate={gate} />
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

          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar">
            {moreLikeThis.map((svc) => (
              <SearchServiceCard key={svc.id} service={svc} storeSlug={svc.store?.slug ?? storeId} gate={gate} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
