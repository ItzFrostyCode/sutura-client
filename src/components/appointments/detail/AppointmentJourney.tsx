import Link from 'next/link';
import { Check } from 'lucide-react';
import type { Appointment } from '../appointmentHelpers';
import { CARD } from './StepCard';

const STEPS = ['Request', 'Approved', 'Visit', 'Job order'] as const;
/** A walk-in has no request and nothing to approve: its path starts at the visit. */
const WALK_IN_FROM = 2;

/** Which step the appointment is on (0–3), and whether the path ended early. */
function where(apt: Appointment): { at: number; ended: string | null; done: boolean } {
  switch (apt.status) {
    case 'pending': return { at: 0, ended: null, done: false };
    case 'confirmed': return { at: 1, ended: null, done: false };
    case 'in_progress': return { at: 2, ended: null, done: false };
    case 'completed': return apt.job_order_id ? { at: 3, ended: null, done: true } : { at: 2, ended: null, done: true };
    case 'rejected': return { at: 0, ended: 'The shop declined this request.', done: false };
    case 'cancelled': return { at: 1, ended: 'This booking was cancelled.', done: false };
    default: return { at: 2, ended: 'The customer did not come.', done: false };
  }
}

/** One plain sentence: what is true now and what to do. */
function sentence(apt: Appointment): string {
  const job = apt.job_order?.order_number ? `#${apt.job_order.order_number}` : 'the job order';
  switch (apt.status) {
    case 'pending': return 'Approve or decline this request. The customer is told right away.';
    case 'confirmed': return 'When the customer arrives, tap Customer arrived. That starts the visit.';
    case 'in_progress': return 'Talk through what they want. Then tap Done: Create Job Order (the measurements are taken there), or Consultation only.';
    case 'completed': return apt.job_order_id ? `Job order ${job} was made from this visit. Production, payments and pick-up continue there.` : 'The visit is done and no job order was made. Create one when the customer decides to go ahead.';
    default: return '';
  }
}

/** The whole path in one strip: Request → Approved → Visit → Job order, with the one thing to do now. Fittings and pick-ups belong to the job order, so they say so instead. */
export default function AppointmentJourney({ apt }: Readonly<{ apt: Appointment }>) {
  if (apt.kind === 'production') {
    return (
      <p className={`${CARD} p-5 text-sm text-ink-body`}>
        This {apt.appointment_type} was made by a job order. It closes itself with the order
        {apt.job_order?.order_number && <> — <Link href={`/dashboard/jobs/${apt.job_order_id}`} className="font-semibold text-taupe hover:underline">open job order #{apt.job_order.order_number}</Link></>}.
      </p>
    );
  }
  const found = where(apt);
  const steps = apt.intake_channel === 'walk_in' ? STEPS.slice(WALK_IN_FROM) : STEPS;
  const at = Math.max(0, found.at - (STEPS.length - steps.length));
  const { ended, done } = found;
  return (
    <div className={`${CARD} p-4 sm:p-6`}>
      <ol className="mx-auto flex max-w-2xl items-center sm:px-4">
        {steps.map((label, i) => {
          const passed = i < at || (done && i <= at);
          const current = i === at && !done && !ended;
          return (
            <li key={label} className="flex min-w-0 flex-1 items-center last:flex-none">
              <span className="flex flex-col items-center gap-1">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${passed ? 'bg-espresso text-white' : current ? 'bg-espresso text-white ring-4 ring-espresso/15' : 'border border-line bg-sunken text-ink-faint'}`}>
                  {passed ? <Check size={15} /> : i + 1}
                </span>
                <span className={`text-[11px] ${current ? 'font-semibold text-ink' : passed ? 'font-medium text-ink' : 'text-ink-faint'}`}>{label}</span>
              </span>
              {i < steps.length - 1 && <span className={`mx-1 mb-5 h-0.5 flex-1 sm:mx-2 ${i < at || (done && i < at) ? 'bg-espresso' : 'bg-line'}`} />}
            </li>
          );
        })}
      </ol>
      <p className="mx-auto mt-4 max-w-xl border-t border-line pt-4 text-center text-[13px] text-ink-muted">{ended ?? sentence(apt)}</p>
    </div>
  );
}
