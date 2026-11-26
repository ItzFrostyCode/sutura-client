'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

interface CatalogBottomActionBarProps {
  orderHref: string | null;
}

/** Below 600px: "Order online" for this design, docked at the bottom. There is no messaging in SUTURA. */
export default function CatalogBottomActionBar({ orderHref }: Readonly<CatalogBottomActionBarProps>) {
  if (!orderHref) return null;
  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 shrink-0 border-t border-line bg-surface px-4 py-2.5 min-[600px]:hidden"
      style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
      <div className="flex items-center gap-3">
        {orderHref && (
          <Link href={orderHref} className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-base font-semibold text-white active:opacity-90">
            <ShoppingBag size={18} className="shrink-0" aria-hidden />
            Order online
          </Link>
        )}
      </div>
    </div>
  );
}
