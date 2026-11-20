import Link from 'next/link';
import { Loader2, Lock } from 'lucide-react';
import type { AppointmentDetailData } from './AppointmentDetailContent';

interface AppointmentDetailActionsProps {
  readonly appt: AppointmentDetailData;
  readonly canSelfCancel: boolean;
  readonly cancelling: boolean;
  readonly onCancel: () => void;
}

const button = 'mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-opacity active:opacity-70';

/** What the person can do: book again after a cancellation, or cancel. Picking a new time lives on the tappable "When" row. */
export default function AppointmentDetailActions({ appt, canSelfCancel, cancelling, onCancel }: AppointmentDetailActionsProps) {
  return (
    <>
      {appt.status === 'cancelled' && (
        <>
          {appt.cancellation_reason && (
            <p className="mobile-caption mt-3 text-ink-muted"><span className="font-semibold text-ink-body">Reason from store:</span> {appt.cancellation_reason}</p>
          )}
          {appt.rebooking_blocked ? (
            <div className={`${button} cursor-not-allowed bg-sunken font-normal text-ink-faint`}><Lock size={16} /> Rebooking unavailable — contact the shop</div>
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
