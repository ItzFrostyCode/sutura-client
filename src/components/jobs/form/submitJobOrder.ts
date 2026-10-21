import api from '@/lib/axios';
import { serviceHasType } from '@/components/jobs/jobHelpers';
import { canonicalGarment, categoryOfGarment, garmentLabel } from '@/lib/garmentTaxonomy';
import { legacyJobCategory } from './jobFormHelpers';
import { compileRoster, toTeamRoster } from './rosterHelpers';
import type { GarmentSpecColumn } from '@/components/jobs/jobTypes';
import type { JobPricing } from './useJobPricing';
import type { JobCreateFormData, RosterMember, ServiceData } from './types';

export interface JobSubmission {
  storeId: number;
  branchId: number | null;
  formData: JobCreateFormData;
  pricing: JobPricing;
  service: ServiceData | undefined;
  intakeChannel: 'walk_in' | 'online';
  appointmentId: string | null;
  catalogItemId: string;
  standardSize: string;
  customFieldValues: Record<string, string>;
  isBulk: boolean;
  teamName: string;
  roster: RosterMember[];
  rosterColumns: GarmentSpecColumn[];
  damageNotes: string;
  referenceImages: string[];
  referenceLink: string;
  assignees: Record<number, string>;
  measurementMode?: import('./types').MeasurementSourceMode;
  inlineMeasurement?: import('./types').InlineMeasurementData;
  inlineMeasurements?: import('./types').InlineMeasurementData[];
  /** The owner or a branch manager chose to go below the service's usual minimum. */
  confirmBelowMinimum?: boolean;
  /** The shop's measuring unit, written with each new measurement. */
  defaultUnit?: 'in' | 'cm';
  /** Other services asked for at the same visit; each becomes its own linked order. */
  extras?: import('./types').ExtraService[];
}

/** A team order's list in both shapes: the job's own Spec Table (with the owner's column names) and the roster the tracker and ticket read. */
function teamFields(s: JobSubmission) {
  const { rows, columns } = compileRoster(s.roster, s.rosterColumns);
  return {
    team_roster: toTeamRoster(rows),
    spec_table: { columns, rows: rows.map((r) => ({ ...r, completed: false })) },
  };
}

/** What is wrong with the form before it is sent, in words the owner can act on; null when it is fine. */
export function jobProblem(s: JobSubmission): string | null {
  const repair = serviceHasType(s.service, 'alteration_repair');
  if (!s.formData.customer_id) return 'Choose the customer.';
  if (!s.formData.service_id) return 'Choose the service.';
  if (repair && !s.damageNotes.trim()) return 'Write down the garment’s condition before taking it in (stains, tears, missing buttons).';
  if (!repair && !s.pricing.dueDate) return 'Set the date the order is due.';
  return null;
}

