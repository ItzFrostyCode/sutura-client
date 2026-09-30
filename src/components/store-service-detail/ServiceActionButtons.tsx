import React from 'react';
import Link from 'next/link';
import { MessageCircle, CalendarDays } from 'lucide-react';

interface ServiceActionButtonsProps {
  bookHref: string;
  messageHref?: string | null;
  storeHref: string;
}

// 600px+: the inline pair in the info column (outline "Message" + filled
// "Book an Appointment"), same sizes as the Catalog Design's buttons.
export function ServiceInlineActions({ bookHref, messageHref }: Omit<ServiceActionButtonsProps, 'storeHref'>) {
  return (
    <div className="hidden min-[600px]:flex items-center gap-2 pt-4">
      {messageHref && (
        <a
          href={messageHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 h-12 flex items-center justify-center gap-1.5 border border-taupe text-taupe text-xs min-[900px]:text-sm font-semibold hover:bg-taupe/5 transition-colors whitespace-nowrap px-2"
        >
          <MessageCircle size={16} className="shrink-0" /> Message the Shop
        </a>
      )}
      <Link
        href={bookHref}
        className="flex-1 h-12 flex items-center justify-center gap-1.5 bg-taupe hover:bg-ink text-white text-xs min-[900px]:text-sm font-semibold transition-colors text-center whitespace-nowrap px-2"
      >
        <CalendarDays size={16} className="shrink-0" /> Book an Appointment
      </Link>
    </div>
  );
}

// Below 600px: the sticky bottom bar (Shop · Message | Book an Appointment).
export function ServiceBottomBar({ bookHref, messageHref, storeHref }: ServiceActionButtonsProps) {
  return (
    <div
      className="min-[600px]:hidden sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-line shrink-0"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-14">
        <div className="flex items-stretch border-r border-line">
          <Link href={storeHref} className="flex flex-col items-center justify-center gap-0.5 px-3.5 text-ink-muted hover:text-taupe transition-colors">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span className="text-[10px] font-semibold">Shop</span>
          </Link>
          {messageHref && (
            <a
              href={messageHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-0.5 px-3.5 text-ink-muted hover:text-taupe transition-colors border-l border-line"
            >
              <MessageCircle size={20} />
              <span className="text-[10px] font-semibold">Message</span>
            </a>
          )}
        </div>
        <Link href={bookHref} className="flex-1 flex items-center justify-center text-sm font-bold text-white bg-taupe hover:bg-ink transition-colors text-center">
          Book an Appointment
        </Link>
      </div>
    </div>
  );
}
