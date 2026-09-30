'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { StoreProfile } from '@/components/store-storefront/types';

interface ServiceStoreProfileCardProps {
  store: StoreProfile;
  gate: (href: string) => string;
}

// Mirrors CatalogStoreProfileCard.tsx's exact layout (avatar + name/status/
// buttons left, 2-col stats right) — built straight from StoreProfile since
// the service detail page already fetches the store separately rather than
// nested under the item the way a catalog item embeds its own store.
export default function ServiceStoreProfileCard({ store, gate }: ServiceStoreProfileCardProps) {
  const storeHref = gate(`/store/${store.slug}`);
  const avgRating = store.reviews_avg_rating ? Number(store.reviews_avg_rating).toFixed(1) : 'New';
  const reviewsCount = store.reviews_count ?? 0;

  const stats: [string, string][] = [
    ['Ratings', avgRating],
    ['Reviews', reviewsCount > 0 ? `${reviewsCount}` : '—'],
  ];

  return (
    <div className="border border-line bg-white">
      <div className="flex items-center px-4 sm:px-6 py-4 sm:py-5 gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
        {/* Left column: avatar + name + status + buttons */}
        <div className="flex items-center gap-4 pr-0 sm:pr-6 sm:border-r sm:border-line min-w-0 sm:min-w-[240px] flex-1 sm:flex-none">
          <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] shrink-0 rounded-full overflow-hidden bg-sunken border border-line">
            {store.logo_path ? (
              <Image src={getMediaUrl(store.logo_path)} alt="" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store size={24} className="text-ink-faint" />
              </div>
            )}
          </div>

          <div>
            <p className="text-base font-semibold text-ink leading-snug line-clamp-2">
              {store.name}
            </p>
            <p className="text-xs text-ink-muted mt-0.5 mb-3">Active Recently</p>

            <div className="flex items-center gap-2">
              <Link
                href={storeHref}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-taupe text-taupe text-xs font-semibold hover:bg-taupe hover:text-white transition-colors"
              >
                <Store size={12} />
                View Shop
              </Link>
            </div>
          </div>
        </div>

        {/* Right column: stats */}
        <div className="flex-1 grid grid-cols-2 gap-y-3 gap-x-6 sm:pl-2">
          {stats.map(([label, val]) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">{label}</span>
              <span className="font-semibold text-taupe">{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
