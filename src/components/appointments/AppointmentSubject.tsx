import React from 'react';
import Link from 'next/link';
import { catalogCategoryPath, serviceCategoryPath, SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/lib/canonicalTaxonomy';
import type { Appointment } from './appointmentHelpers';

interface AppointmentSubjectProps {
  readonly apt: Pick<Appointment, 'catalog_item' | 'service' | 'service_package' | 'selected_size' | 'selected_color' | 'garment_category'>;
  /** Store slug for linking the design to its public page (full variant only). */
  readonly storeSlug?: string;
  readonly variant?: 'compact' | 'full';
}

/**
 * What an appointment is *for*: the catalog design it was booked from (title,
 * Men/Women/Kids category path, picked size/color) and/or the service (name,
 * Services category path). One component for the list, calendar, and view
 * modal so owners, branch managers, and staff all see the same thing.
 */
export default function AppointmentSubject({ apt, storeSlug, variant = 'compact' }: AppointmentSubjectProps) {
  const design = apt.catalog_item;
  const designPath = design ? catalogCategoryPath(design) : [];
  const servicePath = apt.service ? serviceCategoryPath(apt.service) : [];
  const pkg = apt.service_package;
  const pkgCat = pkg?.service_category ? SERVICE_CATEGORY_LABELS[pkg.service_category as ServiceCategory] : null;
  const picks = [apt.selected_size && `Size ${apt.selected_size}`, apt.selected_color].filter(Boolean).join(' · ');

  if (variant === 'compact') {
    if (!design && !apt.service && !pkg && !apt.garment_category) return null;
    return (
      <div className="min-w-0 space-y-0.5">
        {design && (
          <p className="text-xs text-ink font-medium truncate" title={design.name}>
            {design.name}
          </p>
        )}
        {design && designPath.length > 0 && (
          <p className="text-[11px] text-ink-muted truncate" title={designPath.join(' → ')}>
            {designPath.join(' → ')}{picks && ` · ${picks}`}
          </p>
        )}
        {pkg && (
          <p className="text-xs text-ink font-medium truncate" title={pkg.name}>
            Package: {pkg.name}{pkgCat && <span className="text-ink-muted font-normal"> · {pkgCat}</span>}
          </p>
        )}
        {apt.service && !pkg && (
          <p className="text-[11px] text-ink-body truncate" title={servicePath.join(' → ')}>
            Service: {apt.service.name}
            {!design && servicePath.length > 0 && <span className="text-ink-muted"> · {servicePath.join(' → ')}</span>}
          </p>
        )}
        {!design && !apt.service && apt.garment_category && (
          <p className="text-xs text-ink-muted capitalize truncate">{apt.garment_category.replace(/_/g, ' ')}</p>
        )}
      </div>
    );
  }

  return (
    <>
      {design && (
        <div className="col-span-2">
          <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Design</p>
          {storeSlug ? (
            <Link
              href={`/store/${storeSlug}/catalog/${design.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink font-semibold mt-0.5 hover:underline block"
            >
              {design.name}
            </Link>
          ) : (
            <p className="text-ink font-semibold mt-0.5">{design.name}</p>
          )}
          {designPath.length > 0 && <p className="text-xs text-ink-muted mt-0.5">{designPath.join(' → ')}</p>}
          {picks && <p className="text-xs text-ink-body mt-0.5">{picks}</p>}
        </div>
      )}
      {pkg && (
        <div className="col-span-2">
          <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Package</p>
          <p className="text-ink font-semibold mt-0.5">{pkg.name}</p>
          {pkgCat && <p className="text-xs text-ink-muted mt-0.5">Services → {pkgCat}</p>}
          {(pkg.services?.length ?? 0) > 0 && <p className="text-xs text-ink-body mt-0.5">Includes: {pkg.services!.map(s => s.name).join(', ')}</p>}
          {pkg.bundle_price && <p className="text-xs text-ink-body mt-0.5">Bundle price ₱{Number(pkg.bundle_price).toLocaleString()}</p>}
        </div>
      )}
      {apt.service && !pkg && (
        <div className="col-span-2">
          <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Service</p>
          <p className="text-ink font-semibold mt-0.5">{apt.service.name}</p>
          {servicePath.length > 0 && <p className="text-xs text-ink-muted mt-0.5">{servicePath.join(' → ')}</p>}
        </div>
      )}
      {!design && !apt.service && !pkg && apt.garment_category && (
        <div>
          <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Garment Category</p>
          <p className="text-ink font-semibold mt-0.5 capitalize">{apt.garment_category.replace(/_/g, ' ')}</p>
        </div>
      )}
    </>
  );
}
