import React from 'react';
import Link from 'next/link';
import { catalogCategoryPath, serviceCategoryPath } from '@/lib/garmentTaxonomy';
import type { Appointment } from './appointmentHelpers';

interface AppointmentSubjectProps {
  readonly apt: Pick<Appointment, 'catalog_item' | 'service' | 'selected_size' | 'selected_color' | 'garment_category'>;
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
  const picks = [apt.selected_size && `Size ${apt.selected_size}`, apt.selected_color].filter(Boolean).join(' · ');

  if (variant === 'compact') {
    if (!design && !apt.service && !apt.garment_category) return null;
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
        {apt.service && (
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
      {apt.service && (
        <div className="col-span-2">
          <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Service</p>
          <p className="text-ink font-semibold mt-0.5">{apt.service.name}</p>
          {servicePath.length > 0 && <p className="text-xs text-ink-muted mt-0.5">{servicePath.join(' → ')}</p>}
        </div>
      )}
      {!design && !apt.service && apt.garment_category && (
        <div>
          <p className="text-xs text-ink-faint font-semibold uppercase tracking-wider">Garment Category</p>
          <p className="text-ink font-semibold mt-0.5 capitalize">{apt.garment_category.replace(/_/g, ' ')}</p>
        </div>
      )}
    </>
  );
}
