/**
 * The online order's money, worked out the same way the server does (JobOrderController::customerServiceOrder):
 *   subtotal = (price per piece − own-fabric deduction per piece) × pieces
 *   rush     = subtotal × the shop's rush %, or the shop's rush pesos × pieces (only when rush is asked)
 *   total    = subtotal + rush
 *   deposit  = total × the service's deposit % (or the whole total for "full payment")
 * A price "after quotation" has no number yet: every figure is then null and the copy says the shop sends it.
 */
export interface OrderMoneyInput {
  unitPrice: number | null;
  pieces: number;
  fabricEach: number;
  rushAsked: boolean;
  /** Pesos per piece when the shop charges rush per piece (then rushPercent is ignored). */
  rushPerPiece: number | null;
  rushPercent: number;
  depositPercent: number;
  payFull: boolean;
}

export interface OrderMoney {
  unitPrice: number | null;
  pieces: number;
  fabricTotal: number;
  subtotal: number | null;
  rushFee: number | null;
  total: number | null;
  dueBeforeProduction: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function orderMoney(i: OrderMoneyInput): OrderMoney {
  const priced = i.unitPrice !== null && i.unitPrice > 0;
  const each = priced ? Math.min(i.fabricEach, i.unitPrice as number) : 0;
  const fabricTotal = round2(each * i.pieces);
  const subtotal = priced ? round2(((i.unitPrice as number) - each) * i.pieces) : null;
  const rushFee = !i.rushAsked ? 0
    : i.rushPerPiece !== null ? round2(i.rushPerPiece * i.pieces)
      : subtotal !== null ? round2((subtotal * i.rushPercent) / 100) : null;
  const total = subtotal !== null ? round2(subtotal + (rushFee ?? 0)) : null;
  const share = i.payFull ? 100 : i.depositPercent;
  return {
    unitPrice: priced ? i.unitPrice : null,
    pieces: i.pieces,
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
