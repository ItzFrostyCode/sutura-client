import React from 'react';
import Link from 'next/link';
import { MessageCircle, ShoppingBag } from 'lucide-react';

interface ServiceActionButtonsProps {
  /** Where "Order online" goes: the online order for this service (or the repair request for a repair-only one). */
  orderHref: string;
  /** No longer shown: ordering replaced booking on the service page (2026-11-15). Kept so callers compile. */
  bookHref?: string;
  messageHref?: string | null;
}

const PRIMARY = 'flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-center text-base font-semibold text-white transition-opacity active:opacity-90';
const MESSAGE = 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line text-ink-muted transition-colors hover:border-ink hover:text-ink';

function MessageButton({ href }: Readonly<{ href: string }>) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Message the shop" title="Message the shop" className={MESSAGE}>
      <MessageCircle size={20} />
    </a>
  );
}

/** The customer's action on a service is Order online. 600px+: inline in the info column. */
export function ServiceInlineActions({ orderHref, messageHref }: ServiceActionButtonsProps) {
  return (
    <div className="hidden items-center gap-3 pt-4 min-[600px]:flex">
      <Link href={orderHref} className={PRIMARY}>
        <ShoppingBag size={18} className="shrink-0" aria-hidden />
        Order online
      </Link>
      {messageHref && <MessageButton href={messageHref} />}
    </div>
  );
}

// Below 600px: the same action docked at the bottom.
export function ServiceBottomBar({ orderHref, messageHref }: ServiceActionButtonsProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 shrink-0 border-t border-line bg-surface px-4 py-2.5 min-[600px]:hidden"
      style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}>
      <div className="flex items-center gap-3">
        <Link href={orderHref} className={PRIMARY}>
          <ShoppingBag size={18} className="shrink-0" aria-hidden />
          Order online
        </Link>
        {messageHref && <MessageButton href={messageHref} />}
      </div>
    </div>
  );
}
