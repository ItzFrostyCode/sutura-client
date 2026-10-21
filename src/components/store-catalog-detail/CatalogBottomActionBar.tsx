'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface CatalogBottomActionBarProps {
  bookHref: string;
}

export default function CatalogBottomActionBar({
  bookHref,
}: CatalogBottomActionBarProps) {
  return (
    <div
      className="min-[600px]:hidden sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-line shrink-0 px-4 py-2.5"
      style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}
    >
      <Link
        href={bookHref}
        className="w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-taupe hover:bg-ink transition-colors text-center px-4 rounded-xl cursor-pointer shadow-xs"
      >
        <Calendar size={18} className="shrink-0" />
        Book Appointment
      </Link>
    </div>
  );
}

