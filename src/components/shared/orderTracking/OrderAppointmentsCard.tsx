import { CalendarClock } from 'lucide-react';
import type { TrackedAppointment } from '@/components/shared/OrderTrackingView';

/** The appointments linked to an order, as a soft side card (below the order on a phone, sticky beside it from 768px). */
export default function OrderAppointmentsCard({ appointments }: { readonly appointments: TrackedAppointment[] }) {
  return (
    <div className="card-soft mt-3 p-4 md:sticky md:top-4 md:col-span-2 md:mt-0">
      <h4 className="mobile-overline mb-2 text-ink-faint">Related appointment{appointments.length > 1 ? 's' : ''}</h4>
      <div className="space-y-3">
        {appointments.map((appt) => (
          <div key={appt.id} className="flex items-center gap-3">
            <CalendarClock size={18} className="shrink-0 text-taupe" />
            <div className="min-w-0 flex-1">
              <p className="mobile-body-sm capitalize text-ink">
                {appt.appointment_type}
                {appt.service_name ? ` — ${appt.service_name}` : ''}
              </p>
              <p className="mobile-caption text-ink-muted">
                {new Date(appt.scheduled_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                {appt.branch?.name ? ` · ${appt.branch.name}` : ''}
              </p>
            </div>
            <span className="mobile-caption shrink-0 capitalize text-ink-muted">{appt.status.replace(/_/g, ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
