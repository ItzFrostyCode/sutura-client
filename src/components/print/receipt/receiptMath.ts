import type { Job, Payment } from '@/components/jobs/jobTypes';
import { num } from './receiptFormat';

/** Counts toward the balance: not rejected, and verified (cash is verified on the spot). */
export const isVerified = (p: Payment) => !p.rejected_at && (p.status ?? 'verified') === 'verified';
export const isPending = (p: Payment) => !p.rejected_at && p.status === 'pending_verification';

export interface ReceiptFigures {
  total: number;
  discount: number;
  discountReason: string | null;
  /** Total paid, verified only: total - balance - discount (same formula as the cashier desk). */
  totalPaid: number;
  pendingTotal: number;
  balanceDue: number;
  payments: Payment[];
}

export function receiptFigures(job: Job): ReceiptFigures {
  const total = num(job.total_amount);
  const discount = num(job.discount_amount);
  const balanceDue = Math.max(0, num(job.balance));
  const reason = job.custom_order_data?.discount_reason;
  const payments = [...(job.payments ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || a.id - b.id,
  );
  return {
    total,
    discount,
    discountReason: typeof reason === 'string' && reason ? reason : null,
    totalPaid: Math.max(0, total - balanceDue - discount),
    pendingTotal: payments.filter(isPending).reduce((s, p) => s + num(p.amount), 0),
    balanceDue,
    payments,
  };
}

export interface SingleFigures {
  payment: Payment;
  receiptNo: string;
  paidBefore: number;
  balanceAfter: number;
}

/** Figures for one payment's acknowledgement receipt, as of the moment that payment was recorded. */
export function singleFigures(job: Job, figures: ReceiptFigures, paymentId: number): SingleFigures | null {
  const index = figures.payments.findIndex((p) => p.id === paymentId);
  if (index < 0) return null;
  const payment = figures.payments[index];
  const paidBefore = figures.payments.slice(0, index).filter(isVerified).reduce((s, p) => s + num(p.amount), 0);
  const applied = isVerified(payment) ? num(payment.amount) : 0;
  return {
    payment,
    receiptNo: `${job.order_number}-P${index + 1}`,
    paidBefore,
    balanceAfter: Math.max(0, figures.total - figures.discount - paidBefore - applied),
  };
}
