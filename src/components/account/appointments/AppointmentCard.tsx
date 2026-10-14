import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { MapPin, CalendarDays, Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { catalogCategoryPath, serviceCategoryPath, SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/lib/canonicalTaxonomy';
import { type MyAppointment, STATUS_META, TYPE_LABELS } from './appointmentTypes';
import AppointmentCardFooter from './AppointmentCardFooter';

interface AppointmentCardProps {
  appt: MyAppointment;
  cancellingId: number | null;
  onCancel: (id: number) => void;
}

const chip = 'mobile-caption rounded-full bg-sunken px-2.5 py-0.5 text-ink-muted';

/** One appointment as a soft card: shop and status, what it is, when and where, then what the status means. */
export default function AppointmentCard({ appt, cancellingId, onCancel }: Readonly<AppointmentCardProps>) {
  const router = useRouter();
  const meta = STATUS_META[appt.status] ?? STATUS_META.pending;
  const StatusIcon = meta.Icon;
  const scheduled = new Date(appt.scheduled_at);
  const categoryPath = appt.catalog_item
    ? catalogCategoryPath(appt.catalog_item)
    : appt.service_package?.service_category ? ['Services', SERVICE_CATEGORY_LABELS[appt.service_package.service_category as ServiceCategory] ?? ''].filter(Boolean)
    : appt.service ? serviceCategoryPath(appt.service) : [];
  const canSelfCancel = appt.status === 'pending' || appt.status === 'confirmed';
  const isPastDue = canSelfCancel && scheduled < new Date();
  const open = () => router.push(`/account/appointments/${appt.id}`);

  return (
    <div
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') open();
      }}
      role="button"
      tabIndex={0}
      className="card-soft cursor-pointer p-4 transition-opacity active:opacity-90"
    >
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-sunken text-ink-faint">
          {appt.store?.logo_path ? <Image src={getMediaUrl(appt.store.logo_path)} alt="" fill className="object-cover" /> : <Store size={14} />}
        </span>
        {appt.store?.slug ? (
          <Link href={`/store/${appt.store.slug}`} onClick={(e) => e.stopPropagation()} className="mobile-caption min-w-0 flex-1 truncate text-ink-muted hover:text-taupe">
            {appt.store.name}
          </Link>
        ) : (
          <span className="mobile-caption min-w-0 flex-1 truncate text-ink-muted">Store</span>
        )}
        <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}>
          <StatusIcon size={12} /> {meta.label}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className={chip}>{appt.appointment_type === 'other' && appt.purpose_label ? `Other — ${appt.purpose_label}` : (TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type)}</span>
        {appt.notes?.toLowerCase().includes('bring own fabric') && <span className={chip}>✓ Bring fabric/sample</span>}
        {appt.intake_channel === 'walk_in' && <span className={`${chip} text-[10px] font-semibold`}>WALK-IN</span>}
        {appt.needs_new_time && appt.status === 'pending' && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">Pick a new time</span>}
      </div>

      <h3 className="mobile-h4 mt-2 text-ink">
        {appt.catalog_item?.name ?? appt.service_package?.name ?? appt.service_name ?? (TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type)}
      </h3>
      {categoryPath.length > 0 && <p className="mobile-caption truncate text-ink-muted">{categoryPath.join(' → ')}</p>}

      <div className="mobile-caption mt-1.5 flex items-center gap-1.5 text-ink-muted">
        <CalendarDays size={14} className="shrink-0 text-ink-faint" />
        {scheduled.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        {' · '}
        {scheduled.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })}
      </div>
      {appt.branch && (
        <div className="mobile-caption mt-1 flex items-center gap-1.5 truncate text-ink-muted">
          <MapPin size={14} className="shrink-0 text-ink-faint" />
          {appt.branch.name}{appt.branch.city ? `, ${appt.branch.city}` : ''}
        </div>
      )}

      <AppointmentCardFooter appt={appt} isPastDue={isPastDue} canSelfCancel={canSelfCancel} cancelling={cancellingId === appt.id} onCancel={onCancel} />
    </div>
  );
}
