'use client';

import React from 'react';
import Link from 'next/link';

interface CatalogDesktopActionButtonsProps {
  onOpenFind: () => void;
  bookHref: string;
  orderAction?: 'made_to_order' | 'bulk' | null;
  onOrder?: () => void;
  orderSubmitting?: boolean;
}

// 600px+ counterpart to CatalogBottomActionBar — same actions, placed
// inline in the product info column (below Size Selector/Accordions)
// instead of a bottom bar, so nothing floats over scrolled content once
// the two-column layout is active. Hidden below 600px (CatalogBottomActionBar
// handles that range instead).
export default function CatalogDesktopActionButtons({
  onOpenFind,
  bookHref,
  orderAction,
  onOrder,
  orderSubmitting,
}: CatalogDesktopActionButtonsProps) {
  const buttonBase = 'flex-1 h-12 min-h-[48px] rounded-none text-sm font-semibold flex items-center justify-center transition-colors whitespace-nowrap px-4';

  return (
    <div className="hidden min-[600px]:flex items-center gap-3 pt-1">
      <button
        type="button"
        onClick={onOpenFind}
        className={`${buttonBase} border border-line-strong hover:border-ink text-ink font-medium`}
      >
        Find Branch
      </button>
      {orderAction && onOrder ? (
        <button
          type="button"
          onClick={onOrder}
          disabled={orderSubmitting}
          className={`${buttonBase} bg-ink hover:bg-taupe text-white disabled:opacity-60`}
        >
          {orderSubmitting ? 'Placing order…' : orderAction === 'bulk' ? 'Bulk Order' : 'Order This Design'}
        </button>
      ) : (
        <Link href={bookHref} className={`${buttonBase} bg-ink hover:bg-taupe text-white text-center`}>
          Book a Fitting
        </Link>
      )}
    </div>
  );
}
