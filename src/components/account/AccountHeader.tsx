'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { canGoBackInApp } from '@/lib/inAppBack';

interface AccountHeaderProps {
  readonly title: string;
  readonly backHref: string;
  /** A control that belongs to the whole page (e.g. List / Calendar), on the title row's right. */
  readonly action?: ReactNode;
  /** Keep the back arrow on desktop too: for detail pages (one order, one appointment) the side menu has no entry for. */
  readonly backOnDesktop?: boolean;
}

/**
 * The title row of every /account/* sub-page — the page's one H1 at every width.
 * Phone and tablet (below 1024px): sticky, with a back arrow (there is no side menu, so Back is the way up).
 * Desktop (1024px+): the side menu is the navigation, so no back arrow — just the page title, larger.
 * Detail pages pass `backOnDesktop`, since the side menu can't lead back to the list or notification they came from.
 */
export default function AccountHeader({ title, backHref, action, backOnDesktop = false }: AccountHeaderProps) {
  const router = useRouter();
  // Settings is a hierarchy (profile → settings → one setting), and leaving it for /location or the map and coming back leaves those
  // screens in the browser history, so a history "back" from Settings landed on them instead of the profile. Under /account/settings
  // Back always goes to the parent screen.
  const parentOnly = usePathname().startsWith('/account/settings');

  // At the top of the page the bar blends into it; once the page scrolls under it, it gets an edge (hairline + soft
  // shadow, slightly see-through) so it reads as a bar, not a stray cream band cutting across the cards.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // A real back (to wherever the person came from: the list, a notification, a shop page); `backHref` when the previous
  // page isn't a SUTURA page (opened by URL, new tab, email link), so Back never leaves the app.
  const handleBack = () => {
    if (!parentOnly && canGoBackInApp()) router.back();
    else router.push(backHref);
  };

  return (
    <div className={`sticky top-[var(--topbar-h,0px)] z-40 -mx-4 -mt-4 px-4 pb-2 pt-4 transition-[box-shadow,background-color,border-color] duration-200 min-[481px]:-mx-6 min-[481px]:px-6 min-[600px]:-mx-8 min-[600px]:px-8 md:-mx-12 md:px-12 lg:static lg:mx-0 lg:mt-0 lg:border-0 lg:bg-transparent lg:px-0 lg:pb-5 lg:pt-0 lg:shadow-none ${scrolled ? 'border-b border-line bg-canvas/90 shadow-[0_6px_16px_-10px_rgba(45,42,38,0.25)] backdrop-blur-md' : 'border-b border-transparent bg-canvas'}`}>
      <div className="flex min-h-8 items-center gap-1 lg:min-h-11">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className={`relative -ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink transition-colors before:absolute before:-inset-2 hover:bg-sunken active:bg-sunken ${backOnDesktop ? 'lg:-ml-2 lg:mr-1 lg:h-11 lg:w-11 lg:before:inset-0' : 'lg:hidden'}`}
        >
          <ChevronLeft size={26} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-ink lg:text-[28px] lg:font-bold lg:leading-tight">{title}</h1>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
