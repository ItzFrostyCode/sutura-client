/**
 * A Service's base_price is a reference/starting figure, not a promise of
 * the final transaction amount — the real total lives on the JobOrder once
 * one exists. base_price is nullable at the schema level (services.base_price),
 * which is the one real signal of a genuinely quote-based service already
 * present in the data — never fabricated here.
 */
export function getServicePriceLabel(basePrice: string | number | null | undefined): string {
  if (basePrice === null || basePrice === undefined || basePrice === '') {
    return 'Price depends on requirements';
  }
  const amount = Number(basePrice);
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Price depends on requirements';
  }
  return `Starting at ₱${amount.toLocaleString()}`;
}

export function isQuoteBasedService(basePrice: string | number | null | undefined): boolean {
  if (basePrice === null || basePrice === undefined || basePrice === '') return true;
  const amount = Number(basePrice);
  return !Number.isFinite(amount) || amount <= 0;
}

/** How a service shows its price (B6-O11): one of three, never a range. Older rows without it read as Starting. */
export type PriceDisplay = 'fixed' | 'starting' | 'quotation';

/** The words before the amount: "From " for a starting price, nothing for a fixed price. */
export function priceLead(display?: PriceDisplay | null): string {
  return display === 'fixed' ? '' : 'From ';
}

/** True when the customer should see "Price after quotation" instead of an amount. */
export function showsQuotation(display?: PriceDisplay | null, basePrice?: string | number | null): boolean {
  return display === 'quotation' || isQuoteBasedService(basePrice);
}

export const QUOTATION_LABEL = 'Price after quotation';
