import React from 'react';
import Link from 'next/link';
import { Receipt, Printer, CheckCircle2, Tag } from 'lucide-react';
import { Job } from '../jobTypes';
import { ComputedFinancials } from './financialsTypes';

interface FinancialStatementSummaryProps {
  readonly job: Job;
  readonly financials: ComputedFinancials;
}

export function FinancialStatementSummary({ job, financials }: FinancialStatementSummaryProps) {
  const {
    totalAmount,
    remainingBalance,
    discountApplied,
    amountPaid,
    percentCollected,
    isDownpaymentMet,
    statusBadge,
  } = financials;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0">
            <Receipt size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">Financial Statement</h2>
            <p className="text-xs text-ink-muted">Contract balance, collections, and discounts</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
          <Link
            href={`/print/jobs/${job.id}/receipt`}
            target="_blank"
            title="Print full statement"
            className="h-8 px-2.5 rounded-lg bg-canvas hover:bg-surface border border-line text-ink-muted hover:text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Printer size={13} />
            <span className="hidden sm:inline">Print Statement</span>
          </Link>
        </div>
      </div>

      {/* Collection Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-ink-muted">Collection Progress</span>
          <span className="font-bold text-ink">{percentCollected}% Collected</span>
        </div>
        <div className="h-2 w-full bg-sunken rounded-full overflow-hidden relative">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              remainingBalance === 0 ? 'bg-emerald-600' : 'bg-taupe'
            }`}
            style={{ width: `${percentCollected}%` }}
          />
          {/* 50% Milestone Marker */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-black/15 z-10" title="50% Downpayment Threshold" />
        </div>
        <div className="flex justify-between items-center text-[10px] text-ink-faint pt-0.5">
          <span>Intake: ₱0.00</span>
          <span className={`font-semibold ${isDownpaymentMet ? 'text-emerald-700' : 'text-amber-700'}`}>
            50% DP: ₱{(totalAmount * 0.5).toFixed(2)} {isDownpaymentMet ? '✓' : '(Required)'}
          </span>
          <span>Total: ₱{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Statement Breakdown Table */}
      <div className="bg-canvas border border-line rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-ink-muted">Total Contract Price:</span>
          <span className="font-bold text-ink">₱{totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-emerald-700 font-medium flex items-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Payments Collected:
          </span>
          <span className="font-bold text-emerald-700">−₱{amountPaid.toFixed(2)}</span>
        </div>

        {discountApplied > 0 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-rose-700 font-medium flex items-center gap-1">
              <Tag size={12} className="text-rose-600" />
              Courtesy Discount:
            </span>
            <span className="font-bold text-rose-700">−₱{discountApplied.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-line-strong pt-3 flex justify-between items-baseline">
          <div>
            <span className="text-xs font-bold text-ink uppercase tracking-wider block">Remaining Balance</span>
            <span className="text-[10px] text-ink-muted">
              {remainingBalance === 0 ? 'Fully settled order' : 'Payable upon fitting or claim'}
            </span>
          </div>
          <span className={`text-xl font-black font-mono ${remainingBalance > 0 ? 'text-danger' : 'text-emerald-700'}`}>
            ₱{remainingBalance.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
