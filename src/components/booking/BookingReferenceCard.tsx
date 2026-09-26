'use client';

import React from 'react';
import Image from 'next/image';
import { Scissors } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { getServicePriceLabel } from '@/lib/servicePricing';
import { PackageInfo, Service } from './types';

interface BookingReferenceCardProps {
  readonly refName: string | null;
  readonly refImage: string | null;
  readonly refPrice: string | null;
  readonly refSize: string | null;
  readonly refColor: string | null;
  readonly packageInfo: PackageInfo | null;
  readonly selectedService?: Service | null;
  readonly serviceName?: string | null;
  readonly quantity?: string | null;
}

export default function BookingReferenceCard({
  refName,
  refImage,
  refPrice,
  refSize,
  refColor,
  packageInfo,
  selectedService,
  serviceName,
  quantity,
}: BookingReferenceCardProps) {
  return (
    <>
      {/* Compact Design Reference Preview */}
      {refName && (
        <div className="mb-5 bg-surface border border-line rounded-none shadow-xs p-3 flex items-center gap-3">
          {refImage && (
            <div className="relative w-12 h-12 rounded-none overflow-hidden border border-line shrink-0 bg-sunken">
              <Image src={getMediaUrl(refImage)} alt={refName} fill className="object-cover object-top" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-taupe uppercase tracking-wider">Design Reference</span>
              {refPrice && (
                <span className="text-xs font-bold text-ink">₱{Number(refPrice).toLocaleString()}</span>
              )}
            </div>
            <h3 className="font-semibold text-xs text-ink truncate mt-0.5">{refName}</h3>
            <div className="flex items-center gap-1.5 text-[11px] text-ink-muted mt-0.5">
              {refSize && <span className="text-ink-faint">Size {refSize}</span>}
              {refSize && refColor && <span>•</span>}
              {refColor && <span>{refColor}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Compact Package Summary Preview */}
      {packageInfo && (
        <div className="mb-5 bg-surface border border-taupe/30 rounded-none p-3 shadow-xs">
          <span className="text-[10px] font-bold text-taupe uppercase tracking-wider">Package Inquiry</span>
          <div className="flex items-center justify-between mt-0.5">
            <h3 className="font-semibold text-xs text-ink">{packageInfo.name}</h3>
            <span className="text-xs font-bold text-taupe">
              ₱{(packageInfo.bundle_price
                ? Number(packageInfo.bundle_price)
                : packageInfo.services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0)
              ).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Compact Selected Service Context (from Service Detail) */}
      {!refName && (selectedService || serviceName) && (
        <div className="mb-5 bg-surface border border-line rounded-none shadow-xs p-3">
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
        <div className="mb-4 px-3 py-2 bg-sunken border border-line rounded-none flex items-center justify-between text-xs">
          <span className="text-ink-muted font-medium">Estimated Quantity</span>
          <span className="font-semibold text-ink">{quantity} items/people</span>
        </div>
      )}
    </>
  );
}
