'use client';

import React from 'react';
import Link from 'next/link';

interface CatalogBottomActionBarProps {
  onOpenFind: () => void;
  bookHref: string;
  /**
   * Bulk/team-roster items (min_order_qty-gated) skip the fitting and open
   * the roster sheet directly via onOrder() instead — every other item
   * (single custom pieces, which always need an in-person fitting to lock
   * down exact fabric/measurements/quantity) keeps "Book a Fitting". There
   * is deliberately no direct single-piece order shortcut here anymore —
   * one existed ('made_to_order') but nothing has set it since the catalog
   * item detail page stopped offering it, so it's removed rather than left
   * as dead, confusing optionality.
   */
  orderAction?: 'bulk' | null;
  onOrder?: () => void;
  orderSubmitting?: boolean;
}

export default function CatalogBottomActionBar({
  onOpenFind,
  bookHref,
  orderAction,
  onOrder,
  orderSubmitting,
}: CatalogBottomActionBarProps) {
  // True-mobile-only docked bar (below 600px) — 600px+ gets the same
  // actions placed inline in the right column instead (see
  // CatalogDesktopActionButtons, activates alongside the two-column
  // layout), so this never floats as a small centered card over scrolled
  // content on wider screens. True edge-to-edge (no max-width, no side
  // borders/rounding), border-top only, and a sleeker 44-46px button
  // height instead of the shared .btn-*-mobile classes' 52px (that class
  // is the right call for most primary CTAs elsewhere, just too tall for
  // this always-visible bar).
  const buttonBase = 'flex-1 h-11 min-h-[44px] rounded-none text-sm font-semibold flex items-center justify-center transition-colors whitespace-nowrap px-3';

  return (
    <div
      className="min-[600px]:hidden sticky bottom-0 left-0 right-0 z-40 bg-surface border-t border-line p-3 shrink-0"
      style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-2">
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
            {orderSubmitting ? 'Placing order…' : 'Bulk Order'}
          </button>
        ) : (
          <Link href={bookHref} className={`${buttonBase} bg-ink hover:bg-taupe text-white text-center`}>
            Book a Fitting
          </Link>
        )}
      </div>
    </div>
  );
}
