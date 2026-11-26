'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle, ShoppingBag } from 'lucide-react';

interface CatalogDesktopActionButtonsProps {
  orderHref: string | null;
  messageHref?: string | null;
}

/** 600px+: "Order online" and "Message shop" for this design, inline. */
export default function CatalogDesktopActionButtons({ orderHref, messageHref }: Readonly<CatalogDesktopActionButtonsProps>) {
  if (!orderHref && !messageHref) return null;
  return (
    <div className="hidden pt-4 min-[600px]:flex items-center gap-3">
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
  );
}
