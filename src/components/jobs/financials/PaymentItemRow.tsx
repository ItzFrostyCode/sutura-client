import React from 'react';
import Link from 'next/link';
import { CreditCard, Printer, MoreVertical, Pencil, Flag, Check, Receipt } from 'lucide-react';
import { Payment } from '../jobTypes';
import { METHOD_CONFIG } from './financialsTypes';

interface PaymentItemRowProps {
  readonly payment: Payment;
  readonly jobId: number;
  readonly jobIsCompleted: boolean;
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

  return (
    <div className="bg-canvas border border-line rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border ${cfg.badgeCls}`}>
            {cfg.icon}
            {cfg.label}
          </span>
          {payment.rejected_at && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
              Rejected
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
              <option value="paymaya">PayMaya</option>
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
              <a
                href={payment.receipt_path}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-taupe font-bold hover:underline"
              >
                <Receipt size={11} /> Receipt Image
              </a>
            )}
          </div>
        </div>
      )}

      {/* Reject Form Drawer */}
      {isRejecting && (
        <div className="space-y-2 mt-2 pt-2 border-t border-rose-200 bg-rose-50/50 p-2.5 rounded-lg">
          <p className="text-[11px] font-bold text-rose-800">Reason for rejecting this transaction:</p>
          <input
            type="text"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="e.g. GCash screenshot forged / reference invalid"
            className="w-full px-2.5 py-1.5 bg-surface border border-rose-300 rounded-lg text-xs text-ink focus:outline-none focus:border-rose-500"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancelReject}
              className="px-2.5 py-1 rounded-lg text-xs text-ink-muted hover:text-ink cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submittingReject || !rejectReason.trim()}
              onClick={onSubmitReject}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs cursor-pointer"
            >
              {submittingReject ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      )}

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
