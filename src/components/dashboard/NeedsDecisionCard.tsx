'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, X } from 'lucide-react';
import RejectAppointmentDialog from '@/components/appointments/RejectAppointmentDialog';
import { useDecisionQueue } from './useDecisionQueue';

const TYPE: Record<string, string> = { consultation: 'Consultation', measurement: 'Measurement', fitting: 'Fitting', alteration: 'Alteration', pickup: 'Pickup', other: 'Other' };
const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

// Home, top: what needs the owner's decision before anything else.
export default function NeedsDecisionCard({ storeId, enabled }: Readonly<{ storeId?: number; enabled: boolean }>) {
  const { queue, loading, busyId, approve, reject } = useDecisionQueue(storeId, enabled);
  const [rejecting, setRejecting] = useState<number | null>(null);
  const { appointments, payments, deposits } = queue;
  const proofs = payments.count + deposits.count;
  if (loading || (appointments.count === 0 && proofs === 0)) return null;

  return (
    <section className="bg-surface border border-taupe/40" aria-label="Needs your decision">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-line bg-taupe/5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink">Needs your decision</h2>
        <div className="flex gap-2 text-xs font-semibold">
          <span className="bg-ink text-white px-2.5 py-1">Appointments {appointments.count}</span>
          {proofs > 0 && <span className="bg-white border border-line-strong text-ink px-2.5 py-1">Payments to verify {proofs}</span>}
        </div>
      </div>

      {appointments.count > 0 && (
        <div>
          <p className="px-4 sm:px-5 pt-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Appointment requests</p>
          <ul className="divide-y divide-line">
            {appointments.items.map((a) => (
              <li key={a.id} className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{a.customer ?? 'Customer'}</p>
                  <p className="text-xs text-ink-muted truncate">{a.what ? `${a.what} · ` : ''}{a.appointment_type === 'other' && a.purpose_label ? `Other — ${a.purpose_label}` : (TYPE[a.appointment_type] ?? a.appointment_type)} · {when(a.scheduled_at)}{a.branch ? ` · ${a.branch}` : ''}{a.intake_channel === 'walk_in' ? ' · Walk-in' : ' · Online'}</p>
                  {a.needs_new_time && <p className="text-[11px] font-semibold text-amber-700 mt-0.5">Slot was taken — needs a new time</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => approve(a.id)} disabled={busyId === a.id} className="h-11 px-4 bg-taupe hover:bg-taupe-hover text-white text-sm font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                    {busyId === a.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
                  </button>
                  <button type="button" onClick={() => setRejecting(a.id)} disabled={busyId === a.id} className="h-11 px-4 border border-rose-200 text-rose-700 hover:bg-rose-50 text-sm font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50">
                    <X size={14} /> Reject
                  </button>
                  <Link href="/dashboard/appointments" className="h-11 px-4 border border-line-strong text-ink hover:bg-sunken text-sm font-medium flex items-center">Open</Link>
                </div>
              </li>
            ))}
          </ul>
          {appointments.count > appointments.items.length && (
            <Link href="/dashboard/appointments" className="block px-4 sm:px-5 py-3 text-xs font-semibold text-taupe hover:underline border-t border-line">
              + {appointments.count - appointments.items.length} more pending →
            </Link>
          )}
        </div>
      )}

      {deposits.count > 0 && (
        <div className="border-t border-line">
          <p className="px-4 sm:px-5 pt-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Booking deposit proofs</p>
          <ul className="divide-y divide-line">
            {deposits.items.map((d) => (
              <li key={d.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{d.customer ?? 'Customer'}</p>
                  <p className="text-xs text-ink-muted">{d.method.toUpperCase()} · appointment {when(d.scheduled_at)}</p>
                </div>
                <Link href="/dashboard/appointments" className="h-11 px-4 border border-line-strong text-ink hover:bg-sunken text-sm font-medium flex items-center shrink-0">Review</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {payments.count > 0 && (
        <div className="border-t border-line">
          <p className="px-4 sm:px-5 pt-3 text-[11px] font-bold uppercase tracking-wider text-ink-muted">Payments waiting for verification</p>
          <ul className="divide-y divide-line">
            {payments.items.map((p) => (
              <li key={p.id} className="px-4 sm:px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{p.customer ?? 'Customer'} · {p.order_number ?? `Job #${p.job_order_id}`}</p>
                  <p className="text-xs text-ink-muted">₱{p.amount.toLocaleString()} · {p.method.toUpperCase()}</p>
                </div>
                <Link href={`/dashboard/jobs/${p.job_order_id}`} className="h-11 px-4 border border-line-strong text-ink hover:bg-sunken text-sm font-medium flex items-center shrink-0">Review</Link>
              </li>
            ))}
          </ul>
          {payments.count > payments.items.length && (
            <Link href="/dashboard/payments" className="block px-4 sm:px-5 py-3 text-xs font-semibold text-taupe hover:underline border-t border-line">
              + {payments.count - payments.items.length} more →
            </Link>
          )}
        </div>
      )}

      <RejectAppointmentDialog
        isOpen={rejecting !== null}
        busy={busyId === rejecting}
        onClose={() => setRejecting(null)}
        onConfirm={async (code, note) => (rejecting !== null ? reject(rejecting, code, note) : false)}
      />
    </section>
  );
}
