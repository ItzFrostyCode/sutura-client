import type { PublicService } from '@/components/store-storefront/types';
import type { RosterRow } from './useOrderForm';

export type PricingOption = NonNullable<PublicService['pricing']>[number];
export interface DesignPricingInfo { mode: string; amount: number | null; extra_charge: number | null; needs_quote: boolean }

/** One line of the bill: an option, its price for one, and how many. unit null = the shop quotes it. */
export interface PriceLine { label: string; unit: number | null; qty: number }

/**
 * The price of one of an option, the same way the server works it out (JobOrderController::customerServiceOrder):
 * the option's price, else the service's; a picked design then replaces it (own price), adds to it (extra) or asks for a quote.
 */
export function unitFor(option: PricingOption | null, service: PublicService | null, design: DesignPricingInfo | null, quoted: boolean): number | null {
  if (quoted) return null;
  const n = Number(option?.amount ?? service?.base_price);
  const base = Number.isFinite(n) && n > 0 ? n : null;
  if (design?.mode === 'set') return design.amount ?? base;
  if (design?.mode === 'extra' && base !== null) return base + Number(design.extra_charge ?? 0);
  return base;
}

/** The options a person on a group order can each pick from: every option that says what it covers (top / bottom / set). */
export const partOptions = (pricing: PricingOption[]) => pricing.filter((p) => p.covers === 'top' || p.covers === 'bottom' || p.covers === 'both');

/** This person's option: their own pick, else the order's. */
export const optionOfRow = (row: RosterRow, pricing: PricingOption[], orderOption: PricingOption | null) =>
  pricing.find((p) => p.id === row.pricingId) ?? orderOption;

/**
 * The bill as lines. One person: one line (the option × how many). A group: one line per option, counting the people
 * on it — so 8 complete sets and 2 blouses read as two lines with their own prices, never one price for everyone.
 */
export function priceLines(a: {
  group: boolean; roster: RosterRow[]; quantity: number; pricing: PricingOption[]; option: PricingOption | null;
  service: PublicService | null; design: DesignPricingInfo | null; quoted: boolean;
}): PriceLine[] {
  const labelOf = (o: PricingOption | null) => o?.label ?? a.service?.name ?? 'Order';
  if (!a.group) return [{ label: labelOf(a.option), unit: unitFor(a.option, a.service, a.design, a.quoted), qty: Math.max(1, a.quantity) }];
  const lines = new Map<string, PriceLine>();
  for (const row of a.roster) {
    const o = optionOfRow(row, a.pricing, a.option);
    const unit = unitFor(o, a.service, a.design, a.quoted);
    const key = `${labelOf(o)}|${unit}`;
    const line = lines.get(key) ?? { label: labelOf(o), unit, qty: 0 };
    line.qty += 1;
    lines.set(key, line);
  }
  return [...lines.values()];
}
