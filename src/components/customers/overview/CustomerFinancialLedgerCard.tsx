import React from 'react';
import { Wallet, Banknote, ShieldCheck } from 'lucide-react';
import { CustomerData, JobOrder } from '../customerTypes';
import { moneySummary, peso } from '../customerMoney';

interface CustomerFinancialLedgerCardProps {
  readonly customer: CustomerData | null;
  readonly jobs: JobOrder[];
  readonly canCollect?: boolean;
  readonly onCollect: () => void;
}

/** Where this client stands on money: invoiced vs settled vs still owed, with a jump to the Payments tab. */
export default function CustomerFinancialLedgerCard({ customer, jobs, canCollect = false, onCollect }: CustomerFinancialLedgerCardProps) {
  const { billed, paid, balance } = moneySummary(jobs);
  const verifiedPayments = jobs.flatMap((j) => j.payments ?? []).filter((p) => p.verified_at).length;

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sunken flex items-center justify-center text-ink-muted shrink-0">
            <Wallet size={15} />
          </div>
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink">Financial Summary &amp; Ledger</h3>
            <p className="text-xs text-ink-muted">Balance and settlement across this client&apos;s job orders</p>
          </div>
        </div>
        {balance > 0 && (
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
            Balance Due
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-canvas border border-line">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-faint">Total Invoiced</span>
          <div className="font-serif text-xl font-semibold text-ink mt-0.5 tabular-nums">{peso(billed)}</div>
          <span className="text-[10px] text-ink-faint">Across {jobs.length} job order{jobs.length === 1 ? '' : 's'}</span>
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-faint">Total Settled (Paid)</span>
          <div className={`font-serif text-xl font-semibold mt-0.5 tabular-nums ${paid > 0 ? 'text-sage' : 'text-ink'}`}>
            {paid > 0 ? `-${peso(paid)}` : peso(0)}
          </div>
          <span className="text-[10px] text-ink-faint">{verifiedPayments > 0 ? `${verifiedPayments} verified payment${verifiedPayments === 1 ? '' : 's'} on record` : 'No verified payments yet'}</span>
        </div>
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-faint">Remaining Balance</span>
          <div className={`font-serif text-2xl font-bold mt-0.5 tabular-nums ${balance > 0 ? 'text-danger' : 'text-ink'}`}>{peso(balance)}</div>
          <span className="text-[10px] text-ink-faint">{customer?.is_trusted ? 'Deposit waived (Trusted client)' : 'Outstanding across live orders'}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {customer?.is_trusted ? (
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <ShieldCheck size={15} className="text-sage" />
            <span>Trusted customer — new orders start with no deposit</span>
          </div>
        ) : (
          <div className="text-xs text-ink-faint">
            {balance > 0 ? 'Balance is collected before handover' : 'All live orders are settled'}
          </div>
        )}
        {balance > 0 && canCollect && (
          <button
            type="button"
            onClick={onCollect}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-espresso text-white text-xs font-bold shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
          >
            <Banknote size={15} /> Receive Payment Now
          </button>
        )}
      </div>
    </div>
  );
}
