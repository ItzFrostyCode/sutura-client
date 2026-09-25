'use client';

import React from 'react';
import { CreditCard, Receipt, Store } from 'lucide-react';

interface PaymentStatsCardsProps {
  totalOutstanding: number;
  totalPendingReceipts: number;
  pendingCount: number;
  pickupBalances: number;
}

export default function PaymentStatsCards({
  totalOutstanding,
  totalPendingReceipts,
  pendingCount,
  pickupBalances,
}: PaymentStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-stretch">
      {/* Card 1: Total Outstanding */}
      <div className="bg-taupe text-white rounded-xl p-5 shadow-2xs flex flex-col justify-between h-full min-h-[125px] transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Total Outstanding</span>
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <CreditCard size={15} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black tabular-nums tracking-tight">
            ₱{totalOutstanding.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-white/70 mt-0.5">Uncollected across all active orders</p>
        </div>
      </div>

      {/* Card 2: Pending Digital Receipts */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-2xs flex flex-col justify-between h-full min-h-[125px] transition-all">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Pending Verification</span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center">
            <Receipt size={15} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black text-ink tabular-nums tracking-tight">
            ₱{totalPendingReceipts.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-ink-muted mt-0.5">{pendingCount} digital proof(s) in queue</p>
        </div>
      </div>

      {/* Card 3: Ready for Pickup Balance */}
      <div className="bg-surface border border-line rounded-xl p-5 shadow-2xs flex flex-col justify-between h-full min-h-[125px] transition-all sm:col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Pickup Stage Balances</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-800 flex items-center justify-center">
            <Store size={15} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-black text-ink tabular-nums tracking-tight">
            ₱{pickupBalances.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-ink-muted mt-0.5">Collect final payment upon handover</p>
        </div>
      </div>
    </div>
  );
}
