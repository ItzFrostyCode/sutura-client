import React from 'react';
import Link from 'next/link';
import { Banknote, CreditCard, Loader2, Upload, CheckCircle2, Printer } from 'lucide-react';
import { Job } from '../jobTypes';
import { ComputedFinancials } from './financialsTypes';
import { CashierMethodSelector } from './CashierMethodSelector';

interface JobCashierDeskProps {
  readonly job: Job;
  readonly financials: ComputedFinancials;
  readonly saving: boolean;
  readonly method: string;
  readonly setMethod: (m: string) => void;
  readonly amount: string;
  readonly setAmount: (a: string) => void;
  readonly reference: string;
  readonly setReference: (r: string) => void;
  readonly notes: string;
  readonly setNotes: (n: string) => void;
  readonly receiptUrl: string;
  readonly setReceiptUrl: (u: string) => void;
  readonly uploadingReceipt: boolean;
  readonly setUploadingReceipt: (v: boolean) => void;
  readonly charging: boolean;
  readonly onChargeSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  readonly uploadReceipt: (file: File | undefined, onDone: (url: string) => void, setUploading: (v: boolean) => void) => Promise<void>;
  readonly cashTendered: string;
  readonly setCashTendered: (v: string) => void;
  readonly reviewingCharge: boolean;
  readonly onConfirmCharge: () => Promise<void>;
  readonly onCancelChargeReview: () => void;
}

