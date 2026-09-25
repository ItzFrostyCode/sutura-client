'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, ChevronRight } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { CatalogItem } from './types';

interface CatalogStoreProfileCardProps {
  item: CatalogItem;
  gate: (href: string) => string;
}

// Extracted from CatalogProductInfo so it can sit at its own position in
// the page order (Price > Title > Available Sizing > Product Rating >
// Store Profile) instead of always trailing right after Price/Title.
export default function CatalogStoreProfileCard({ item, gate }: CatalogStoreProfileCardProps) {
  if (!item.store) return null;

  const storeName = item.store.name;
  // Smart-size the name instead of a fixed font: short names get the full
  // size the bigger avatar leaves room for, long ones step down so they
  // still fit in the same two-line clamp without overflowing next to Visit.
  const nameSizeClass =
    storeName.length > 28 ? 'text-[11px]' : storeName.length > 18 ? 'text-xs' : 'text-sm';

  return (
    <div className="space-y-3">
      {/* Whole card is the "Visit" affordance now — a chevron next to the
          store name (top-right, not vertically centered on the whole
          card) replaces the old bordered Visit button, so linking to the
          store no longer costs the card any extra width/height. */}
      <Link
        href={gate(`/store/${item.store.slug}`)}
        className="bg-surface border border-line p-2.5 flex items-center gap-3 hover:bg-canvas transition-colors"
      >
        <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden bg-sunken border-[0.5px] border-line">
          {item.store.logo_path ? (
            <Image src={getMediaUrl(item.store.logo_path)} alt="" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Store size={22} className="text-ink-faint" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`min-w-0 font-bold text-ink leading-snug line-clamp-2 ${nameSizeClass}`}>{storeName}</p>
            <ChevronRight size={20} className="text-taupe shrink-0" />
          </div>

          <div className="flex items-stretch mt-2 pt-2 border-t border-line">
            <div className="flex-1 text-center">
              <p className="text-xs font-bold text-ink">
                {item.store.reviews_count ? Number(item.store.reviews_avg_rating).toFixed(1) : 'New'}
              </p>
              <p className="text-[10px] text-ink-faint mt-0.5">Rating</p>
            </div>
            <div className="w-px bg-line" />
            <div className="flex-1 text-center">
              <p className="text-xs font-bold text-ink">{item.store.catalog_items_count ?? 0}</p>
              {/* "Catalog Designs" reads clearer than "Catalog Items" for
                  what a shop owner actually lists — kept short as just
                  "Catalog" on mobile/tablet where the column is narrower,
                  spelled out on desktop where there's room. */}
              <p className="text-[10px] text-ink-faint mt-0.5">
                <span className="lg:hidden">Catalog</span>
                <span className="hidden lg:inline">Catalog Designs</span>
              </p>
            </div>
            <div className="w-px bg-line" />
            <div className="flex-1 text-center">
              <p className="text-xs font-bold text-ink">{item.store.services_count ?? 0}</p>
              <p className="text-[10px] text-ink-faint mt-0.5">Services</p>
            </div>
          </div>
        </div>
      </Link>

      {item.external_gallery_url && (
        <a
          href={item.external_gallery_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full border border-line-strong hover:border-ink hover:bg-canvas text-ink-body font-medium tracking-wide py-2.5 transition-colors flex items-center justify-center rounded-none uppercase gap-2 text-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View Sample Designs (External Gallery)
        </a>
      )}
    </div>
  );
}
