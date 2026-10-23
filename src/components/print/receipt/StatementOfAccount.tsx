import React from 'react';
import type { Job } from '@/components/jobs/jobTypes';
import type { Store } from '@/store/useAuthStore';
import { METHOD_LABELS, fmtDateTime, money, num } from './receiptFormat';
import { isPending, type ReceiptFigures } from './receiptMath';
import { CustomerRows, ReceiptFooter, ReceiptHeader, Row, Rule } from './ReceiptParts';
import { DiscountRow, OrderDetails, OrderTotalRow, PaymentTermsRows, PriceLines, StatusRow } from './ReceiptOrder';
import type { ReceiptJob } from './receiptTerms';

/** The whole order's account: every payment, what was verified, and the balance due. */
export function StatementOfAccount({ job, store, figures }: Readonly<{ job: Job; store: Store | null; figures: ReceiptFigures }>) {
  return (
    <div className="slip">
      <ReceiptHeader store={store} job={job} />
      <Rule />
      <p className="c semi">STATEMENT OF ACCOUNT</p>
      <Row text label="Printed" value={fmtDateTime(new Date().toISOString())} />
      <Row text label="Order no." value={job.order_number} />
      {job.tracking_code && <Row text label="Tracking code" value={job.tracking_code} />}
      <CustomerRows job={job} />
      <StatusRow job={job} />
      <Rule />
      <OrderDetails job={job as ReceiptJob} />
      <Rule />
      <PriceLines job={job as ReceiptJob} total={figures.total} />
      <Rule />
      <p className="semi">Payments</p>
      {figures.payments.length === 0 && <p>No payments recorded yet.</p>}
      {figures.payments.map((p) => (
        <div key={p.id}>
          <Row label={`${fmtDateTime(p.created_at)} · ${METHOD_LABELS[p.payment_method] ?? p.payment_method}`} value={money(num(p.amount))} />
          {(isPending(p) || p.rejected_at) && <p className="sm">{p.rejected_at ? '(rejected, not counted)' : '(pending)'}</p>}
        </div>
      ))}
      <Rule />
      <OrderTotalRow job={job} total={figures.total} />
      <DiscountRow figures={figures} />
      <PaymentTermsRows job={job} figures={figures} />
      <Row label="Total paid (verified only)" value={money(figures.totalPaid)} />
      {figures.pendingTotal > 0 && <Row label="Pending verification" value={money(figures.pendingTotal)} />}
      <Row strong large label="BALANCE DUE" value={money(figures.balanceDue)} />
      <Rule />
      <ReceiptFooter job={job} />
    </div>
  );
}