export function JobCashierDesk({
  job,
  financials,
  saving,
  method,
  setMethod,
  amount,
  setAmount,
  reference,
  setReference,
  notes,
  setNotes,
  receiptUrl,
  setReceiptUrl,
  uploadingReceipt,
  setUploadingReceipt,
  charging,
  onChargeSubmit,
  uploadReceipt,
  cashTendered,
  setCashTendered,
  reviewingCharge,
  onConfirmCharge,
  onCancelChargeReview,
}: JobCashierDeskProps) {
  const { remainingBalance, totalAmount, amountPaid, isDownpaymentMet } = financials;
  const parsedAmount = Number.parseFloat(amount) || 0;
  const parsedTendered = Number.parseFloat(cashTendered) || 0;
  const change = method === 'cash' ? Math.max(0, parsedTendered - parsedAmount) : 0;
  const cashShortfall = method === 'cash' && cashTendered !== '' && parsedTendered < parsedAmount;

  if (reviewingCharge) {
    return (
      <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <div className="w-8 h-8 rounded-xl bg-sage/10 text-sage flex items-center justify-center font-bold">
            <Banknote size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">Review Payment</h3>
            <p className="text-[11px] text-ink-muted">Confirm before this is recorded</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-ink-muted">Amount</span><strong className="text-ink">₱{parsedAmount.toFixed(2)}</strong></div>
          <div className="flex justify-between"><span className="text-ink-muted">Method</span><strong className="text-ink capitalize">{method}</strong></div>
          {method === 'cash' && (
            <>
              <div className="flex justify-between"><span className="text-ink-muted">Cash Tendered</span><strong className="text-ink">₱{parsedTendered.toFixed(2)}</strong></div>
              <div className="flex justify-between border-t border-line pt-2"><span className="text-ink-muted">Change</span><strong className="text-emerald-700">₱{change.toFixed(2)}</strong></div>
            </>
          )}
          {method !== 'cash' && reference && (
            <div className="flex justify-between"><span className="text-ink-muted">Reference #</span><strong className="text-ink font-mono">{reference}</strong></div>
          )}
        </div>

        {method !== 'cash' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            This {method === 'gcash' ? 'GCash' : 'PayMaya'} payment will be logged as <strong>Pending Verification</strong> — it won&apos;t reduce the balance until an owner or branch manager verifies the receipt.
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancelChargeReview}
            disabled={charging}
            className="flex-1 h-11 border border-line rounded-xl text-xs font-bold text-ink-muted hover:text-ink hover:bg-canvas transition-colors cursor-pointer"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onConfirmCharge}
            disabled={charging}
            className="flex-1 h-11 bg-taupe hover:bg-taupe-hover text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
          >
            {charging ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={15} />}
            <span>{charging ? 'Recording…' : 'Confirm & Record'}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sage/10 text-sage flex items-center justify-center font-bold">
            <Banknote size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">Cashier Desk</h3>
            <p className="text-[11px] text-ink-muted">Record deposit or settlement</p>
          </div>
        </div>
        {remainingBalance > 0 && (
          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Due: ₱{remainingBalance.toFixed(2)}
          </span>
        )}
      </div>

      {remainingBalance > 0 ? (
        <form onSubmit={onChargeSubmit} className="space-y-4">
          {/* Quick Fill Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Quick Amount Presets</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setAmount(remainingBalance.toFixed(2))}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-canvas hover:bg-surface border border-line text-ink hover:border-taupe transition-colors shadow-2xs cursor-pointer"
              >
                Full Balance (₱{remainingBalance.toFixed(2)})
              </button>
              {!isDownpaymentMet && (
                <button
                  type="button"
                  onClick={() => {
                    const dpShortfall = Math.max(0, (totalAmount * 0.5) - amountPaid);
                    if (dpShortfall > 0) setAmount(dpShortfall.toFixed(2));
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sage/10 hover:bg-sage/20 border border-sage/30 text-sage transition-colors shadow-2xs cursor-pointer"
                >
                  50% DP (₱{(totalAmount * 0.5).toFixed(2)})
                </button>
              )}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label htmlFor="payment-amount" className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Payment Amount <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted font-bold text-base">₱</span>
              <input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remainingBalance}
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-canvas border border-line rounded-xl text-ink font-bold text-base focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe shadow-2xs"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <CashierMethodSelector method={method} setMethod={setMethod} />

          {/* Cash Tendered & Change */}
          {method === 'cash' && (
            <div className="space-y-1.5 p-3 bg-canvas border border-line rounded-xl">
              <label htmlFor="cash-tendered" className="text-[11px] font-bold text-ink-muted uppercase">
                Cash Tendered <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint font-bold text-sm">₱</span>
                <input
                  id="cash-tendered"
                  type="number"
                  step="0.01"
                  min={amount || '0'}
                  required
                  value={cashTendered}
                  onChange={e => setCashTendered(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-7 pr-3 py-2 bg-surface border rounded-lg text-sm font-bold focus:outline-none ${cashShortfall ? 'border-danger text-danger' : 'border-line text-ink focus:border-taupe'}`}
                />
              </div>
              {cashShortfall ? (
                <p className="text-[11px] font-semibold text-danger">Cash tendered can&apos;t be less than the amount being paid.</p>
              ) : (
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-ink-muted">Change</span>
                  <strong className="text-emerald-700">₱{change.toFixed(2)}</strong>
                </div>
              )}
            </div>
          )}

          {/* Reference & Receipt Screenshot */}
          {method !== 'cash' && (
            <div className="space-y-3 p-3 bg-canvas border border-line rounded-xl">
              <div className="space-y-1">
                <label htmlFor="ref-no" className="text-[11px] font-bold text-ink-muted uppercase">
                  {method === 'gcash' ? 'GCash Reference Number' : method === 'paymaya' ? 'PayMaya Reference Number' : 'Bank Reference Number'}
                </label>
                <input
                  id="ref-no"
                  type="text"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder={method === 'gcash' ? 'e.g. 90218492049' : 'e.g. BDO-REF-4920'}
                  className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-xs text-ink font-mono focus:outline-none focus:border-taupe"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-ink-muted uppercase block">
                  Receipt Proof <span className="text-danger">*</span>
                </span>
                {receiptUrl ? (
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={receiptUrl} alt="Receipt Screenshot" className="h-16 w-16 object-cover rounded-lg border border-line" />
                    <button
                      type="button"
                      onClick={() => setReceiptUrl('')}
                      className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove Screenshot
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-1.5 p-2 bg-surface hover:bg-canvas border border-dashed border-line hover:border-taupe rounded-lg cursor-pointer text-xs text-ink-muted font-medium transition-colors">
                    {uploadingReceipt ? <Loader2 size={13} className="animate-spin text-taupe" /> : <Upload size={13} />}
                    <span>{uploadingReceipt ? 'Uploading receipt…' : 'Attach Screenshot'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingReceipt}
                      onChange={e => uploadReceipt(e.target.files?.[0], setReceiptUrl, setUploadingReceipt)}
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Remarks / Cashier Notes */}
          <div className="space-y-1">
            <label htmlFor="cashier-notes" className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Remarks / Notes <span className="text-[10px] font-normal text-ink-faint lowercase">(optional)</span>
            </label>
            <input
              id="cashier-notes"
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Paid in cash at front counter"
              className="w-full px-3 py-2 bg-canvas border border-line rounded-xl text-xs text-ink focus:outline-none focus:border-taupe"
            />
          </div>

          {/* Submit Action Button — opens the Review step, nothing is sent yet */}
          <button
            type="submit"
            disabled={
              saving || charging || !amount || parsedAmount <= 0 ||
              (method === 'cash' ? (!cashTendered || cashShortfall) : !receiptUrl)
            }
            className="w-full h-11 bg-taupe hover:bg-taupe-hover text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <CreditCard size={15} />
            <span>Review Payment</span>
          </button>
        </form>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-2">
          <CheckCircle2 size={32} className="text-emerald-600 mx-auto" />
          <h4 className="text-sm font-bold text-emerald-900">Order Fully Settled</h4>
          <p className="text-xs text-emerald-700">
            There is no outstanding balance due on this job order.
          </p>
          <Link
            href={`/print/jobs/${job.id}/receipt`}
            target="_blank"
            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors"
          >
            <Printer size={13} /> Print Final Statement
          </Link>
        </div>
      )}
    </div>
  );
}
