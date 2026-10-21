'use client';

import { useEffect, useState } from 'react';
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
  readonly onSelectBranch?: (branch: DiscoveryMapBranch) => void;
}

/**
 * A shop opened inside the panel.
 *
 * Header layout:
 *   [← Back]  [Address  ·  X.X km]  [View Store]  [⤢ Expand / ⤡ Minimise]
 *   [MAIN · Branch Name] [2 · Branch 2] [3 · Branch 3] (when multiple branches exist)
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
  onSelectBranch,
}: ShopDetailProps) {
  const queryParam = searchQuery?.trim() ? `q=${encodeURIComponent(searchQuery.trim())}` : '';
  const branchParam = branch?.branchId ? `branch=${branch.branchId}` : '';

  let targetPath = path;
  if (!targetPath) {
    const parts = [queryParam, branchParam].filter(Boolean).join('&');
    targetPath = parts ? `?tab=services&${parts}` : (branchParam ? `?${branchParam}` : '');
  } else if (branchParam && !targetPath.includes('branch=')) {
    const sep = targetPath.includes('?') ? '&' : '?';
    targetPath = `${targetPath}${sep}${branchParam}`;
  }

  const sep = targetPath.includes('?') ? '&' : '?';
  const src = `/store/${store.slug}${targetPath}${sep}embed=1`;
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  const validBranches = (store.branches ?? []).filter(
    (b) =>
      b.latitude != null &&
      b.longitude != null &&
      !Number.isNaN(Number(b.latitude)) &&
      !Number.isNaN(Number(b.longitude)),
  );
  const mainBranch =
    validBranches.find((b) => Boolean(b.is_main)) ?? validBranches[0];
  const otherBranches = validBranches.filter((b) => b.id !== mainBranch?.id);
  const orderedBranches = mainBranch ? [mainBranch, ...otherBranches] : [];

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

        {/* CENTRE: Address + distance */}
        <div className="min-w-0 flex-1 px-1">
          {subtitle && (
            <p className="mobile-caption truncate text-ink-muted">{subtitle}</p>
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

      {/* ── Companion Branches Switcher (when 2+ branches exist) ─────────── */}
      {orderedBranches.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto px-3 py-1.5 border-t border-line bg-surface/50 no-scrollbar shrink-0">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider shrink-0 mr-0.5">
            Branches:
          </span>
          {orderedBranches.map((b, idx) => {
            const isMain = b.id === mainBranch.id;
            const badge = isMain ? 'MAIN' : `${idx + 1}`;
            const isCurrent = branch.branchId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onSelectBranch?.({
                    storeSlug: store.slug,
                    storeName: store.name,
                    storeLogoPath: store.logo_path,
                    branchId: b.id,
                    branchName: b.name,
                    isMain,
                    address: b.address ?? null,
                    city: b.city,
                    district: b.district,
                    landmark: null,
                    latitude: Number(b.latitude),
                    longitude: Number(b.longitude),
                    isOpen: branch.isOpen,
                    badgeText: badge,
                    isSelected: true,
                  });
                }}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-ink text-white shadow-sm'
                    : 'bg-surface border border-line text-ink hover:bg-sunken'
                }`}
              >
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isMain
                      ? 'bg-ink text-white'
                      : 'bg-taupe text-white'
                  }`}
                >
                  {badge}
                </span>
                <span className="truncate max-w-[120px]">{b.name}</span>
              </button>
            );
          })}
        </div>
      )}

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
