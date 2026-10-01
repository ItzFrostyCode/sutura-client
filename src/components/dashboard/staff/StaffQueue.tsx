import React from 'react';
import Link from 'next/link';
import type { StaffQueueJob } from './useStaffOverview';

const STAGE: Record<string, string> = {
  design: 'Design', pattern_making: 'Pattern making', mass_cutting_printing: 'Cutting & printing', cutting: 'Cutting', sewing: 'Sewing',
  final_adjustments: 'Final adjustments', qc_ironing: 'QC / ironing', qc_check: 'QC check', in_repair: 'In repair', ready_for_fitting: 'Ready for fitting',
};
const due = (d: string | null) => (d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : 'No due date');

// "My Production Queue": the orders on the floor, mine first, urgent deadlines flagged.
export default function StaffQueue({ jobs }: Readonly<{ jobs: StaffQueueJob[] }>) {
  return (
    <section className="bg-surface border border-line" aria-label="My production queue">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
        <h2 className="mobile-h4 font-semibold text-ink">My production queue</h2>
        <Link href="/dashboard/jobs" className="text-xs font-semibold text-taupe min-h-11 flex items-center">All orders</Link>
      </div>
      {jobs.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-muted">Nothing in production right now.</p>
      ) : (
        <ul className="divide-y divide-line">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/dashboard/jobs/${j.id}`} className="flex items-center gap-3 px-4 py-3 min-h-14 hover:bg-canvas">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{j.order_number} · {j.customer ?? 'Customer'}</p>
                  <p className="text-xs text-ink-muted truncate">{j.what ? `${j.what} · ` : ''}{STAGE[j.status] ?? j.status}{j.is_mine ? ' · Mine' : ''}</p>
                </div>
                <div className="text-right shrink-0">
                  {j.urgent && <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-700">Urgent{j.is_rush ? ' · Rush' : ''}</span>}
                  <span className="text-xs text-ink-muted">{due(j.due_date)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
