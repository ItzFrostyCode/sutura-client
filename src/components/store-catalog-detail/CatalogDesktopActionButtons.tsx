'use client';

import React from 'react';
import Link from 'next/link';

interface CatalogDesktopActionButtonsProps {
  bookHref: string;
}

// 600px+ inline action buttons in the buy zone column.
export default function CatalogDesktopActionButtons({
  bookHref,
}: CatalogDesktopActionButtonsProps) {
  return (
    <div className="hidden min-[600px]:flex items-center gap-2 pt-4">
      {/* Book an Appointment — filled button */}
      <Link
        href={bookHref}
        className="w-full h-12 flex items-center justify-center gap-2 bg-taupe hover:bg-ink text-white text-xs min-[900px]:text-sm font-semibold transition-colors text-center whitespace-nowrap px-4"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Book an Appointment
      </Link>
    </div>
  );
}
