import Link from 'next/link';
import type { ReactNode } from 'react';
import type { SHOP_STAGES } from '../jobStage';

interface BoardLaneProps {
  readonly stage: (typeof SHOP_STAGES)[number];
  readonly count: number;
  readonly visible: boolean;
  /** Shown above the order cards (e.g. appointments waiting to become orders). */
  readonly leading?: ReactNode;
  /** Offered in an empty lane when the person can start an order. */
  readonly canCreate?: boolean;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

/** One stage of the board: a tinted lane that fills the height, so an empty board still reads as a board. */
export default function BoardLane({ stage, count, visible, leading, canCreate, children, footer }: BoardLaneProps) {
  return (
    <section aria-label={stage.label} className={`${visible ? 'block' : 'hidden'} bg-sunken/50 p-3 lg:block lg:min-h-[60vh] lg:rounded-xl`}>
      <header className="mb-1 hidden items-center justify-between lg:flex">
        <h2 className="text-sm font-bold text-ink">{stage.label}</h2>
        <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${count > 0 ? 'bg-ink text-white' : 'bg-line text-ink-muted'}`}>{count}</span>
      </header>
      <p className="mb-3 hidden text-[11px] text-ink-muted lg:block">{stage.hint}</p>
      <ul className="space-y-2">
        {leading}
        {children}
        {count === 0 && !leading && (
          <li className="px-1 py-4 text-xs leading-relaxed text-ink-muted">
            {stage.empty}
            {canCreate && stage.key === 'request' && (
              <Link href="/dashboard/jobs/new" className="mt-2 block text-sm font-semibold text-taupe hover:underline">+ Start an order</Link>
            )}
          </li>
        )}
      </ul>
      {footer}
    </section>
  );
}
