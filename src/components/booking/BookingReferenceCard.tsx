'use client';

import React from 'react';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/media';
import { PackageInfo } from './types';

interface BookingReferenceCardProps {
  readonly refName: string | null;
  readonly refImage: string | null;
  readonly refPrice: string | null;
  readonly refSize: string | null;
  readonly refColor: string | null;
  readonly packageInfo: PackageInfo | null;
}

export default function BookingReferenceCard({
  refName,
  refImage,
  refPrice,
  refSize,
  refColor,
  packageInfo,
}: BookingReferenceCardProps) {
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
        <div className="mb-5 bg-surface border border-taupe/30 rounded-xl p-3 shadow-xs">
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
    </>
  );
}
