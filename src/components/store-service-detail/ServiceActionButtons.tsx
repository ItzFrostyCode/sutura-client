import React from 'react';
import Link from 'next/link';
import { MessageCircle, CalendarDays } from 'lucide-react';

interface ServiceActionButtonsProps {
  bookHref: string;
  messageHref?: string | null;
}

// 600px+: the inline pair in the info column (filled "Book Appointment" + outline "Message")
export function ServiceInlineActions({
  bookHref,
  messageHref,
}: ServiceActionButtonsProps) {
  return (
    <div className="hidden min-[600px]:flex items-center gap-2.5 pt-4">
      <Link
        href={bookHref}
        className="flex-1 h-12 flex items-center justify-center gap-2 bg-taupe hover:bg-ink text-white text-sm font-semibold transition-colors text-center px-4 rounded-xl cursor-pointer shadow-xs"
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

// Below 600px: the sticky bottom bar (Book Appointment + optional Message icon)
export function ServiceBottomBar({
  bookHref,
  messageHref,
}: ServiceActionButtonsProps) {
  return (
    <div
      className="min-[600px]:hidden sticky bottom-0 left-0 right-0 z-40 bg-white border-t border-line shrink-0 px-4 py-2.5"
      style={{ paddingBottom: 'calc(10px + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-2">
        <Link
          href={bookHref}
          className="flex-1 h-12 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-taupe hover:bg-ink transition-colors text-center px-4 rounded-xl cursor-pointer shadow-xs"
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
            className="w-12 h-12 flex items-center justify-center border border-line bg-white hover:bg-canvas text-ink-muted hover:text-taupe rounded-xl transition-colors shrink-0"
          >
            <MessageCircle size={20} />
          </a>
        )}
      </div>
    </div>
  );
}

