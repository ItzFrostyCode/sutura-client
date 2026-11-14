import api from '@/lib/axios';
import { rowArea, type OrderForm } from './useOrderForm';
import { tableFit, type Area } from './orderPoints';
import { answersFor, type AnswerContext } from './orderQuestions';

export interface PlacedOrder {
  id: number;
  order_number: string;
  tracking_code: string;
  total_amount: number;
}

/** Sends the order to POST /stores/{slug}/service-orders, in the shape JobOrderController::customerServiceOrder reads. */
export async function submitOrder(
  storeSlug: string,
  serviceId: number,
  f: OrderForm,
  o: { area: Area | ''; areaLocked: boolean; answerContext: AnswerContext; questions: { label?: string }[]; measurementsNeeded: boolean; sizesNeeded: boolean; chartSizes: boolean; rush: boolean; payFull: boolean },
): Promise<PlacedOrder> {
  const group = f.mode === 'group';
  const one = !group && o.sizesNeeded;
  // No body measurements for this service: the only way to size is a chart size.
  const source = o.measurementsNeeded ? f.source : 'standard';
  const res = await api.post(`/stores/${storeSlug}/service-orders`, {
    service_id: serviceId,
    contact_phone: f.phone,
    store_branch_id: f.branchId ?? undefined,
    order_mode: group ? 'bulk' : 'individual',
    pricing_id: f.pricingId ?? undefined,
    measure_area: o.sizesNeeded && o.area ? o.area : undefined,
    quantity: group ? undefined : f.quantity,
    // One person
    measurement_source: one ? source : undefined,
    wearer_name: !group ? f.wearer.trim() || undefined : undefined,
    cut: !group ? f.cut || undefined : undefined,
    measurement_id: one && source === 'saved' ? f.measurementId ?? undefined : undefined,
    size: one && source === 'standard' ? f.size : undefined,
    size_bottom: one && source === 'standard' && o.area === 'both' ? f.sizeBottom : undefined,
    individual_measurements: one && source === 'own' ? { unit: f.unit || 'in', ...f.points } : undefined,
    measurement_sheets: one && source === 'own' ? f.sheets : [],
    // Group
    team_name: group ? f.teamName.trim() || undefined : undefined,
    roster_unit: group ? (o.chartSizes ? f.unit || 'in' : 'in') : undefined,
    roster: group
      ? f.roster.map((r) => {
          const gets = rowArea(r, o.area, o.areaLocked);
          // No shop chart: the typed measurements (any blank is fine) make the person Custom Fit; none typed = the shop measures.
          if (!o.chartSizes) {
            const fit = tableFit(r.fit, gets || 'both', f.hiddenCols, r.units, f.customCols);
            const any = Object.keys(fit).length > 0;
            return {
              player_name: r.name.trim(), measure_area: gets || 'both',
              size: any ? 'Custom Fit' : 'To be measured', bottom_size: (gets || 'both') === 'both' ? (any ? 'Custom Fit' : 'To be measured') : undefined,
              fit_metrics: any ? fit : undefined, extra: Object.keys(r.extra).length ? r.extra : undefined,
            };
          }
          return {
            player_name: r.name.trim(),
            measure_area: gets || undefined,
            size: r.size,
            bottom_size: o.sizesNeeded && gets === 'both' ? r.bottomSize : undefined,
            fit_metrics: Object.keys(r.fit).length ? r.fit : undefined,
            extra: Object.keys(r.extra).length ? r.extra : undefined,
          };
        })
      : undefined,
    // Style
    catalog_item_id: f.designId ?? undefined,
    reference_images: f.photos,
    reference_link: f.link.trim() || undefined,
    material_source: f.material === 'own' ? 'customer_supplied' : 'store_supplied',
    material_description: f.material === 'own' ? f.materialNote.trim() || undefined : undefined,
    answers: (() => { const a = answersFor(f, o.questions, o.answerContext); return Object.keys(a).length ? a : undefined; })(),
    notes: f.notes.trim() || undefined,
    // Review
    needed_by: f.neededBy || undefined,
    rush_requested: o.rush,
    payment_term: o.payFull ? 'full' : 'downpayment',
    payment_method: f.payMethod || undefined,
  });
  return res.data.data as PlacedOrder;
}
