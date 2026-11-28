'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, SearchX } from 'lucide-react';
import api from '@/lib/axios';
import GarmentTiles from './GarmentTiles';
import StoreRowInfo from './StoreRowInfo';
import type { RelatedStore } from './types';

interface SearchNoResultsProps {
  /** What was searched ('' = no words, just filters). */
  readonly query: string;
  /** "shops" / "designs" / "services" — what was looked for. */
  readonly what: string;
  /** The district the results are narrowed to, if any. */
  readonly district?: string;
  /** Search for a garment (a tile was tapped). */
  readonly onSearch: (term: string) => void;
  /** Where the person is, for the nearby shops (none: shops in Davao City). */
  readonly userCoords?: { lat: number; lng: number } | null;
}

/**
 * A search that found nothing. Says so plainly — no "Did you mean …?" (a guess turned "malong", a real garment we do
 * not list, into "barong"). Then two safe ways on: the garment tiles from Discover (+ All categories), and, under a
 * line, the shops near the person — clearly NOT results of the search, just nearby.
 */
export default function SearchNoResults({ query, what, district, onSearch, userCoords }: SearchNoResultsProps) {
  const q = query.trim();
  const where = district ? ` in ${district}` : '';
  const [near, setNear] = useState<RelatedStore[]>([]);

  const lat = userCoords?.lat;
  const lng = userCoords?.lng;
  useEffect(() => {
    let alive = true;
    const params: Record<string, string | number> = { per_page: 5 };
    if (lat !== undefined && lng !== undefined) { params.lat = lat; params.lng = lng; params.sort_by = 'distance'; }
    api.get('/public/stores', { params })
      .then((res) => { if (alive) setNear((res.data.data ?? []) as RelatedStore[]); })
      .catch(() => { if (alive) setNear([]); });
    return () => { alive = false; };
  }, [lat, lng]);

  return (
    <div className="border-t border-line pt-6">
      <div className="text-center" role="status">
        <SearchX size={28} className="mx-auto mb-2 text-ink-faint" aria-hidden />
        <p className="mobile-h4 text-ink">{q ? `No ${what} match “${q}”${where}` : `No ${what} found${where}`}</p>
        <p className="mobile-body-sm mt-1 text-ink-muted">Browse by garment instead, or see the shops near you.</p>
      </div>

      {/* Browse by garment — the same tiles as Discover. */}
      <div className="mt-6">
        <GarmentTiles onSearch={onSearch} />
      </div>

      {/* A line, then nearby shops — not results of the search. */}
      {near.length > 0 && (
        <div className="mt-6 border-t border-line pt-5">
          <h3 className="mobile-h4 text-ink">Shops near you</h3>
          <p className="mobile-body-sm text-ink-muted">Not results for “{q || what}” — just the shops closest to you.</p>
          <ul className="mt-2 divide-y divide-line">
            {near.map((store, index) => {
              const branch = store.branches?.[0];
              const km = store.distance_km != null ? Number(store.distance_km) : null;
              return (
                <li key={store.id}>
                  <Link href={`/store/${store.slug}`} className="group flex items-center gap-2 py-3.5">
                    <StoreRowInfo store={store} index={index} distKm={km} addressText={branch?.address || branch?.city || 'Davao City'} imageSrc={store.logo_path || store.banner_path} />
                    <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