/** Creates the order, then plans the picked staff on it. Returns the new order's id. */
export async function submitJobOrder(s: JobSubmission, onStaffFailed: () => void): Promise<number | null> {
  const { formData: f, pricing: p } = s;
  const repair = serviceHasType(s.service, 'alteration_repair');

  // Only the "use saved measurements" choice links an existing profile; measuring now makes a new one, standard size or later links none.
  let finalMeasurementId = f.measurement_id && !s.isBulk && (s.measurementMode ?? 'existing') === 'existing' ? Number(f.measurement_id) : null;
  const savedMeasurementsMeta: Array<{ id: number; name: string; area: string; metrics: Record<string, string> }> = [];

  // If the tailor recorded new measurements directly in the form, create the measurement record(s) first
  if (s.measurementMode === 'record_now') {
    const listToSave = (s.inlineMeasurements && s.inlineMeasurements.length > 0)
      ? s.inlineMeasurements
      : (s.inlineMeasurement ? [s.inlineMeasurement] : []);

    for (let i = 0; i < listToSave.length; i++) {
      const person = listToSave[i];
      const hasMetrics = Object.keys(person.metrics).some((k) => !k.startsWith('_'));
      const hasPhotos = person.photo_urls && person.photo_urls.length > 0;

      if (hasMetrics || hasPhotos) {
        try {
          const metricsPayload: Record<string, string> = {
            ...person.metrics,
            _area: person.measurement_area,
            _unit: String(person.metrics._unit ?? s.defaultUnit ?? 'in'),
          };

          const defaultName = i === 0 ? 'Primary Profile' : `Person ${i + 1}`;
          const res = await api.post(`/stores/${s.storeId}/measurements`, {
            customer_id: Number(f.customer_id),
            appointment_id: s.appointmentId ? Number(s.appointmentId) : null,
            service_id: f.service_id ? Number(f.service_id) : null,
            catalog_item_id: s.catalogItemId ? Number(s.catalogItemId) : null,
            profile_name: person.profile_name || defaultName,
            metrics: metricsPayload,
            photo_urls: person.photo_urls || [],
            notes: person.notes || null,
            source: 'store_owner',
            status: 'finalized',
          });

          if (res.data?.data?.id) {
            const newId = Number(res.data.data.id);
            if (finalMeasurementId === null) {
              finalMeasurementId = newId;
            }
            savedMeasurementsMeta.push({
              id: newId,
              name: person.profile_name || defaultName,
              area: person.measurement_area,
              metrics: person.metrics,
            });
          }
        } catch {
          // Continue saving other profiles even if one fails
        }
      }
    }
  } else if (s.measurementMode === 'standard_size' || s.measurementMode === 'none') {
    finalMeasurementId = null;
  }

  const created = await api.post(`/stores/${s.storeId}/jobs`, {
    intake_channel: s.intakeChannel,
    fulfillment_type: 'pickup',
    customer_id: f.customer_id,
    service_id: f.service_id,
    store_branch_id: s.branchId ?? undefined,
    measurement_id: finalMeasurementId,
    // A bulk order's roster already has one row per person, so quantity is always 1 there.
    quantity: s.isBulk ? 1 : p.quantity,
    total_amount: p.total.toFixed(2),
    discount_amount: Number(p.discount.toFixed(2)),
    balance: Number(p.balance.toFixed(2)),
    due_date: p.dueDate || null,
    notes: f.notes,
    // Always sent (null when empty): an emptied field must stay empty, not be refilled from the consultation by the server.
    design_source: s.catalogItemId ? 'shop_design' : (f.design_source === 'shop_design' ? null : f.design_source ?? null),
    design_link: f.design_link || null,
    consultation_notes: f.consultation_notes || null,
    confirm_below_minimum: s.confirmBelowMinimum || undefined,
    extra_services: (s.extras ?? []).filter((x) => x.service_id).map((x) => ({
      service_id: Number(x.service_id), catalog_item_id: x.catalog_item_id ? Number(x.catalog_item_id) : undefined,
      quantity: Math.max(1, Number(x.quantity) || 1), total_amount: x.price.trim() !== '' ? Number(x.price) : undefined,
    })),
    custom_order_data: {
      ...s.customFieldValues,
      // Readable name (what the order pages show), plus the slugs the taxonomy and reports use.
      garment_type: garmentLabel(f.garment_type) ?? (f.garment_type || null),
      garment: canonicalGarment(f.garment_type),
      garment_group: categoryOfGarment(f.garment_type),
      standard_size: s.standardSize && s.standardSize !== 'Custom Measurements' ? s.standardSize : null,
      discount_reason: f.discount_reason || null,
      team_name: s.teamName || null,
      ...(s.isBulk ? teamFields(s) : { team_roster: null }),
      pre_existing_damage_notes: repair ? s.damageNotes.trim() : null,
      measurements: savedMeasurementsMeta.length > 0 ? savedMeasurementsMeta : null,
    },
    appointment_id: s.appointmentId ? Number(s.appointmentId) : null,
    catalog_item_id: s.catalogItemId ? Number(s.catalogItemId) : null,
    reference_images: s.referenceImages.length > 0 ? s.referenceImages : null,
    reference_link: s.referenceLink.trim() || null,
    material_source: f.material_source,
    garment_category: legacyJobCategory(f.garment_type, s.service),
    is_rush: f.is_rush,
    rush_fee: Number(p.rushFee.toFixed(2)),
  });
  const id: number | undefined = created.data?.data?.id;
  const planned = Object.entries(s.assignees).map(([userId, role]) => ({ user_id: Number(userId), role }));
  if (id && planned.length > 0) {
    // The order exists already; planning can be redone from its Order Steps tab.
    await api.put(`/stores/${s.storeId}/jobs/${id}/assignees`, { assignees: planned }).catch(onStaffFailed);
  }
  return id ?? null;
}
