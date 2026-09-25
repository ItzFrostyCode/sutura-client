'use client';

import React from 'react';
import { CatalogItem } from './types';

interface CatalogProductInfoProps {
  item: CatalogItem;
}

// Price + Title only — the star-rating summary that used to live here was
// removed (Product Ratings now has its own full section, positioned per
// the requested Price > Title > Available Sizing > Product Rating > Store
// Profile order, so a duplicate quick-rating line here would be redundant)
// and the Store Profile card was extracted to CatalogStoreProfileCard for
// the same reason — it now sits at its own position in that order instead
// of always trailing right after Price/Title.
export default function CatalogProductInfo({ item }: CatalogProductInfoProps) {
  return (
    <div className="space-y-2">
      <p className="text-lg font-bold text-ink">₱{Number(item.price).toLocaleString()}</p>
      <h1 className="text-base font-serif font-semibold text-ink">{item.name}</h1>
    </div>
  );
}
