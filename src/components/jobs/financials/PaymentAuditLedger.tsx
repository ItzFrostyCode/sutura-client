import React from 'react';
import { FileText, Receipt } from 'lucide-react';
import { Job, Payment } from '../jobTypes';
import { ComputedFinancials } from './financialsTypes';
import { PaymentItemRow } from './PaymentItemRow';

interface PaymentAuditLedgerProps {
  readonly job: Job;
  readonly financials: ComputedFinancials;
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
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-taupe" />
          <h3 className="text-sm font-bold text-ink">Payment History & Audit Ledger</h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-canvas text-ink-muted border border-line">
            {payments.length}
          </span>
        </div>
        {jobIsCompleted && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-sunken text-ink-muted px-2 py-0.5 rounded-full border border-line">
            Ledger Locked
          </span>
        )}
      </div>

      {payments.length > 0 ? (
        <div className="space-y-3">
          {payments.map(payment => (
            <PaymentItemRow
              key={payment.id}
              payment={payment}
              jobId={job.id}
              jobIsCompleted={jobIsCompleted}
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
        <div className="text-center py-8 text-ink-faint border border-dashed border-line rounded-xl bg-canvas/40">
          <Receipt size={24} className="mx-auto mb-1.5 opacity-40" />
          <p className="text-xs font-medium">No payments recorded yet</p>
          <p className="text-[10px] text-ink-faint">Use the cashier desk on the right to log downpayment.</p>
        </div>
      )}
    </div>
  );
}
