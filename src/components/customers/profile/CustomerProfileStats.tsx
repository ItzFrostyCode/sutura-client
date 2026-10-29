import React from 'react';
import { Wallet, Scissors, CheckCircle2, CalendarDays, ArrowRight } from 'lucide-react';
import { peso } from '../customerMoney';

interface CustomerProfileStatsProps {
  readonly totalSpend: number;
  readonly activeJobsCount: number;
  readonly completedJobsCount: number;
  readonly appointmentsCount: number;
  /** What is billed across live orders. */
  readonly invoiced: number;
  /** What is still owed across live orders. */
  readonly balance: number;
  /** Jumps to the Payments tab; only wired when the viewer may collect. */
  readonly onCollect?: () => void;
}

const CARD = 'flex min-h-[96px] flex-col justify-between rounded-xl border p-3.5 sm:min-h-[104px] sm:p-4 shadow-2xs hover:border-taupe transition-colors';

/** The six counts across the top of the profile — neutral cards, the last one calls out what is still owed. */
export default function CustomerProfileStats({
  totalSpend,
  activeJobsCount,
  completedJobsCount,
  appointmentsCount,
  invoiced,
  balance,
  onCollect,
}: CustomerProfileStatsProps) {
  const due = balance > 0;
  const labelCls = 'text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-ink-muted';
  const valueCls = 'font-serif text-xl sm:text-[22px] font-medium tracking-tight text-ink tabular-nums mt-2';
  const subCls = 'text-[10px] text-ink-faint mt-1';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 gap-3.5">
      <div className={`${CARD} bg-surface border-line`}>
        <div className="flex items-center justify-between gap-2">
          <span className={labelCls}>Lifetime Spend</span>
          <Wallet size={15} className="text-ink-faint shrink-0" />
        </div>
        <div>
          <div className={valueCls}>{peso(totalSpend)}</div>
          <div className={subCls}>Total paid to date</div>
        </div>
      </div>

      <div className={`${CARD} bg-surface border-line`}>
        <div className="flex items-center justify-between gap-2">
          <span className={labelCls}>Active Jobs</span>
          <Scissors size={15} className="text-ink-faint shrink-0" />
        </div>
        <div>
          <div className={valueCls}>{activeJobsCount}</div>
          <div className={subCls}>In production line</div>
        </div>
      </div>

      <div className={`${CARD} bg-surface border-line`}>
        <div className="flex items-center justify-between gap-2">
          <span className={labelCls}>Completed</span>
          <CheckCircle2 size={15} className="text-ink-faint shrink-0" />
        </div>
        <div>
          <div className={valueCls}>{completedJobsCount}</div>
          <div className={subCls}>Settled &amp; collected</div>
        </div>
      </div>

      <div className={`${CARD} bg-surface border-line`}>
        <div className="flex items-center justify-between gap-2">
          <span className={labelCls}>Appointments</span>
          <CalendarDays size={15} className="text-ink-faint shrink-0" />
        </div>
        <div>
          <div className={valueCls}>{appointmentsCount}</div>
          <div className={subCls}>Visits logged</div>
        </div>
      </div>

      <div className={`${CARD} bg-amber-50 border-amber-200`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-amber-800">Balance Due</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${due ? 'bg-amber-100 text-amber-800' : 'bg-sage/10 text-sage'}`}>
            {due ? 'UNPAID' : 'SETTLED'}
          </span>
        </div>
        <div>
          <div className={`font-serif text-xl sm:text-[22px] font-semibold tracking-tight tabular-nums mt-2 ${due ? 'text-danger' : 'text-ink'}`}>
            {peso(balance)}
          </div>
          <div className="flex items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-amber-200/60">
            <span className="text-[10px] text-amber-800/80">Inv: {peso(invoiced)}</span>
            {due && onCollect ? (
              <button
                type="button"
                onClick={onCollect}
                className="flex items-center gap-0.5 text-[10px] font-bold text-sage cursor-pointer hover:underline"
              >
                Collect <ArrowRight size={11} />
              </button>
            ) : (
              <span className="text-[10px] text-ink-faint">All settled</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
