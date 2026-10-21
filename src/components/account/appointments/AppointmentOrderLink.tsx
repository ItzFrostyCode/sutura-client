import Link from 'next/link';
import { PackageCheck } from 'lucide-react';
import type { MyJobOrder } from './appointmentTypes';

const STAGE: Record<string, string> = {
  pending: 'Being prepared', confirmed: 'Confirmed', awaiting_materials: 'Waiting for materials', queued: 'In line',
  design: 'In production', pattern_making: 'In production', mass_cutting_printing: 'In production', cutting: 'In production', sewing: 'In production',
  in_repair: 'In production', qc_ironing: 'Final check', qc_check: 'Final check', ready_for_fitting: 'Ready for fitting', final_adjustments: 'Adjusting',
  ready_for_pickup: 'Ready for pick-up', balance_handover: 'Ready for pick-up', completed: 'Handed over', on_hold: 'On hold', cancelled: 'Cancelled', rejected: 'Not accepted',
};

/** The order that came out of this visit (or that this fitting is for): its number, where it is now, and the way to follow it. */
export default function AppointmentOrderLink({ appt }: Readonly<{ appt: { kind?: string; job_order?: MyJobOrder | null } }>) {
  const job = appt.job_order;
  if (!job) return null;
  return (
    <div className="mt-4 rounded-xl border border-line bg-canvas p-3">
      <p className="mobile-overline text-taupe">{appt.kind === 'production' ? 'This is for your order' : 'Your order from this visit'}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="mobile-body-sm font-semibold text-ink">{job.order_number} · {STAGE[job.status] ?? job.status.replaceAll('_', ' ')}</p>
          {job.tracking_code && <p className="mobile-caption text-ink-muted">Tracking code <span className="select-all font-mono font-semibold text-ink-body">{job.tracking_code}</span></p>}
        </div>
        <Link href={`/account/orders/${job.id}`} className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white active:opacity-80">
          <PackageCheck size={15} /> Track
        </Link>
      </div>
    </div>
  );
}
