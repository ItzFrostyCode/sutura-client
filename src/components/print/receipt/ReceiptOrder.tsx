import React from 'react';
import { SHOP_STAGES, shopStageOf } from '@/components/jobs/jobStage';
import type { Job as BoardJob } from '@/components/jobs/jobHelpers';
import type { Job } from '@/components/jobs/jobTypes';
import { FULFILLMENT_LABELS, fmtDate, money, num } from './receiptFormat';
import type { ReceiptFigures } from './receiptMath';
import { paymentTerms, quotationLines, type PriceLine, type ReceiptJob } from './receiptTerms';
import { Row } from './ReceiptParts';

const signed = (n: number) => (n < 0 ? `-${money(-n)}` : money(n));

/** Service, quantity, dates and hand-over: only the lines the order actually has. */
export function OrderDetails({ job }: Readonly<{ job: ReceiptJob }>) {
  const service = job.service?.name ?? job.catalog_item?.name;
  const design = job.service?.name ? job.catalog_item?.name : null;
  const qty = num(job.quantity);
  return (
    <>
      {service && <Row text label="Service" value={service} />}
      {design && design !== service && <Row text label="Design" value={design} />}
      {qty > 1 && <Row text label="Quantity" value={`${qty} pcs`} />}
      {job.due_date && <Row text label="Due date" value={fmtDate(job.due_date)} />}
      {job.estimated_ready_at && <Row text label="Ready by" value={fmtDate(job.estimated_ready_at)} />}
      {job.fulfillment_type && <Row text label="Pickup / Delivery" value={FULFILLMENT_LABELS[job.fulfillment_type] ?? job.fulfillment_type} />}
      {job.is_rush && <p className="semi">RUSH ORDER</p>}
    </>
  );
}

/** The price: the quotation's breakdown when the order has one, else a single item line. */
export function PriceLines({ job, total }: Readonly<{ job: ReceiptJob; total: number }>) {
  // No separate rush fee line: the server records rush_fee but never adds it to total_amount, so it would not add up.
  const lines: PriceLine[] | null = quotationLines(job, total);
  if (lines) {
    return <>{lines.map((l, i) => <Row key={`${i}-${l.label}`} label={l.label} value={signed(l.amount)} />)}</>;
  }
  const name = [job.service?.name, job.catalog_item?.name].filter(Boolean).join(' - ') || 'Tailoring order';
  const qty = num(job.quantity);
  return <Row label={qty > 1 ? `${qty} x ${name}` : name} value={money(total)} />;
}

export const OrderTotalRow = ({ job, total }: Readonly<{ job: Job; total: number }>) => (
  <Row label={`Order total${job.quotation_status === 'estimate' ? ' (estimate)' : ''}`} value={money(total)} />
);

/** "Discount" with the amount; the reason (if any) goes on its own line below. */
export function DiscountRow({ figures }: Readonly<{ figures: ReceiptFigures }>) {
  if (figures.discount <= 0) return null;
  return (
    <>
      <Row label="Discount" value={`-${money(figures.discount)}`} />
      {figures.discountReason && <p className="sm ind">{figures.discountReason}</p>}
    </>
  );
}

export function PaymentTermsRows({ job, figures }: Readonly<{ job: Job; figures: ReceiptFigures }>) {
  const terms = paymentTerms(job, figures);
  if (!terms) return null;
  return (
    <>
      <Row label={terms.label} value={money(terms.required)} />
      <Row text label={job.payment_policy === 'full' ? 'Full payment' : 'Deposit'} value={terms.paid ? 'Paid' : 'Not yet paid'} />
    </>
  );
}

/** The customer-facing stage name ("Being made"), or why the order stopped. */
export function StatusRow({ job }: Readonly<{ job: Job }>) {
  if (job.status === 'cancelled') return <Row text label="Status" value="Cancelled" />;
  if (job.status === 'rejected') return <Row text label="Status" value="Not accepted" />;
  const key = shopStageOf(job as unknown as BoardJob);
  const label = SHOP_STAGES.find((s) => s.key === key)?.label;
  return label ? <Row text label="Status" value={label} /> : null;
}
