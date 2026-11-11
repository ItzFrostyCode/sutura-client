import { CalendarClock, MapPin } from 'lucide-react';
import type { TrackedAppointment } from '@/components/shared/OrderTrackingView';

/** "Poblacion Branch · Main branch" — the branch's own name, and "Main branch" when it is the main one (unless the name already says so). */
function branchLabel(branch: NonNullable<TrackedAppointment['branch']>): string {
  return branch.is_main && !/\bmain\b/i.test(branch.name) ? `${branch.name} · Main branch` : branch.name;
}

const when = (iso: string) => new Date(iso).toLocaleString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/**
 * The appointments linked to an order, in the order page's side column: what it is, when, and where — the tailoring
 * shop and which of its branches (a shop can have several, so the branch alone is not enough).
 */
export default function OrderAppointmentsCard({ appointments, shopName }: { readonly appointments: TrackedAppointment[]; readonly shopName: string | null }) {
  return (
    <section aria-labelledby="order-appts-title" className="card-soft p-4">
      <h2 id="order-appts-title" className="mobile-h4 mb-3 text-ink">Related appointment{appointments.length > 1 ? 's' : ''}</h2>
      <ul className="divide-y divide-line">
        {appointments.map((appt) => (
          <li key={appt.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <CalendarClock size={18} className="mt-0.5 shrink-0 text-taupe" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="mobile-body-sm font-medium capitalize text-ink">
                  {appt.appointment_type.replace(/_/g, ' ')}
                  {appt.service_name ? <span className="normal-case"> — {appt.service_name}</span> : ''}
                </p>
                <span className="mobile-caption shrink-0 rounded-full bg-sunken px-2 py-0.5 font-semibold capitalize text-ink-muted">{appt.status.replace(/_/g, ' ')}</span>
              </div>
              <p className="mobile-caption mt-0.5 text-ink-muted">{when(appt.scheduled_at)}</p>
              {(shopName || appt.branch) && (
                <p className="mobile-caption mt-1 flex items-start gap-1 text-ink-body">
                  <MapPin size={13} className="mt-px shrink-0 text-ink-faint" aria-hidden />
                  <span className="min-w-0 break-words">
                    {shopName && <span className="font-semibold text-ink">{shopName}</span>}
                    {shopName && appt.branch ? ' · ' : ''}
                    {appt.branch && branchLabel(appt.branch)}
                  </span>
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
