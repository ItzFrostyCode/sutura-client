import type { ReactNode } from 'react';

/**
 * Full-width page for the order screens: cancels the dashboard's own padding so the content runs edge to edge,
 * on the porcelain canvas with white panels (DESIGN.md, Espresso Atelier).
 * `plain` is kept for callers that pass it; both look the same now.
 */
export default function ApplePage({ children, plain = false }: Readonly<{ children: ReactNode; plain?: boolean }>) {
  return <div className={`-m-4 min-h-[calc(100dvh-4rem)] text-ink bg-canvas`}>{children}</div>;
}

/**
 * The title row of an order screen. It sits inside the main panel, under the dashboard's own header (a screen has one
 * header, not two): the title and its actions on the porcelain canvas. `stuck` keeps it in view while the page scrolls,
 * for a long form whose buttons must stay reachable. `flush` drops the side margins when the page sets its own.
 */
export function AppleBar({ children, stuck = false, flush = false }: Readonly<{ children: ReactNode; stuck?: boolean; flush?: boolean }>) {
  return stuck ? (
    <div className="sticky top-0 z-30 flex min-h-14 flex-wrap items-center gap-3 border-b border-espresso/[0.08] bg-surface/85 px-4 py-2 backdrop-blur-xl sm:px-6">
      {children}
    </div>
  ) : (
    <div className={`flex min-h-14 flex-wrap items-center gap-3 pt-5 sm:pt-7 ${flush ? '' : 'px-4 sm:px-6'}`}>
      {children}
    </div>
  );
}
