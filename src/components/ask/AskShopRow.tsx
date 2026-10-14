'use client';

import Link from 'next/link';
import { ChevronRight, MapPin, Star } from 'lucide-react';
import StoreLogoAvatar from '@/components/StoreLogoAvatar';
import { isStoreOpen } from '@/lib/storeStatus';
import type { AskShop } from './useAskSutura';

const fmtKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

/** One shop in an Ask SUTURA answer: who it is, whether it's open, how far, how rated. */
export default function AskShopRow({ shop }: { readonly shop: AskShop }) {
  const open = isStoreOpen(shop.operating_hours);
  const rating = shop.reviews_avg_rating ? Number(shop.reviews_avg_rating) : null;
  const km = shop.distance_km != null && Number.isFinite(Number(shop.distance_km)) ? Number(shop.distance_km) : null;
  const place = shop.branches[0]?.city ?? shop.branches[0]?.name ?? 'Davao City';
  const matches = shop.matching_items_count ?? 0;

  return (
    <li>
      <Link
        href={`/store/${shop.slug}`}
        className="group flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-[#F7F1EA] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-taupe"
      >
        <StoreLogoAvatar
          src={shop.logo_path}
          name={shop.name}
          className="h-12 w-12 rounded-full border border-line bg-surface"
          textClassName="text-base font-bold text-taupe"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-[15px] font-semibold text-ink group-hover:text-taupe transition-colors">{shop.name}</span>
            <span className={`shrink-0 text-[11px] font-bold uppercase tracking-wide ${open ? 'text-sage' : 'text-danger'}`}>
              {open ? 'Open' : 'Closed'}
            </span>
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
            {rating ? (
              <span className="inline-flex items-center gap-1 font-semibold text-ink tabular-nums">
                <Star size={12} className="fill-[#D9A441] text-[#D9A441]" aria-hidden="true" />
                {rating.toFixed(1)}
                <span className="font-normal text-ink-faint">({shop.reviews_count})</span>
              </span>
            ) : (
              <span>No ratings yet</span>
            )}
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} className="text-taupe" aria-hidden="true" />
              {place}
              {km !== null && <span className="tabular-nums"> · {fmtKm(km)}</span>}
            </span>
            {matches > 0 && (
              <span className="text-taupe">
                {matches} matching {matches === 1 ? 'design' : 'designs'}
              </span>
            )}
          </span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </Link>
    </li>
  );
}
