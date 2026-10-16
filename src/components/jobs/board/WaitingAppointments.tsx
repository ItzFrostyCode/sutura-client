import Link from 'next/link';
import { CalendarCheck, ArrowRight } from 'lucide-react';
import type { Appointment } from '@/components/appointments/appointmentHelpers';
import { newOrderHref } from './newOrderHref';

const SHOWN = 4;
const when = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

/** Real appointments with no order yet, at the top of the Request lane. One tap opens the order form already filled in. */
export default function WaitingAppointments({ appointments }: Readonly<{ appointments: Appointment[] }>) {
  if (appointments.length === 0) return null;
  return (
    <li className="px-1 pb-1">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-taupe">
        <CalendarCheck size={13} /> Ready to write up · {appointments.length}
      </p>
      <ul className="divide-y divide-line">
        {appointments.slice(0, SHOWN).map((a) => (
          <li key={a.id}>
            <Link href={newOrderHref(a)} className="group flex min-h-11 items-center justify-between gap-2 py-1.5">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{a.customer.name}</span>
                <span className="block truncate text-xs text-ink-muted">{a.service?.name ?? 'No service yet'} · {when(a.scheduled_at)}</span>
              </span>
              <ArrowRight size={14} className="shrink-0 text-ink-faint group-hover:text-taupe" />
            </Link>
          </li>
        ))}
      </ul>
      {appointments.length > SHOWN && (
        <Link href="/dashboard/appointments" className="block pt-1 text-xs font-semibold text-taupe hover:underline">+ {appointments.length - SHOWN} more in Appointments</Link>
      )}
    </li>
  );
}
