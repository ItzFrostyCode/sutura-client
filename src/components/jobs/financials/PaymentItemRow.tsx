import React from 'react';
import { CreditCard, Printer, MoreVertical, Pencil, Flag } from 'lucide-react';
import { Payment } from '../jobTypes';
import { METHOD_CONFIG } from './financialsTypes';
import { PaymentLedgerDetails } from './PaymentLedgerDetails';
import { printInPlace } from '@/lib/printInPlace';
import { PaymentEditPanel, PaymentVerifyPanel, PaymentRejectPanel, PaymentRejectedNote } from './PaymentRowPanels';

const ICON_BTN = 'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-sunken hover:text-ink';
const TYPE_LABEL: Record<string, string> = { partial: 'Partial', balance: 'Balance', full: 'Full' };

interface PaymentItemRowProps {
  readonly payment: Payment;
  readonly jobId: number;
  readonly jobIsCompleted: boolean;
  readonly isOwnerOrManager: boolean;
  readonly verifying: boolean;
  readonly onVerify: () => void;
  readonly menuOpen: boolean;
  readonly onToggleMenu: () => void;
  readonly isEditing: boolean;
  readonly onStartEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly editMethod: string;
  readonly setEditMethod: (m: string) => void;
  readonly editReference: string;
  readonly setEditReference: (r: string) => void;
  readonly editNotes: string;
  readonly setEditNotes: (n: string) => void;
  readonly savingEdit: boolean;
  readonly onSaveEdit: () => Promise<void>;
  readonly isRejecting: boolean;
  readonly onStartReject: () => void;
  readonly onCancelReject: () => void;
  readonly rejectReason: string;
  readonly setRejectReason: (r: string) => void;
  readonly submittingReject: boolean;
  readonly onSubmitReject: () => Promise<void>;
}

export function PaymentItemRow({
  payment,
  jobId,
  jobIsCompleted,
  isOwnerOrManager,
  verifying,
  onVerify,
  menuOpen,
  onToggleMenu,
  isEditing,
  onStartEdit,
  onCancelEdit,
  editMethod,
  setEditMethod,
  editReference,
  setEditReference,
  editNotes,
  setEditNotes,
  savingEdit,
  onSaveEdit,
  isRejecting,
  onStartReject,
  onCancelReject,
  rejectReason,
  setRejectReason,
  submittingReject,
  onSubmitReject,
}: PaymentItemRowProps) {
  const cfg = METHOD_CONFIG[payment.payment_method] ?? {
    label: payment.payment_method,
    icon: <CreditCard size={14} />,
    badgeCls: 'bg-sunken text-ink-muted border-line',
  };

  const typeText = payment.type
    ? `${TYPE_LABEL[payment.type] ?? 'Deposit'}${payment.source ? ` · ${payment.source === 'online' ? 'Online' : 'Walk-in'}` : ''}`
    : null;
  const pending = !payment.rejected_at && payment.status === 'pending_verification';

  return (
    <div className="py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sunken">{cfg.icon}</div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="rounded-md bg-sunken px-2 py-0.5 text-xs font-medium text-ink">{cfg.label}</span>
            {typeText && <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">{typeText}</span>}
            {payment.rejected_at && <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-rose-700">Rejected</span>}
            {pending && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700">Pending Verification</span>}
          </div>
          <p className="text-[13px] text-ink-muted">
            {new Date(payment.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {payment.recorded_by && <> · Logged by: <span className="text-ink-body">{payment.recorded_by.name}</span></>}
          </p>
          <PaymentLedgerDetails payment={payment} />
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className={`text-lg font-semibold ${payment.rejected_at ? 'text-ink-faint line-through' : 'text-ink'}`}>
            ₱{Number.parseFloat(String(payment.amount)).toFixed(2)}
          </span>
          <div className="flex items-center">
            <button type="button" onClick={() => printInPlace(`/print/jobs/${jobId}/receipt?payment=${payment.id}`)} title="Print receipt" aria-label="Print receipt" className={ICON_BTN}>
              <Printer size={16} />
            </button>
            {!payment.rejected_at && (
              <div className="relative">
                <button type="button" onClick={onToggleMenu} title="Actions" aria-label="Payment actions" className={ICON_BTN}>
                  <MoreVertical size={16} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-10 z-20 min-w-40 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg">
                    {!jobIsCompleted && (
                      <button type="button" onClick={onStartEdit} className="flex min-h-11 w-full cursor-pointer items-center gap-2 px-3 text-left text-sm text-ink-body hover:bg-sunken">
                        <Pencil size={14} /> Edit Details
                      </button>
                    )}
                    <button type="button" onClick={onStartReject} className="flex min-h-11 w-full cursor-pointer items-center gap-2 px-3 text-left text-sm font-medium text-rose-700 hover:bg-rose-500/10">
                      <Flag size={14} /> Flag / Reject…
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <PaymentEditPanel
          editMethod={editMethod} setEditMethod={setEditMethod} editReference={editReference} setEditReference={setEditReference}
          editNotes={editNotes} setEditNotes={setEditNotes} savingEdit={savingEdit} onSaveEdit={onSaveEdit} onCancelEdit={onCancelEdit}
        />
      )}
      {pending && isOwnerOrManager && <PaymentVerifyPanel methodLabel={cfg.label} verifying={verifying} onVerify={onVerify} />}
      {isRejecting && (
        <PaymentRejectPanel rejectReason={rejectReason} setRejectReason={setRejectReason} submittingReject={submittingReject} onSubmitReject={onSubmitReject} onCancelReject={onCancelReject} />
      )}
      <PaymentRejectedNote payment={payment} />
    </div>
  );
}
