'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface CatalogSizeSelectorProps {
  sizes: string[] | null | undefined;
  selectedSize: string;
  onSelectSize: (size: string) => void;
  orderSuccess: { order_number: string; id: number } | null;
  onViewOrder: (id: number) => void;
}

export default function CatalogSizeSelector({
  sizes,
  selectedSize,
  onSelectSize,
  orderSuccess,
  onViewOrder,
}: CatalogSizeSelectorProps) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-serif font-semibold text-taupe-dark">
          {selectedSize ? `Reference Size: ${selectedSize}` : 'Available Sizing'}
        </h3>
      </div>

      {sizes && sizes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sizes.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => onSelectSize(selectedSize === size ? '' : size)}
              className={`px-4 py-2 rounded-none border text-sm font-semibold transition-all ${
                selectedSize === size
                  ? 'border-ink bg-ink text-white'
                  : 'border-line-strong text-ink-body hover:border-taupe'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      )}

      {/* Always shown now, not just when there are no pre-made sizes —
          every item here still books a fitting regardless of whether it
          has reference sizes, so this reassurance applies to both cases. */}
      <p className={`text-xs text-ink-muted ${sizes && sizes.length > 0 ? 'mt-2' : ''}`}>
        Custom tailored to your bespoke measurements during fitting.
      </p>

      {orderSuccess && (
        <div className="flex items-center gap-2 bg-sage/10 border border-sage/20 rounded-none px-3 py-2 mt-3">
          <CheckCircle2 size={16} className="text-sage shrink-0" />
          <p className="text-sm text-ink-body flex-1">Order {orderSuccess.order_number} placed.</p>
          <button
            type="button"
            onClick={() => onViewOrder(orderSuccess.id)}
            className="text-xs font-semibold text-taupe shrink-0"
          >
            View
          </button>
        </div>
      )}
    </div>
  );
}
