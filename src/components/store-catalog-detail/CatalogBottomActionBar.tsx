'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle, ShoppingBag } from 'lucide-react';

interface CatalogBottomActionBarProps {
  orderHref: string | null;
  messageHref?: string | null;
}

/** Below 600px: "Order online" and "Message shop" for this design, docked at the bottom. */
export default function CatalogBottomActionBar({ orderHref, messageHref }: Readonly<CatalogBottomActionBarProps>) {
  if (!orderHref && !messageHref) return null;
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
        {messageHref && (
          <a
            href={messageHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Message the shop about this design"
            title="Message the shop"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line text-ink-muted transition-colors hover:border-ink hover:text-ink"
          >
            <MessageCircle size={20} />
          </a>
        )}
      </div>
    </div>
  );
}
