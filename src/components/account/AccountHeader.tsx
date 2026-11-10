'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface AccountHeaderProps {
  readonly title: string;
  readonly backHref: string;
  /** A control that belongs to the whole page (e.g. List / Calendar), on the title row's right. */
  readonly action?: ReactNode;
}

/**
 * The title row of every /account/* sub-page — the page's one H1 at every width.
 * Phone and tablet (below 1024px): sticky, with a back arrow (there is no side menu, so Back is the way up).
 * Desktop (1024px+): the side menu is the navigation, so no back arrow — just the page title, larger.
 */
export default function AccountHeader({ title, backHref, action }: AccountHeaderProps) {
  const router = useRouter();
  // Settings is a hierarchy (profile → settings → one setting), and leaving it for /location or the map and coming back leaves those
  // screens in the browser history, so a history "back" from Settings landed on them instead of the profile. Under /account/settings
  // Back always goes to the parent screen.
  const parentOnly = usePathname().startsWith('/account/settings');

  // A real back (to wherever the person came from); `backHref` only when there is no app history (opened by URL / new tab).
  const handleBack = () => {
    if (!parentOnly && typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push(backHref);
  };

  return (
    <div className="sticky top-0 z-40 -mt-4 bg-canvas pb-2 pt-4 lg:static lg:mt-0 lg:pb-5 lg:pt-0">
      <div className="flex min-h-8 items-center gap-1 lg:min-h-11">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className="relative -ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink transition-colors before:absolute before:-inset-2 hover:bg-sunken active:bg-sunken lg:hidden"
        >
          <ChevronLeft size={26} />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-base font-semibold leading-snug text-ink lg:text-[28px] lg:font-bold lg:leading-tight">{title}</h1>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
