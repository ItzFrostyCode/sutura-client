import { useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { GARMENT_CATEGORIES, garmentLabel as labelOf, canonicalGarment, categoryOfGarment } from '@/lib/garmentTaxonomy';
import { formatTurnaround } from '@/lib/formatTurnaround';
import GarmentStep from './GarmentStep';
import ServicePicker from './ServicePicker';
import DesignStrip from './DesignStrip';
import { designsFor, garmentOptions, readyBy, servicesForGarment } from './jobFormHelpers';
import type { JobCreateForm } from './useJobCreateForm';

/** What is being made: garment category → garment → the service that does it → optionally one of the shop's designs. */
export default function WhatStep({ form }: Readonly<{ form: JobCreateForm }>) {
  const { services, catalogItems, formData, garmentCategory, service, design } = form;
  const [showAll, setShowAll] = useState(false);
  const options = useMemo(() => garmentOptions(services, catalogItems), [services, catalogItems]);
  const fitting = useMemo(() => {
    const list = servicesForGarment(services, formData.garment_type, garmentCategory);
    // The chosen service stays listed even when it does not list this garment (e.g. a design set up that way).
    const chosen = services.find((s) => s.id.toString() === formData.service_id);
    return chosen && !list.includes(chosen) ? [chosen, ...list] : list;
  }, [services, formData.garment_type, garmentCategory, formData.service_id]);
  const designs = useMemo(
    () => designsFor(catalogItems, formData.garment_type, formData.service_id, garmentCategory),
    [catalogItems, formData.garment_type, formData.service_id, garmentCategory],
  );
  const typedName = formData.garment_type && !canonicalGarment(formData.garment_type) ? formData.garment_type : null;
  const category = categoryOfGarment(formData.garment_type) ?? (garmentCategory || null);
  const scope = labelOf(formData.garment_type) ?? typedName ?? (category && category !== 'other' ? GARMENT_CATEGORIES[category].label : null);

  // One simple line once a service (or design) is picked: when the order would be ready if it started today.
  const days = design?.estimated_days ?? service?.estimated_days ?? null;
  const daysMax = design ? design.estimated_days_max : service?.estimated_days_max;
  const ready = readyBy(days, daysMax);

  return (
    <div className="space-y-6">
      <GarmentStep options={options} garment={formData.garment_type} onGarment={form.pickGarment} />
      <div>
        <ServicePicker services={showAll ? services : fitting} selectedId={formData.service_id} onPick={form.pickService} garmentLabel={scope} />
        {fitting.length < services.length && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 min-h-11 cursor-pointer text-sm font-semibold text-taupe hover:underline">
            {showAll ? `Only services for ${scope ?? 'this garment'}` : `Not here? Show all ${services.length} services`}
          </button>
        )}
        {ready && (
          <p className="mt-2 flex items-center gap-2 text-sm text-ink">
            <CalendarClock size={16} className="shrink-0 text-taupe" />
            <span>Ready around <strong>{ready}</strong> <span className="text-ink-muted">({formatTurnaround(days, daysMax)} from today)</span></span>
          </p>
        )}
      </div>
      <DesignStrip designs={designs} selected={design} scope={scope} onPick={form.pickDesign} onClear={() => form.setCatalogItemId('')} />
    </div>
  );
}
