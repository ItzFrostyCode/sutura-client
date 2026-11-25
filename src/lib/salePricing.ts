/**
 * The Manila calendar day (YYYY-MM-DD) of a sale date. The API sends the bare
 * date the owner picked as a full timestamp in UTC (Nov 25 00:00 Manila =
 * "2026-11-24T16:00:00Z"), so slicing the string would land a day early.
 */
export function saleDay(value: string): string {
  if (value.length <= 10) return value;
  return new Date(value).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

export interface SaleAwareItem {
  price: string | number;
  sale_price?: string | number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
}

/**
 * A sale is active whenever sale_price is set AND (if given) the current
 * time falls within the optional start/end window — blank dates on either
 * side mean "no limit" on that side, matching "time limited or unlimited."
 * Shared by both Catalog items and Services so the rule never drifts apart.
 */
export function getActiveSale(item: SaleAwareItem): { original: number; sale: number; percentOff: number; endsAt: string | null } | null {
  const salePrice = item.sale_price != null ? Number(item.sale_price) : null;
  if (salePrice == null || Number.isNaN(salePrice)) return null;

  const original = Number(item.price);
  if (Number.isNaN(original) || salePrice >= original) return null;

  // sale_starts_at/sale_ends_at only ever carry a bare date (e.g.
  // "2026-08-10") from the date-picker forms. Parsed plain, JS treats that
  // as UTC midnight — for a Philippines store (UTC+8) that makes a sale
  // advertised as "through Aug 10" actually expire at 8am Manila time that
  // same day, and a sale "starting Aug 5" not kick in until 8am Manila time
  // instead of the start of that day. Anchor explicitly to Manila's day
  // boundaries (UTC+8) instead of letting the bare date default to UTC.
  const now = Date.now();
  if (item.sale_starts_at) {
    const datePart = saleDay(item.sale_starts_at);
    if (now < new Date(`${datePart}T00:00:00+08:00`).getTime()) return null;
  }
  if (item.sale_ends_at) {
    const datePart = saleDay(item.sale_ends_at);
    if (now > new Date(`${datePart}T23:59:59+08:00`).getTime()) return null;
  }

  const percentOff = Math.round(((original - salePrice) / original) * 100);
  return { original, sale: salePrice, percentOff, endsAt: item.sale_ends_at ?? null };
}

/** "Dec 1" for a sale date (read as a Manila day). */
export function saleDayLabel(value: string): string {
  return new Date(`${saleDay(value)}T12:00:00+08:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
}

/** "Ends Dec 1" for a sale's last day. */
export function saleEndLabel(endsAt: string | null | undefined): string | null {
  return endsAt ? `Ends ${saleDayLabel(endsAt)}` : null;
}
