import Link from 'next/link';
import Image from 'next/image';
import { CalendarDays, Lock, Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { type MyAppointment, STATUS_META, TYPE_LABELS } from './accountTypes';

/** The next appointment as a soft inner card: shop and status, what it is, when and where. */
export default function AppointmentPreviewItem({ appt }: { readonly appt: MyAppointment }) {
  const meta = STATUS_META[appt.status] ?? STATUS_META.pending;
  const StatusIcon = meta.Icon;
  const scheduled = new Date(appt.scheduled_at);
  const type = TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type;

  return (
    <div className="mt-3 rounded-2xl bg-sunken p-3.5">
      <div className="flex items-center gap-2">
        <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-surface text-ink-faint">
          {appt.store?.logo_path ? <Image src={getMediaUrl(appt.store.logo_path)} alt="" fill className="object-cover" /> : <Store size={12} />}
        </span>
        <span className="mobile-caption min-w-0 flex-1 truncate text-ink-muted">{appt.store?.name ?? 'Store'}</span>
        <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
          <StatusIcon size={12} /> {meta.label}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="mobile-caption rounded-full bg-surface px-2 py-0.5 text-ink-muted">{type}</span>
        {appt.intake_channel === 'walk_in' && <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-semibold text-ink-muted">WALK-IN</span>}
      </div>
      <h3 className="mobile-h4 mt-1.5 text-ink">{appt.service_name ?? type}</h3>
      <div className="mobile-caption mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-ink-muted">
        <span className="flex items-center gap-1">
          <CalendarDays size={13} />
          {scheduled.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} · {scheduled.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
        </span>
        {appt.branch && <span>{appt.branch.name}</span>}
      </div>
      {appt.status === 'cancelled' && (
        <div className="mt-3">
          {appt.cancellation_reason && (
            <p className="mobile-caption mb-1.5 text-ink-muted"><span className="font-semibold text-ink-body">Reason:</span> {appt.cancellation_reason}</p>
          )}
          {appt.rebooking_blocked ? (
            <div className="mobile-caption flex items-center gap-1.5 text-ink-faint"><Lock size={13} /> Rebooking unavailable</div>
          ) : appt.store?.slug ? (
            <Link href={`/store/${appt.store.slug}/book`} className="mobile-caption font-semibold text-taupe">Book a new appointment →</Link>
          ) : null}
        </div>
      )}
    </div>
  );
}
