import React from 'react';
import { History, Receipt } from 'lucide-react';
import { Job, Payment } from '../jobTypes';
import { ComputedFinancials } from './financialsTypes';
import SectionHeader from '../ui/SectionHeader';
import { PaymentItemRow } from './PaymentItemRow';

interface PaymentAuditLedgerProps {
  readonly job: Job;
  readonly financials: ComputedFinancials;
  readonly isOwnerOrManager: boolean;
  readonly verifyingPaymentId: number | null;
  readonly onVerifyPayment: (paymentId: number) => Promise<void>;
  readonly editingPaymentId: number | null;
  readonly setEditingPaymentId: (id: number | null) => void;
  readonly editMethod: string;
  readonly setEditMethod: (m: string) => void;
  readonly editReference: string;
  readonly setEditReference: (r: string) => void;
  readonly editNotes: string;
  readonly setEditNotes: (n: string) => void;
  readonly savingEdit: boolean;
  readonly onSaveEdit: (paymentId: number) => Promise<void>;
  readonly onStartEditPayment: (payment: Payment) => void;
  readonly menuOpenPaymentId: number | null;
  readonly setMenuOpenPaymentId: React.Dispatch<React.SetStateAction<number | null>>;
  readonly rejectingPaymentId: number | null;
  readonly setRejectingPaymentId: (id: number | null) => void;
  readonly rejectReason: string;
  readonly setRejectReason: (r: string) => void;
  readonly submittingReject: boolean;
  readonly onSubmitReject: (paymentId: number) => Promise<void>;
}

export function PaymentAuditLedger({
  job,
  financials,
  isOwnerOrManager,
  verifyingPaymentId,
  onVerifyPayment,
  editingPaymentId,
  setEditingPaymentId,
  editMethod,
  setEditMethod,
  editReference,
  setEditReference,
  editNotes,
  setEditNotes,
  savingEdit,
  onSaveEdit,
  onStartEditPayment,
  menuOpenPaymentId,
  setMenuOpenPaymentId,
  rejectingPaymentId,
  setRejectingPaymentId,
  rejectReason,
  setRejectReason,
  submittingReject,
  onSubmitReject,
}: PaymentAuditLedgerProps) {
  const { jobIsCompleted } = financials;
  const payments = job.payments || [];

  return (
    <section className="rounded-2xl border border-line bg-surface shadow-2xs" aria-label="Payment history and audit ledger">
      <div className="border-b border-line px-5 py-4 sm:px-6">
        <SectionHeader
          icon={History}
          title="Payment History & Audit Ledger"
          as="h3"
          badge={<span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs font-medium text-ink-muted">{payments.length}</span>}
          actions={jobIsCompleted ? (
            <span className="rounded-full bg-sunken px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Ledger Locked</span>
          ) : undefined}
        />
      </div>

      {payments.length > 0 ? (
        <div className="divide-y divide-line px-5 sm:px-6">
          {payments.map(payment => (
            <PaymentItemRow
              key={payment.id}
              payment={payment}
              jobId={job.id}
              jobIsCompleted={jobIsCompleted}
              isOwnerOrManager={isOwnerOrManager}
              verifying={verifyingPaymentId === payment.id}
              onVerify={() => onVerifyPayment(payment.id)}
              menuOpen={menuOpenPaymentId === payment.id}
              onToggleMenu={() => setMenuOpenPaymentId(p => (p === payment.id ? null : payment.id))}
              isEditing={editingPaymentId === payment.id}
              onStartEdit={() => {
                onStartEditPayment(payment);
                setMenuOpenPaymentId(null);
              }}
              onCancelEdit={() => setEditingPaymentId(null)}
              editMethod={editMethod}
              setEditMethod={setEditMethod}
              editReference={editReference}
              setEditReference={setEditReference}
              editNotes={editNotes}
              setEditNotes={setEditNotes}
              savingEdit={savingEdit}
              onSaveEdit={() => onSaveEdit(payment.id)}
              isRejecting={rejectingPaymentId === payment.id}
              onStartReject={() => {
                setEditingPaymentId(null);
                setRejectingPaymentId(payment.id);
                setMenuOpenPaymentId(null);
              }}
              onCancelReject={() => {
                setRejectingPaymentId(null);
                setRejectReason('');
              }}
              rejectReason={rejectReason}
              setRejectReason={setRejectReason}
              submittingReject={submittingReject}
              onSubmitReject={() => onSubmitReject(payment.id)}
            />
          ))}
        </div>
      ) : (
        <div className="m-5 rounded-xl bg-sunken/70 py-8 sm:m-6 text-center text-ink-faint">
          <Receipt size={24} className="mx-auto mb-1.5 opacity-50" />
          <p className="text-sm font-medium text-ink-muted">No payments recorded yet</p>
          <p className="text-xs text-ink-faint">Use the cashier desk on the right to log downpayment.</p>
        </div>
      )}
    </section>
  );
}
