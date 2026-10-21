'use client';

import React from 'react';
import Image from 'next/image';
import { Scissors, Sparkles, Trash2 } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { RequestedServiceItem } from '@/store/useRequestedItemsStore';
import ItemQuantitySelector from '@/components/shared/ItemQuantitySelector';
import { StoreSettings } from './types';

interface RequestedItemsSectionProps {
  items: RequestedServiceItem[];
  storeSettings?: StoreSettings | null;
  onOpenAddModal?: (prefilterServiceId?: number | null, targetItemId?: string | null) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onRemoveCatalogDesign?: (id: string, fallbackServiceName?: string) => void;
  allowEdit?: boolean;
  compact?: boolean;
}

export default function RequestedItemsSection({
  items,
  storeSettings,
  onUpdateQuantity,
  onRemoveItem,
  allowEdit = true,
  compact = false,
}: RequestedItemsSectionProps) {
  const hasItems = items.length > 0;
  if (!hasItems) return null;

  const singleItem = items.length === 1 ? items[0] : null;

  // Helper to resolve parent service name
  const getParentServiceName = (item: RequestedServiceItem): string | null => {
    if (item.serviceName) return item.serviceName;
    if (item.serviceId && storeSettings?.services) {
      const match = storeSettings.services.find((s) => s.id === item.serviceId);
      if (match) return match.name;
    }
    return null;
  };

  // ─── COMPACT VIEW (Step 2 Schedule Preview) ──────────────────────────────────
  if (compact) {
    if (singleItem) {
      const isDesign = !!singleItem.catalogItemId;
      const parentName = getParentServiceName(singleItem);

      return (
        <div className="mb-5 bg-surface border border-line rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {singleItem.image ? (
              <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-line shrink-0 bg-sunken">
                <Image
                  src={getMediaUrl(singleItem.image)}
                  alt={singleItem.name}
                  fill
                  className="object-cover object-top"
                />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-taupe/10 text-taupe flex items-center justify-center shrink-0">
                {isDesign ? <Sparkles size={18} /> : <Scissors size={18} />}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-taupe uppercase tracking-wider block">
                {isDesign ? 'Design Reference' : 'Service Consultation'}
              </span>
              <p className="mobile-caption font-semibold text-ink truncate mt-0.5">
                {singleItem.name}
                {isDesign && parentName && (
                  <span className="text-ink-muted font-normal ml-1">({parentName})</span>
                )}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-taupe shrink-0">
            {singleItem.quantity} {singleItem.quantity === 1 ? 'piece' : 'pieces'}
          </span>
        </div>
      );
    }

    // Multiple items compact view
    const totalPieces = items.reduce((acc, it) => acc + it.quantity, 0);
    return (
      <div className="mb-5 bg-surface border border-line rounded-xl p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <span className="text-[10px] font-bold text-taupe uppercase tracking-wider flex items-center gap-1.5">
            <Scissors size={13} /> Requested Services &amp; Garments ({items.length})
          </span>
          <span className="text-xs font-semibold text-ink">
            {totalPieces} {totalPieces === 1 ? 'piece' : 'pieces'} total
          </span>
        </div>
        <div className="divide-y divide-line/60">
          {items.map((it) => {
            const parentName = getParentServiceName(it);
            return (
              <div key={it.id} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex-1 truncate">
                  <span className="font-semibold text-ink">{it.name}</span>
                  {it.catalogItemId && parentName && (
                    <span className="text-[11px] text-ink-muted ml-1.5 font-normal">
                      ({parentName})
                    </span>
                  )}
                </div>
                <span className="font-semibold text-taupe shrink-0">{it.quantity} pcs</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── FULL VIEW (Step 1 Details) ──────────────────────────────────────────────
  // 1. Single Item: Design Booking or Service Booking
  if (singleItem) {
    const isDesign = !!singleItem.catalogItemId;
    const parentName = getParentServiceName(singleItem);

    return (
      <div className="p-4 rounded-xl border border-line bg-surface shadow-2xs space-y-3">
        {/* Header: Icon + Category + Title + Subtitle */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {singleItem.image ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-line shrink-0 bg-sunken mt-0.5">
                <Image
                  src={getMediaUrl(singleItem.image)}
                  alt={singleItem.name}
                  fill
                  className="object-cover object-top"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-taupe/10 text-taupe flex items-center justify-center shrink-0 mt-0.5">
                {isDesign ? <Sparkles size={20} /> : <Scissors size={20} />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-taupe block">
                {isDesign ? 'Design Reference' : 'Service Consultation'}
              </span>
              <h3 className="mobile-h4 font-semibold text-ink mt-0.5 truncate">{singleItem.name}</h3>
              {isDesign && parentName && (
                <p className="mobile-caption text-ink-muted font-normal mt-0.5 truncate">
                  Parent Service: <span className="font-medium text-ink">{parentName}</span>
                </p>
              )}
            </div>
          </div>

          {allowEdit && onRemoveItem && (
            <button
              type="button"
              onClick={() => onRemoveItem(singleItem.id)}
              aria-label={`Remove ${singleItem.name}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* Informational Consultation Notice */}
        <p className="mobile-caption text-ink-muted font-normal leading-relaxed">
          {isDesign
            ? 'Design reference for your in-store consultation. Exact specifications, measurements, fabric choices, and final quotation will be discussed and agreed upon with the tailor in person.'
            : 'Custom measurements, fabric choices, and final quotation will be confirmed in person with the tailor during your consultation visit.'}
        </p>

        {/* Interactive Quantity Control */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-line/60">
          <div>
            <label className="text-xs font-semibold text-ink block">Garment Quantity</label>
            <span className="text-[11px] text-ink-muted font-normal block mt-0.5">
              {singleItem.minQuantity > 1
                ? `Required minimum: ${singleItem.minQuantity} pieces`
                : 'Requested pieces to tailor'}
            </span>
          </div>

          {allowEdit && onUpdateQuantity ? (
            <ItemQuantitySelector
              quantity={singleItem.quantity}
              minQuantity={singleItem.minQuantity}
              onChange={(qty) => onUpdateQuantity(singleItem.id, qty)}
              hideLabel={true}
            />
          ) : (
            <span className="text-sm font-semibold text-ink bg-surface px-3 py-1.5 rounded-lg border border-line">
              {singleItem.quantity} {singleItem.quantity === 1 ? 'piece' : 'pieces'}
            </span>
          )}
        </div>

        {/* Informational Price Notice */}
        {singleItem.basePrice != null && Number(singleItem.basePrice) > 0 && (
          <div className="pt-2 border-t border-line/40 flex items-center justify-between text-xs text-ink-muted">
            <span className="font-normal text-[11px]">
              Starting reference price:{' '}
              <span className="font-semibold text-taupe">
                ₱{Number(singleItem.basePrice).toLocaleString()}
              </span>
            </span>
            <span className="text-[10px] text-ink-faint italic text-right">
              * Final price confirmed by tailor
            </span>
          </div>
        )}
      </div>
    );
  }

  // 2. Multi-Item list (if multiple services requested)
  return (
    <div className="space-y-3">
      {items.map((item) => {
        const isDesign = !!item.catalogItemId;
        const parentName = getParentServiceName(item);

        return (
          <div key={item.id} className="p-4 rounded-xl border border-line bg-surface shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {item.image ? (
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-line shrink-0 bg-sunken mt-0.5">
                    <Image
                      src={getMediaUrl(item.image)}
                      alt={item.name}
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-taupe/10 text-taupe flex items-center justify-center shrink-0 mt-0.5">
                    {isDesign ? <Sparkles size={20} /> : <Scissors size={20} />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-taupe block">
                    {isDesign ? 'Design Reference' : 'Service Consultation'}
                  </span>
                  <h3 className="mobile-h4 font-semibold text-ink mt-0.5 truncate">{item.name}</h3>
                  {isDesign && parentName && (
                    <p className="mobile-caption text-ink-muted font-normal mt-0.5 truncate">
                      Parent Service: <span className="font-medium text-ink">{parentName}</span>
                    </p>
                  )}
                </div>
              </div>

              {allowEdit && onRemoveItem && (
                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-line/60">
              <span className="text-xs font-semibold text-ink">Quantity</span>
              {allowEdit && onUpdateQuantity ? (
                <ItemQuantitySelector
                  quantity={item.quantity}
                  minQuantity={item.minQuantity}
                  onChange={(qty) => onUpdateQuantity(item.id, qty)}
                  hideLabel={true}
                />
              ) : (
                <span className="text-sm font-semibold text-ink">
                  {item.quantity} {item.quantity === 1 ? 'piece' : 'pieces'}
                </span>
              )}
            </div>

            {item.basePrice != null && Number(item.basePrice) > 0 && (
              <div className="pt-2 border-t border-line/40 flex items-center justify-between text-xs text-ink-muted">
                <span className="font-normal text-[11px]">
                  Starting reference price:{' '}
                  <span className="font-semibold text-taupe">
                    ₱{Number(item.basePrice).toLocaleString()}
                  </span>
                </span>
                <span className="text-[10px] text-ink-faint italic">* Confirmed in-store</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
