import Link from 'next/link';
import { CalendarClock, Loader2, Lock } from 'lucide-react';
import type { AppointmentDetailData } from './AppointmentDetailContent';

interface AppointmentDetailActionsProps {
  readonly appt: AppointmentDetailData;
  readonly canSelfCancel: boolean;
  readonly cancelling: boolean;
  readonly onCancel: () => void;
  readonly onReschedule: () => void;
}

const button = 'mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-opacity active:opacity-70';

/** What the person can do: pick a new time, book again after a cancellation, or cancel. Soft round buttons, the dark one only when it matters most. */
export default function AppointmentDetailActions({ appt, canSelfCancel, cancelling, onCancel, onReschedule }: AppointmentDetailActionsProps) {
  return (
    <>
      {appt.status === 'pending' && (
        <button type="button" onClick={onReschedule} className={`${button} ${appt.needs_new_time ? 'bg-ink text-white' : 'bg-sunken text-ink'}`}>
          <CalendarClock size={16} /> Pick a new time
        </button>
      )}

      {appt.status === 'cancelled' && (
        <>
          {appt.cancellation_reason && (
            <p className="mobile-caption mt-3 text-ink-muted"><span className="font-semibold text-ink-body">Reason from store:</span> {appt.cancellation_reason}</p>
          )}
          {appt.rebooking_blocked ? (
            <div className={`${button} cursor-not-allowed bg-sunken font-normal text-ink-faint`}><Lock size={16} /> Rebooking unavailable — contact the store</div>
          ) : appt.store?.slug ? (
            <Link href={`/store/${appt.store.slug}/book`} className={`${button} bg-sunken text-taupe`}>Book a new appointment</Link>
          ) : null}
        </>
      )}

      {canSelfCancel && (
        <button type="button" onClick={onCancel} disabled={cancelling} className={`${button} bg-danger/10 text-danger disabled:opacity-50`}>
          {cancelling && <Loader2 size={16} className="animate-spin" />}
          Cancel this appointment
        </button>
      )}
    </>
  );
}
