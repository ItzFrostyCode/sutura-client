import React from 'react';
import Link from 'next/link';
import { Zap, Scissors, CalendarPlus, HandCoins, MessageSquare, Printer, ChevronRight } from 'lucide-react';
import type { CustomerTabType } from '../profile/CustomerTabNav';
import { peso } from '../customerMoney';
import { printInPlace } from '@/lib/printInPlace';
import { useShopRole } from '@/hooks/useShopRole';

interface CustomerQuickActionsCardProps {
  readonly customerId?: number;
  /** What the customer owes across live orders. */
  readonly balance?: number;
  readonly canCollect?: boolean;
  readonly canText?: boolean;
  readonly onOpenTab: (tab: CustomerTabType) => void;
}

const ROW = 'group flex w-full cursor-pointer items-center justify-between rounded-xl border border-line bg-canvas p-2.5 text-[13px] font-semibold text-ink transition-all hover:border-line-strong hover:bg-sunken text-left';

/** One-tap jumps into the other parts of the shop, each already knowing who the customer is. */
export default function CustomerQuickActionsCard({ customerId, balance = 0, canCollect = false, canText = false, onOpenTab }: CustomerQuickActionsCardProps) {
  const { isOwnerOrManager } = useShopRole();
  const chevron = <ChevronRight size={16} className="text-ink-faint group-hover:text-ink transition-colors shrink-0" />;

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 shadow-2xs space-y-3">
      <div className="flex items-center gap-2.5 border-b border-line pb-2.5">
        <Zap size={16} className="text-taupe shrink-0" />
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink">Quick Actions</h3>
      </div>

      <div className="space-y-1.5">
        {isOwnerOrManager && (
          <Link href={`/dashboard/jobs/new?customer_id=${customerId}`} className={ROW}>
            <span className="flex items-center gap-2.5"><Scissors size={17} className="text-taupe" /> New Job Order</span>
            {chevron}
          </Link>
        )}
        <Link href={`/dashboard/appointments?customer_id=${customerId}`} className={ROW}>
          <span className="flex items-center gap-2.5"><CalendarPlus size={17} className="text-taupe" /> Book Appointment</span>
          {chevron}
        </Link>
        {canCollect && balance > 0 && (
          <button type="button" onClick={() => onOpenTab('payments')} className={ROW}>
            <span className="flex items-center gap-2.5"><HandCoins size={17} className="text-danger" /> Collect Payment</span>
            <span className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-red-50 text-danger text-[10px] rounded font-bold tabular-nums">{peso(balance)}</span>
              {chevron}
            </span>
          </button>
        )}
        {canText && (
          <button type="button" onClick={() => onOpenTab('texts')} className={ROW}>
            <span className="flex items-center gap-2.5"><MessageSquare size={17} className="text-taupe" /> Send Text</span>
            {chevron}
          </button>
        )}
        <button type="button" onClick={() => printInPlace(`/print/customers/${customerId}/statement`)} className={ROW}>
          <span className="flex items-center gap-2.5"><Printer size={17} className="text-taupe" /> Print Statement</span>
          {chevron}
        </button>
      </div>
    </div>
  );
}
