import React from 'react';
import type { Job } from '@/components/jobs/jobTypes';
import { useAuthStore, type Store } from '@/store/useAuthStore';

/** Inkless till slip: white page, black text, dashed rules, Arial, nothing shaded. */
export const RECEIPT_CSS = `
  @page { margin: 6mm; }
  body { background: #fff; }
  #receipt-print-area { padding: 16px; }
  @media print { #receipt-print-area { padding: 0 !important; } }
  .slip { max-width: 72mm; margin: 0 auto; color: #000; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; line-height: 1.35; font-variant-numeric: tabular-nums; }
  .slip .c { text-align: center; }
  .slip .r { text-align: right; }
  .slip .sm { font-size: 8pt; }
  .slip .semi { font-weight: 600; }
  .slip .lg { font-size: 12pt; }
  .slip .ind { padding-left: 2mm; overflow-wrap: anywhere; }
  .slip .rule { border-top: 1px dashed #000; margin: 2.5mm 0; }
  .slip .row { display: flex; justify-content: space-between; align-items: baseline; gap: 3mm; }
  .slip .row > :first-child { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
  .slip .row > :last-child { flex: none; white-space: nowrap; text-align: right; }
  .slip .row.text > :first-child { flex: none; }
  .slip .row.text > :last-child { flex: 1 1 auto; min-width: 0; white-space: normal; overflow-wrap: anywhere; }
  .slip .sign { width: 40mm; margin: 10mm auto 0; border-top: 1px solid #000; }
  .slip p { margin: 0; }
`;

export const Rule = () => <div className="rule" />;

/** One label/value line. Money values stay on one line and the label wraps; `text` rows let a long value (a name) wrap instead. */
export function Row({ label, value, strong, large, text }: Readonly<{ label: React.ReactNode; value?: React.ReactNode; strong?: boolean; large?: boolean; text?: boolean }>) {
  return (
    <div className={`row${text ? ' text' : ''}${strong ? ' semi' : ''}${large ? ' lg' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function ReceiptHeader({ store, job }: Readonly<{ store: Store | null; job: Job }>) {
  const address = [store?.address, store?.city, store?.province].filter(Boolean).join(', ');
  return (
    <header className="c">
      <p className="semi lg">{store?.name ?? 'SUTURA'}</p>
      {job.branch?.name && <p>{job.branch.name}</p>}
      {address && <p className="sm">{address}</p>}
      {store?.phone && <p className="sm">Tel. {store.phone}</p>}
    </header>
  );
}

/** Customer name, with their email on the next line when we have one. */
export function CustomerRows({ job }: Readonly<{ job: Job }>) {
  return (
    <>
      <Row text label="Customer" value={job.customer?.name ?? 'Walk-in customer'} />
      {job.customer?.email && <p className="sm r">{job.customer.email}</p>}
    </>
  );
}

/** Optional signature line (receipts): the cashier's name sits under it. */
export function SignatureLine({ name }: Readonly<{ name?: string | null }>) {
  return (
    <div>
      <p className="sm">Received by:</p>
      <div className="sign" />
      {name && <p className="c sm">{name}</p>}
    </div>
  );
}

export function ReceiptFooter({ job }: Readonly<{ job: Job }>) {
  const user = useAuthStore((s) => s.user);
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  return (
    <footer className="c sm">
      {user?.name && <p>Printed by: {user.name}</p>}
      {job.tracking_code && <p>Track your order: {origin}/track/{job.tracking_code}</p>}
      <p>Thank you!</p>
      <p>This document is not valid for claim of input tax.</p>
    </footer>
  );
}
