'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

interface CatalogDesktopActionButtonsProps {
  bookHref: string;
}

export default function CatalogDesktopActionButtons({
  bookHref,
}: CatalogDesktopActionButtonsProps) {
  return (
    <div className="hidden min-[600px]:flex flex-col gap-2.5 pt-4">
      <Link
        href={bookHref}
        className="w-full h-12 flex items-center justify-center gap-2 bg-taupe hover:bg-ink text-white text-sm font-semibold transition-colors text-center px-4 rounded-xl cursor-pointer shadow-xs"
      >
        <Calendar size={18} className="shrink-0" />
        Book Appointment
      </Link>
    </div>
  );
}

