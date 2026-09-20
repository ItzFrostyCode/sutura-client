'use client';

import { usePathname } from 'next/navigation';

/**
 * Dev-time mobile preview frame — forces every non-dashboard page into a
 * real 320px column, centered, on any screen (desktop included), so the
 * mobile-first redesign can be reviewed without opening DevTools' device
 * toolbar every time.
 *
 * There is no bottom tab bar anymore — Home/Map/Notification/Me all moved
 * into PublicNav's header + hamburger menu (per explicit direction), so
 * this frame is just a scroll region now, no flex-shell split needed.
 *
 * Full-screen overlays elsewhere in the app (the /search filter panel, the
 * location picker, PublicNav's own menu panel) use plain `fixed inset-0`
 * (or `fixed` with a partial offset, like the menu panel) — WITHOUT a
 * `transform` on some ancestor to redirect their containing block, `fixed`
 * binds to the real browser viewport, not this 320px column, and stretches
 * edge-to-edge on a real desktop/tablet window. `transform: translateZ(0)`
 * here creates that containing block for exactly those descendants.
 *
 * Skips /dashboard entirely — that shell is deliberately desktop-first
 * (the shop floor, not a phone in a customer's hand) and would just break
 * inside a 320px column.
 *
 * Remove this component (and its one usage in layout.tsx) once the mobile
 * redesign is done and the site should go back to responding to the
 * visitor's real viewport instead of a forced preview width.
 */
export default function MobileFrame({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard') ?? false;

  if (isDashboard) return <>{children}</>;

  return (
    <div
      id="mobile-frame-container"
      data-mobile-frame="true"
      className="mx-auto h-dvh w-full max-w-[320px] overflow-x-hidden overflow-y-auto bg-canvas shadow-2xl border-x border-line relative"
    >
      {children}
    </div>
  );
}
