'use client';

import React from 'react';
import Link from 'next/link';

interface CatalogBottomActionBarProps {
  bookHref: string;
  storeSlug?: string;
  /** @deprecated Shop button removed from mobile bars */
  showShop?: boolean;
}

export default function CatalogBottomActionBar({
  bookHref,
}: CatalogBottomActionBarProps) {
  return (
    <div
      className="min-[600px]:hidden sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-line shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-14">
        <Link
          href={bookHref}
          className="flex-1 flex items-center justify-center text-sm font-bold text-white bg-taupe hover:bg-ink transition-colors text-center"
        >
          Book an Appointment
        </Link>
      </div>
    </div>
  );
}

