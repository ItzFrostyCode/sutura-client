'use client';

import React from 'react';
import Link from 'next/link';

interface CatalogBottomActionBarProps {
  onOpenFind: () => void;
  bookHref: string;
  storeSlug?: string;
  orderAction?: 'bulk' | null;
  onOrder?: () => void;
  orderSubmitting?: boolean;
  /** The owner closed appointments for this design. */
}

export default function CatalogBottomActionBar({
  onOpenFind,
  bookHref,
  storeSlug,
  orderAction,
  onOrder,
  orderSubmitting,
}: CatalogBottomActionBarProps) {
  return (
    <div
      className="min-[600px]:hidden sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-line shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-14">
        {/* Left: Shop icon + Categories icon */}
        <div className="flex items-stretch border-r border-line">
          <Link
            href={storeSlug ? `/store/${storeSlug}` : '/search?tab=store'}
            className="flex flex-col items-center justify-center gap-0.5 px-3.5 text-ink-muted hover:text-taupe transition-colors"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-[10px] font-semibold">Shop</span>
          </Link>
          <button
            type="button"
            onClick={onOpenFind}
            className="flex flex-col items-center justify-center gap-0.5 px-3.5 text-ink-muted hover:text-taupe transition-colors border-l border-line"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span className="text-[10px] font-semibold">Find</span>
          </button>
        </div>

        {/* Right: Add to Cart + Book Appointment */}
        <div className="flex flex-1 items-stretch">
          <button
            type="button"
            onClick={onOpenFind}
            className="flex-1 flex items-center justify-center text-sm font-semibold text-taupe border-r border-line hover:bg-canvas transition-colors"
          >
            Add To Cart
          </button>
          {orderAction && onOrder ? (
            <button
              type="button"
              onClick={onOrder}
              disabled={orderSubmitting}
              className="flex-1 flex items-center justify-center text-sm font-bold text-white bg-taupe hover:bg-ink transition-colors disabled:opacity-60"
            >
              {orderSubmitting ? 'Placing…' : 'Bulk Order'}
            </button>
          ) : (
            <Link
              href={bookHref}
              className="flex-1 flex items-center justify-center text-sm font-bold text-white bg-taupe hover:bg-ink transition-colors text-center"
            >
              Book an Appointment
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
