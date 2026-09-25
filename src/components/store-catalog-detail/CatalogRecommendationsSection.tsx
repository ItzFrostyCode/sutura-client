'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/media';
import CatalogItemCard from '@/components/discovery/CatalogItemCard';
import type { CatalogItemResult } from '@/types/publicCatalog';
import { Recommendation, CatalogItemImage } from './types';

interface CatalogRecommendationsSectionProps {
  recommendations?: Recommendation[];
  fromSameShop: CatalogItemResult[];
  moreLikeThis: CatalogItemResult[];
  storeId: string;
}

export default function CatalogRecommendationsSection({
  recommendations,
  fromSameShop,
  moreLikeThis,
  storeId,
}: CatalogRecommendationsSectionProps) {
  return (
    <>
      {/* 1. Also Suggested — no own top border/margin: these 3 sections sit
          inside a parent space-y-* wrapper (see page.tsx) that already
          handles the gap between whichever of them actually render, so a
          per-section border here would double up with the parent's when
          this is the first one to render (Also Suggested is often empty). */}
      {recommendations && recommendations.length > 0 && (
        <div>
          <h2 className="text-base font-serif font-semibold text-ink mb-3">Also Suggested</h2>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {recommendations.map((rec) => {
              const recItem = rec.recommendedItem;
              if (!recItem) return null;
              const recImage = recItem.images?.find((i: CatalogItemImage) => i.is_primary)?.image_url || recItem.images?.[0]?.image_url;

              return (
                <Link href={`/store/${storeId}/catalog/${recItem.id}`} key={recItem.id} className="shrink-0 w-28 group block">
                  <div className="aspect-square bg-sunken overflow-hidden mb-2 relative rounded-none">
                    {recImage ? (
                      <Image src={getMediaUrl(recImage)} alt={recItem.name} className="w-full h-full object-cover" fill />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-body">No Image</div>
                    )}
                  </div>
                  <h4 className="text-xs font-medium text-ink group-hover:text-taupe truncate">{recItem.name}</h4>
                  <p className="text-xs text-ink-faint mt-0.5">₱{Number(recItem.price).toLocaleString()}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. From the Same Shop — store-scoped, horizontal carousel (matches
          Shopee's own "From the Same Shop" placement and shape: right after
          Also Suggested, before the broader cross-shop rail below). */}
      {fromSameShop.length > 0 && (
        <div>
          <h2 className="text-base font-serif font-semibold text-ink mb-3">From the Same Shop</h2>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
            {fromSameShop.map((rec) => (
              <div key={rec.id} className="w-36 sm:w-44 shrink-0">
                <CatalogItemCard item={rec} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. More Like This — broader, cross-shop grid, deliberately LAST
          on the page (matches Shopee's "You May Also Like" position). */}
      {moreLikeThis.length > 0 && (
        <div>
          <h2 className="text-base font-serif font-semibold text-ink mb-3">More Like This</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {moreLikeThis.map((rec) => (
              <CatalogItemCard key={rec.id} item={rec} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
