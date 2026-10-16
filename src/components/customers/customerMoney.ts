import type { JobOrder, OrderPayment } from './customerTypes';

export const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const amountOf = (v: string | number | null | undefined) => Number.parseFloat(String(v ?? 0)) || 0;

/** Orders that still owe money (not cancelled or declined), biggest balance first. */
export const owingOrders = (jobs: JobOrder[]) =>
  jobs.filter((j) => !['cancelled', 'rejected'].includes(j.status) && amountOf(j.balance) > 0).sort((a, b) => amountOf(b.balance) - amountOf(a.balance));

/** Money received on an order: counted payments only (not rejected ones). */
export const receivedOn = (job: JobOrder) => (job.payments ?? []).filter((p) => !p.rejected_at).reduce((sum, p) => sum + amountOf(p.amount), 0);

/** Where the customer stands across every live order. */
export function moneySummary(jobs: JobOrder[]) {
  const live = jobs.filter((j) => !['cancelled', 'rejected'].includes(j.status));
  const billed = live.reduce((sum, j) => sum + amountOf(j.total_amount) - amountOf(j.discount_amount), 0);
  const balance = live.reduce((sum, j) => sum + amountOf(j.balance), 0);
  return { billed, balance, paid: Math.max(0, billed - balance) };
}

export type PaymentState = 'verified' | 'pending' | 'rejected';
export const stateOf = (p: OrderPayment): PaymentState => (p.rejected_at ? 'rejected' : p.verified_at ? 'verified' : 'pending');
