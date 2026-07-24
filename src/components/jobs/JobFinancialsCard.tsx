import React, { useState } from 'react';
import Link from 'next/link';
import { Job, Payment } from './jobTypes';
import { CreditCard, Banknote, Smartphone, ChevronDown, ChevronUp, Pencil, X, Check, Printer, Tag, MoreVertical, Flag } from 'lucide-react';

interface JobFinancialsCardProps {
  readonly job: Job;
  readonly saving: boolean;
  readonly onCharge: (amount: number, method: string, notes: string, reference?: string) => Promise<void>;
  readonly onApplyDiscount: (amount: number, reason: string) => Promise<void>;
  readonly onUpdatePayment: (paymentId: number, fields: { payment_method: string; reference?: string; notes?: string; receipt_path?: string }) => Promise<void>;
  readonly onRejectPayment: (paymentId: number, reason: string) => Promise<void>;
}

const METHOD_ICONS: Record<string, React.ReactNode> = {
  cash:          <Banknote size={13} className="text-emerald-600" />,
  gcash:         <Smartphone size={13} className="text-blue-600" />,
  bank_transfer: <CreditCard size={13} className="text-violet-600" />,
};

const METHOD_LABELS: Record<string, string> = {
  cash:          'Cash',
  gcash:         'GCash',
  bank_transfer: 'Bank Transfer',
};

