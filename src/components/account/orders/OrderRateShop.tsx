'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import RateShopStars from './RateShopStars';

/** A completed order's detail page: rate the shop (stars only), starting from the customer's current rating. */
export default function OrderRateShop({ storeSlug, storeName }: { readonly storeSlug: string; readonly storeName: string }) {
  const [rating, setRating] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    api.get(`/stores/${storeSlug}/my-review`)
      .then((res) => { if (live) setRating(res.data?.data?.rating ?? 0); })
      .catch(() => { if (live) setRating(0); });
    return () => { live = false; };
  }, [storeSlug]);

  if (rating === null) return null;
  return (
    <section aria-label="Rate the shop" className="rounded-2xl border border-line bg-surface px-4 py-3">
      <RateShopStars storeSlug={storeSlug} storeName={storeName} rating={rating} onRated={setRating} />
    </section>
  );
}
