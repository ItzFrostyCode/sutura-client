'use client';

import React from 'react';
import Link from 'next/link';

interface CatalogDesktopActionButtonsProps {
  onOpenFind: () => void;
  bookHref: string;
  orderAction?: 'bulk' | null;
  onOrder?: () => void;
  orderSubmitting?: boolean;
  /** The owner closed appointments for this design. */
}

// 600px+ inline action buttons in the buy zone column.
// Matches mocked layout: Find a Branch (outline) | Book an Appointment (filled).
export default function CatalogDesktopActionButtons({
  onOpenFind,
  bookHref,
  orderAction,
  onOrder,
  orderSubmitting,
}: CatalogDesktopActionButtonsProps) {
  return (
    <div className="hidden min-[600px]:flex items-center gap-2 pt-4">
      {/* Find a Branch — outline button */}
      <button
        type="button"
        onClick={onOpenFind}
        className="flex-1 h-12 flex items-center justify-center gap-1.5 border border-taupe text-taupe text-xs min-[900px]:text-sm font-semibold hover:bg-taupe/5 transition-colors whitespace-nowrap px-2"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        Find a Branch
      </button>

      {/* Book an Appointment / Bulk Order — filled button */}
      {orderAction && onOrder ? (
        <button
          type="button"
          onClick={onOrder}
          disabled={orderSubmitting}
          className="flex-1 h-12 flex items-center justify-center gap-1.5 bg-taupe hover:bg-ink text-white text-xs min-[900px]:text-sm font-semibold transition-colors disabled:opacity-60 whitespace-nowrap px-2"
        >
          {orderSubmitting ? 'Placing order…' : 'Bulk Order'}
        </button>
      ) : (
        <Link
          href={bookHref}
          className="flex-1 h-12 flex items-center justify-center gap-1.5 bg-taupe hover:bg-ink text-white text-xs min-[900px]:text-sm font-semibold transition-colors text-center whitespace-nowrap px-2"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Book an Appointment
        </Link>
      )}
    </div>
  );
}
