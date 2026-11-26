import React from 'react';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import OnlineOrderLink from '@/components/service-order/OnlineOrderLink';

interface ServiceActionButtonsProps {
  /** Where "Order online" goes: the online order for this service (or the repair request for a repair-only one). */
  orderHref: string;
  /** No longer shown: ordering replaced booking on the service page (2026-11-15). Kept so callers compile. */
  bookHref?: string;
  storeHref?: string;
  /** The shop's slug: "Online Order" checks it has a GCash account first. */
  storeSlug?: string;
  /** False when the service asks for no payment before production. */
  paymentRequired?: boolean;
}

const PRIMARY = 'flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-center text-base font-semibold text-white transition-opacity active:opacity-90';

/** The customer's action on a service is Order online (there is no messaging in SUTURA). 600px+: inline in the info column. */
export function ServiceInlineActions({ orderHref, storeSlug, paymentRequired }: ServiceActionButtonsProps) {
  return (
    <div className="hidden items-center gap-3 pt-4 min-[600px]:flex">
      {storeSlug ? (
        <OnlineOrderLink href={orderHref} storeSlug={storeSlug} paymentRequired={paymentRequired} className={PRIMARY}>
          <ShoppingBag size={18} className="shrink-0" aria-hidden />
          Order online
        </OnlineOrderLink>
      ) : (
        <Link href={orderHref} className={PRIMARY}>
          <ShoppingBag size={18} className="shrink-0" aria-hidden />
          Order online
        </Link>
      )}
    </div>
  );
}

// Below 600px: the same action docked at the bottom.
export function ServiceBottomBar({ orderHref, storeSlug, paymentRequired }: ServiceActionButtonsProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 shrink-0 border-t border-line bg-surface px-4 py-2.5 min-[600px]:hidden"
      style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
      <div className="flex items-center gap-3">
        {storeSlug ? (
          <OnlineOrderLink href={orderHref} storeSlug={storeSlug} paymentRequired={paymentRequired} className={PRIMARY}>
            <ShoppingBag size={18} className="shrink-0" aria-hidden />
            Order online
          </OnlineOrderLink>
        ) : (
          <Link href={orderHref} className={PRIMARY}>
            <ShoppingBag size={18} className="shrink-0" aria-hidden />
            Order online
          </Link>
        )}
        </div>
    </div>
  );
}
