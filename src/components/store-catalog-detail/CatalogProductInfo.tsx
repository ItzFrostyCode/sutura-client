import React from 'react';
import { getColorHex, getFabricLabel } from '@/lib/fabricHelper';
import { CatalogItem } from './types';

interface CatalogProductInfoProps {
  item: CatalogItem;
  selectedColor?: string;
}

export default function CatalogProductInfo({ item, selectedColor }: CatalogProductInfoProps) {
  const fabricName = getFabricLabel(item);
  const currentColor = selectedColor || item.color;

  return (
    <div className="space-y-2.5">
      <p className="text-xl font-bold text-ink">₱{Number(item.price).toLocaleString()}</p>
      <h1 className="text-base font-serif font-semibold text-ink leading-snug">{item.name}</h1>

      {/* Service, Color, and Fabric specifications */}
      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
        {item.service?.name && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-line rounded-none text-xs font-medium text-ink-muted shadow-2xs">
            <span>Service:</span>
            <span className="font-semibold text-ink">{item.service.name}</span>
          </div>
        )}
        {currentColor && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-line rounded-none text-xs font-medium text-ink shadow-2xs">
            <span
              className="w-3 h-3 rounded-full border border-black/15 shrink-0"
              style={{ backgroundColor: getColorHex(currentColor) }}
            />
            <span className="capitalize">{currentColor}</span>
          </div>
        )}
        {fabricName && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface border border-line rounded-none text-xs font-medium text-ink-muted shadow-2xs">
            <span>Fabric:</span>
            <span className="font-semibold text-ink">{fabricName}</span>
          </div>
        )}
      </div>
    </div>
  );
}

