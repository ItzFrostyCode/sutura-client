import Link from 'next/link';
import { AlertCircle, Info, Loader2, Lock } from 'lucide-react';
import type { MyAppointment } from './appointmentTypes';

interface AppointmentCardFooterProps {
  readonly appt: MyAppointment;
  readonly isPastDue: boolean;
  readonly canSelfCancel: boolean;
  readonly cancelling: boolean;
  readonly onCancel: (id: number) => void;
}

const notice = 'mobile-caption mt-3 flex items-start gap-2 rounded-xl bg-sunken px-3 py-2.5 text-ink-body';
const action = 'mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-opacity active:opacity-70';

/** What the status means for the person and what they can do about it: a quiet note, then at most one soft button. */
export default function AppointmentCardFooter({ appt, isPastDue, canSelfCancel, cancelling, onCancel }: AppointmentCardFooterProps) {
  return (
    <>
      {isPastDue && (
        <p className={notice}>
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-ink-muted" />
          This appointment&apos;s scheduled time has already passed with no update from the store. If you&apos;re not sure what happened, reach out to them directly.
        </p>
      )}

      {!isPastDue && appt.status === 'pending' && (
        <p className={notice}>
          <Info size={15} className="mt-0.5 shrink-0 text-ink-muted" />
          {appt.kind === 'production'
            ? 'The shop chose this time for your fitting and will confirm it with you. If it does not suit you, open it and pick another time.'
            : appt.previous_scheduled_at
            ? 'You asked to move this appointment. The shop needs to approve the new time.'
            : 'Waiting for the store to confirm. Walk-ins are seen first come, first served — arriving early improves your spot in line.'}
        </p>
      )}

      {appt.status === 'rejected' && (
        <>
          <p className="mobile-caption mt-3 text-ink-muted">
            <span className="font-semibold text-danger">Rejected</span>
            {appt.rejection_reason ? <> — {appt.rejection_reason}</> : null}
            {appt.rejection_note ? <>. {appt.rejection_note}</> : null}
          </p>
          {appt.rebooking_blocked ? (
            <div className={`${action} bg-sunken font-normal text-ink-faint`}><Lock size={14} /> Rebooking unavailable — contact the store</div>
          ) : appt.store?.slug ? (
            <Link href={`/store/${appt.store.slug}/book`} onClick={(e) => e.stopPropagation()} className={`${action} bg-sunken text-taupe`}>
              Book a new appointment
            </Link>
          ) : null}
        </>
      )}

      {appt.status === 'cancelled' && (
        <>
          {appt.cancellation_reason && (
            <p className="mobile-caption mt-3 text-ink-muted"><span className="font-semibold text-ink-body">Reason from store:</span> {appt.cancellation_reason}</p>
          )}
          {appt.rebooking_blocked ? (
            <div className={`${action} bg-sunken font-normal text-ink-faint`}><Lock size={14} /> Rebooking unavailable — contact the store</div>
          ) : appt.store?.slug ? (
            <Link href={`/store/${appt.store.slug}/book`} onClick={(e) => e.stopPropagation()} className={`${action} bg-sunken text-taupe`}>
              Book a new appointment
            </Link>
          ) : null}
        </>
      )}

      {canSelfCancel && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCancel(appt.id);
          }}
          disabled={cancelling}
          className={`${action} bg-danger/10 text-danger disabled:opacity-50`}
        >
          {cancelling && <Loader2 size={14} className="animate-spin" />}
          Cancel this appointment
        </button>
      )}
    </>
  );
}
