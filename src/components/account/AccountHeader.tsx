'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface AccountHeaderProps {
  readonly title: string;
  readonly backHref: string;
}

// The one back-arrow + title row every /account/* sub-page (except the Me hub itself, which has the SUTURA row) uses: it sticks to the
// top and sits where the hub's SUTURA row sits, so every screen of the profile has the same margins. Hidden at md+ — that's where
// AccountLayout's persistent sidebar takes over as the section's real navigation, making this back-arrow redundant.
export default function AccountHeader({ title, backHref }: AccountHeaderProps) {
  const router = useRouter();
  // Settings is a hierarchy (profile → settings → one setting), and leaving it for /location or the map and coming back leaves those
  // screens in the browser history, so a history "back" from Settings landed on them instead of the profile. Under /account/settings
  // Back always goes to the parent screen.
  const parentOnly = usePathname().startsWith('/account/settings');

  // A "literal" back — return to wherever the user actually came from
  // (e.g. a notification thread, a search result) instead of always
  // force-landing on this page's own canonical parent. `backHref` is only
  // the fallback for when there's genuinely no app history to go back to
  // (page opened directly via URL/refresh/new tab).
  const handleBack = () => {
    if (!parentOnly && typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(backHref);
    }
  };

  // Same place as the SUTURA row of the profile page (16px from the top, a 32px row, 8px under it), so the first card starts at the same
  // height and with the same side margins whichever screen of the profile is open. The 44px tap area is drawn outside the 32px row.
  return (
    <div className="sticky top-0 z-40 -mt-4 bg-canvas pb-2 pt-4 md:hidden">
      <div className="flex h-8 items-center gap-1">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className="relative -ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink transition-colors before:absolute before:-inset-2 hover:bg-sunken active:bg-sunken"
        >
          <ChevronLeft size={26} />
        </button>
        <h1 className="mobile-h4 min-w-0 truncate text-ink">{title}</h1>
      </div>
    </div>
  );
}