export default function JobFinancialsCard({
  job,
  saving,
  onCharge,
  onApplyDiscount,
  onUpdatePayment,
  onRejectPayment,
}: JobFinancialsCardProps) {
  const totalAmount       = Number.parseFloat(String(job.total_amount));
  const remainingBalance  = Number.parseFloat(String(job.balance));
  const amountPaid        = totalAmount - remainingBalance;
  const discountApplied   = Number.parseFloat(String(job.discount_amount ?? 0)) || 0;
  const jobIsCompleted    = job.status === 'completed';
  const jobIsCancelled    = job.status === 'cancelled';
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes]   = useState('');
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [charging, setCharging] = useState(false);
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const handleApplyDiscountSubmit = async () => {
    const amt = Number.parseFloat(discountInput);
    if (!amt || amt <= 0) return;
    setApplyingDiscount(true);
    try {
      await onApplyDiscount(amt, discountReason);
      setShowDiscountForm(false);
      setDiscountInput('');
      setDiscountReason('');
    } catch {
      // handled by parent
    } finally {
      setApplyingDiscount(false);
    }
  };

  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [editMethod, setEditMethod] = useState('cash');
  const [editReference, setEditReference] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [menuOpenPaymentId, setMenuOpenPaymentId] = useState<number | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const handleSubmitReject = async (paymentId: number) => {
    if (!rejectReason.trim()) return;
    setSubmittingReject(true);
    try {
      await onRejectPayment(paymentId, rejectReason.trim());
      setRejectingPaymentId(null);
      setRejectReason('');
    } catch {
      // handled by parent
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) return;
    setCharging(true);
    try {
      await onCharge(amt, method, notes, reference || undefined);
      setAmount('');
      setReference('');
      setNotes('');
    } catch {
      // handled by parent
    } finally {
      setCharging(false);
    }
  };

  const startEditingPayment = (payment: Payment) => {
    setEditingPaymentId(payment.id);
    setEditMethod(payment.payment_method);
    setEditReference(payment.reference || '');
    setEditNotes(payment.notes || '');
  };

  const handleSaveEdit = async (paymentId: number) => {
    setSavingEdit(true);
    try {
      await onUpdatePayment(paymentId, {
        payment_method: editMethod,
        reference: editReference || undefined,
        notes: editNotes || undefined,
      });
      setEditingPaymentId(null);
    } catch {
      // handled by parent
    } finally {
      setSavingEdit(false);
    }
  };

  const paymentStatus = job.payment_status;

  const statusConfig = {
    paid:    { label: 'Fully Paid',   cls: 'bg-[#7A8B76]/10 text-[#7A8B76] border border-[#7A8B76]/20' },
    partial: { label: 'Partial',      cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
    unpaid:  { label: 'Unpaid',       cls: 'bg-red-50 text-red-600 border border-red-200' },
    pending: { label: 'Pending',      cls: 'bg-[#BCA89F]/10 text-[#BCA89F] border border-[#BCA89F]/20' },
  }[paymentStatus] ?? { label: paymentStatus, cls: 'bg-gray-100 text-gray-600 border border-gray-200' };

  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-medium text-[#2D2A26]">Financials</h2>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase tracking-wide ${statusConfig.cls}`}>
          {statusConfig.label}
        </span>
      </div>

      {/* Financial breakdown */}
      <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-4 mb-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[#A8A19A]">Total Amount</span>
          <span className="font-semibold text-[#2D2A26]">₱{totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#7A8B76]">Deposit Paid</span>
          <span className="font-semibold text-[#7A8B76]">−₱{amountPaid.toFixed(2)}</span>
        </div>
        {discountApplied > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-rose-600">Discount Applied</span>
            <span className="font-semibold text-rose-600">−₱{discountApplied.toFixed(2)}</span>
          </div>
        )}
        <div className="border-t border-[#EBE6E0] pt-2 flex justify-between">
          <span className="text-sm font-medium text-[#524A44]">Balance Due</span>
          <span className={`text-lg font-bold ${remainingBalance > 0 ? 'text-[#B26959]' : 'text-[#7A8B76]'}`}>
            ₱{remainingBalance.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Apply Discount — a one-time, in-the-moment decision (e.g. a repeat
          customer), not a standing coupon/promo code. */}
      {!jobIsCompleted && !jobIsCancelled && remainingBalance > 0 && (
        <div className="mb-4">
          {showDiscountForm ? (
            <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Apply Discount</p>
                {typeof job.customer_job_count === 'number' && (
                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full">
                    {job.customer_job_count === 1 ? 'First order' : `${job.customer_job_count} orders with this customer`}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A] font-medium text-sm">₱</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingBalance}
                  value={discountInput}
                  onChange={e => setDiscountInput(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-white border border-rose-200 rounded-lg text-[#2D2A26] focus:outline-none focus:border-rose-400 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <input
                type="text"
                value={discountReason}
                onChange={e => setDiscountReason(e.target.value)}
                placeholder="Reason (optional) — e.g. repeat customer"
                className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-rose-400"
              />
              <div className="flex justify-end gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => { setShowDiscountForm(false); setDiscountInput(''); setDiscountReason(''); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#827A73] hover:text-[#2D2A26]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={applyingDiscount || !discountInput || Number.parseFloat(discountInput) <= 0}
                  onClick={handleApplyDiscountSubmit}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                >
                  {applyingDiscount ? 'Applying…' : 'Apply Discount'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDiscountForm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Tag size={13} /> Apply Discount
            </button>
          )}
        </div>
      )}

      {/* Log Payment Form */}
      {remainingBalance > 0 ? (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <p className="text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-2">Log a Payment</p>

          {/* Amount — full width on its own row so larger amounts are never
              cramped or clipped next to the method dropdown. */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A] font-medium text-sm">₱</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingBalance}
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2 bg-white border border-[#D1C7BD] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <select
            value={method}
            onChange={e => setMethod(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#D1C7BD] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
          >
            <option value="cash">Cash</option>
            <option value="gcash">GCash</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>

          {/* GCash/Bank reference number (shown only for digital methods) */}
          {(method === 'gcash' || method === 'bank_transfer') && (
            <input
              type="text"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder={method === 'gcash' ? 'GCash Reference # (e.g. 9876543210)' : 'Bank Transfer Reference #'}
              className="w-full px-3 py-2 bg-white border border-[#D1C7BD] rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
            />
          )}

          {/* Optional notes */}
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Internal notes (optional)..."
            className="w-full px-3 py-2 bg-white border border-[#D1C7BD] rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
          />

          <button
            type="submit"
            disabled={saving || charging || !amount || Number.parseFloat(amount) <= 0}
            className="w-full bg-taupe hover:bg-taupe/90 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {(saving || charging) ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <CreditCard size={15} />
            )}
            Charge Payment
          </button>
        </form>
      ) : (
        <div className="text-center py-4 bg-[#7A8B76]/10 rounded-lg border border-[#7A8B76]/20 text-[#7A8B76] font-medium text-sm flex items-center justify-center gap-2">
          ✓ Fully Paid — No Balance Remaining
        </div>
      )}

      {/* Payment Ledger (collapsible) */}
      {job.payments && job.payments.length > 0 && (
        <div className="mt-5 pt-4 border-t border-[#EBE6E0]">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setLedgerOpen(p => !p)}
              className="flex-1 flex items-center justify-between text-sm font-semibold text-[#524A44] hover:text-[#2D2A26] transition-colors"
            >
              <span className="flex items-center gap-1.5">
                Payment History ({job.payments.length})
                {jobIsCompleted && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-[#F0EAE3] text-[#827A73] px-1.5 py-0.5 rounded">Locked</span>
                )}
              </span>
              {ledgerOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            <Link
              href={`/print/jobs/${job.id}/receipt`}
              target="_blank"
              title="Print full payment statement"
              className="shrink-0 flex items-center gap-1 text-xs font-medium text-[#827A73] hover:text-[#9A8073] transition-colors"
            >
              <Printer size={13} /> Statement
            </Link>
          </div>
          {ledgerOpen && (
            <div className="space-y-2 mt-3 max-h-64 overflow-y-auto pr-1">
              {job.payments.map(payment => (
                <div key={payment.id} className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      {METHOD_ICONS[payment.payment_method] ?? <CreditCard size={13} className="text-[#827A73]" />}
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${payment.rejected_at ? 'line-through text-[#A8A19A]' : 'text-[#827A73]'}`}>
                        {METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
                      </span>
                      {payment.rejected_at && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-600 border border-rose-200 px-1.5 py-0.5 rounded-full">
                          Rejected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${payment.rejected_at ? 'line-through text-[#A8A19A]' : 'text-[#2D2A26]'}`}>
                        ₱{Number.parseFloat(String(payment.amount)).toFixed(2)}
                      </span>
                      <Link
                        href={`/print/jobs/${job.id}/receipt?payment=${payment.id}`}
                        target="_blank"
                        title="Print receipt for this payment"
                        className="text-[#A8A19A] hover:text-[#9A8073] transition-colors"
                      >
                        <Printer size={12} />
                      </Link>
                      {!payment.rejected_at && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setMenuOpenPaymentId(p => (p === payment.id ? null : payment.id))}
                            title="More actions"
                            className="text-[#A8A19A] hover:text-[#9A8073] transition-colors"
                          >
                            <MoreVertical size={13} />
                          </button>
                          {menuOpenPaymentId === payment.id && (
                            <div className="absolute right-0 top-5 bg-white border border-[#EBE6E0] rounded-lg shadow-lg min-w-[160px] z-10 overflow-hidden">
                              {!jobIsCompleted && (
                                <button
                                  type="button"
                                  onClick={() => { startEditingPayment(payment); setMenuOpenPaymentId(null); }}
                                  className="w-full text-left px-3 py-2 text-xs text-[#524A44] hover:bg-[#FAF6F3] flex items-center gap-1.5"
                                >
                                  <Pencil size={12} /> Edit details
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => { setRejectingPaymentId(payment.id); setMenuOpenPaymentId(null); }}
                                className="w-full text-left px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-1.5"
                              >
                                <Flag size={12} /> Reject payment…
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {editingPaymentId === payment.id ? (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-[#EBE6E0]">
                      <select
                        value={editMethod}
                        onChange={e => setEditMethod(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-[#D1C7BD] rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                      >
                        <option value="cash">Cash</option>
                        <option value="gcash">GCash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                      </select>
                      {(editMethod === 'gcash' || editMethod === 'bank_transfer') && (
                        <input
                          type="text"
                          value={editReference}
                          onChange={e => setEditReference(e.target.value)}
                          placeholder="Reference #"
                          className="w-full px-2 py-1.5 bg-white border border-[#D1C7BD] rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                        />
                      )}
                      <input
                        type="text"
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="Internal notes (optional)..."
                        className="w-full px-2 py-1.5 bg-white border border-[#D1C7BD] rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                      />
                      <div className="flex justify-end gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setEditingPaymentId(null)}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium text-[#827A73] hover:text-[#2D2A26] flex items-center gap-1"
                        >
                          <X size={11} /> Cancel
                        </button>
                        <button
                          type="button"
                          disabled={savingEdit}
                          onClick={() => handleSaveEdit(payment.id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-taupe hover:bg-taupe/90 text-white flex items-center gap-1 disabled:opacity-50"
                        >
                          <Check size={11} /> {savingEdit ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-[#A8A19A] space-y-0.5">
                      <p>{new Date(payment.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      {payment.recorded_by && <p>By: {payment.recorded_by.name}</p>}
                      {payment.reference && <p>Ref: {payment.reference}</p>}
                      {payment.notes && <p className="text-[#827A73] italic">{payment.notes}</p>}
                    </div>
                  )}

                  {rejectingPaymentId === payment.id && (
                    <div className="space-y-1.5 mt-2 pt-2 border-t border-rose-200">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Reason — e.g. GCash reference doesn't match our records"
                        className="w-full px-2 py-1.5 bg-white border border-rose-200 rounded-lg text-xs text-[#2D2A26] focus:outline-none focus:border-rose-400"
                      />
                      <div className="flex justify-end gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => { setRejectingPaymentId(null); setRejectReason(''); }}
                          className="px-2 py-1 rounded-lg text-[10px] font-medium text-[#827A73] hover:text-[#2D2A26]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submittingReject || !rejectReason.trim()}
                          onClick={() => handleSubmitReject(payment.id)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                        >
                          {submittingReject ? 'Rejecting…' : 'Confirm Reject'}
                        </button>
                      </div>
                    </div>
                  )}

                  {payment.rejected_at && (
                    <div className="mt-2 pt-2 border-t border-rose-200 text-[10px] text-rose-600 space-y-0.5">
                      <p className="font-semibold">
                        Rejected {new Date(payment.rejected_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {payment.rejected_by && ` by ${payment.rejected_by.name}`}
                      </p>
                      {payment.rejected_reason && <p className="italic">{payment.rejected_reason}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
