'use client';

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { JobBalanceItem } from '../usePayments';

interface LogPaymentModalProps {
  logPaymentJob: JobBalanceItem | null;
  onClose: () => void;
  payAmount: string;
  setPayAmount: (val: string) => void;
  payMethod: string;
  setPayMethod: (val: string) => void;
  payReference: string;
  setPayReference: (val: string) => void;
  payNotes: string;
  setPayNotes: (val: string) => void;
  handleLogPayment: () => void;
  paySubmitting: boolean;
}

export default function LogPaymentModal({
  logPaymentJob,
  onClose,
  payAmount,
  setPayAmount,
  payMethod,
  setPayMethod,
  payReference,
  setPayReference,
  payNotes,
  setPayNotes,
  handleLogPayment,
  paySubmitting,
}: LogPaymentModalProps) {
  if (!logPaymentJob) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl border border-line w-full max-w-md shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-canvas/30">
          <div>
            <h3 className="font-bold text-ink text-sm">Log Payment</h3>
            <p className="text-xs text-ink-muted">
              {logPaymentJob.order_number} · {logPaymentJob.customer?.name || 'Walk-in'}
            </p>
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

        {/* Modal Form */}
        <div className="p-4 space-y-3">
          {/* Balance Bar */}
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800">Remaining Balance:</span>
            <span className="text-base font-black text-rose-700 tabular-nums">
              ₱{logPaymentJob.balance.toFixed(2)}
            </span>
          </div>

          {/* Amount Input & Full Button */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="pay-amount-input" className="font-bold text-ink">Amount</label>
              <button
                type="button"
                onClick={() => setPayAmount(String(logPaymentJob.balance))}
                className="text-[10px] font-bold text-taupe hover:underline"
              >
                Pay Full (₱{logPaymentJob.balance.toFixed(2)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint font-bold text-xs">₱</span>
              <input
                id="pay-amount-input"
                type="number"
                step="0.01"
                min="0.01"
                max={logPaymentJob.balance}
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-line rounded-lg text-xs font-bold bg-canvas focus:outline-none focus:border-taupe tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-ink">Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash' },
                { id: 'gcash', label: 'GCash' },
                { id: 'paymaya', label: 'PayMaya' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayMethod(m.id)}
                  className={`py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    payMethod === m.id
                      ? 'bg-taupe text-white border-taupe shadow-xs'
                      : 'bg-canvas text-ink border-line hover:bg-sunken'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference # for GCash / PayMaya */}
          {(payMethod === 'gcash' || payMethod === 'paymaya') && (
            <div className="space-y-1">
              <label htmlFor="pay-reference-input" className="text-xs font-bold text-ink">Reference #</label>
              <input
                id="pay-reference-input"
                type="text"
                value={payReference}
                onChange={e => setPayReference(e.target.value)}
                placeholder="e.g. 982038102"
                className="w-full px-3 py-1.5 border border-line rounded-lg text-xs bg-canvas focus:outline-none focus:border-taupe font-mono"
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1">
            <label htmlFor="pay-notes-input" className="text-xs font-bold text-ink">Notes (Optional)</label>
            <input
              id="pay-notes-input"
              type="text"
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
              placeholder="Optional internal note..."
              className="w-full px-3 py-1.5 border border-line rounded-lg text-xs bg-canvas focus:outline-none focus:border-taupe"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-canvas/30 border-t border-line flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleLogPayment}
            disabled={paySubmitting || !payAmount || Number.parseFloat(payAmount) <= 0}
            className="bg-taupe hover:bg-taupe-hover disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            {paySubmitting && <Loader2 size={12} className="animate-spin" />}
            <span>Confirm (₱{Number(payAmount || 0).toFixed(2)})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
