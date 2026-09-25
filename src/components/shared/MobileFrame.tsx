'use client';

import { usePathname } from 'next/navigation';

/**
 * Breakpoint-aware layout frame:
 *
 * < 640px (Tailwind `sm`) — Mobile column: 599px max-width, centered,
 *            scrolls inside this div (same as before — the "phone preview"
 *            experience).
 *
 * ≥ 640px — Tablet/desktop web layout: full viewport width, mx-auto. Body
 *           scroll instead of div scroll so sticky headers, browser
 *           address-bar auto-hide, and scroll anchoring all work correctly.
 *
 * Deliberately matches `sm:` (640px), not the visually-close 600px this
 * comment used to claim — every other breakpoint on the site (PublicNav's
 * own header padding, `.mobile-screen-margins`) is keyed off Tailwind's
 * real `sm`/`lg` breakpoints, so a custom 600px cutover here would reopen
 * the exact 600–639px "half mobile, half tablet" mismatch this comment's
 * old wording caused.
 *
 * Skips /dashboard entirely — that shell is deliberately desktop-first.
 */
export default function MobileFrame({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard') ?? false;

  if (isDashboard) return <>{children}</>;

  if (pathname === '/map') {
    return (
      <div
        id="mobile-frame-container"
        data-mobile-frame="true"
        className="w-full h-dvh overflow-hidden bg-canvas relative flex flex-col"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      id="mobile-frame-container"
      data-mobile-frame="true"
      className="w-full min-h-dvh bg-canvas relative"
    >
      {children}
    </div>
  );
}
