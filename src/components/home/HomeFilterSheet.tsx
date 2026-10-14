'use client';

import { useEffect, useState } from 'react';
import HomeSheet from './HomeSheet';
import FilterDistance from './filter/FilterDistance';
import FilterMore from './filter/FilterMore';
import FilterShopLights from './filter/FilterShopLights';
import { DEFAULT_ALL_FILTERS, type AllFilters, type MoreFilters, type NearFilters } from './homeFilters';

interface HomeFilterSheetProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly value: NearFilters & Partial<MoreFilters>;
  /** Also show price, rating and district (the search screen). The landing page only needs Distance and the lights. */
  readonly showMore?: boolean;
  readonly onApply: (filters: AllFilters) => void;
}

/** The one filter pop-up: Distance, Open / Closed lights and, on the search screen, price, rating and district. */
export default function HomeFilterSheet({ isOpen, onClose, value, showMore = false, onApply }: HomeFilterSheetProps) {
  const [draft, setDraft] = useState<AllFilters>({ ...DEFAULT_ALL_FILTERS, ...value });
  useEffect(() => { if (isOpen) setDraft({ ...DEFAULT_ALL_FILTERS, ...value }); }, [isOpen, value]);

  return (
    <HomeSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filter"
      footer={(
        <div className="flex gap-3">
          <button type="button" onClick={() => setDraft(DEFAULT_ALL_FILTERS)} className="h-[52px] flex-1 rounded-full bg-sunken text-ink transition-colors hover:bg-sunken-hover">Reset</button>
          <button type="button" onClick={() => { onApply(draft); onClose(); }} className="h-[52px] flex-1 rounded-full bg-ink font-semibold text-white transition-colors hover:bg-taupe">Apply</button>
        </div>
      )}
    >
      <section>
        <h3 className="mobile-h4 mb-3 text-ink">Distance</h3>
        <FilterDistance radiusKm={draft.radiusKm} onChange={(radiusKm) => setDraft({ ...draft, radiusKm })} />
      </section>
      <section className="mt-6">
        <h3 className="mobile-h4 mb-3 text-ink">Shop</h3>
        <FilterShopLights value={draft.status} onChange={(status) => setDraft({ ...draft, status })} />
      </section>
      {showMore && <FilterMore value={draft} onChange={(more) => setDraft({ ...draft, ...more })} />}
    </HomeSheet>
  );
}
