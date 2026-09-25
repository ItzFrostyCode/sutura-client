'use client';

import React from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/Skeleton';
import SearchInput from '@/components/shared/SearchInput';
import { JobBalanceItem } from '../usePayments';
import { getPaymentStatusBadge } from '../paymentHelpers';

interface JobBalancesTabProps {
  balanceSearch: string;
  setBalanceSearch: (val: string) => void;
  balanceTier: 'all' | 'unpaid' | 'partial';
  setBalanceTier: (tier: 'all' | 'unpaid' | 'partial') => void;
  balancesLoading: boolean;
  displayedBalances: JobBalanceItem[];
  onSelectJobToPay: (job: JobBalanceItem) => void;
}

export default function JobBalancesTab({
  balanceSearch,
  setBalanceSearch,
  balanceTier,
  setBalanceTier,
  balancesLoading,
  displayedBalances,
  onSelectJobToPay,
}: JobBalancesTabProps) {
  return (
    <div>
      {/* Toolbar */}
      <div className="p-3 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-canvas/10">
        <SearchInput
          value={balanceSearch}
          onChange={setBalanceSearch}
          placeholder="Search order # or customer..."
          className="w-full sm:w-64 shrink-0"
        />

        <div className="flex items-center gap-1.5 shrink-0">
          {(['all', 'unpaid', 'partial'] as const).map(tier => (
            <button
              key={tier}
              type="button"
              onClick={() => setBalanceTier(tier)}
              className={`h-[34px] px-3 rounded-lg text-xs font-semibold border transition-all capitalize ${
                balanceTier === tier
                  ? 'bg-taupe text-white border-taupe shadow-xs'
                  : 'bg-canvas text-ink border-line hover:bg-sunken'
              }`}
            >
              {tier === 'all' ? 'All' : tier}
            </button>
          ))}
        </div>
      </div>

      {balancesLoading ? (
        <div className="p-4">
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : displayedBalances.length === 0 ? (
        <div className="text-center py-16 px-4">
          <CheckCircle2 size={28} className="mx-auto text-emerald-600 mb-2 opacity-80" />
          <h3 className="font-bold text-sm text-ink">No Balances Found</h3>
          <p className="text-xs text-ink-muted mt-0.5">All active job orders are paid in full.</p>
        </div>
      ) : (
        <div>
          {/* Mobile View */}
          <div className="block md:hidden divide-y divide-line">
            {displayedBalances.map(job => {
              const amountPaid = job.total_amount - job.balance - (job.discount_amount || 0);
              return (
                <div key={`mob-job-${job.id}`} className="p-3.5 space-y-2 hover:bg-canvas/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/dashboard/jobs/${job.id}`} className="font-mono text-sm font-bold text-taupe hover:underline">
                        {job.order_number}
                      </Link>
                      <p className="text-xs text-ink font-medium mt-0.5">{job.customer?.name || 'Walk-in Client'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-rose-600 tabular-nums">₱{job.balance.toFixed(2)}</p>
                      <span className="text-[10px] text-ink-faint">due</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-muted">
                    <span>Total: ₱{job.total_amount.toFixed(2)}</span>
                    <span className="text-emerald-700 font-semibold">Paid: ₱{amountPaid.toFixed(2)}</span>
                    {getPaymentStatusBadge(job.payment_status)}
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectJobToPay(job)}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg bg-taupe hover:bg-taupe-hover text-white shadow-2xs transition-colors"
                  >
                    <CreditCard size={13} /> <span>Log Payment</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-body">
              <thead className="bg-canvas/50 text-[10px] font-bold uppercase tracking-wider text-ink-faint border-b border-line">
                <tr>
                  <th className="px-4 py-2.5">Order</th>
                  <th className="px-4 py-2.5">Customer</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5 text-right">Paid</th>
                  <th className="px-4 py-2.5 text-right">Balance Due</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {displayedBalances.map(job => {
                  const amountPaid = job.total_amount - job.balance - (job.discount_amount || 0);

                  return (
                    <tr key={job.id} className="hover:bg-canvas/40 transition-colors">
                      <td className="px-4 py-3 align-middle font-mono text-xs font-bold text-taupe">
                        <Link href={`/dashboard/jobs/${job.id}`} className="hover:underline">
                          {job.order_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-middle font-medium text-xs text-ink">
                        {job.customer?.name || <span className="text-ink-faint italic font-normal">Walk-in</span>}
                      </td>
                      <td className="px-4 py-3 align-middle text-right text-xs font-medium text-ink tabular-nums">
                        ₱{job.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 align-middle text-right text-xs font-semibold text-emerald-700 tabular-nums">
                        ₱{amountPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 align-middle text-right font-bold text-xs text-rose-600 tabular-nums">
                        ₱{job.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 align-middle text-center">
                        {getPaymentStatusBadge(job.payment_status)}
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <button
                          type="button"
                          onClick={() => onSelectJobToPay(job)}
                          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-taupe hover:bg-taupe-hover text-white shadow-2xs transition-colors"
                        >
                          <CreditCard size={12} /> <span>Log Pay</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
