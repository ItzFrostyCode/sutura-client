import React from 'react';
import Link from 'next/link';
import { CreditCard, Printer, MoreVertical, Pencil, Flag, Check, Receipt, Loader2, ShieldCheck } from 'lucide-react';
import { Payment } from '../jobTypes';
import { METHOD_CONFIG } from './financialsTypes';
import ImageViewerModal from '@/components/shared/ImageViewerModal';
import RejectReasonModal from '@/components/payments/modals/RejectReasonModal';
import { REJECT_PRESET_REASONS } from '@/components/payments/paymentHelpers';

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
  readonly submittingReject: boolean;
  readonly onSubmitReject: (reason: string) => Promise<void>;
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
  submittingReject,
  onSubmitReject,
}: PaymentItemRowProps) {
  const [viewingReceipt, setViewingReceipt] = React.useState(false);
  // Same popup and preset reasons as the Payments page.
  const [presetReason, setPresetReason] = React.useState<string>(REJECT_PRESET_REASONS[0]);
  const [rejectNote, setRejectNote] = React.useState('');
  const amountLabel = `₱${Number.parseFloat(String(payment.amount)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const cfg = METHOD_CONFIG[payment.payment_method] ?? {
    label: payment.payment_method,
    icon: <CreditCard size={14} />,
    badgeCls: 'bg-sunken text-ink-muted border-line',
  };

  return (
    <div className="bg-canvas border border-line rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${cfg.badgeCls}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          {payment.type && (
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-sunken text-ink-body border border-line px-2 py-0.5 rounded-full">
              {payment.type === 'partial' ? 'Partial' : payment.type === 'balance' ? 'Balance' : payment.type === 'full' ? 'Full' : 'Deposit'}{payment.source ? ` · ${payment.source === 'online' ? 'Online' : 'Walk-in'}` : ''}
            </span>
          )}
          {payment.rejected_at && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
              Rejected
            </span>
          )}
          {!payment.rejected_at && payment.status === 'pending_verification' && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
              Pending Verification
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-base font-black font-mono ${payment.rejected_at ? 'line-through text-ink-faint' : 'text-ink'}`}>
            ₱{Number.parseFloat(String(payment.amount)).toFixed(2)}
          </span>

          <Link
            href={`/print/jobs/${jobId}/receipt?payment=${payment.id}`}
            target="_blank"
            title="Print Official Receipt"
            className="p-1 rounded-md text-ink-muted hover:text-taupe hover:bg-surface transition-colors"
          >
            <Printer size={14} />
          </Link>

          {!payment.rejected_at && (
            <div className="relative">
              <button
                type="button"
                onClick={onToggleMenu}
                title="Actions"
                className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface transition-colors cursor-pointer"
              >
                <MoreVertical size={14} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-6 bg-surface border border-line rounded-xl shadow-lg min-w-37.5 z-20 overflow-hidden py-1">
                  {!jobIsCompleted && (
                    <button
                      type="button"
                      onClick={onStartEdit}
                      className="w-full text-left px-3 py-2 text-xs text-ink-body hover:bg-canvas flex items-center gap-2 cursor-pointer"
                    >
                      <Pencil size={12} /> Edit Details
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onStartReject}
                    className="w-full text-left px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Flag size={12} /> Flag / Reject…
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Metadata / Edit Row */}
      {isEditing ? (
        <div className="space-y-2 mt-2 pt-2 border-t border-line">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={editMethod}
              onChange={e => setEditMethod(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
            >
              <option value="cash">Cash</option>
              <option value="gcash">GCash</option>
            </select>
            {editMethod !== 'cash' && (
              <input
                type="text"
                value={editReference}
                onChange={e => setEditReference(e.target.value)}
                placeholder="Reference #"
                className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
              />
            )}
          </div>
          <input
            type="text"
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            placeholder="Internal notes..."
            className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-2.5 py-1 rounded-lg text-xs text-ink-muted hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingEdit}
              onClick={onSaveEdit}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-taupe hover:bg-taupe-hover text-white flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Check size={12} /> {savingEdit ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between text-[11px] text-ink-muted pt-1 border-t border-line/60 gap-y-1">
          <div className="flex items-center gap-2">
            <span>{new Date(payment.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            {payment.recorded_by && (
              <span>• Logged by: <strong className="text-ink-body font-semibold">{payment.recorded_by.name}</strong></span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {payment.reference && (
              <span className="font-mono bg-surface px-1.5 py-0.5 rounded border border-line text-ink-body">
                Ref: {payment.reference}
              </span>
            )}
            {payment.receipt_path && (
              <button
                type="button"
                onClick={() => setViewingReceipt(true)}
                className="inline-flex items-center gap-1 text-taupe font-bold hover:underline cursor-pointer"
              >
                <Receipt size={11} /> Receipt Image
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pending Verification — owner/branch manager confirms the GCash/PayMaya proof before it counts toward the balance */}
      {!payment.rejected_at && payment.status === 'pending_verification' && isOwnerOrManager && (
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-amber-200 bg-amber-50/50 p-2.5 rounded-lg">
          <p className="text-[11px] text-amber-800">
            Confirm the {cfg.label} receipt before this counts toward the balance.
          </p>
          <button
            type="button"
            disabled={verifying}
            onClick={onVerify}
            className="shrink-0 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {verifying ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
            {verifying ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      )}

      {/* Reject: the same popup as the Payments page */}
      <RejectReasonModal
        rejectingItem={isRejecting ? { id: payment.id, itemName: `this ${amountLabel} ${cfg.label} payment` } : null}
        description="It stays on the order marked Rejected and won't count toward the balance. The customer is told why so they can send a new proof."
        onClose={() => { onCancelReject(); setRejectNote(''); }}
        rejectionReason={presetReason}
        setRejectionReason={setPresetReason}
        rejectionCustomText={rejectNote}
        setRejectionCustomText={setRejectNote}
        onConfirmRejection={() => {
          const note = rejectNote.trim();
          void onSubmitReject(note ? `${presetReason}. ${note}` : presetReason).then(() => setRejectNote(''));
        }}
        processingId={submittingReject ? payment.id : null}
      />

      <ImageViewerModal
        src={viewingReceipt ? payment.receipt_path ?? null : null}
        title={`${cfg.label} receipt · ₱${Number.parseFloat(String(payment.amount)).toFixed(2)}`}
        fileName={`receipt-${payment.id}`}
        onClose={() => setViewingReceipt(false)}
      />

      {payment.rejected_at && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-[10px] text-rose-700">
          <p className="font-bold">
            Rejected on {new Date(payment.rejected_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            {payment.rejected_by && ` by ${payment.rejected_by.name}`}
          </p>
          {payment.rejected_reason && <p className="italic mt-0.5">{payment.rejected_reason}</p>}
        </div>
      )}
    </div>
  );
}
