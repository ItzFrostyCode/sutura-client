import type { CatalogItem } from '@/components/catalog/catalogHelpers';
import { dateInDays, designUnitPrice } from './jobFormHelpers';
import type { JobCreateFormData, ServiceData } from './types';

const num = (v: string | null | undefined) => Number.parseFloat(v ?? '') || 0;

/** One piece: the design's price when it belongs to this service, else the service's starting price. null = quote it. */
function suggestedUnit(service: ServiceData | undefined, design: CatalogItem | null, serviceId: string): number | null {
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
export function useJobPricing(formData: JobCreateFormData, service: ServiceData | undefined, design: CatalogItem | null, isBulk: boolean, teamPieces = 1) {
  // A team order is priced per piece: every person's pieces count, so adding a person adds to the total.
  const quantity = isBulk ? Math.max(1, teamPieces) : Math.max(1, Number.parseInt(formData.quantity, 10) || 1);
  const unit = suggestedUnit(service, design, formData.service_id);
  const suggestedPrice = unit == null ? '' : (unit * quantity).toFixed(2);
  const price = formData.price ?? suggestedPrice;

  const days = design?.estimated_days ?? service?.estimated_days ?? null;
  const suggestedDue = days ? dateInDays(days) : '';
  const dueDate = formData.due_date ?? suggestedDue;

  const priceNum = num(price);
  const rushFee = formData.is_rush ? num(formData.rush_fee) : 0;
  const discountValue = num(formData.discount_value);
  const discount = Math.min(formData.discount_mode === 'percent' ? (priceNum * discountValue) / 100 : discountValue, priceNum + rushFee);
  const total = Math.max(0, priceNum + rushFee - discount);
  const downpayment = Math.min(num(formData.downpayment), total);

  return {
    quantity,
    price,
    needsQuote: unit == null,
    dueDate,
    rushFee,
    discount,
    total,
    downpayment,
    balance: total - downpayment,
    overpaid: Math.max(0, num(formData.downpayment) - total),
    tooQuick: Boolean(!formData.is_rush && service?.estimated_days && dueDate && dueDate < dateInDays(service.estimated_days)),
  };
}

export type JobPricing = ReturnType<typeof useJobPricing>;
