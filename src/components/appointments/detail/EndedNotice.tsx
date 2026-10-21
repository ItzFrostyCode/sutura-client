import { AlertTriangle, X } from 'lucide-react';
import type { Appointment } from '../appointmentHelpers';
import { REJECTION_REASONS, sameText } from '../appointmentHelpers';

/** Why this appointment ended without a visit: declined, cancelled, or the customer did not come. */
export default function EndedNotice({ apt }: Readonly<{ apt: Appointment }>) {
  if (!['rejected', 'cancelled', 'no_show'].includes(apt.status)) return null;
  const declined = apt.status === 'rejected';
  const reason = REJECTION_REASONS.find((r) => r.code === apt.rejection_reason_code)?.label || apt.rejection_reason_code || 'The request could not be accommodated';
  const [title, body] = declined
    ? ['This request was declined', `Reason: ${reason}${apt.rejection_note && !sameText(apt.rejection_note, reason) ? ` — “${apt.rejection_note}”` : ''}`]
    : apt.status === 'cancelled'
    ? ['This appointment was cancelled', apt.cancellation_reason ? `Reason: ${apt.cancellation_reason}` : 'It is kept for your records.']
    : ['The customer did not come', 'It is kept for your records.'];

  return (
    <div role="status" className={`flex items-start gap-3 rounded-xl border p-4 ${declined ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-espresso/[0.08] bg-white text-ink'}`}>
      {declined ? <X size={18} className="mt-0.5 shrink-0" /> : <AlertTriangle size={18} className="mt-0.5 shrink-0 text-ink-muted" />}
      <div><p className="text-sm font-semibold">{title}</p><p className="text-sm">{body}</p></div>
    </div>
  );
}
