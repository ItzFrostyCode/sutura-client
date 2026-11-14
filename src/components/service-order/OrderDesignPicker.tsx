'use client';

import { Check, Shirt } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import type { CatalogListItem } from '@/components/store-storefront/types';
import { designPriceLabel, type DesignPricing } from '@/lib/designPricing';
import { SectionLabel } from './orderUi';

const photoOf = (d: CatalogListItem) => ((d.images ?? []).find((i) => i.is_primary) ?? (d.images ?? [])[0])?.image_url ?? null;

/**
 * The shop's designs for this service, as the style to follow. Nothing is picked for the customer unless they came
 * from a design's page; "None of these" means they show their own references below instead.
 */
export default function OrderDesignPicker({ designs, value, onChange }: Readonly<{
  designs: CatalogListItem[]; value: number | null; onChange: (id: number | null) => void;
}>) {
  if (designs.length === 0) return null;
  const tile = (on: boolean) => `relative flex min-w-0 flex-col overflow-hidden rounded-xl border text-left transition-colors ${on ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-line-strong'}`;

  return (
    <fieldset>
      <SectionLabel as="legend" hint="Pick one of the shop's designs to follow, or choose None of these and show your own.">Design</SectionLabel>
      <div className="grid grid-cols-2 gap-3 min-[600px]:grid-cols-3" role="radiogroup" aria-label="Design">
        {designs.map((d) => {
          const on = value === d.id;
          const img = photoOf(d);
          return (
            <button key={d.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(on ? null : d.id)} className={tile(on)}>
              <span className="relative block aspect-square w-full bg-sunken">
                {img
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={getMediaUrl(img)} alt="" className="h-full w-full object-cover" />
                  : <span className="flex h-full w-full items-center justify-center text-ink-faint"><Shirt size={24} /></span>}
                {on && <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white"><Check size={16} /></span>}
              </span>
              <span className="block min-w-0 space-y-0.5 px-3 py-2.5">
                <span className="block truncate text-sm font-semibold text-ink" title={d.name}>{d.name}</span>
                {d.garment_type && <span className="mobile-caption block truncate capitalize text-ink-muted">{d.garment_type.replace(/_/g, ' ')}</span>}
                <span className="block truncate text-sm tabular-nums text-ink">
                  {designPriceLabel((d as { pricing?: DesignPricing | null }).pricing ?? null, d.price)}
                </span>
              </span>
            </button>
          );
        })}
        <button type="button" role="radio" aria-checked={value === null} onClick={() => onChange(null)} className={`${tile(value === null)} items-center justify-center p-4 text-center`}>
          <span className="text-sm font-semibold text-ink">None of these</span>
          <span className="mobile-caption mt-1 text-ink-muted">I&apos;ll show my own</span>
        </button>
      </div>
    </fieldset>
  );
}
