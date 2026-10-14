import Link from 'next/link';
import { ChevronRight, Info } from 'lucide-react';
import type { MyAppointment, CalendarCell } from './accountTypes';
import ApptViewToggle from './ApptViewToggle';
import AppointmentPreviewItem from './AppointmentPreviewItem';
import AppointmentMiniCalendar from './AppointmentMiniCalendar';

interface AppointmentsPreviewCardProps {
  appointments: MyAppointment[] | null;
  apptView: 'list' | 'calendar';
  setApptView: (view: 'list' | 'calendar') => void;
  hasActiveAppointment: boolean;
  previewAppt: MyAppointment | null;
  calCells: CalendarCell[];
}

export default function AppointmentsPreviewCard({
  appointments,
  apptView,
  setApptView,
  hasActiveAppointment,
  previewAppt,
  calCells,
}: Readonly<AppointmentsPreviewCardProps>) {
  const hasAny = appointments !== null && appointments.length > 0;

  return (
    <section aria-labelledby="hub-appts-title" className="card-soft p-4">
      <div className="flex items-center justify-between">
        <h2 id="hub-appts-title" className="mobile-h4 text-ink">My Appointments</h2>
        <ApptViewToggle view={apptView} onChange={setApptView} />
      </div>

      {hasActiveAppointment && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-sunken px-3 py-2.5">
          <Info size={16} className="mt-0.5 shrink-0 text-ink-muted" />
          <p className="mobile-caption text-ink-body">One active appointment per store at a time — cancel it first to book a different date.</p>
        </div>
      )}

      {appointments === null && <p className="mobile-body-sm py-3 text-ink-muted">Loading…</p>}
      {appointments !== null && appointments.length === 0 && <p className="mobile-body-sm py-3 text-ink-muted">No appointments yet.</p>}

      {hasAny && apptView === 'list' && previewAppt && <AppointmentPreviewItem appt={previewAppt} />}
      {hasAny && apptView === 'calendar' && <AppointmentMiniCalendar cells={calCells} />}

      {hasAny && (
        <Link href="/account/appointments" className="mt-3 flex h-12 items-center justify-between rounded-2xl bg-sunken px-4 text-sm font-semibold text-ink transition-opacity active:opacity-70">
          See all appointments <ChevronRight size={18} className="text-ink-faint" />
        </Link>
      )}
    </section>
  );
}
