'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface CatalogSizeSelectorProps {
  sizes: string[] | null | undefined;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
  orderSuccess?: { order_number: string; id: number } | null;
  onViewOrder?: (id: number) => void;
  /** Owner view: the box header already says "Size". */
  hideLabel?: boolean;
}

export default function CatalogSizeSelector({
  sizes,
  orderSuccess,
  onViewOrder,
  hideLabel,
}: CatalogSizeSelectorProps) {
  const hasSizes = sizes && sizes.length > 0;

  return (
    <div>
      {/* Size row — label on left, informational badges on right */}
      {hasSizes && (
        <div className="flex items-start gap-0 py-3.5 border-b border-line">
          {!hideLabel && (
            <div className="w-[110px] shrink-0 text-sm text-ink-muted">
              <span>Supported</span>
              <span className="block text-[11px] text-ink-faint">Sizes</span>
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1.5 bg-sunken/60 rounded-lg border border-line/60 text-xs text-ink-body select-none">
              {sizes.map((size, index) => {
                // Strip any fee annotation for static informational display
                const label = size.replace(/\s*\(\+?₱?[0-9,.]+\)/gi, '').trim();

                return (
                  <React.Fragment key={size}>
                    {index > 0 && <span className="text-ink-faint/60 text-[10px] select-none">•</span>}
                    <span className="font-medium tracking-wide">{label}</span>
                  </React.Fragment>
                );
              })}
            </div>
            <p className="text-[11px] text-ink-muted leading-tight">
              Supported sizes. Exact size, adjustments, and bespoke measurements are taken and confirmed during fitting.
            </p>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div className="flex items-center gap-2 bg-sage/10 border border-sage/20 px-3 py-2 mt-3">
          <CheckCircle2 size={16} className="text-sage shrink-0" />
          <p className="text-sm text-ink-body flex-1">Order {orderSuccess.order_number} placed.</p>
          {onViewOrder && (
            <button
              type="button"
              onClick={() => onViewOrder(orderSuccess.id)}
              className="text-xs font-semibold text-taupe shrink-0"
            >
              View
            </button>
          )}
        </div>
      )}
    </div>
  );
}

