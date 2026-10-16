import React from 'react';
import Link from 'next/link';
import { Sparkles, Scissors, Calendar, ChevronRight, HandCoins, MessageSquare, Printer } from 'lucide-react';
import type { CustomerTabType } from '../profile/CustomerTabNav';
import { peso } from '../customerMoney';

interface CustomerQuickActionsCardProps {
  readonly customerId?: number;
  /** What the customer owes across live orders. */
  readonly balance?: number;
  readonly canCollect?: boolean;
  readonly canText?: boolean;
  readonly onOpenTab: (tab: CustomerTabType) => void;
}

const ROW = 'w-full flex items-center justify-between p-3 rounded-xl bg-canvas hover:bg-surface border border-line text-xs font-semibold text-ink transition-colors shadow-2xs group cursor-pointer text-left';

/** One-tap jumps into the other parts of the shop, each already knowing who the customer is. */
export default function CustomerQuickActionsCard({ customerId, balance = 0, canCollect = false, canText = false, onOpenTab }: CustomerQuickActionsCardProps) {
  const chevron = <ChevronRight size={13} className="text-ink-muted group-hover:text-taupe transition-colors" />;
  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center gap-3 border-b border-line pb-4 min-h-12">
        <div className="w-8 h-8 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0 shadow-2xs"><Sparkles size={15} /></div>
        <h4 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">Quick Actions</h4>
      </div>
      <div className="space-y-2.5">
        <Link href={`/dashboard/jobs/new?customer_id=${customerId}`} className={ROW}>
          <span className="flex items-center gap-2.5"><Scissors size={14} className="text-taupe" /> New order</span>{chevron}
        </Link>
        <Link href={`/dashboard/appointments?customer_id=${customerId}`} className={ROW}>
          <span className="flex items-center gap-2.5"><Calendar size={14} className="text-taupe" /> Book an appointment</span>{chevron}
        </Link>
        {canCollect && balance > 0 && (
          <button type="button" onClick={() => onOpenTab('payments')} className={ROW}>
            <span className="flex items-center gap-2.5"><HandCoins size={14} className="text-taupe" /> Collect payment <span className="font-bold text-danger">{peso(balance)}</span></span>{chevron}
          </button>
        )}
        {canText && (
          <button type="button" onClick={() => onOpenTab('texts')} className={ROW}>
            <span className="flex items-center gap-2.5"><MessageSquare size={14} className="text-taupe" /> Send a text</span>{chevron}
          </button>
        )}
        <Link href={`/print/customers/${customerId}/statement`} target="_blank" className={ROW}>
          <span className="flex items-center gap-2.5"><Printer size={14} className="text-taupe" /> Print statement</span>{chevron}
        </Link>
      </div>
    </div>
  );
}
