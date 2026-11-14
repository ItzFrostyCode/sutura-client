'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

/** 600px+: "Order online" for this design, inline. Hidden for a design with no service to order. */
export default function CatalogDesktopActionButtons({ orderHref }: Readonly<{ orderHref: string | null }>) {
  if (!orderHref) return null;
  return (
    <div className="hidden pt-4 min-[600px]:flex">
      <Link href={orderHref} className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-ink px-4 text-base font-semibold text-white active:opacity-90">
        <ShoppingBag size={18} className="shrink-0" aria-hidden />
        Order online
      </Link>
    </div>
  );
}
