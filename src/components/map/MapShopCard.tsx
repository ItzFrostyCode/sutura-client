'use client';

import Image from 'next/image';
import { MapPin, Star, Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { specializationLabel } from '@/lib/storeSpecializations';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import { pinName } from '@/components/discovery/pinName';

const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

/** One shop in the Tailor Locator list: photo, name, open pill, rating, address, distance, specialties. */
export default function MapShopCard({ branch, active, onSelect, onHover }: {
  readonly branch: DiscoveryMapBranch;
  readonly active: boolean;
  readonly onSelect: (b: DiscoveryMapBranch) => void;
  /** Hover/focus in → this branch; out → null. Bounces its pin on the map. */
  readonly onHover?: (b: DiscoveryMapBranch | null) => void;
}) {
  const photo = branch.storeBannerPath || branch.storeLogoPath;
  const place = branch.address || [branch.district, branch.city].filter(Boolean).join(', ') || 'Davao City';
  const specialties = (branch.specializations ?? []).slice(0, 2).map(specializationLabel);

  return (
    <button
      type="button"
      onClick={() => onSelect(branch)}
      onMouseEnter={() => onHover?.(branch)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(branch)}
      onBlur={() => onHover?.(null)}
      aria-pressed={active}
      className={`group flex w-full items-start gap-3 rounded-xl border p-2.5 text-left transition-[border-color,box-shadow,background-color] duration-200 ease-out cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taupe ${
        active ? 'border-ink bg-surface shadow-[0_4px_14px_rgba(45,42,38,0.12)]' : 'border-line bg-surface hover:border-line-strong hover:shadow-[0_3px_10px_rgba(45,42,38,0.08)]'
      }`}
    >
      <span className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-lg bg-sunken">
        {photo ? (
          <Image src={getMediaUrl(photo)} alt="" fill sizes="76px" className="object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-ink-faint"><Store size={22} aria-hidden="true" /></span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        {/* Full name, wrapping if needed; the badges get their own row under it. */}
        <span className="block break-words text-[15px] font-semibold leading-snug text-ink">{pinName(branch)}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="contents">
            {/* Same colours as the map pins: deep brown = main store, taupe = branch. */}
            <span
              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                branch.isMain ? 'bg-[#2E1C14] text-white' : 'border border-[#8D7B68] bg-[#F3EEE8] text-[#5E4E40]'
              }`}
            >
              {branch.isMain ? 'Main Shop' : 'Branch'}
            </span>
          </span>
          <span className="contents">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${branch.isOpen ? 'bg-sage/15 text-sage' : 'bg-danger/10 text-danger'}`}>
              {branch.isOpen ? 'Open' : 'Closed'}
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-ink" aria-label={branch.rating ? `Rated ${branch.rating.toFixed(1)}` : 'No ratings yet'}>
              <Star size={12} className="fill-[#D9A441] text-[#D9A441]" aria-hidden="true" />
              {branch.rating ? branch.rating.toFixed(1) : 'New'}
            </span>
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-ink-muted">
          {branch.isMain ? '' : `${branch.storeName} · `}{place}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-body">
          {branch.distanceKm != null && (
            // Straight line, so it can read shorter than the road route in
            // Directions; tapping the shop shows the road distance.
            <span className="inline-flex items-center gap-1 tabular-nums">
              <MapPin size={12} className="text-taupe" aria-hidden="true" />
              <span className="font-semibold text-ink">{fmtKm(branch.distanceKm)}</span>
              <span className="text-ink-faint">straight line</span>
            </span>
          )}
          {specialties.map((s, i) => (
            <span key={s} className="text-ink-muted">{(i > 0 || branch.distanceKm != null) && <span aria-hidden="true">· </span>}{s}</span>
          ))}
        </span>
      </span>
    </button>
  );
}
