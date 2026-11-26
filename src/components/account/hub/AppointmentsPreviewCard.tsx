import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { MyAppointment, HubCalendar } from './accountTypes';
import ApptViewToggle from './ApptViewToggle';
import AppointmentPreviewItem from './AppointmentPreviewItem';
import AppointmentMiniCalendar from './AppointmentMiniCalendar';

interface AppointmentsPreviewCardProps {
  appointments: MyAppointment[] | null;
  apptView: 'list' | 'calendar';
  setApptView: (view: 'list' | 'calendar') => void;
  previewAppt: MyAppointment | null;
  calendar: HubCalendar;
}

export default function AppointmentsPreviewCard({
  appointments,
  apptView,
  setApptView,
  previewAppt,
  calendar,
}: Readonly<AppointmentsPreviewCardProps>) {
  const hasAny = appointments !== null && appointments.length > 0;

  return (
    <section aria-labelledby="hub-appts-title" className="card-soft p-4">
      <div className="flex items-center justify-between">
        <h2 id="hub-appts-title" className="mobile-h4 text-ink">My Appointments</h2>
        <ApptViewToggle view={apptView} onChange={setApptView} />
      </div>

      {appointments === null && <p className="mobile-body-sm py-3 text-ink-muted">Loading…</p>}
      {appointments !== null && appointments.length === 0 && <p className="mobile-body-sm py-3 text-ink-muted">No appointments yet.</p>}

      {hasAny && apptView === 'list' && previewAppt && <AppointmentPreviewItem appt={previewAppt} />}
      {hasAny && apptView === 'calendar' && <AppointmentMiniCalendar calendar={calendar} />}

      {hasAny && (
        <Link href="/account/appointments" className="mt-3 flex h-12 items-center justify-between rounded-2xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-sunken active:opacity-70">
          See all appointments <ChevronRight size={18} className="text-ink-faint" />
        </Link>
      )}
    </section>
  );
}
