import React from 'react';
import type { Job } from '@/components/jobs/jobTypes';
import type { Store } from '@/store/useAuthStore';
import { METHOD_LABELS, TYPE_LABELS, fmtDateTime, money, num } from './receiptFormat';
import { isPending, type ReceiptFigures, type SingleFigures } from './receiptMath';
import { CustomerRows, ReceiptFooter, ReceiptHeader, Row, Rule, SignatureLine } from './ReceiptParts';
import { DiscountRow, OrderDetails, OrderTotalRow, PaymentTermsRows, PriceLines } from './ReceiptOrder';
import type { ReceiptJob } from './receiptTerms';

function MethodRows({ single }: Readonly<{ single: SingleFigures }>) {
  const { payment } = single;
  const amount = num(payment.amount);
  const ref = payment.reference ? <Row text label="Reference no." value={payment.reference} /> : null;
  switch (payment.payment_method) {
    case 'cash':
      return (
        <>
          <Row label="Cash tendered" value={money(num(payment.cash_tendered ?? amount))} />
          {payment.change_amount != null && <Row label="Change" value={money(num(payment.change_amount))} />}
        </>
      );
    case 'gcash':
    case 'paymaya':
      return <><Row label={`Sent via ${METHOD_LABELS[payment.payment_method]}`} value={money(amount)} />{ref}</>;
    default:
      return <><Row label={`Received (${METHOD_LABELS[payment.payment_method] ?? payment.payment_method})`} value={money(amount)} />{ref}</>;
  }
}

/** One payment's receipt: what was paid, how, and what is still owed after it. */
export function AcknowledgementReceipt({ job, store, figures, single }: Readonly<{ job: Job; store: Store | null; figures: ReceiptFigures; single: SingleFigures }>) {
  const { payment } = single;
  const type = payment.type ? TYPE_LABELS[payment.type] : null;
  const rJob = job as ReceiptJob;
  const paidAt = fmtDateTime(payment.created_at);
  const printedAt = fmtDateTime(new Date().toISOString());
  return (
    <div className="slip">
      <ReceiptHeader store={store} job={job} />
      <Rule />
      <p className="c semi">ACKNOWLEDGEMENT RECEIPT</p>
      <Row text label="Receipt no." value={single.receiptNo} />
      <Row text label="Date" value={paidAt} />
      {printedAt !== paidAt && <Row text label="Printed" value={printedAt} />}
      {payment.recorded_by && <Row text label="Cashier" value={payment.recorded_by.name} />}
      <Row text label="Order no." value={job.order_number} />
      {job.tracking_code && <Row text label="Tracking code" value={job.tracking_code} />}
      <CustomerRows job={job} />
      <Rule />
      <OrderDetails job={rJob} />
      <Rule />
      <PriceLines job={rJob} total={figures.total} />
      <Rule />
      <OrderTotalRow job={job} total={figures.total} />
      <DiscountRow figures={figures} />
      <PaymentTermsRows job={job} figures={figures} />
      <Row label="Paid before this receipt" value={money(single.paidBefore)} />
      <Row strong label={`THIS PAYMENT${type ? ` (${type})` : ''}`} value={money(num(payment.amount))} />
      <MethodRows single={single} />
      {isPending(payment) && <p className="semi">PENDING VERIFICATION — not yet applied to the balance</p>}
      {payment.rejected_at && <p className="semi">REJECTED{payment.rejected_reason ? ` — ${payment.rejected_reason}` : ''}</p>}
      <Row strong large label="Balance after this payment" value={money(single.balanceAfter)} />
      <Rule />
      <SignatureLine name={payment.recorded_by?.name} />
      <Rule />
      <ReceiptFooter job={job} />
    </div>
  );
}
