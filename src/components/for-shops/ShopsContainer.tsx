import type { ReactNode } from 'react';

/**
 * The one width + side-margin every part of the shop-owner landing page uses —
 * the header, each section and the footer — so their edges line up at 320px,
 * on tablet and on desktop (16 / 24 / 32px margins, 1120px max).
 */
export default function ShopsContainer({ children, className = '' }: { readonly children: ReactNode; readonly className?: string }) {
  return <div className={`mx-auto w-full max-w-[1120px] mobile-screen-margins ${className}`}>{children}</div>;
}
