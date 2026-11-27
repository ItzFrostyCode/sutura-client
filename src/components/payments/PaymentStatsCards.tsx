'use client';

import React from 'react';
import { CreditCard, Receipt, Store } from 'lucide-react';

interface PaymentStatsCardsProps {
  totalOutstanding: number;
  /** Balances on orders still waiting for the shop's approval (not owed yet). */
  pendingApproval?: { amount: number; count: number };
  totalPendingReceipts: number;
  pendingCount: number;
  pickupBalances: number;
}

export default function PaymentStatsCards({
  totalOutstanding,
  pendingApproval,
  totalPendingReceipts,
  pendingCount,
  pickupBalances,
}: PaymentStatsCardsProps) {
  const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  // Apple-style summary: three calm white cards, the same shape; the colour lives only in the small round icon.
  const card = 'flex h-full min-h-[128px] flex-col rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(45,42,38,0.04),0_8px_24px_rgba(45,42,38,0.05)]';
  const label = 'text-[13px] font-medium text-ink-muted';
  const value = 'mt-3 text-[28px] font-semibold leading-none tracking-tight text-ink tabular-nums';
  const note = 'mt-1.5 text-xs text-ink-muted';

  return (
    <div className="grid grid-cols-1 items-stretch gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      <div className={card}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-taupe/12 text-taupe-dark"><CreditCard size={16} aria-hidden /></span>
          <span className={label}>Total outstanding</span>
        </div>
        <p className={value}>{peso(totalOutstanding)}</p>
        <p className={note}>Still owed on accepted orders</p>
        {pendingApproval && pendingApproval.amount > 0 && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-body">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
            +{peso(pendingApproval.amount)} waiting for your approval ({pendingApproval.count} {pendingApproval.count === 1 ? 'order' : 'orders'})
          </p>
        )}
      </div>

      <div className={card}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/12 text-amber-700"><Receipt size={16} aria-hidden /></span>
          <span className={label}>Pending verification</span>
        </div>
        <p className={value}>{peso(totalPendingReceipts)}</p>
        <p className={note}>{pendingCount} GCash proof{pendingCount === 1 ? '' : 's'} to check</p>
      </div>

      <div className={`${card} sm:col-span-2 lg:col-span-1`}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-700"><Store size={16} aria-hidden /></span>
          <span className={label}>Balances at pickup</span>
        </div>
        <p className={value}>{peso(pickupBalances)}</p>
        <p className={note}>Collect the rest when the customer picks up</p>
      </div>
    </div>
  );
}
