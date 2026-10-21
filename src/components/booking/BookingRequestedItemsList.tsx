'use client';

import React from 'react';
import Image from 'next/image';
import { Scissors, Sparkles, AlertCircle } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { RequestedServiceItem } from '@/store/useRequestedItemsStore';

interface BookingRequestedItemsListProps {
  storeId: string;
  items: RequestedServiceItem[];
  onUpdateQuantity?: (id: string, qty: number) => void;
  onRemoveItem?: (id: string) => void;
  onOpenAddModal?: () => void;
  onUpdateNotes?: (id: string, notes: string) => void;
  onRemoveCatalogDesign?: (id: string, fallbackServiceName?: string) => void;
  allowEdit?: boolean;
}

export default function BookingRequestedItemsList({
  items,
}: BookingRequestedItemsListProps) {
  if (!items || items.length === 0) return null;

  // Single Item: Simple, clean booking detail (just like Store Profile Booking)
  if (items.length === 1) {
    const item = items[0];
    const isDesign = !!item.catalogItemId;
    const parentName = item.serviceName || item.name;

    return (
      <div className="bg-surface border border-line rounded-xl shadow-xs p-4 space-y-3">
        {/* Header: Icon + Category + Title */}
        <div className="flex items-start gap-3">
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
            <span className="mobile-overline text-taupe block">
              {isDesign ? 'Design Reference' : 'Service Consultation'}
            </span>
            <h3 className="mobile-h4 font-medium text-ink mt-0.5 truncate">{item.name}</h3>
            {isDesign && parentName && (
              <p className="mobile-caption text-ink-muted font-normal mt-0.5 truncate">
                Parent Service: <span className="font-medium text-ink">{parentName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Quantity & Reference Price */}
        <div className="flex items-center justify-between text-xs pt-2.5 border-t border-line/60">
          <span className="text-ink-muted font-normal">
            Requested Quantity: <strong className="text-ink font-semibold">{item.quantity} {item.quantity === 1 ? 'piece' : 'pieces'}</strong>
          </span>
          {item.basePrice != null && Number(item.basePrice) > 0 && (
            <span className="text-taupe font-semibold">
              From ₱{Number(item.basePrice).toLocaleString()}
            </span>
          )}
        </div>

        {/* Informational Consultation Notice */}
        <div className="pt-2 border-t border-line/40 flex items-start gap-2 text-[11px] text-ink-muted font-normal">
          <AlertCircle size={13} className="text-taupe shrink-0 mt-0.5" />
          <span>
            {isDesign
              ? 'Design reference for your consultation. Exact specifications and final pricing will be confirmed in-store.'
              : 'Custom measurements, fabric choices, and final quotation will be confirmed with the tailor during your consultation visit.'}
          </span>
        </div>
      </div>
    );
  }

  // Multi-Item List: Clean, consolidated presentation
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="bg-surface border border-line rounded-xl shadow-xs p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <Scissors size={16} className="text-taupe" />
          <span className="mobile-overline text-taupe font-semibold tracking-wider">
            Requested Consultations ({items.length})
          </span>
        </div>
        <span className="text-xs font-semibold text-ink-muted">
          Total: {totalQuantity} {totalQuantity === 1 ? 'piece' : 'pieces'}
        </span>
      </div>

      <div className="divide-y divide-line/60">
        {items.map((item) => {
          const isDesign = !!item.catalogItemId;
          const parentName = item.serviceName || item.name;

          return (
            <div key={item.id} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0 flex-1 truncate">
                <span className="font-medium text-ink">{item.name}</span>
                {isDesign && parentName && (
                  <span className="text-[11px] text-ink-muted font-normal ml-1.5">
                    ({parentName})
                  </span>
                )}
              </div>
              <span className="font-semibold text-taupe shrink-0">{item.quantity} pcs</span>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-line/40 flex items-center gap-2 text-[11px] text-ink-muted font-normal">
        <AlertCircle size={13} className="text-taupe shrink-0" />
        <span>Price and garment specifications will be verified by the tailor during your consultation.</span>
      </div>
    </div>
  );
}
