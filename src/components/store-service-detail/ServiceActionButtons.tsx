import React from 'react';
import Link from 'next/link';
import { MessageCircle, CalendarDays, ShoppingCart } from 'lucide-react';

interface ServiceActionButtonsProps {
  orderHref: string;
  bookHref: string;
  messageHref?: string | null;
}

// 600px+: the inline pair in the info column — "Online Order" (the primary
// path, opens the service-order wizard) next to "Book Appointment", with the
// optional message icon.
export function ServiceInlineActions({
  orderHref,
  bookHref,
  messageHref,
}: ServiceActionButtonsProps) {
  return (
    <div className="hidden min-[600px]:flex items-center gap-3 pt-4">
      <Link
        href={orderHref}
        className="flex-1 h-12 flex items-center justify-center gap-2 bg-taupe hover:bg-ink text-white text-sm font-semibold transition-colors text-center px-4 rounded-xl cursor-pointer shadow-xs"
      >
        <ShoppingCart size={18} className="shrink-0" />
        Online Order
      </Link>
      <Link
        href={bookHref}
        className="flex-1 h-12 flex items-center justify-center gap-2 border border-line text-ink hover:border-taupe hover:text-taupe text-sm font-semibold transition-colors text-center px-4 rounded-xl cursor-pointer"
      >
        <CalendarDays size={18} className="shrink-0" />
        Book Appointment
      </Link>
      {messageHref && (
        <a
          href={messageHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Message the shop"
          title="Message the shop"
          className="w-12 h-12 flex items-center justify-center border border-line hover:border-taupe text-ink-muted hover:text-taupe rounded-xl transition-colors shrink-0"
        >
          <MessageCircle size={20} />
        </a>
      )}
    </div>
  );
}

// Below 600px: the sticky bottom bar (Online Order + Book Appointment,
// optional Message icon on the first row).
export function ServiceBottomBar({
  orderHref,
  bookHref,
  messageHref,
}: ServiceActionButtonsProps) {
  return (
    <div
      className="min-[600px]:hidden sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-line shrink-0 px-4 py-2.5"
      style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={orderHref}
            className="flex-1 h-12 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-taupe hover:bg-ink transition-colors text-center px-4 rounded-xl cursor-pointer shadow-xs"
          >
            <ShoppingCart size={18} className="shrink-0" />
            Online Order
          </Link>
          {messageHref && (
            <a
              href={messageHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message the shop"
              title="Message the shop"
              className="w-12 h-12 flex items-center justify-center border border-line bg-white hover:bg-canvas text-ink-muted hover:text-taupe rounded-xl transition-colors shrink-0"
            >
              <MessageCircle size={20} />
            </a>
          )}
        </div>
        <Link
          href={bookHref}
          className="w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold text-ink hover:text-taupe border border-line bg-white transition-colors text-center px-4 rounded-xl cursor-pointer"
        >
          <CalendarDays size={18} className="shrink-0" />
          Book Appointment
        </Link>
      </div>
    </div>
  );
}

