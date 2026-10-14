import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { STATUS_META, TYPE_LABELS, type MyAppointment } from '@/components/account/hub/accountTypes';

// Appointments are booked in Davao time, whatever the phone's own clock says.
const when = new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** One upcoming appointment: what for, where, when, and whether the shop has confirmed it. */
export default function AskAppointmentRow({ appointment: a }: { readonly appointment: MyAppointment }) {
  const kind = TYPE_LABELS[a.appointment_type] ?? 'Appointment';
  const place = [a.store?.name, a.branch?.name].filter(Boolean).join(' · ');
  return (
    <li>
      <Link href={`/account/appointments/${a.id}`} className="group flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-[#F7F1EA] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-taupe">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink group-hover:text-taupe">{kind}{a.service_name ? ` · ${a.service_name}` : ''}</p>
          {place && <p className="truncate text-sm text-ink-muted">{place}</p>}
          <p className="mt-1 text-sm text-ink-body">
            <span className="font-semibold text-ink">{when.format(new Date(a.scheduled_at))}</span>
            {' · '}
            {STATUS_META[a.status]?.label ?? a.status}
          </p>
        </div>
        <ChevronRight size={18} className="shrink-0 text-ink-faint" aria-hidden="true" />
      </Link>
    </li>
  );
}
