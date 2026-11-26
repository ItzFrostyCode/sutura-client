import React from 'react';
import Link from 'next/link';
import type { StaffFitting } from './useStaffOverview';

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const STATUS: Record<string, string> = { pending: 'Pending', confirmed: 'Pending', in_progress: 'In progress' };

// Upcoming fitting sessions, soonest first.
export default function StaffFittings({ fittings }: Readonly<{ fittings: StaffFitting[] }>) {
  return (
    <section className="bg-surface border border-line" aria-label="Upcoming fittings">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
        <h2 className="mobile-h4 font-semibold text-ink">Upcoming fittings</h2>
        <Link href="/dashboard/appointments" className="text-xs font-semibold text-taupe min-h-11 flex items-center">All appointments</Link>
      </div>
      {fittings.length === 0 ? (
        <p className="px-4 py-6 text-sm text-ink-muted">No fittings scheduled.</p>
      ) : (
        <ul className="divide-y divide-line">
          {fittings.map((f) => (
            <li key={f.id} className="flex items-center gap-3 px-4 py-3 min-h-14">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{f.customer ?? 'Customer'}{f.order_number ? ` · ${f.order_number}` : ''}</p>
                <p className="text-xs text-ink-muted truncate">{when(f.scheduled_at)}{f.is_mine ? ' · Assigned to me' : ''}</p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted shrink-0">{STATUS[f.status] ?? f.status}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
