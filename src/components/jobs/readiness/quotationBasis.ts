import { designUnitPrice } from '../form/jobFormHelpers';
import type { Job } from '../jobHelpers';
import type { ChargeRow, QuotationData } from './readinessTypes';

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const sumRows = (rows: ChargeRow[]) => rows.reduce((t, r) => t + (Number(r.amount) || 0), 0);

export interface UnitBasis {
  /** What one piece costs from the service or design; null = the shop quotes it. */
  readonly amount: number | null;
  readonly source: 'design' | 'service' | null;
}

/** Same rule as the Create Job Order form: the design's price when it belongs to this service, else the service's own price. */
export function unitBasis(job: Job): UnitBasis {
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
