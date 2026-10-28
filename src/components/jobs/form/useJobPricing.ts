import type { CatalogItem } from '@/components/catalog/catalogHelpers';
import { dateInDays, designUnitPrice } from './jobFormHelpers';
import type { JobCreateFormData, ServiceData } from './types';

const num = (v: string | null | undefined) => Number.parseFloat(v ?? '') || 0;

/** One ordered unit: the chosen option's price, else the design's price when it belongs to this service, else the service's starting price. null = quote it. */
function suggestedUnit(service: ServiceData | undefined, design: CatalogItem | null, serviceId: string, optionAmount: number | null): number | null {
  // The option chosen is priced per ordered unit (a garment or a set); it is the suggestion, and the owner can still type their own.
  if (optionAmount != null && optionAmount > 0) return optionAmount;
  if (design) {
    if (design.pricing?.mode === 'quote') return null;
    const unit = designUnitPrice(design);
    if (unit != null && (design.service_id == null || String(design.service_id) === serviceId)) return unit;
  }
  const base = num(service?.base_price?.toString());
  return base > 0 ? base : null;
}

/**
 * Price, due date and balance worked out from the choices made so far. The price and date are suggestions until
 * the owner types their own (then `formData.price` / `formData.due_date` are not null) — no effects, so a changed
 * service or quantity can never leave a stale number behind.
 */
export function useJobPricing(formData: JobCreateFormData, service: ServiceData | undefined, design: CatalogItem | null, isBulk: boolean, teamPieces = 1, optionAmount: number | null = null) {
  // A team order is priced per piece: every person's pieces count, so adding a person adds to the total.
  const quantity = isBulk ? Math.max(1, teamPieces) : Math.max(1, Number.parseInt(formData.quantity, 10) || 1);
  const suggested = suggestedUnit(service, design, formData.service_id, optionAmount);
  // The owner may type the price of one piece (a top only, a bottom only…); the total follows the number of pieces.
  const typedUnit = formData.unit_price != null && formData.unit_price.trim() !== '' ? num(formData.unit_price) : null;
  const unit = typedUnit ?? suggested;
  const suggestedPrice = unit == null ? '' : (unit * quantity).toFixed(2);
  const price = formData.price ?? suggestedPrice;

  // One turnaround drives the suggested date, the "ready around" line and the "too quick" warning: the design's own
  // estimate when it has one, else the service's. The date promised is the end of a range (5–6 days → day 6), not its best case.
  const fromDesign = Boolean(design?.estimated_days);
  const days = (fromDesign ? design?.estimated_days : service?.estimated_days) ?? null;
  const daysMax = (fromDesign ? design?.estimated_days_max : service?.estimated_days_max) ?? null;
  const promiseDays = days && daysMax && daysMax > days ? daysMax : days;
  const suggestedDue = promiseDays ? dateInDays(promiseDays) : '';
  const dueDate = formData.due_date ?? suggestedDue;

  const priceNum = num(price);
  const rushFee = formData.is_rush ? num(formData.rush_fee) : 0;
  const discountValue = num(formData.discount_value);
  const discount = Math.min(formData.discount_mode === 'percent' ? (priceNum * discountValue) / 100 : discountValue, priceNum + rushFee);
  const total = Math.max(0, priceNum + rushFee - discount);
  const downpayment = Math.min(num(formData.downpayment), total);

  return {
    quantity,
    /** One piece: what is typed, else the design's or service's price. null = to be quoted. */
    unit,
    suggestedUnit: suggested,
    price,
    needsQuote: unit == null,
    dueDate,
    rushFee,
    discount,
    total,
    downpayment,
    balance: total - downpayment,
    overpaid: Math.max(0, num(formData.downpayment) - total),
    /** Earlier than the shortest time this service or design usually takes. */
    tooQuick: Boolean(!formData.is_rush && days && dueDate && dueDate < dateInDays(days)),
    /** The usual turnaround in days (shortest, longest) that the dates above come from. */
    turnaround: { days, daysMax },
  };
}

export type JobPricing = ReturnType<typeof useJobPricing>;
