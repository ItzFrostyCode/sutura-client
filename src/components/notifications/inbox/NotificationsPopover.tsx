'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import InboxPanel from './InboxPanel';

/** The bell beside Order Tracking: tapping it drops the notifications down under it, as on Facebook. */
export default function NotificationsPopover({ unreadCount, title }: { readonly unreadCount: number; readonly title: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', esc); };
  }, [open]);

  // On the full Notifications page the bell just stays lit; the list is already the page.
  const onPage = pathname === '/notifications';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !onPage && setOpen((o) => !o)}
        aria-label={title}
        aria-expanded={open}
        title={title}
        className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors before:absolute before:-inset-2 ${open || onPage ? 'bg-taupe/15 text-taupe-dark' : 'text-espresso hover:bg-sunken'}`}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E41E3F] px-1 text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="card-soft absolute right-0 top-11 z-50 max-h-[75dvh] w-[min(400px,calc(100vw-32px))] overflow-y-auto p-3 shadow-[0_12px_40px_rgba(45,42,38,0.18)]">
          <InboxPanel compact onLeave={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
