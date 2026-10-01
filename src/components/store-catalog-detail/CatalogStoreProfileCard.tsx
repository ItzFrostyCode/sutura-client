'use client';

import { safeHref } from '@/lib/safeHref';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { CatalogItem } from './types';

interface CatalogStoreProfileCardProps {
  item: CatalogItem;
  gate: (href: string) => string;
}

// Matches the mocked shop-profile.css layout:
//   .shop-profile-card -> flex items-center
//   .shop-left-col    -> avatar + name + status + buttons, border-right, min-w-[360px]
//   .shop-right-stats -> .shop-stats-2x2 grid (2 cols) with label on left, val (taupe) on right
export default function CatalogStoreProfileCard({ item, gate }: CatalogStoreProfileCardProps) {
  if (!item.store) return null;

  const storeHref = gate(`/store/${item.store.slug}`);
  const avgRating = item.store.reviews_avg_rating
    ? Number(item.store.reviews_avg_rating).toFixed(1)
    : 'New';
  const catalogCount = item.store.catalog_items_count ?? 0;
  const serviceCount = item.store.services_count ?? 0;
  const reviewsCount = item.store.reviews_count ?? 0;

  const stats: [string, string][] = [
    ['Ratings', avgRating],
    ['Reviews', reviewsCount > 0 ? `${reviewsCount}` : '—'],
    ['Catalog', `${catalogCount}`],
    ['Services', serviceCount > 0 ? `${serviceCount}` : '—'],
  ];

  return (
    <div className="border border-line bg-white">
      <div className="flex items-center px-4 sm:px-6 py-4 sm:py-5 gap-4 sm:gap-6 flex-wrap sm:flex-nowrap">
        {/* Left column: avatar + name + status + buttons */}
        <div className="flex items-center gap-4 pr-0 sm:pr-6 sm:border-r sm:border-line min-w-0 sm:min-w-[240px] flex-1 sm:flex-none">
          {/* Avatar */}
          <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] shrink-0 rounded-full overflow-hidden bg-sunken border border-line">
            {item.store.logo_path ? (
              <Image src={getMediaUrl(item.store.logo_path)} alt="" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Store size={24} className="text-ink-faint" />
              </div>
            )}
          </div>

          {/* Name + status + action buttons */}
          <div>
            <p className="text-base font-semibold text-ink leading-snug line-clamp-2">
              {item.store.name}
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

        {/* Right column: 2×2 stats grid */}
        <div className="flex-1 grid grid-cols-2 gap-y-3 gap-x-6 sm:pl-2">
          {stats.map(([label, val]) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-ink-muted">{label}</span>
              <span className="font-semibold text-taupe">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {item.external_gallery_url && (
        <div className="border-t border-line px-4 py-2.5">
          <a
            href={safeHref(item.external_gallery_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full border border-line-strong hover:border-ink hover:bg-canvas text-ink-body font-medium tracking-wide py-2 transition-colors flex items-center justify-center gap-2 text-xs uppercase"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Sample Designs (External Gallery)
          </a>
        </div>
      )}
    </div>
  );
}
