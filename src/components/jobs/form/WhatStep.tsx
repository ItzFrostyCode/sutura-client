import { useMemo } from 'react';
import { CalendarClock } from 'lucide-react';
import { BTN } from '@/components/shared/plainForm';
import { formatTurnaround } from '@/lib/formatTurnaround';
import { LABEL } from './FormStep';
import ServiceCards from './ServiceCards';
import DesignStrip from './DesignStrip';
import GarmentStep from './GarmentStep';
import DetailsStep from './DetailsStep';
import ExtraServices from './ExtraServices';
import { garmentOptions, readyBy } from './jobFormHelpers';
import type { JobCreateForm } from './useJobCreateForm';

/**
 * What is being made: the service (already chosen when the order comes from a booking), then one of its designs, then what
 * the service asks. Changing the service can always be undone: Cancel closes the list, and "Restore" brings the booked one back.
 */
export default function WhatStep({ form }: Readonly<{ form: JobCreateForm }>) {
  const { services, catalogItems, formData, service, design, appointmentId } = form;
  const designs = useMemo(() => catalogItems.filter((c) => String(c.service_id) === formData.service_id), [catalogItems, formData.service_id]);
  const options = useMemo(() => garmentOptions(services, catalogItems), [services, catalogItems]);

  // Changing the service or design can always be undone: Cancel closes the list, Restore brings the booking's choice back.
  const fromBooking = Boolean(appointmentId) && !form.changedFromBooking;
  const pickService = (id: string) => form.pickService(id);
  const pickDesign = (id: string) => form.pickDesign(id);
  const clearDesign = () => form.setCatalogItemId('');

  const days = design?.estimated_days ?? service?.estimated_days ?? null;
  const daysMax = design ? design.estimated_days_max : service?.estimated_days_max;
  const ready = readyBy(days, daysMax);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <span className={LABEL}>Service <span className="text-danger">*</span>{fromBooking && <span className="ml-2 font-normal text-espresso/60">from the booking</span>}</span>
        <ServiceCards services={services} selectedId={formData.service_id} onPick={pickService} />
        {form.changedFromBooking && <button type="button" onClick={form.restoreBooked} className={BTN}>Restore the booked service and design</button>}
      </div>
      {service ? (
        <DesignStrip designs={designs} selected={design} serviceName={service.name} onPick={pickDesign} onClear={clearDesign} fromBooking={fromBooking} customerPhotos={fromBooking ? form.referenceImages : []} />
      ) : (
        <p className="text-sm text-espresso/60">Choose a service to see its designs.</p>
      )}

      {ready && (
        <p className="flex items-center gap-2 text-sm text-espresso">
          <CalendarClock size={16} className="shrink-0" />
          <span>Ready around <strong>{ready}</strong> <span className="text-espresso/60">({formatTurnaround(days, daysMax)} from today)</span></span>
        </p>
      )}

      {service && (
        <div className="space-y-5 border-t border-espresso/15 pt-5">
          <GarmentStep options={options} garment={formData.garment_type} onGarment={form.pickGarment} />
          <DetailsStep form={form} />
        </div>
      )}

      <ExtraServices form={form} />
    </div>
  );
}
