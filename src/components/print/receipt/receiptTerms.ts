import type { Job } from '@/components/jobs/jobTypes';
import type { QuotationData } from '@/components/jobs/readiness/readinessTypes';
import { depositFraction } from '@/components/jobs/requirements';
import { num } from './receiptFormat';
import type { ReceiptFigures } from './receiptMath';

/** The order as the API returns it: the job plus its saved quotation (cast to an array on the server, not typed on Job). */
export type ReceiptJob = Job & { quotation?: Partial<QuotationData> | null };

export interface PriceLine {
  label: string;
  /** Signed: negative amounts print with a leading minus. */
  amount: number;
}

/**
 * The quotation's price breakdown, or null when the order has none (or it no longer matches the order total,
 * e.g. the total was edited afterwards): then the single item line is shown instead.
 */
export function quotationLines(job: ReceiptJob, total: number): PriceLine[] | null {
  const q = job.quotation;
  if (!q || typeof q !== 'object' || q.base_price == null || Math.abs(num(q.total) - total) > 0.005) return null;
  const lines: PriceLine[] = [{ label: 'Service price', amount: num(q.base_price) }];
  if (num(q.quantity_adjustment) !== 0) lines.push({ label: 'Quantity pricing', amount: num(q.quantity_adjustment) });
  for (const c of q.additional_charges ?? []) lines.push({ label: `+ ${c.label}`, amount: num(c.amount) });
  for (const c of q.customer_provided_deduction ?? []) lines.push({ label: `- ${c.label}`, amount: -Math.abs(num(c.amount)) });
  return lines;
}

export interface PaymentTerms {
  label: string;
  required: number;
  paid: boolean;
}

/** What the order asks to be paid up front, and whether the verified payments already cover it. */
export function paymentTerms(job: Job, figures: ReceiptFigures): PaymentTerms | null {
  const policy = job.payment_policy;
  if (!policy || policy === 'none') return null;
  const fraction = depositFraction(policy, job.payment_policy_percent);
  const required = fraction * Math.max(0, figures.total - figures.discount);
  if (required <= 0) return null;
  const label = policy === 'full' ? 'Full payment required' : `Deposit required (${Math.round(fraction * 100)}%)`;
  return { label, required, paid: figures.totalPaid + 0.005 >= required };
}
