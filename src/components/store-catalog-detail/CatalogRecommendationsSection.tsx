'use client';

import React from 'react';
import Link from 'next/link';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';

interface CatalogRecommendationsSectionProps {
  fromSameShop: CatalogItemResult[];
  moreLikeThis: CatalogItemResult[];
  storeId: string;
}

export default function CatalogRecommendationsSection({
  fromSameShop,
  moreLikeThis,
  storeId,
}: CatalogRecommendationsSectionProps) {
  return (
    <>
      {/* FROM THE SAME SHOP — mocked layout: bold uppercase header + "See All >" link, 4-col grid */}
      {fromSameShop.length > 0 && (
        <div className="bg-white border border-line">
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="text-xs font-bold uppercase tracking-wider text-ink">From the Same Shop</span>
            <Link
              href={`/store/${fromSameShop[0]?.store?.slug ?? storeId}`}
              className="text-xs font-semibold text-taupe hover:underline"
            >
              See All &gt;
            </Link>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {fromSameShop.slice(0, 5).map((rec) => (
              <CatalogItemCard key={rec.id} item={rec} />
            ))}
          </div>
        </div>
      )}

      {/* YOU MAY ALSO LIKE — centered divider line + text, then 6-col grid */}
      {moreLikeThis.length > 0 && (
        <div>
          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs font-bold uppercase tracking-widest text-ink-muted whitespace-nowrap">
              You May Also Like
            </span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {moreLikeThis.map((rec) => (
              <CatalogItemCard key={rec.id} item={rec} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
