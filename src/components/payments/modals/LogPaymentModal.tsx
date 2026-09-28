'use client';

import React from 'react';
import { X, Loader2, Upload, CheckCircle2 } from 'lucide-react';
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
  payReceiptPath: string;
  setPayReceiptPath: (val: string) => void;
  payReceiptUploading: boolean;
  handlePayReceiptUpload: (file: File) => Promise<void>;
  payCashTendered: string;
  setPayCashTendered: (val: string) => void;
  payReviewing: boolean;
  setPayReviewing: (val: boolean) => void;
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
  payReceiptPath,
  setPayReceiptPath,
  payReceiptUploading,
  handlePayReceiptUpload,
  payCashTendered,
  setPayCashTendered,
  payReviewing,
  setPayReviewing,
  handleLogPayment,
  paySubmitting,
}: LogPaymentModalProps) {
  if (!logPaymentJob) return null;

  const parsedAmount = Number.parseFloat(payAmount) || 0;
  const parsedTendered = Number.parseFloat(payCashTendered) || 0;
  const change = payMethod === 'cash' ? Math.max(0, parsedTendered - parsedAmount) : 0;
  const cashShortfall = payMethod === 'cash' && payCashTendered !== '' && parsedTendered < parsedAmount;
  const canReview = !!payAmount && parsedAmount > 0
    && (payMethod === 'cash' ? (!!payCashTendered && !cashShortfall) : !!payReceiptPath);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-xl border border-line w-full max-w-md shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-canvas/30">
          <div>
            <h3 className="font-bold text-ink text-sm">{payReviewing ? 'Review Payment' : 'Log Payment'}</h3>
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

        {payReviewing ? (
          <>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ink-muted">Amount</span><strong className="text-ink">₱{parsedAmount.toFixed(2)}</strong></div>
              <div className="flex justify-between"><span className="text-ink-muted">Method</span><strong className="text-ink capitalize">{payMethod}</strong></div>
              {payMethod === 'cash' ? (
                <>
                  <div className="flex justify-between"><span className="text-ink-muted">Cash Tendered</span><strong className="text-ink">₱{parsedTendered.toFixed(2)}</strong></div>
                  <div className="flex justify-between border-t border-line pt-2"><span className="text-ink-muted">Change</span><strong className="text-emerald-700">₱{change.toFixed(2)}</strong></div>
                </>
              ) : (
                payReference && (
                  <div className="flex justify-between"><span className="text-ink-muted">Reference #</span><strong className="text-ink font-mono">{payReference}</strong></div>
                )
              )}
              {payMethod !== 'cash' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[11px] text-amber-800 mt-2">
                  This {payMethod === 'gcash' ? 'GCash' : 'PayMaya'} payment will be logged as <strong>Pending Verification</strong> — it won&apos;t reduce the balance until an owner or branch manager verifies the receipt.
                </div>
              )}
            </div>
            <div className="p-3 bg-canvas/30 border-t border-line flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayReviewing(false)}
                disabled={paySubmitting}
                className="px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-ink"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleLogPayment}
                disabled={paySubmitting}
                className="bg-taupe hover:bg-taupe-hover disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                {paySubmitting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                <span>{paySubmitting ? 'Recording…' : 'Confirm & Record'}</span>
              </button>
            </div>
          </>
        ) : (
          <>
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

              {/* Cash Tendered & Change */}
              {payMethod === 'cash' && (
                <div className="space-y-1">
                  <label htmlFor="pay-cash-tendered" className="text-xs font-bold text-ink">
                    Cash Tendered <span className="text-danger">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint font-bold text-xs">₱</span>
                    <input
                      id="pay-cash-tendered"
                      type="number"
                      step="0.01"
                      min={payAmount || '0'}
                      value={payCashTendered}
                      onChange={e => setPayCashTendered(e.target.value)}
                      className={`w-full pl-7 pr-3 py-1.5 border rounded-lg text-xs font-bold bg-canvas focus:outline-none ${cashShortfall ? 'border-danger text-danger' : 'border-line focus:border-taupe'}`}
                      placeholder="0.00"
                    />
                  </div>
                  {cashShortfall ? (
                    <p className="text-[10px] font-semibold text-danger">Cash tendered can&apos;t be less than the amount.</p>
                  ) : (
                    <div className="flex justify-between text-[11px] pt-0.5">
                      <span className="text-ink-muted">Change</span>
                      <strong className="text-emerald-700">₱{change.toFixed(2)}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Reference # & Receipt for GCash / PayMaya */}
              {(payMethod === 'gcash' || payMethod === 'paymaya') && (
                <>
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
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-ink block">
                      Receipt Proof <span className="text-danger">*</span>
                    </span>
                    {payReceiptPath ? (
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={payReceiptPath} alt="Receipt Screenshot" className="h-14 w-14 object-cover rounded-lg border border-line" />
                        <button
                          type="button"
                          onClick={() => setPayReceiptPath('')}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-1.5 p-2 bg-canvas hover:bg-sunken border border-dashed border-line hover:border-taupe rounded-lg cursor-pointer text-xs text-ink-muted font-medium transition-colors">
                        {payReceiptUploading ? <Loader2 size={13} className="animate-spin text-taupe" /> : <Upload size={13} />}
                        <span>{payReceiptUploading ? 'Uploading…' : 'Attach Screenshot'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={payReceiptUploading}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handlePayReceiptUpload(file);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </>
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
                onClick={() => setPayReviewing(true)}
                disabled={!canReview}
                className="bg-taupe hover:bg-taupe-hover disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <span>Review (₱{parsedAmount.toFixed(2)})</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
