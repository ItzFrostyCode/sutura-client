import { designUnitPrice } from '../form/jobFormHelpers';
import type { Job } from '../jobHelpers';
import type { ChargeRow, QuotationData } from './readinessTypes';

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const sumRows = (rows: ChargeRow[]) => rows.reduce((t, r) => t + (Number(r.amount) || 0), 0);

export interface UnitBasis {
  /** What one piece costs from the service or design; null = the shop quotes it. */
  readonly amount: number | null;
  readonly source: 'order' | 'design' | 'service' | null;
}

/** One line of the price: what it is, the price for one, how many (8 complete sets; 2 blouses). */
export interface QuoteLine { label: string; unit: number; qty: number }

const orderData = (job: Job) => (job.custom_order_data ?? {}) as Record<string, unknown>;

/** The order's own lines when its people got different options (set by the online order or a saved quotation). */
export function orderLines(job: Job): QuoteLine[] | null {
  const raw = orderData(job).price_lines;
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const lines = raw.map((l) => ({ label: String(l?.label ?? ''), unit: Number(l?.unit) || 0, qty: Math.max(1, Math.floor(Number(l?.qty) || 1)) }));
  return lines.every((l) => l.label) ? lines : null;
}

/** The customer's own fabric taken off when the order was placed: the quotation starts with it, so it is never lost. */
export function orderFabricDeduction(job: Job): ChargeRow[] {
  const n = Number(orderData(job).own_fabric_deduction);
  return n > 0 ? [{ label: "Customer's own fabric", amount: n }] : [];
}

/** Same rule as the Create Job Order form: the design's price when it belongs to this service, else the service's own price. */
export function unitBasis(job: Job): UnitBasis {
  // What the customer actually ordered comes first: the option they picked (with any design price), saved on the order.
  const rate = Number(orderData(job).item_rate);
  if (Number.isFinite(rate) && rate > 0) return { amount: rate, source: 'order' };
  const item = job.catalog_item;
  if (item) {
    if (item.pricing?.mode === 'quote') return { amount: null, source: null };
    const unit = designUnitPrice(item);
    const sameService = item.service_id == null || String(item.service_id) === String(job.service?.id);
    if (unit != null && sameService) return { amount: unit, source: 'design' };
  }
  const base = Number(job.service?.base_price) || 0;
  return base > 0 ? { amount: base, source: 'service' } : { amount: null, source: null };
}

/** The per-piece price inside a saved base price, when it divides into whole cents; null when it does not (or one piece). */
export function perPiece(base: number, pieces: number): number | null {
  if (pieces < 2 || base <= 0) return null;
  const unit = round2(base / pieces);
  return Math.abs(unit * pieces - base) < 0.005 ? unit : null;
}

export interface PriceStart {
  readonly unit: number;
  readonly extras: ChargeRow[];
  readonly discount: number;
}

/**
 * The price fields a saved quotation opens with. The old window saved one whole-order service price, so it is divided by
 * the pieces; a positive "quantity adjustment" (old data) becomes an extra charge line, a negative one the bulk discount,
 * and cents lost in the division go to one of them, so the total never moves by opening the window.
 */
export function priceStart(q: QuotationData | null | undefined, pieces: number, basis: number | null, rushExtras: ChargeRow[]): PriceStart {
  const base = Number(q?.base_price) || 0;
  if (!q || base <= 0) return { unit: basis ?? 0, extras: q ? [...(q.additional_charges ?? [])] : rushExtras, discount: 0 };
  const unit = round2(base / Math.max(1, pieces));
  const leftover = round2(base - unit * Math.max(1, pieces));
  const adj = Number(q.quantity_adjustment) || 0;
  const extras = [...(q.additional_charges ?? [])];
  let discount = adj < 0 ? -adj : 0;
  if (adj > 0) extras.push({ label: 'Quantity pricing', amount: adj });
  if (leftover > 0) extras.push({ label: 'Earlier price rounding', amount: leftover });
  else if (leftover < 0) discount += -leftover;
  return { unit, extras, discount: round2(discount) };
}
