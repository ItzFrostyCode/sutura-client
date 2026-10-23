'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { BTN } from '@/components/shared/plainForm';

interface BoardLaneProps {
  readonly stage: { key: string; label: string };
  readonly count: number;
  readonly visible: boolean;
  /** Offered in an empty request lane when the user can start an order. */
  readonly canCreate?: boolean;
  /** Highlights the count when everything in the lane is waiting on the shop (the consultations). */
  readonly attention?: boolean;
  /** An empty lane that only phones show (as a tab); wide screens leave it out until it has cards. */
  readonly hideWhenEmptyOnWide?: boolean;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

/** One column of the board: a soft panel with its name and count on top, its cards scrolling inside it so the page never grows past the screen. */
export default function BoardLane({ stage, count, visible, canCreate, attention, hideWhenEmptyOnWide, children, footer }: BoardLaneProps) {
  return (
    <section aria-label={stage.label} className={`${visible ? 'flex' : 'hidden'} min-h-0 flex-col rounded-2xl border border-line bg-sunken/60 p-2.5 ${hideWhenEmptyOnWide && count === 0 ? 'lg:hidden' : 'lg:flex'} lg:h-full`}>
      <header className="flex items-center gap-2 px-1.5 pb-2.5 pt-1">
        <h2 className="truncate text-[15px] font-semibold text-ink">{stage.label}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${attention && count > 0 ? 'bg-amber-500/15 text-amber-700' : 'bg-espresso/[0.07] text-ink-muted'}`}>{count}</span>
      </header>
      <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto pb-1 pr-0.5">
        {children}
        {count === 0 && (
          <li className="rounded-xl border border-dashed border-espresso/[0.16] px-3 py-8 text-center text-[13px] text-ink-faint">
            No orders
            {stage.key === 'request' && canCreate && (
              <Link href="/dashboard/jobs/new" className={`${BTN} mt-3 w-full`}>
                <Plus size={14} />New Job Order
              </Link>
            )}
          </li>
        )}
        {footer && <li>{footer}</li>}
      </ul>
    </section>
  );
}
