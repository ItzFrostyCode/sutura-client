'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import type { RelatedStore } from '../types';

interface ShopDetailProps {
  readonly store: RelatedStore;
  readonly branch: DiscoveryMapBranch;
  /** One step back: to the list. There is only ever this one level, so one tap always returns. */
  readonly onBack: () => void;
  /** One of the shop's pages (e.g. "/service/3") instead of its storefront. */
  readonly path?: string | null;
  /** Straight-line km to the branch, computed by the parent from userCoords. */
  readonly km?: number | null;
  /** Whether the sheet is currently at full height. */
  readonly isExpanded?: boolean;
  /** Toggle the sheet between half and full snap. */
  readonly onToggleExpand?: () => void;
  readonly searchQuery?: string;
}

/**
 * A shop opened inside the panel.
 *
 * Header layout (three columns, mobile touch targets):
 *   [← Back]  [Store name  ·  address  ·  X.X km]  [⤢ Expand / ⤡ Minimise]
 *
 * The real storefront page is an iframe below it (/store/[slug]?embed=1).
 * One Back always returns to the list.
 */
export default function ShopDetail({
  store,
  branch,
  onBack,
  path = null,
  km = null,
  isExpanded = false,
  onToggleExpand,
  searchQuery,
}: ShopDetailProps) {
  const queryParam = searchQuery?.trim() ? `q=${encodeURIComponent(searchQuery.trim())}` : '';
  const initialPath = path ?? (queryParam ? `?tab=services&${queryParam}` : '');
  const sep = initialPath.includes('?') ? '&' : '?';
  const src = `/store/${store.slug}${initialPath}${sep}embed=1`;
  const [loaded, setLoaded] = useState(false);
  const address = branch.address || branch.city || 'Davao City';

  const distanceLabel = km != null && Number.isFinite(km) ? `${km.toFixed(1)} km away` : null;
  const subtitle = [address, distanceLabel].filter(Boolean).join(' · ');

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-1 px-2 pb-1 pt-1">
        {/* LEFT: Back */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to the list"
          className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken active:opacity-70"
        >
          <ChevronLeft size={22} />
        </button>

        {/* CENTRE: Name + address + distance */}
        <div className="min-w-0 flex-1 px-1">
          <h2 className="mobile-h4 truncate font-semibold text-ink">{store.name}</h2>
          {subtitle && (
            <p className="mobile-caption line-clamp-1 text-ink-muted">{subtitle}</p>
          )}
        </div>

        {/* Open full store page */}
        <Link
          href={`/store/${store.slug}`}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full bg-ink text-white text-xs font-semibold hover:bg-ink/80 transition-colors mr-1 cursor-pointer"
        >
          View Store
        </Link>

        {/* RIGHT: Expand / Minimise */}
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Minimise panel' : 'Expand panel'}
            className="-mr-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken active:opacity-70"
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        )}
      </div>

      {/* ── Store iframe ─────────────────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-[28px]">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-ink-faint">
            <Loader2 size={24} className="animate-spin" />
          </div>
        )}
        <iframe
          key={src}
          src={src}
          title={store.name}
          onLoad={() => setLoaded(true)}
          className="h-full w-full border-0 bg-surface"
        />
      </div>
    </div>
  );
}
