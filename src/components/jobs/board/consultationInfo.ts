import type { Appointment } from '@/components/appointments/appointmentHelpers';
import { designSourceLabel } from '@/lib/designSource';

const METHODS: Record<string, string> = { gcash: 'GCash', maya: 'Maya', paymaya: 'Maya', cash: 'Cash', bank: 'Bank transfer', bank_transfer: 'Bank transfer' };

const methodLabel = (m?: string | null): string | null => {
  if (!m) return null;
  return METHODS[m.toLowerCase()] ?? m.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
};

/** The short facts shown under the customer's name: design source, people and pieces, own fabric, and whether the booking deposit was paid (an appointment stores no amount). */
export function consultationFacts(a: Appointment): string[] {
  const facts: string[] = [];
  const design = a.design_source && a.design_source !== 'none' ? designSourceLabel(a.design_source) : null;
  if (design) facts.push(design);
  if ((a.people_count ?? 0) >= 2) facts.push(`${a.people_count} people`);
  if (a.pieces_count) facts.push(`${a.pieces_count} pcs`);
  if (a.material_source === 'own') facts.push('Own fabric');
  if (a.payment_status === 'paid') {
    const method = methodLabel(a.payment_method);
    facts.push(method ? `Booking deposit paid (${method})` : 'Booking deposit paid');
  }
  return facts;
}

/** What the order form will still need: pieces (no count and no item quantities) and a design (no design source and no catalog design). */
export function consultationMissing(a: Appointment): string[] {
  const missing: string[] = [];
  const hasQuantities = a.items?.some((it) => (it.quantity ?? 0) > 0) ?? false;
  if (!a.pieces_count && !hasQuantities) missing.push('pieces');
  const hasDesignSource = !!a.design_source && a.design_source !== 'none';
  const hasCatalogItem = !!a.catalog_item || !!a.catalog_item_id || (a.items?.some((it) => !!it.catalog_item_id) ?? false);
  if (!hasDesignSource && !hasCatalogItem) missing.push('design');
  return missing;
}
