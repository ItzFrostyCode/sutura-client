import api from '@/lib/axios';
import { serviceHasType } from '@/components/jobs/jobHelpers';
import { canonicalGarment, categoryOfGarment, garmentLabel } from '@/lib/garmentTaxonomy';
import { legacyJobCategory } from './jobFormHelpers';
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
  damageNotes: string;
  referenceImages: string[];
  referenceLink: string;
  assignees: Record<number, string>;
}

/** What is wrong with the form before it is sent, in words the owner can act on; null when it is fine. */
export function jobProblem(s: JobSubmission): string | null {
  const repair = serviceHasType(s.service, 'alteration_repair');
  if (!s.formData.customer_id) return 'Choose the customer.';
  if (!s.formData.service_id) return 'Choose the service.';
  if (s.isBulk && s.service?.min_order_qty && s.roster.length < s.service.min_order_qty) {
    return `This service needs at least ${s.service.min_order_qty} pieces — the list has ${s.roster.length}.`;
  }
  if (repair && !s.damageNotes.trim()) return 'Write down the garment’s condition before taking it in (stains, tears, missing buttons).';
  if (!repair && !s.pricing.dueDate) return 'Set the date the order is due.';
  return null;
}

/** Creates the order, then plans the picked staff on it. Returns the new order's id. */
export async function submitJobOrder(s: JobSubmission, onStaffFailed: () => void): Promise<number | null> {
  const { formData: f, pricing: p } = s;
  const repair = serviceHasType(s.service, 'alteration_repair');
  const created = await api.post(`/stores/${s.storeId}/jobs`, {
    intake_channel: s.intakeChannel,
    fulfillment_type: 'pickup',
    customer_id: f.customer_id,
    service_id: f.service_id,
    store_branch_id: s.branchId ?? undefined,
    measurement_id: f.measurement_id && !s.isBulk ? Number(f.measurement_id) : null,
    // A bulk order's roster already has one row per person, so quantity is always 1 there.
    quantity: p.quantity,
    total_amount: p.total.toFixed(2),
    discount_amount: Number(p.discount.toFixed(2)),
    balance: Number(p.balance.toFixed(2)),
    due_date: p.dueDate || null,
    notes: f.notes,
    custom_order_data: {
      ...s.customFieldValues,
      // Readable name (what the order pages show), plus the slugs the taxonomy and reports use.
      garment_type: garmentLabel(f.garment_type) ?? (f.garment_type || null),
      garment: canonicalGarment(f.garment_type),
      garment_group: categoryOfGarment(f.garment_type),
      standard_size: s.standardSize && s.standardSize !== 'Custom Measurements' ? s.standardSize : null,
      discount_reason: f.discount_reason || null,
      team_name: s.teamName || null,
      team_roster: s.isBulk ? s.roster.map(({ name, print_name, number, size }) => ({ name, print_name, number, size })) : null,
      pre_existing_damage_notes: repair ? s.damageNotes.trim() : null,
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
