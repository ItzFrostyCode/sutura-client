import type { PriceLine } from './orderLines';

/**
 * The online order's money, worked out the same way the server does (JobOrderController::customerServiceOrder):
 *   subtotal = Σ over the lines (price for one − own-fabric deduction for one) × how many  (orderLines.ts)
 *   rush     = subtotal × the shop's rush %, or the shop's rush pesos × pieces (only when rush is asked)
 *   total    = subtotal + rush
 *   deposit  = total × the service's deposit % (or the whole total for "full payment")
 * A price "after quotation" has no number yet: every figure is then null and the copy says the shop sends it.
 */
export interface OrderMoneyInput {
  lines: PriceLine[];
  fabricEach: number;
  rushAsked: boolean;
  /** Pesos per piece when the shop charges rush per piece (then rushPercent is ignored). */
  rushPerPiece: number | null;
  rushPercent: number;
  depositPercent: number;
  payFull: boolean;
}

export interface OrderMoney {
  /** The price for one when every line costs the same; null when the lines differ or the shop quotes it. */
  unitPrice: number | null;
  pieces: number;
  /** The bill line by line (what each option costs × how many). */
  lines: PriceLine[];
  fabricTotal: number;
  subtotal: number | null;
  rushFee: number | null;
  total: number | null;
  dueBeforeProduction: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function orderMoney(i: OrderMoneyInput): OrderMoney {
  const pieces = i.lines.reduce((n, l) => n + l.qty, 0);
  // Every line needs a price for the order to have one; any quoted line makes the whole order quoted.
  const priced = i.lines.length > 0 && i.lines.every((l) => l.unit !== null && l.unit > 0);
  const fabricTotal = priced ? round2(i.lines.reduce((t, l) => t + Math.min(i.fabricEach, l.unit as number) * l.qty, 0)) : 0;
  const subtotal = priced ? round2(i.lines.reduce((t, l) => t + (l.unit as number) * l.qty, 0) - fabricTotal) : null;
  const units = [...new Set(i.lines.map((l) => l.unit))];
  const rushFee = !i.rushAsked ? 0
    : i.rushPerPiece !== null ? round2(i.rushPerPiece * pieces)
      : subtotal !== null ? round2((subtotal * i.rushPercent) / 100) : null;
  const total = subtotal !== null ? round2(subtotal + (rushFee ?? 0)) : null;
  const share = i.payFull ? 100 : i.depositPercent;
  return {
    unitPrice: priced && units.length === 1 ? (units[0] as number) : null,
    pieces,
    lines: i.lines,
    fabricTotal,
    subtotal,
    rushFee,
    total,
    dueBeforeProduction: total !== null ? round2((total * share) / 100) : null,
  };
}

export function peso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** "30%" / "15%" without trailing zeros. */
export const percent = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`;
