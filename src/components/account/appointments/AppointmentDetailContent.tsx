import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, CalendarDays, Clock, Lock, Loader2, AlertCircle, Info,
  Wallet, FileText, Link as LinkIcon, Store, CheckCircle2, CalendarClock,
} from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { catalogCategoryPath, serviceCategoryPath } from '@/lib/canonicalTaxonomy';
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
  service?: { id: number; name: string; service_category?: string | null; service_leaf_type?: string | null } | null;
  catalog_item?: {
    id: number;
    name: string;
    department?: string | null;
    subcategory?: string | null;
    garment_structure?: string | null;
    garment_type?: string | null;
  } | null;
  service_package?: { id: number; name: string; bundle_price?: string | null; service_category?: string | null; services?: { id: number; name: string }[] } | null;
  selected_size?: string | null;
  selected_color?: string | null;
  purpose_label?: string | null;
  rejection_reason?: string | null;
  rejection_note?: string | null;
  // The store's own hand-off after accepting (link + photos), and the flag set when a walk-in took this slot.
  shared_link?: string | null;
  shared_images?: string[];
  needs_new_time?: boolean;
  store_branch_id?: number | null;
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
  onReschedule: () => void;
}

export default function AppointmentDetailContent({
  appt,
  cancelling,
  onCancel,
  onReschedule,
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
          {appt.appointment_type === 'other' && appt.purpose_label ? `Other — ${appt.purpose_label}` : (TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type)}
        </span>
        {appt.intake_channel === 'walk_in' && (
          <span className="text-[10px] font-semibold bg-surface text-ink-muted border border-line rounded-full px-2.5 py-0.5">
            WALK-IN
          </span>
        )}
      </div>

      <h2 className="mobile-h3 font-semibold text-ink mb-1">
        {appt.catalog_item && appt.store?.slug ? (
          <Link href={`/store/${appt.store.slug}/catalog/${appt.catalog_item.id}`} className="hover:underline">
            {appt.catalog_item.name}
          </Link>
        ) : (
          appt.catalog_item?.name ?? appt.service_package?.name ?? appt.service_name ?? (TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type)
        )}
      </h2>
      <div className="mb-3 space-y-0.5">
        {appt.catalog_item && catalogCategoryPath(appt.catalog_item).length > 0 && (
          <p className="mobile-caption text-ink-muted font-normal">{catalogCategoryPath(appt.catalog_item).join(' → ')}</p>
        )}
        {(appt.selected_size || appt.selected_color) && (
          <p className="mobile-caption text-ink-body font-normal">
            {[appt.selected_size && `Size ${appt.selected_size}`, appt.selected_color].filter(Boolean).join(' · ')}
          </p>
        )}
        {appt.service_package && (appt.service_package.services?.length ?? 0) > 0 && (
          <p className="mobile-caption text-ink-muted font-normal">Package · includes {appt.service_package.services!.map(s => s.name).join(', ')}</p>
        )}
        {appt.service && !appt.service_package && (
          <p className="mobile-caption text-ink-muted font-normal">
            {appt.catalog_item ? `Service: ${appt.service.name}` : null}
            {serviceCategoryPath(appt.service).length > 0 && (
              <>{appt.catalog_item ? ' · ' : ''}{serviceCategoryPath(appt.service).join(' → ')}</>
            )}
          </p>
        )}
      </div>

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

      {appt.needs_new_time && appt.status === 'pending' && (
        <div className="mb-3 border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Your time was taken by a walk-in client</p>
          <p className="mobile-caption font-normal mt-1">
            The shop can&apos;t use the time you asked for. Pick another one — your request stays with the store, so you don&apos;t need to start over.
          </p>
        </div>
      )}

      {!isPastDue && appt.status === 'pending' && !appt.needs_new_time && (
        <div className="flex items-start gap-2 mb-3 bg-sunken border border-line p-3 mobile-caption text-ink-body leading-relaxed font-normal">
          <Info size={16} className="text-ink-muted shrink-0 mt-0.5" />
          Waiting for the store to confirm. Walk-ins are seen first come, first served — arriving early improves your spot in line.
        </div>
      )}

      {appt.status === 'pending' && (
        <button
          type="button"
          onClick={onReschedule}
          className={`w-full mb-3 h-12 flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer transition-colors ${
            appt.needs_new_time ? 'bg-ink text-white hover:bg-ink/90' : 'border border-line-strong bg-white text-ink hover:bg-sunken'
          }`}
        >
          <CalendarClock size={16} /> Pick a new time
        </button>
      )}

      {(appt.shared_link || (appt.shared_images && appt.shared_images.length > 0)) && (
        <div className="mb-3 border border-line p-3 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-ink">From the store</p>
          {appt.shared_link && (
            <a href={appt.shared_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mobile-body-sm text-taupe hover:underline break-all">
              <LinkIcon size={16} className="shrink-0" /> {appt.shared_link}
            </a>
          )}
          {appt.shared_images && appt.shared_images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {appt.shared_images.map((url) => (
                <a key={url} href={getMediaUrl(url)} target="_blank" rel="noopener noreferrer" className="relative block aspect-square bg-sunken border border-line overflow-hidden">
                  <Image src={getMediaUrl(url)} alt="Shared by the store" fill sizes="120px" className="object-cover" unoptimized />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {appt.status === 'rejected' && (
        <div className="mb-3 border border-danger/30 bg-danger/5 p-3">
          <p className="mobile-caption font-semibold text-danger">Appointment Rejected</p>
          {appt.rejection_reason && <p className="mobile-caption text-ink-body mt-1 font-normal"><span className="font-semibold">Reason:</span> {appt.rejection_reason}</p>}
          {appt.rejection_note && <p className="mobile-caption text-ink-muted mt-1 font-normal">{appt.rejection_note}</p>}
          <p className="mobile-caption text-ink-muted mt-2 font-normal">You can book a different date or time anytime.</p>
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
