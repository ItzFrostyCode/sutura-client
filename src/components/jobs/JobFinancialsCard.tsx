import React, { useState } from 'react';
import Link from 'next/link';
import { Job, Payment } from './jobTypes';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Pencil,
  Check,
  Printer,
  Tag,
  MoreVertical,
  Flag,
  Upload,
  Loader2,
  Receipt,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface JobFinancialsCardProps {
  readonly job: Job;
  readonly saving: boolean;
  readonly onCharge: (amount: number, method: string, notes: string, reference?: string, receiptPath?: string) => Promise<void>;
  readonly onApplyDiscount: (amount: number, reason: string) => Promise<void>;
  readonly onUpdatePayment: (paymentId: number, fields: { payment_method: string; reference?: string; notes?: string; receipt_path?: string }) => Promise<void>;
  readonly onRejectPayment: (paymentId: number, reason: string) => Promise<void>;
}

const METHOD_CONFIG: Record<string, { label: string; icon: React.ReactNode; badgeCls: string }> = {
  cash: {
    label: 'Cash',
    icon: <Banknote size={15} className="text-emerald-600" />,
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  gcash: {
    label: 'GCash',
    icon: <Smartphone size={15} className="text-blue-600" />,
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  bank_transfer: {
    label: 'Bank Transfer',
    icon: <CreditCard size={15} className="text-purple-600" />,
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
  },
};

export default function JobFinancialsCard({
  job,
  saving,
  onCharge,
  onApplyDiscount,
  onUpdatePayment,
  onRejectPayment,
}: JobFinancialsCardProps) {
  const totalAmount       = Number.parseFloat(String(job.total_amount)) || 0;
  const remainingBalance  = Math.max(0, Number.parseFloat(String(job.balance)) || 0);
  const discountApplied   = Number.parseFloat(String(job.discount_amount ?? 0)) || 0;
  const amountPaid        = Math.max(0, totalAmount - remainingBalance - discountApplied);
  const jobIsCompleted    = job.status === 'completed';
  const jobIsCancelled    = job.status === 'cancelled';
  const { shop } = useAuthStore();

  // Cashier State
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes]   = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [charging, setCharging] = useState(false);

  // Discount State
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  // Edit / Reject Payment State
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [editMethod, setEditMethod] = useState('cash');
  const [editReference, setEditReference] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editReceiptUrl, setEditReceiptUrl] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [menuOpenPaymentId, setMenuOpenPaymentId] = useState<number | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  const uploadReceipt = async (file: File | undefined, onDone: (url: string) => void, setUploading: (v: boolean) => void) => {
    if (!file || !shop) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/shops/${shop.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onDone(res.data?.data?.url || res.data?.url || '');
    } catch {
      alert('Failed to upload receipt image.');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyDiscountSubmit = async () => {
    const amt = Number.parseFloat(discountInput);
    if (!amt || amt <= 0) return;
    setApplyingDiscount(true);
    try {
      await onApplyDiscount(amt, discountReason);
      setShowDiscountForm(false);
      setDiscountInput('');
      setDiscountReason('');
    } finally {
      setApplyingDiscount(false);
    }
  };

  const handleSaveEdit = async (paymentId: number) => {
    setSavingEdit(true);
    try {
      await onUpdatePayment(paymentId, {
        payment_method: editMethod,
        reference: editReference || undefined,
        notes: editNotes || undefined,
        receipt_path: editReceiptUrl || undefined,
      });
      setEditingPaymentId(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSubmitReject = async (paymentId: number) => {
    if (!rejectReason.trim()) return;
    setSubmittingReject(true);
    try {
      await onRejectPayment(paymentId, rejectReason.trim());
      setRejectingPaymentId(null);
      setRejectReason('');
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
      await onCharge(amt, method, notes, reference || undefined, receiptUrl || undefined);
      setAmount('');
      setReference('');
      setNotes('');
      setReceiptUrl('');
    } finally {
      setCharging(false);
    }
  };

  const startEditingPayment = (payment: Payment) => {
    setEditingPaymentId(payment.id);
    setEditMethod(payment.payment_method);
    setEditReference(payment.reference || '');
    setEditNotes(payment.notes || '');
    setEditReceiptUrl(payment.receipt_path || '');
    setRejectingPaymentId(null);
    setRejectReason('');
  };

  // Calculations & Percentages
  const percentCollected = totalAmount > 0 ? Math.min(100, Math.round(((amountPaid + discountApplied) / totalAmount) * 100)) : 0;
  const isDownpaymentMet = totalAmount > 0 && amountPaid >= totalAmount * 0.5;

  const paymentStatus = job.payment_status;
  const statusBadge = {
    paid:    { label: 'Fully Settled', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    partial: { label: 'Partial Deposit', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    unpaid:  { label: 'Unpaid Order', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    pending: { label: 'Pending Verification', cls: 'bg-sunken text-ink-muted border-line' },
  }[paymentStatus] ?? { label: paymentStatus, cls: 'bg-sunken text-ink-muted border-line' };

  return (
    <div className="space-y-6">
      {/* 2-Column Balanced Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Financial Statement & Audit Ledger (7 Columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Statement Card */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-canvas border border-line flex items-center justify-center text-taupe shrink-0">
                  <Receipt size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-ink">Financial Statement</h2>
                  <p className="text-xs text-ink-muted">Contract balance, collections, and discounts</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${statusBadge.cls}`}>
                  {statusBadge.label}
                </span>
                <Link
                  href={`/print/jobs/${job.id}/receipt`}
                  target="_blank"
                  title="Print full statement"
                  className="h-8 px-2.5 rounded-lg bg-canvas hover:bg-surface border border-line text-ink-muted hover:text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Printer size={13} />
                  <span className="hidden sm:inline">Print Statement</span>
                </Link>
              </div>
            </div>

            {/* Collection Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-ink-muted">Collection Progress</span>
                <span className="font-bold text-ink">{percentCollected}% Collected</span>
              </div>
              <div className="h-2 w-full bg-sunken rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    remainingBalance === 0 ? 'bg-emerald-600' : 'bg-taupe'
                  }`}
                  style={{ width: `${percentCollected}%` }}
                />
                {/* 50% Milestone Marker */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-black/15 z-10" title="50% Downpayment Threshold" />
              </div>
              <div className="flex justify-between items-center text-[10px] text-ink-faint pt-0.5">
                <span>Intake: ₱0.00</span>
                <span className={`font-semibold ${isDownpaymentMet ? 'text-emerald-700' : 'text-amber-700'}`}>
                  50% DP: ₱{(totalAmount * 0.5).toFixed(2)} {isDownpaymentMet ? '✓' : '(Required)'}
                </span>
                <span>Total: ₱{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Statement Breakdown Table */}
            <div className="bg-canvas border border-line rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-muted">Total Contract Price:</span>
                <span className="font-bold text-ink">₱{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-600" />
                  Payments Collected:
                </span>
                <span className="font-bold text-emerald-700">−₱{amountPaid.toFixed(2)}</span>
              </div>

              {discountApplied > 0 && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rose-700 font-medium flex items-center gap-1">
                    <Tag size={12} className="text-rose-600" />
                    Courtesy Discount:
                  </span>
                  <span className="font-bold text-rose-700">−₱{discountApplied.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-line-strong pt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-xs font-bold text-ink uppercase tracking-wider block">Remaining Balance</span>
                  <span className="text-[10px] text-ink-muted">
                    {remainingBalance === 0 ? 'Fully settled order' : 'Payable upon fitting or claim'}
                  </span>
                </div>
                <span className={`text-xl font-black font-mono ${remainingBalance > 0 ? 'text-danger' : 'text-emerald-700'}`}>
                  ₱{remainingBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Apply Courtesy / Suki Discount Section */}
            {!jobIsCompleted && !jobIsCancelled && remainingBalance > 0 && (
              <div className="pt-1">
                {showDiscountForm ? (
                  <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 uppercase tracking-wider">
                        <Tag size={14} className="text-rose-600" />
                        Apply Suki / Courtesy Discount
                      </div>
                      {typeof job.customer_job_count === 'number' && (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full">
                          {job.customer_job_count === 1 ? 'First order' : `${job.customer_job_count} past orders`}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint font-semibold text-xs">₱</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max={remainingBalance}
                          value={discountInput}
                          onChange={e => setDiscountInput(e.target.value)}
                          placeholder="Discount amount"
                          className="w-full pl-7 pr-3 py-2 bg-surface border border-rose-200 rounded-lg text-ink focus:outline-none focus:border-rose-400 text-xs shadow-2xs"
                        />
                      </div>
                      <input
                        type="text"
                        value={discountReason}
                        onChange={e => setDiscountReason(e.target.value)}
                        placeholder="Reason (e.g. Suki loyal customer)"
                        className="w-full px-3 py-2 bg-surface border border-rose-200 rounded-lg text-xs text-ink focus:outline-none focus:border-rose-400 shadow-2xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => { setShowDiscountForm(false); setDiscountInput(''); setDiscountReason(''); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={applyingDiscount || !discountInput || Number.parseFloat(discountInput) <= 0}
                        onClick={handleApplyDiscountSubmit}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors shadow-2xs"
                      >
                        {applyingDiscount ? 'Applying…' : 'Apply Discount'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDiscountForm(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-rose-300 hover:border-rose-400 text-rose-700 hover:bg-rose-50/50 text-xs font-semibold rounded-xl transition-all shadow-2xs"
                  >
                    <Tag size={13} />
                    <span>Apply Suki / Courtesy Discount</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Payment History & Audit Ledger */}
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-taupe" />
                <h3 className="text-sm font-bold text-ink">Payment History & Audit Ledger</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-canvas text-ink-muted border border-line">
                  {job.payments?.length || 0}
                </span>
              </div>
              {jobIsCompleted && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sunken text-ink-muted px-2 py-0.5 rounded-full border border-line">
                  Ledger Locked
                </span>
              )}
            </div>

            {job.payments && job.payments.length > 0 ? (
              <div className="space-y-3">
                {job.payments.map(payment => {
                  const cfg = METHOD_CONFIG[payment.payment_method] ?? {
                    label: payment.payment_method,
                    icon: <CreditCard size={14} />,
                    badgeCls: 'bg-sunken text-ink-muted border-line',
                  };

                  return (
                    <div key={payment.id} className="bg-canvas border border-line rounded-xl p-3.5 space-y-2">
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
                            href={`/print/jobs/${job.id}/receipt?payment=${payment.id}`}
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
                                onClick={() => setMenuOpenPaymentId(p => (p === payment.id ? null : payment.id))}
                                title="Actions"
                                className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface transition-colors"
                              >
                                <MoreVertical size={14} />
                              </button>
                              {menuOpenPaymentId === payment.id && (
                                <div className="absolute right-0 top-6 bg-surface border border-line rounded-xl shadow-lg min-w-37.5 z-20 overflow-hidden py-1">
                                  {!jobIsCompleted && (
                                    <button
                                      type="button"
                                      onClick={() => { startEditingPayment(payment); setMenuOpenPaymentId(null); }}
                                      className="w-full text-left px-3 py-2 text-xs text-ink-body hover:bg-canvas flex items-center gap-2"
                                    >
                                      <Pencil size={12} /> Edit Details
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => { setEditingPaymentId(null); setRejectingPaymentId(payment.id); setMenuOpenPaymentId(null); }}
                                    className="w-full text-left px-3 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-medium"
                                  >
                                    <Flag size={12} /> Flag / Reject…
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Metadata Row */}
                      {editingPaymentId === payment.id ? (
                        <div className="space-y-2 mt-2 pt-2 border-t border-line">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                              value={editMethod}
                              onChange={e => setEditMethod(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-surface border border-line rounded-lg text-xs text-ink focus:outline-none focus:border-taupe"
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
                              onClick={() => setEditingPaymentId(null)}
                              className="px-2.5 py-1 rounded-lg text-xs text-ink-muted hover:text-ink"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={savingEdit}
                              onClick={() => handleSaveEdit(payment.id)}
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-taupe hover:bg-taupe-hover text-white flex items-center gap-1 shadow-2xs"
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
                      {rejectingPaymentId === payment.id && (
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
                              onClick={() => { setRejectingPaymentId(null); setRejectReason(''); }}
                              className="px-2.5 py-1 rounded-lg text-xs text-ink-muted hover:text-ink"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={submittingReject || !rejectReason.trim()}
                              onClick={() => handleSubmitReject(payment.id)}
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-2xs"
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
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-ink-faint border border-dashed border-line rounded-xl bg-canvas/40">
                <Receipt size={24} className="mx-auto mb-1.5 opacity-40" />
                <p className="text-xs font-medium">No payments recorded yet</p>
                <p className="text-[10px] text-ink-faint">Use the cashier desk on the right to log downpayment.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Cashier Desk & Record Payment Form (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
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
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Quick Fill Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Quick Amount Presets</span>
                  <div className="flex flex-wrap gap-1.5">
                    {/* Exact Remaining Balance */}
                    <button
                      type="button"
                      onClick={() => setAmount(remainingBalance.toFixed(2))}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-canvas hover:bg-surface border border-line text-ink hover:border-taupe transition-colors shadow-2xs"
                    >
                      Full Balance (₱{remainingBalance.toFixed(2)})
                    </button>
                    {/* 50% Downpayment Shortcut if not yet paid */}
                    {!isDownpaymentMet && (
                      <button
                        type="button"
                        onClick={() => {
                          const dpShortfall = Math.max(0, (totalAmount * 0.5) - amountPaid);
                          if (dpShortfall > 0) setAmount(dpShortfall.toFixed(2));
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sage/10 hover:bg-sage/20 border border-sage/30 text-sage transition-colors shadow-2xs"
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

                {/* Payment Method Selector Cards */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted block">Payment Channel</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'cash', label: 'Cash', icon: Banknote },
                      { key: 'gcash', label: 'GCash', icon: Smartphone },
                      { key: 'bank_transfer', label: 'Bank', icon: CreditCard },
                    ].map(m => {
                      const isSelected = method === m.key;
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.key}
                          type="button"
                          onClick={() => setMethod(m.key)}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all shadow-2xs ${
                            isSelected
                              ? 'bg-taupe/10 border-taupe text-ink font-bold ring-1 ring-taupe/50'
                              : 'bg-canvas border-line text-ink-muted hover:text-ink hover:bg-surface'
                          }`}
                        >
                          <Icon size={16} className={`mb-1 ${isSelected ? 'text-taupe' : 'text-ink-muted'}`} />
                          <span className="text-xs leading-none">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* GCash / Bank Reference & Receipt Screenshot */}
                {(method === 'gcash' || method === 'bank_transfer') && (
                  <div className="space-y-3 p-3 bg-canvas border border-line rounded-xl">
                    <div className="space-y-1">
                      <label htmlFor="ref-no" className="text-[11px] font-bold text-ink-muted uppercase">
                        {method === 'gcash' ? 'GCash Reference Number' : 'Bank Reference Number'}
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
                      <span className="text-[11px] font-bold text-ink-muted uppercase block">Receipt Proof (Optional)</span>
                      {receiptUrl ? (
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={receiptUrl} alt="Receipt Screenshot" className="h-16 w-16 object-cover rounded-lg border border-line" />
                          <button
                            type="button"
                            onClick={() => setReceiptUrl('')}
                            className="text-xs font-semibold text-rose-600 hover:underline"
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

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={saving || charging || !amount || Number.parseFloat(amount) <= 0}
                  className="w-full h-11 bg-taupe hover:bg-taupe-hover text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 active:scale-95"
                >
                  {saving || charging ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CreditCard size={15} />
                  )}
                  <span>{charging ? 'Processing…' : 'Record Payment & Issue Receipt'}</span>
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
        </div>

      </div>
    </div>
  );
}
