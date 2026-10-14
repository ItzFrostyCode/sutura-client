import Link from 'next/link';
import Image from 'next/image';
import { Store } from 'lucide-react';
import { getMediaUrl } from '@/lib/media';
import { catalogCategoryPath, serviceCategoryPath } from '@/lib/canonicalTaxonomy';
import { STATUS_META, TYPE_LABELS } from './appointmentTypes';
import type { AppointmentDetailData } from './AppointmentDetailContent';

/** Who and what: the shop and status, the kind of appointment, and the design / service / package it is for. */
export default function AppointmentDetailHeader({ appt }: { readonly appt: AppointmentDetailData }) {
  const meta = STATUS_META[appt.status] ?? STATUS_META.pending;
  const StatusIcon = meta.Icon;
  const type = appt.appointment_type === 'other' && appt.purpose_label ? `Other — ${appt.purpose_label}` : (TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type);
  const designPath = appt.catalog_item ? catalogCategoryPath(appt.catalog_item) : [];
  const servicePath = appt.service ? serviceCategoryPath(appt.service) : [];

  return (
    <>
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line-strong bg-sunken text-ink-faint">
          {appt.store?.logo_path ? <Image src={getMediaUrl(appt.store.logo_path)} alt="" fill className="object-cover" /> : <Store size={16} />}
        </span>
        {appt.store?.slug ? (
          <Link href={`/store/${appt.store.slug}`} className="mobile-h4 min-w-0 flex-1 truncate text-ink hover:text-taupe">{appt.store.name}</Link>
        ) : (
          <span className="mobile-h4 min-w-0 flex-1 truncate text-ink">Store</span>
        )}
        <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}>
          <StatusIcon size={12} /> {meta.label}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <span className="mobile-caption rounded-full bg-sunken px-2.5 py-0.5 text-ink-muted">{type}</span>
        {appt.intake_channel === 'walk_in' && <span className="rounded-full bg-sunken px-2.5 py-0.5 text-[10px] font-semibold text-ink-muted">WALK-IN</span>}
      </div>

      <h2 className="mobile-h3 mt-2 text-ink">
        {appt.catalog_item && appt.store?.slug ? (
          <Link href={`/store/${appt.store.slug}/catalog/${appt.catalog_item.id}`} className="hover:underline">{appt.catalog_item.name}</Link>
        ) : (
          appt.catalog_item?.name ?? appt.service_package?.name ?? appt.service_name ?? (TYPE_LABELS[appt.appointment_type] ?? appt.appointment_type)
        )}
      </h2>
      <div className="mt-1 space-y-0.5">
        {designPath.length > 0 && <p className="mobile-caption text-ink-muted">{designPath.join(' → ')}</p>}
        {(appt.selected_size || appt.selected_color) && (
          <p className="mobile-caption text-ink-body">{[appt.selected_size && `Size ${appt.selected_size}`, appt.selected_color].filter(Boolean).join(' · ')}</p>
        )}
        {appt.service_package && (appt.service_package.services?.length ?? 0) > 0 && (
          <p className="mobile-caption text-ink-muted">Package · includes {appt.service_package.services!.map((s) => s.name).join(', ')}</p>
        )}
        {appt.service && !appt.service_package && (
          <p className="mobile-caption text-ink-muted">
            {appt.catalog_item ? `Service: ${appt.service.name}` : null}
            {servicePath.length > 0 && <>{appt.catalog_item ? ' · ' : ''}{servicePath.join(' → ')}</>}
          </p>
        )}
      </div>
    </>
  );
}
