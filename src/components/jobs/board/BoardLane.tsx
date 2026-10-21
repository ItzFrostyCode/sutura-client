'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import type { SHOP_STAGES } from '../jobStage';
import { BTN } from '@/components/shared/plainForm';

interface BoardLaneProps {
  readonly stage: (typeof SHOP_STAGES)[number];
  readonly count: number;
  readonly visible: boolean;
  /** Offered in an empty request lane when the user can start an order. */
  readonly canCreate?: boolean;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

/** One column of the board: its name and count on top, its cards scrolling inside it so the page never grows past the screen. */
export default function BoardLane({ stage, count, visible, canCreate, children, footer }: BoardLaneProps) {
  return (
    <section aria-label={stage.label} className={`${visible ? 'flex' : 'hidden'} min-h-0 flex-col lg:flex lg:h-full`}>
      <header className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <h2 className="truncate text-[15px] font-semibold text-ink">{stage.label}</h2>
        <span className="text-[13px] text-ink-muted">{count}</span>
      </header>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pb-2 pr-0.5">
        {children}
        {count === 0 && (
          <li className="rounded-xl border border-dashed border-espresso/[0.14] px-3 py-6 text-center text-[13px] text-ink-faint">
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
