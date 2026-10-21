'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { getServicePriceLabel } from '@/lib/servicePricing';
import ItemQuantitySelector from '@/components/shared/ItemQuantitySelector';
import type { CatalogDesignItem } from '@/components/booking/AddRequestedItemModal';
import type { Service } from '@/components/booking/types';
import type { RequestedServiceItem } from '@/store/useRequestedItemsStore';

const CARD = 'relative flex min-h-[88px] cursor-pointer flex-col justify-between rounded-xl border-2 p-3 text-left transition-colors';
const ON = 'border-taupe bg-taupe/[0.08] ring-2 ring-taupe/20';
const OFF = 'border-line bg-surface hover:border-taupe/40 hover:bg-canvas/50';

/**
 * What the visit is about, service first, then (optionally) one of that service's designs: two grids of cards, never a
 * single column. A service alone is "made to order". Another need is another appointment.
 */
export default function VisitItemPicker({ storeKey, services, selected, onService, onDesign, onQuantity, onClear }: Readonly<{
  storeKey: string;
  services: Service[];
  selected: RequestedServiceItem | null;
  onService: (s: Service) => void;
  onDesign: (d: CatalogDesignItem | null, s: Service) => void;
  onQuantity: (qty: number) => void;
  onClear: () => void;
}>) {
  const [designs, setDesigns] = useState<CatalogDesignItem[] | null>(null);
  const service = selected?.serviceId ? services.find((s) => s.id === selected.serviceId) ?? null : null;

  // The designs are the shop's public catalog; load them once, when a service is first chosen.
  useEffect(() => {
    if (!service || designs !== null) return;
    let live = true;
    api.get(`/catalog/${storeKey}`).then((res) => { if (live) setDesigns(res.data?.data ?? []); }).catch(() => { if (live) setDesigns([]); });
    return () => { live = false; };
  }, [service, designs, storeKey]);

  const ofService = service ? (designs ?? []).filter((d) => d.service_id === service.id || d.service?.id === service.id) : [];

  return (
    <div className="space-y-5">
      <div>
        <span className="mb-2 block text-sm font-semibold text-ink">Service <span className="text-xs font-normal text-ink-faint">(optional)</span></span>
        {services.length === 0 ? (
          <p className="rounded-xl border border-line bg-canvas/40 p-3.5 text-xs text-ink-muted">This shop has no services yet. It will be a general visit.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {services.map((s) => {
              const on = selected?.serviceId === s.id;
              return (
                <button key={s.id} type="button" aria-pressed={on} onClick={() => (on ? onClear() : onService(s))} className={`${CARD} ${on ? ON : OFF}`}>
                  <span className="text-sm font-semibold leading-snug text-ink">{s.name}</span>
                  <span className="mt-2 block text-xs text-ink-muted">{getServicePriceLabel(s.base_price)}{s.estimated_days ? ` · ${s.estimated_days}d` : ''}</span>
                  {on && <Check size={15} className="absolute right-2.5 top-2.5 text-taupe" />}
                </button>
              );
            })}
          </div>
        )}
        <p className="mt-2 text-xs text-ink-muted">One service per appointment. Another need is another appointment.</p>
      </div>

      {service && selected && (
        <>
          <div>
            <span className="mb-2 block text-sm font-semibold text-ink">Design <span className="text-xs font-normal text-ink-faint">(optional, of {service.name})</span></span>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <button type="button" aria-pressed={!selected.catalogItemId} onClick={() => onDesign(null, service)} className={`${CARD} ${!selected.catalogItemId ? ON : OFF}`}>
                <span className="text-sm font-semibold text-ink">Made to order</span>
                <span className="mt-2 block text-xs text-ink-muted">No design chosen</span>
                {!selected.catalogItemId && <Check size={15} className="absolute right-2.5 top-2.5 text-taupe" />}
              </button>
              {ofService.map((d) => {
                const on = selected.catalogItemId === d.id;
                const img = d.images?.find((i) => i.is_primary)?.image_url ?? d.images?.[0]?.image_url;
                return (
                  <button key={d.id} type="button" aria-pressed={on} onClick={() => onDesign(d, service)} className={`${CARD} overflow-hidden !p-0 ${on ? ON : OFF}`}>
                    <span className="relative block aspect-[4/3] w-full bg-sunken">
                      {img && <Image src={getMediaUrl(img)} alt="" fill sizes="(max-width: 640px) 50vw, 200px" className="object-cover" />}
                    </span>
                    <span className="block p-2.5">
                      <span className="block truncate text-sm font-semibold text-ink">{d.name}</span>
                      <span className="block text-xs text-ink-muted">{getServicePriceLabel(d.price ?? undefined)}</span>
                    </span>
                    {on && <Check size={15} className="absolute right-2.5 top-2.5 rounded-full bg-white text-taupe" />}
                  </button>
                );
              })}
            </div>
            {designs === null && <p className="mt-2 text-xs text-ink-muted">Loading designs…</p>}
            {designs !== null && ofService.length === 0 && <p className="mt-2 text-xs text-ink-muted">{service.name} has no designs yet.</p>}
          </div>

          <div>
            <span className="mb-2 block text-sm font-semibold text-ink">Total pieces to make</span>
            <ItemQuantitySelector quantity={selected.quantity} minQuantity={Math.max(1, selected.minQuantity ?? 1)} onChange={onQuantity} hideLabel />
          </div>
        </>
      )}
    </div>
  );
}
