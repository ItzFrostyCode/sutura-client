import Link from 'next/link';
import Image from 'next/image';
import {
  List as ListIcon, Calendar as CalendarIcon,
  Info, CalendarDays, Lock, ChevronRight, Store,
} from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import {
  type MyAppointment,
  type CalendarCell,
  STATUS_META,
  TYPE_LABELS,
  WEEKDAYS,
} from './accountTypes';

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
  return (
    <div className="bg-surface border border-line p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <h2 className="mobile-h3 font-semibold text-ink">My Appointments</h2>
        <div className="flex bg-sunken border border-line p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => setApptView('list')}
            aria-label="List view"
            className={`w-9 h-8 flex items-center justify-center transition-colors ${
              apptView === 'list' ? 'bg-surface border border-line text-ink' : 'text-ink-muted'
            }`}
          >
            <ListIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => setApptView('calendar')}
            aria-label="Calendar view"
            className={`w-9 h-8 flex items-center justify-center transition-colors ${
              apptView === 'calendar' ? 'bg-surface border border-line text-ink' : 'text-ink-muted'
            }`}
          >
            <CalendarIcon size={16} />
          </button>
        </div>
      </div>

      {hasActiveAppointment && (
        <div className="flex items-start gap-2 bg-sunken border border-line px-3 py-2.5 mb-3">
          <Info size={16} className="text-ink-muted shrink-0 mt-0.5" />
          <p className="mobile-caption text-ink-body leading-relaxed font-normal">
            One active appointment per store at a time — cancel it first to book a different date.
          </p>
        </div>
      )}

      {appointments === null && <p className="mobile-body-sm text-ink-muted py-2 font-normal">Loading…</p>}

      {appointments !== null && appointments.length === 0 && (
        <p className="mobile-body-sm text-ink-muted py-2 font-normal">No appointments yet.</p>
      )}

      {appointments !== null && appointments.length > 0 && apptView === 'list' && previewAppt && (() => {
        const meta = STATUS_META[previewAppt.status] ?? STATUS_META.pending;
        const StatusIcon = meta.Icon;
        const scheduled = new Date(previewAppt.scheduled_at);
        return (
          <div className="border border-line p-3.5 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="relative w-7 h-7 shrink-0 rounded-full overflow-hidden bg-sunken border border-line">
                {previewAppt.store?.logo_path ? (
                  <Image
                    src={getMediaUrl(previewAppt.store.logo_path)}
                    alt=""
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink-faint">
                    <Store size={12} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                <span className="mobile-caption font-medium text-ink-muted truncate">
                  {previewAppt.store?.name ?? 'Store'}
                </span>
                <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${meta.tone}`}>
                  <StatusIcon size={12} /> {meta.label}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="mobile-caption font-medium bg-sunken text-ink-muted rounded-full px-2 py-0.5">
                {TYPE_LABELS[previewAppt.appointment_type] ?? previewAppt.appointment_type}
              </span>
              {previewAppt.intake_channel === 'walk_in' && (
                <span className="text-[10px] font-semibold bg-surface text-ink-muted border border-line rounded-full px-2 py-0.5">
                  WALK-IN
                </span>
              )}
            </div>
            <h4 className="mobile-h4 font-semibold text-ink mb-1">
              {previewAppt.service_name ?? (TYPE_LABELS[previewAppt.appointment_type] ?? previewAppt.appointment_type)}
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 mobile-caption text-ink-muted font-normal">
              <span className="flex items-center gap-1">
                <CalendarDays size={13} />
                {scheduled.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} · {scheduled.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
              </span>
              {previewAppt.branch && <span>{previewAppt.branch.name}</span>}
            </div>
            {previewAppt.status === 'cancelled' && (
              <div className="mt-2.5 pt-2.5 border-t border-line">
                {previewAppt.cancellation_reason && (
                  <p className="mobile-caption text-ink-muted leading-relaxed mb-1.5 font-normal">
                    <span className="font-semibold text-ink-body">Reason:</span> {previewAppt.cancellation_reason}
                  </p>
                )}
                {previewAppt.rebooking_blocked ? (
                  <div className="flex items-center gap-1.5 mobile-caption text-ink-faint font-normal">
                    <Lock size={13} /> Rebooking unavailable
                  </div>
                ) : previewAppt.store?.slug ? (
                  <Link href={`/store/${previewAppt.store.slug}/book`} className="mobile-caption font-semibold text-taupe">
                    Book a new appointment →
                  </Link>
                ) : null}
              </div>
            )}
          </div>
        );
      })()}

      {appointments !== null && appointments.length > 0 && apptView === 'calendar' && (
        <div className="border border-line overflow-hidden mb-3">
          <div className="grid grid-cols-7 bg-canvas">
            {WEEKDAYS.map((w, i) => (
              <div key={`${w}-${i}`} className="text-center text-[10px] font-semibold text-ink-faint py-1.5">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calCells.map((c) => (
              <div
                key={c.key}
                className={`h-9 flex flex-col items-center justify-center border-t border-line ${
                  c.isToday ? 'bg-amber-50/50' : c.isPast ? 'bg-canvas/40' : 'bg-surface'
                }`}
              >
                {c.num && (
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-normal ${
                    c.isToday ? 'bg-taupe text-white font-semibold' : c.isPast ? 'text-ink-faint' : 'text-ink'
                  }`}>
                    {c.num}
                  </span>
                )}
                {c.hasAppt && <span className="w-1.5 h-1.5 rounded-full bg-taupe mt-0.5" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {appointments !== null && appointments.length > 0 && (
        <Link
          href="/account/appointments"
          className="btn-secondary-mobile w-full bg-sunken border border-line text-ink hover:bg-line transition-colors"
        >
          See all appointments <ChevronRight size={16} className="text-taupe" />
        </Link>
      )}
    </div>
  );
}
