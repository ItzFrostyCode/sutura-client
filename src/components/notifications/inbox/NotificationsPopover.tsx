'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import InboxPanel from './InboxPanel';

/** Space kept between the drop-down and the screen edges. */
const EDGE = 16;
const MAX_W = 400;

/**
 * The bell: tapping it drops the latest notifications down under it, as on Facebook — the full page only opens from
 * "See all" inside. Used on every bell (phone header, desktop header, Profile).
 * size 'sm' = the 32px phone header bell; 'md' = a 44px bell (desktop header, Profile card).
 *
 * The drop-down is placed against the SCREEN, not the bell: under the bell, lined up with its right edge where that
 * fits, but always at least 16px inside both sides (on a 320px phone it is the full width minus 16px each side) and
 * never taller than the space above the bottom bar.
 */
export default function NotificationsPopover({ unreadCount, title, size = 'sm' }: { readonly unreadCount: number; readonly title: string; readonly size?: 'sm' | 'md' }) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<CSSProperties | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', esc); };
  }, [open]);

  // Where the drop-down goes (again on resize / rotate).
  useLayoutEffect(() => {
    if (!open) return;
    const measure = () => {
      const b = btnRef.current?.getBoundingClientRect();
      if (!b) return;
      const vw = document.documentElement.clientWidth;
      const width = Math.min(MAX_W, vw - EDGE * 2);
      const left = Math.min(Math.max(b.right - width, EDGE), vw - EDGE - width);
      const top = b.bottom + 8;
      setPlace({ top, left, width, maxHeight: `calc(100dvh - ${top}px - var(--bottom-nav-space, 0px) - ${EDGE}px)` });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [open]);

  // On the full Notifications page the bell just stays lit; the list is already the page.
  const onPage = pathname === '/notifications';

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => !onPage && setOpen((o) => !o)}
        aria-label={title}
        aria-expanded={open}
        title={title}
        className={`relative flex items-center justify-center rounded-full transition-colors ${size === 'md' ? 'h-11 w-11' : 'h-8 w-8 before:absolute before:-inset-2'} ${open || onPage ? 'bg-taupe/15 text-taupe-dark' : 'text-espresso hover:bg-sunken'}`}
      >
        <Bell size={size === 'md' ? 20 : 22} />
        {unreadCount > 0 && (
          <span className={`absolute ${size === 'md' ? 'right-1 top-1' : '-right-1 -top-1'} flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E41E3F] px-1 text-[10px] font-bold text-white`}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && place && (
        <div style={place} className="card-soft fixed z-[60] overflow-y-auto p-3 shadow-[0_12px_40px_rgba(45,42,38,0.18)]">
          <InboxPanel compact onLeave={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
