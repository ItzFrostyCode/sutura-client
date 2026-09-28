import React from 'react';
import { Heart } from 'lucide-react';
import { getColorHex, getFabricLabel } from '@/lib/fabricHelper';
import { CatalogItem } from './types';

interface CatalogProductInfoProps {
  item: CatalogItem;
  selectedColor?: string;
  isSaved?: boolean;
  togglingSave?: boolean;
  onToggleSave?: () => void;
}

export default function CatalogProductInfo({ item, selectedColor, isSaved, togglingSave, onToggleSave }: CatalogProductInfoProps) {
  const fabricName = getFabricLabel(item);
  const currentColor = selectedColor || item.color;

  return (
    <div className="space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xl font-bold text-ink">₱{Number(item.price).toLocaleString()}</p>
        {onToggleSave && (
          <button
            type="button"
            onClick={onToggleSave}
            disabled={togglingSave}
            aria-label={isSaved ? 'Unsave this item' : 'Save this item'}
            aria-pressed={isSaved}
            className="w-9 h-9 shrink-0 flex items-center justify-center text-ink hover:bg-canvas rounded-full transition-colors disabled:opacity-50"
          >
            <Heart size={19} className={isSaved ? 'fill-rose-600 text-rose-600' : 'text-ink-muted'} />
          </button>
        )}
      </div>
      <h1 className="text-base font-serif font-semibold text-ink leading-snug">{item.name}</h1>
      {(item.saves_count ?? 0) > 0 && (
        <p className="flex items-center gap-1 text-ink-muted text-xs -mt-1.5">
          <Heart size={12} className="fill-rose-500 text-rose-500" />
          <span>{item.saves_count} saved</span>
        </p>
      )}

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

