import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, CalendarDays, Clock, Lock, Loader2, AlertCircle, Info,
  Wallet, FileText, Link as LinkIcon, Store, CheckCircle2,
} from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import {
  STATUS_META,
  TYPE_LABELS,
} from './appointmentTypes';

export interface AppointmentDetailData {
  id: number;
  appointment_type: string;
  intake_channel: string | null;
  status: string;
  scheduled_at: string;
  duration_minutes: number | null;
  service_name: string | null;
  payment_status: string;
  payment_method: string | null;
  notes: string | null;
  reference_link: string | null;
  cancellation_reason: string | null;
  rebooking_blocked: boolean;
  store: { name: string; slug: string; logo_path: string | null } | null;
  branch: { name: string; address: string | null; city: string | null } | null;
}

interface AppointmentDetailContentProps {
  appt: AppointmentDetailData;
  cancelling: boolean;
  onCancel: () => void;
}

export default function AppointmentDetailContent({
  appt,
  cancelling,
  onCancel,
}: Readonly<AppointmentDetailContentProps>) {
  const meta = STATUS_META[appt.status] ?? STATUS_META.pending;
  const StatusIcon = meta.Icon;
  const scheduled = new Date(appt.scheduled_at);
  const canSelfCancel = appt.status === 'pending' || appt.status === 'confirmed';
  const isPastDue = canSelfCancel && scheduled < new Date();

  const bringsOwnFabric = !!appt.notes?.toLowerCase().includes('bring own fabric');
  const fabricMatch = appt.notes?.match(/\[Material:\s*Customer will bring own fabric\/sample(?:\s*-\s*([^\]]+))?\]/i);
  const sampleDetail = fabricMatch?.[1]?.trim();

  return (
    <div className="bg-surface border border-line p-4">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="relative w-9 h-9 shrink-0 rounded-full overflow-hidden bg-sunken border border-line">
          {appt.store?.logo_path ? (
            <Image
              src={getMediaUrl(appt.store.logo_path)}
              alt=""
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink-faint">
              <Store size={16} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
          {appt.store?.slug ? (
            <Link
              href={`/store/${appt.store.slug}`}
              className="mobile-h4 font-medium text-ink hover:text-taupe truncate min-w-0"
            >
              {appt.store.name}
            </Link>
          ) : (
            <span className="mobile-h4 font-medium text-ink truncate min-w-0">Store</span>
          )}
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shrink-0 ${meta.tone}`}>
            <StatusIcon size={12} /> {meta.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <span className="mobile-caption font-medium bg-sunken text-ink-muted rounded-full px-2.5 py-0.5">
          {TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type}
        </span>
        {appt.intake_channel === 'walk_in' && (
          <span className="text-[10px] font-semibold bg-surface text-ink-muted border border-line rounded-full px-2.5 py-0.5">
            WALK-IN
          </span>
        )}
      </div>

      <h2 className="mobile-h3 font-semibold text-ink mb-3">
        {appt.service_name ?? (TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type)}
      </h2>

      <div className="space-y-2.5 pb-3 mb-3 border-b border-line">
        <div className="flex items-center gap-2.5 mobile-body-sm font-normal text-ink-body">
          <CalendarDays size={16} className="text-ink-faint shrink-0" />
          <span>
            {scheduled.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-2.5 mobile-body-sm font-normal text-ink-body">
          <Clock size={16} className="text-ink-faint shrink-0" />
          <span>
            {scheduled.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
            {appt.duration_minutes ? ` · ${appt.duration_minutes} min` : ''}
          </span>
        </div>

        {appt.branch && (
          <div className="flex items-start gap-2.5 mobile-body-sm font-normal text-ink-body">
            <MapPin size={16} className="text-ink-faint shrink-0 mt-0.5" />
            <span>
              {appt.branch.name}
              {appt.branch.address ? `, ${appt.branch.address}` : ''}
              {appt.branch.city ? `, ${appt.branch.city}` : ''}
            </span>
          </div>
        )}

        {appt.payment_method && (
          <div className="flex items-center gap-2.5 mobile-body-sm font-normal text-ink-body">
            <Wallet size={16} className="text-ink-faint shrink-0" />
            <span>Payment: {appt.payment_status} · {appt.payment_method}</span>
          </div>
        )}

        {bringsOwnFabric && (
          <div className="bg-sand-light/50 border border-sand-warm/40 p-3 rounded-none">
            <span className="text-[10px] font-bold text-taupe uppercase tracking-wider block mb-1">
              WHAT TO BRING
            </span>
            <p className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>Your fabric/sample</span>
            </p>
            {sampleDetail && (
              <p className="text-xs text-ink-muted mt-1 pl-5">Note: {sampleDetail}</p>
            )}
          </div>
        )}

        {appt.notes && (
          <div className="flex items-start gap-2.5 mobile-body-sm font-normal text-ink-body">
            <FileText size={16} className="text-ink-faint shrink-0 mt-0.5" />
            <span>{appt.notes}</span>
          </div>
        )}

        {appt.reference_link && (
          <div className="flex items-center gap-2.5 mobile-body-sm font-normal">
            <LinkIcon size={16} className="text-ink-faint shrink-0" />
            <a
              href={appt.reference_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-taupe hover:text-taupe-hover truncate"
            >
              {appt.reference_link}
            </a>
          </div>
        )}
      </div>

      {isPastDue && (
        <div className="flex items-start gap-2 mb-3 bg-sunken border border-line p-3 mobile-caption text-ink-body leading-relaxed font-normal">
          <AlertCircle size={16} className="text-ink-muted shrink-0 mt-0.5" />
          This appointment&apos;s scheduled time has already passed with no update from the store. If you&apos;re not sure what happened, reach out to them directly.
        </div>
      )}

      {!isPastDue && appt.status === 'pending' && (
        <div className="flex items-start gap-2 mb-3 bg-sunken border border-line p-3 mobile-caption text-ink-body leading-relaxed font-normal">
          <Info size={16} className="text-ink-muted shrink-0 mt-0.5" />
          Waiting for the store to confirm. Walk-ins are seen first come, first served — arriving early improves your spot in line.
        </div>
      )}

      {appt.status === 'cancelled' && (
        <div className="mb-3">
          {appt.cancellation_reason && (
            <p className="mobile-caption text-ink-muted leading-relaxed mb-3 font-normal">
              <span className="font-semibold text-ink-body">Reason from store:</span> {appt.cancellation_reason}
            </p>
          )}
          {appt.rebooking_blocked ? (
            <div className="btn-secondary-mobile w-full bg-sunken border-line text-ink-faint cursor-not-allowed">
              <Lock size={16} /> Rebooking unavailable — contact the store
            </div>
          ) : appt.store?.slug ? (
            <Link
              href={`/store/${appt.store.slug}/book`}
              className="btn-secondary-mobile w-full border-line-strong text-taupe hover:bg-sunken"
            >
              Book a new appointment
            </Link>
          ) : null}
        </div>
      )}

      {canSelfCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling}
          className="btn-secondary-mobile w-full border-danger/30 text-danger hover:bg-danger/5 disabled:opacity-50"
        >
          {cancelling && <Loader2 size={16} className="animate-spin" />}
          Cancel this appointment
        </button>
      )}
    </div>
  );
}
