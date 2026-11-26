'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

interface CatalogDesktopActionButtonsProps {
  orderHref: string | null;
}

/** 600px+: "Order online" for this design, inline. There is no messaging in SUTURA: ordering is the action. */
export default function CatalogDesktopActionButtons({ orderHref }: Readonly<CatalogDesktopActionButtonsProps>) {
  if (!orderHref) return null;
  return (
    <div className="hidden pt-4 min-[600px]:flex items-center gap-3">
      {orderHref && (
        <Link href={orderHref} className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-base font-semibold text-white active:opacity-90">
          <ShoppingBag size={18} className="shrink-0" aria-hidden />
          Order online
        </Link>
      )}
    </div>
  );
}
