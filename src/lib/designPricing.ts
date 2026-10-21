/**
 * What a design costs, as the server works it out (sutura-server App\Support\DesignPricing).
 * A design is a style under a service: by default it costs what its service costs. The shop can
 * add an extra charge for a design, or say it needs a quotation. Service prices are starting
 * prices; the confirmed price is the order's quotation, which the customer approves.
 */
export type DesignPricingMode = 'same' | 'set' | 'extra' | 'quote' | 'own';

export interface DesignPricing {
  mode: DesignPricingMode;
  service_price: number | null;
  extra_charge: number | null;
  /** The price the customer starts from; null when the shop has to quote it. */
  amount: number | null;
  /** The amount without the service's sale, only while a sale is on. */
  regular_amount: number | null;
  needs_quote: boolean;
}

/** The owner's choice on a design (`own` is never chosen — it is a design with no service). */
export const DESIGN_PRICING_CHOICES: { value: Exclude<DesignPricingMode, 'own'>; label: string; hint: string }[] = [
  { value: 'same', label: 'Same as the service', hint: 'The customer pays the parent service base price.' },
  { value: 'set', label: 'Set price for this design', hint: 'This design has its own standalone base price (service price is not added).' },
  { value: 'extra', label: 'Add a charge to the service price', hint: 'The service base price plus an additional surcharge for this design.' },
  { value: 'quote', label: 'Price on quotation', hint: 'You give the price after seeing and reviewing the request.' },
];

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 2 })}`;

/** Short price for cards and lists: "From ₱1,500" or "Price on quotation". */
export function designPriceLabel(pricing: DesignPricing | null | undefined, legacyPrice?: number | string | null): string {
  if (pricing) return pricing.amount != null ? `From ${peso(pricing.amount)}` : 'Price on quotation';
  // A response from before pricing existed (stale cache): show the stored price as before.
  const n = legacyPrice != null ? Number(legacyPrice) : 0;
  return n > 0 ? peso(n) : 'Price on quotation';
}

/** The full price block on a design page: the price, a struck-out regular price during a sale, and one plain sentence. */
export function designPriceDetail(pricing: DesignPricing, serviceName?: string | null): { main: string; struck: string | null; note: string } {
  const service = serviceName ? `the ${serviceName} service` : 'the service';
  const struck = pricing.regular_amount != null ? peso(pricing.regular_amount) : null;
  if (pricing.amount == null) {
    return { main: 'Price on quotation', struck: null, note: 'The shop gives you the price after looking at your request. You approve it before any work starts.' };
  }
  const main = `From ${peso(pricing.amount)}`;
  if (pricing.mode === 'set') {
    return { main, struck, note: `Base price for this design. The shop confirms the final price.` };
  }
  if (pricing.mode === 'extra' && pricing.service_price != null) {
    return { main, struck, note: `${peso(pricing.service_price)} for ${service} + ${peso(pricing.extra_charge ?? 0)} for this design. The shop confirms the final price.` };
  }
  if (pricing.mode === 'same') {
    return { main, struck, note: `Same price as ${service}. It changes only for custom work or add-ons, and you approve the final price.` };
  }
  return { main, struck, note: 'The shop confirms the final price before any work starts.' };
}
