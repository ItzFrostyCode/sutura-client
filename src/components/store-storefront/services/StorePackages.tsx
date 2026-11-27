'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Layers, Star } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import type { PublicServicePackage } from '../types';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

/**
 * The shop's combo packages on its Services tab (the team lead's combo packages, in this site's design): a set of
 * services for one bundle price, with what it saves against ordering each one. Swipe on a phone, a grid on desktop.
 * Nothing is shown when the shop has no packages.
 */
export default function StorePackages({ storeSlug }: { readonly storeSlug: string }) {
  const [packages, setPackages] = useState<PublicServicePackage[]>([]);

  useEffect(() => {
    let live = true;
    api.get(`/public/stores/${storeSlug}/service-packages`)
      .then((res) => { if (live) setPackages(res.data?.data ?? []); })
      .catch(() => { if (live) setPackages([]); });
    return () => { live = false; };
  }, [storeSlug]);

  if (packages.length === 0) return null;

  return (
    <section aria-labelledby="shop-packages-title" className="pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="shop-packages-title" className="mobile-h3 font-semibold text-ink">Combo packages</h2>
        <span className="text-xs text-ink-muted">{packages.length} set{packages.length > 1 ? 's' : ''} · one price</span>
      </div>
      <ul className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 hide-scrollbar sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {packages.map((p) => {
          const bundle = Number(p.bundle_price ?? 0);
          const separate = p.services.reduce((sum, s) => sum + Number(s.base_price ?? 0), 0);
          const saves = separate > bundle && bundle > 0 ? separate - bundle : 0;
          return (
            <li key={p.id} className="w-[78%] shrink-0 snap-start sm:w-auto">
              <Link href={`/store/${storeSlug}/package/${p.id}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-[0_8px_24px_rgba(45,42,38,0.08)]">
                <div className="relative aspect-[4/3] bg-sunken">
                  {p.image_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={getMediaUrl(p.image_url)} alt="" loading="lazy" className="h-full w-full object-cover" />
                    : <Layers size={28} className="absolute inset-0 m-auto text-ink-faint" aria-hidden />}
                  <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">
                    <Layers size={12} aria-hidden /> Combo · {p.services.length}
                  </span>
                  {saves > 0 && <span className="absolute right-2.5 top-2.5 rounded-full bg-sage px-2.5 py-1 text-[11px] font-semibold text-white">Save {peso(saves)}</span>}
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-3.5">
                  <h3 className="text-[15px] font-semibold leading-snug text-ink group-hover:underline">{p.name}</h3>
                  <p className="line-clamp-2 text-xs text-ink-muted">{p.services.map((s) => s.name).join(' · ')}</p>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
                    <p>
                      <span className="text-base font-semibold text-ink">{bundle > 0 ? peso(bundle) : 'Ask for price'}</span>
                      {saves > 0 && <span className="ml-1.5 text-xs text-ink-faint line-through">{peso(separate)}</span>}
                    </p>
                    {(p.reviews_count ?? 0) > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-ink-muted"><Star size={12} className="fill-amber-400 text-amber-400" aria-hidden /> {Number(p.reviews_avg_rating ?? 0).toFixed(1)}</span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
