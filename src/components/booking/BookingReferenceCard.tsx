'use client';

import React from 'react';
import Image from 'next/image';
import { Scissors } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { getServicePriceLabel } from '@/lib/servicePricing';
import { RequestedServiceItem } from '@/store/useRequestedItemsStore';
import { Service } from './types';

interface BookingReferenceCardProps {
  readonly requestedItems?: RequestedServiceItem[];
  readonly refName: string | null;
  readonly refImage: string | null;
  readonly refPrice: string | null;
  readonly refSize: string | null;
  readonly refColor: string | null;
  readonly refAddOns?: string | null;
  readonly selectedService?: Service | null;
  readonly serviceName?: string | null;
  readonly quantity?: string | null;
}

export default function BookingReferenceCard({
  requestedItems,
  refName,
  refImage,
  refPrice,
  refSize,
  refColor,
  refAddOns,
  selectedService,
  serviceName,
  quantity,
}: BookingReferenceCardProps) {
  const items = requestedItems;

  if (items && items.length > 0) {
    const totalPieces = items.reduce((acc, it) => acc + it.quantity, 0);

    if (items.length === 1) {
      const it = items[0];
      return (
        <div className="mb-5 bg-surface border border-line rounded-xl shadow-xs p-3 flex items-center gap-3">
          {it.image ? (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-line shrink-0 bg-sunken">
              <Image src={getMediaUrl(it.image)} alt={it.name} fill className="object-cover object-top" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg border border-line shrink-0 bg-sunken flex items-center justify-center text-taupe">
              <Scissors size={18} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-taupe uppercase tracking-wider">
                {it.catalogItemId ? 'Design Reference' : 'Selected Service'}
              </span>
              <span className="text-xs font-bold text-ink">
                Qty: {it.quantity} {it.quantity === 1 ? 'pc' : 'pcs'}
              </span>
            </div>
            <h3 className="font-semibold text-xs text-ink truncate mt-0.5">{it.name}</h3>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted mt-0.5">
              {it.selectedSize && <span className="text-ink-faint">Size {it.selectedSize}</span>}
              {it.selectedSize && it.selectedColor && <span>•</span>}
              {it.selectedColor && <span>{it.selectedColor}</span>}
              {(it.selectedSize || it.selectedColor) && it.addOns.length > 0 && <span>•</span>}
              {it.addOns.length > 0 && (
                <span className="text-taupe font-medium">Add-ons: {it.addOns.join(', ')}</span>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-5 bg-surface border border-line rounded-xl shadow-xs p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-taupe uppercase tracking-wider flex items-center gap-1.5">
            <Scissors size={12} className="text-taupe" /> Requested Items ({items.length})
          </span>
          <span className="text-xs font-semibold text-ink">
            {totalPieces} pieces total
          </span>
        </div>
        <div className="divide-y divide-line/60">
          {items.map((it) => (
            <div key={it.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0 flex-1 truncate">
                <span className="font-medium text-ink">{it.name}</span>
                <span className="text-[11px] text-ink-muted ml-1.5">
                  {[it.selectedSize && `Size ${it.selectedSize}`, it.selectedColor, it.addOns.length > 0 && `+${it.addOns.length} add-ons`].filter(Boolean).join(' · ')}
                </span>
              </div>
              <span className="font-semibold text-taupe shrink-0">{it.quantity} pcs</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Compact Design Reference Preview */}
      {refName && (
        <div className="mb-5 bg-surface border border-line rounded-xl shadow-xs p-3 flex items-center gap-3">
          {refImage && (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-line shrink-0 bg-sunken">
              <Image src={getMediaUrl(refImage)} alt={refName} fill className="object-cover object-top" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-taupe uppercase tracking-wider">Design Reference</span>
              {refPrice && (
                <span className="text-xs font-bold text-ink">From ₱{Number(refPrice).toLocaleString()}</span>
              )}
            </div>
            <h3 className="font-semibold text-xs text-ink truncate mt-0.5">{refName}</h3>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted mt-0.5">
              {refSize && <span className="text-ink-faint">Size {refSize}</span>}
              {refSize && refColor && <span>•</span>}
              {refColor && <span>{refColor}</span>}
              {(refSize || refColor) && refAddOns && <span>•</span>}
              {refAddOns && <span className="text-taupe font-medium">Add-ons: {refAddOns}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Compact Selected Service Context (from Service Detail) */}
      {!refName && (selectedService || serviceName) && (
        <div className="mb-5 bg-surface border border-line rounded-xl shadow-xs p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-taupe uppercase tracking-wider flex items-center gap-1.5">
              <Scissors size={12} className="text-taupe" /> Selected Service
            </span>
            {selectedService?.base_price && (
              <span className="text-xs font-bold text-taupe shrink-0">
                {getServicePriceLabel(selectedService.base_price)}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-xs text-ink truncate mt-1">
            {selectedService?.name || serviceName}
          </h3>
          {selectedService?.description && (
            <p className="text-[11px] text-ink-muted line-clamp-1 mt-0.5 font-normal">
              {selectedService.description}
            </p>
          )}
        </div>
      )}

      {/* Optional Quantity Context (Bulk / Group Inquiries) */}
      {quantity && (
        <div className="mb-4 px-3 py-2 bg-sunken border border-line rounded-xl flex items-center justify-between text-xs">
          <span className="text-ink-muted font-medium">Estimated Quantity</span>
          <span className="font-semibold text-ink">{quantity} items/people</span>
        </div>
      )}
    </>
  );
}
