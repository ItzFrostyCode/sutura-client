'use client';

import React from 'react';
import { AlertCircle, X, Loader2 } from 'lucide-react';
import { ReceiptItem } from '../usePayments';
import { REJECT_PRESET_REASONS } from '../paymentHelpers';

interface RejectReasonModalProps {
  rejectingItem: ReceiptItem | null;
  onClose: () => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  rejectionCustomText: string;
  setRejectionCustomText: (text: string) => void;
  onConfirmRejection: () => void;
  processingId: number | null;
}

export default function RejectReasonModal({
  rejectingItem,
  onClose,
  rejectionReason,
  setRejectionReason,
  rejectionCustomText,
  setRejectionCustomText,
  onConfirmRejection,
  processingId,
}: RejectReasonModalProps) {
  if (!rejectingItem) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
      <div className="bg-surface rounded-2xl border border-line w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-line bg-rose-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertCircle size={18} />
            <h3 className="font-bold text-sm">Reject & Request New Proof</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-ink-faint hover:text-ink rounded"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs">
          <div>
            <p className="text-ink font-semibold">
              Reject proof for <span className="font-bold text-taupe">{rejectingItem.itemName}</span> ({rejectingItem.customer_name})?
            </p>
            <p className="text-ink-muted mt-0.5">
              This moves the receipt to the <strong>Rejected Proofs History</strong> tab and asks the customer to resubmit a valid proof.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-ink">Select Rejection Reason:</label>
            <div className="space-y-1.5">
              {REJECT_PRESET_REASONS.map(reason => (
                <label
                  key={reason}
                  className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                    rejectionReason === reason
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-semibold'
                      : 'border-line text-ink-body hover:bg-canvas'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    checked={rejectionReason === reason}
                    onChange={() => setRejectionReason(reason)}
                    className="mt-0.5 accent-rose-600"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="rejection-custom-note" className="font-bold text-ink">Custom Note (Optional):</label>
            <input
              id="rejection-custom-note"
              type="text"
              value={rejectionCustomText}
              onChange={e => setRejectionCustomText(e.target.value)}
              placeholder="Additional note to customer..."
              className="w-full px-3 py-2 border border-line rounded-lg text-xs bg-canvas focus:outline-none focus:border-taupe"
            />
          </div>
        </div>

        <div className="p-3.5 bg-canvas/30 border-t border-line flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmRejection}
            disabled={processingId !== null}
            className="bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            {processingId === rejectingItem.id ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
            <span>Confirm Rejection</span>
          </button>
        </div>
      </div>
    </div>
  );
}
