import type { ConnectedOrder } from '../detailTypes';

// How the order came in — the same Walk-in / Online split the Jobs page uses.
export type OrderKind = 'walkin' | 'online';

export const kindOf = (o: ConnectedOrder): OrderKind => (o.intake_channel === 'online' ? 'online' : 'walkin');

export const KIND_LABEL: Record<OrderKind, string> = { walkin: 'Walk-in', online: 'Online' };

// A tailored job order (made to measure) as opposed to a ready walk-in sale of the design.
export const isJob = (o: ConnectedOrder) => o.type === 'Custom Job Order';

// Walk-in sales and job orders share one series (JO-0001, JO-0002, …), so an
// order has exactly one number wherever it is shown.
export function orderCode(o: ConnectedOrder): string {
  return o.order_number || `#${o.id}`;
}

export const peso = (n: number | string | null | undefined) =>
  `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// The two order types use different words for the same thing
// (walk-in: pending, job: unpaid) — show one vocabulary.
export type PaymentTone = 'paid' | 'partial' | 'unpaid';
export function paymentOf(o: ConnectedOrder): { label: string; tone: PaymentTone } {
  const raw = (o.payment_status || '').toLowerCase();
  if (raw === 'paid') return { label: 'Paid', tone: 'paid' };
  if (raw === 'partial') return { label: 'Partial', tone: 'partial' };
  return { label: 'Unpaid', tone: 'unpaid' };
}

export type PaySort = 'asc' | 'desc' | null;

// Paid → Partial → Unpaid
export const PAYMENT_RANK: Record<PaymentTone, number> = { paid: 0, partial: 1, unpaid: 2 };

export const PAYMENT_CLASS: Record<PaymentTone, string> = {
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  partial: 'bg-amber-50 text-amber-800 border-amber-200',
  unpaid: 'bg-zinc-100 text-zinc-700 border-zinc-200',
};

export function statusLabel(o: ConnectedOrder): string {
  const raw = (o.status || 'pending').replaceAll('_', ' ');
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// Every order here is made to order — even a walk-in sale is tailored at the
// fitting. The size is just the starting reference the customer picked; an
// order that recorded none is simply measured at the fitting.
export function sizeLabel(o: ConnectedOrder): string {
  return o.selected_size ? `Size ${o.selected_size}` : 'Measured at fitting';
}

export const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

/** Second line under the amount: the balance still owed, when there is one. */
export function amountNote(o: ConnectedOrder): string | null {
  const balance = Number(o.balance || 0);
  if (paymentOf(o).tone === 'partial' && balance > 0) return `${peso(balance)} balance`;
  if (paymentOf(o).tone === 'unpaid' && isJob(o) && balance > 0) return `${peso(balance)} due`;
  return null;
}
