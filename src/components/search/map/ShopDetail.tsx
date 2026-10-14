'use client';

import { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import type { RelatedStore } from '../types';

interface ShopDetailProps {
  readonly store: RelatedStore;
  readonly branch: DiscoveryMapBranch;
  /** One step back: to the list. There is only ever this one level, so one tap always returns. */
  readonly onBack: () => void;
}

/**
 * A shop opened inside the panel. The name and location sit at the top; under them is the real storefront page
 * (/store/[slug]?embed=1, the same layout, just without its own Back / name / address), which lays itself out for
 * the panel's width. One Back returns to the list.
 */
export default function ShopDetail({ store, branch, onBack }: ShopDetailProps) {
  const [loaded, setLoaded] = useState(false);
  const address = branch.address || [branch.district, branch.city].filter(Boolean).join(', ');

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-2 px-5 pb-2 pt-1">
        <div className="min-w-0">
          <h2 className="mobile-h3 truncate font-semibold text-ink">{store.name}</h2>
          {address && <p className="mobile-caption line-clamp-2 text-ink-muted">{address}</p>}
        </div>
        <button type="button" onClick={onBack} aria-label="Back to the list" className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sunken">
          <ChevronLeft size={22} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-b-[28px]">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-ink-faint"><Loader2 size={24} className="animate-spin" /></div>
        )}
        <iframe
          key={store.slug}
          src={`/store/${store.slug}?embed=1`}
          title={store.name}
          onLoad={() => setLoaded(true)}
          className="h-full w-full border-0 bg-surface"
        />
      </div>
    </div>
  );
}
