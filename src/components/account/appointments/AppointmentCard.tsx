import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  MapPin, CalendarDays, Lock, Loader2, AlertCircle, Info, Store,
} from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import {
  type MyAppointment,
  STATUS_META,
  TYPE_LABELS,
} from './appointmentTypes';

interface AppointmentCardProps {
  appt: MyAppointment;
  cancellingId: number | null;
  onCancel: (id: number) => void;
}

export default function AppointmentCard({
  appt,
  cancellingId,
  onCancel,
}: Readonly<AppointmentCardProps>) {
  const router = useRouter();
  const meta = STATUS_META[appt.status] ?? STATUS_META.pending;
  const StatusIcon = meta.Icon;
  const scheduled = new Date(appt.scheduled_at);
  const canSelfCancel = appt.status === 'pending' || appt.status === 'confirmed';
  const isPastDue = canSelfCancel && scheduled < new Date();

  return (
    <div
      onClick={() => router.push(`/account/appointments/${appt.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') router.push(`/account/appointments/${appt.id}`);
      }}
      role="button"
      tabIndex={0}
      className="bg-surface border border-line p-4 cursor-pointer hover:border-line-strong transition-colors"
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden bg-sunken border border-line">
          {appt.store?.logo_path ? (
            <Image
              src={getMediaUrl(appt.store.logo_path)}
              alt=""
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-faint">
              <Store size={14} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
          {appt.store?.slug ? (
            <Link
              href={`/store/${appt.store.slug}`}
              onClick={(e) => e.stopPropagation()}
              className="mobile-caption font-semibold text-ink-muted hover:text-taupe truncate min-w-0"
            >
              {appt.store.name}
            </Link>
          ) : (
            <span className="mobile-caption font-semibold text-ink-muted truncate min-w-0">Store</span>
          )}
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${meta.tone}`}>
            <StatusIcon size={12} /> {meta.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="mobile-caption font-medium bg-sunken text-ink-muted rounded-full px-2.5 py-0.5">
          {TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}
        </span>
        {appt.notes?.toLowerCase().includes('bring own fabric') && (
          <span className="text-[10px] font-semibold bg-sand text-ink border border-line rounded-full px-2 py-0.5">
            ✓ Bring fabric/sample
          </span>
        )}
        {appt.intake_channel === 'walk_in' && (
          <span className="text-[10px] font-semibold bg-surface text-ink-muted border border-line rounded-full px-2 py-0.5">
            WALK-IN
          </span>
        )}
      </div>

      <h3 className="mobile-h4 font-semibold text-ink mb-1">
        {appt.service_name ?? (TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type)}
      </h3>

      <div className="flex items-center gap-1.5 mt-1.5 mobile-caption text-ink-muted font-normal">
        <CalendarDays size={14} className="shrink-0 text-ink-faint" />
        {scheduled.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        {' · '}
        {scheduled.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
      </div>

      {appt.branch && (
        <div className="flex items-center gap-1.5 mt-1 mobile-caption text-ink-muted truncate font-normal">
          <MapPin size={14} className="shrink-0 text-ink-faint" />
          {appt.branch.name}{appt.branch.city ? `, ${appt.branch.city}` : ''}
        </div>
      )}

      {isPastDue && (
        <div className="flex items-start gap-2 mt-3 pt-3 border-t border-line mobile-caption text-ink-body leading-relaxed font-normal">
          <AlertCircle size={15} className="text-ink-muted shrink-0 mt-0.5" />
          This appointment&apos;s scheduled time has already passed with no update from the store. If you&apos;re not sure what happened, reach out to them directly.
        </div>
      )}

      {!isPastDue && appt.status === 'pending' && (
        <div className="flex items-start gap-2 mt-3 pt-3 border-t border-line mobile-caption text-ink-body leading-relaxed font-normal">
          <Info size={15} className="text-ink-muted shrink-0 mt-0.5" />
          Waiting for the store to confirm. Walk-ins are seen first come, first served — arriving early improves your spot in line.
        </div>
      )}

      {appt.status === 'cancelled' && (
        <div className="mt-3 pt-3 border-t border-line">
          {appt.cancellation_reason && (
            <p className="mobile-caption text-ink-muted leading-relaxed mb-2 font-normal">
              <span className="font-semibold text-ink-body">Reason from store:</span> {appt.cancellation_reason}
            </p>
          )}
          {appt.rebooking_blocked ? (
            <div className="flex items-center gap-2 h-11 bg-sunken text-ink-faint text-xs px-3">
              <Lock size={14} /> Rebooking unavailable — contact the store
            </div>
          ) : appt.store?.slug ? (
            <Link
              href={`/store/${appt.store.slug}/book`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 h-11 border border-line-strong text-taupe text-xs font-semibold hover:bg-sunken transition-colors"
            >
              Book a new appointment
            </Link>
          ) : null}
        </div>
      )}

      {canSelfCancel && (
        <div className="mt-3 pt-3 border-t border-line">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCancel(appt.id);
            }}
            disabled={cancellingId === appt.id}
            className="w-full flex items-center justify-center gap-1.5 h-11 border border-danger/30 text-xs font-semibold text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
          >
            {cancellingId === appt.id && <Loader2 size={14} className="animate-spin" />}
            Cancel this appointment
          </button>
        </div>
      )}
    </div>
  );
}
