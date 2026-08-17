'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard, Check, X, ExternalLink, Banknote, Smartphone,
  CheckCircle2, Loader2, XCircle, Receipt, Eye,
  Search, Copy, CheckCheck, Wallet, ArrowUpRight, ArrowRight,
  ChevronLeft, ChevronRight, LayoutList, Layers, AlertCircle, History, RotateCcw,
  ShoppingBag, Store
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePayments, Tab, ReceiptItem } from '@/components/payments/usePayments';
import SearchInput from '@/components/shared/SearchInput';
import PageHeader from '@/components/shared/PageHeader';

const getMethodBadge = (method: string) => {
  const m = method.toLowerCase();
  if (m === 'gcash') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
        <Smartphone size={11} /> GCash
      </span>
    );
  }
  if (m === 'bank_transfer') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200/60">
        <CreditCard size={11} /> Bank
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">
      <Banknote size={11} /> Cash
    </span>
  );
};

const getPaymentStatusBadge = (status: string) => {
  if (status === 'paid') return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">Paid</span>;
  if (status === 'partial') return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">Partial</span>;
  if (status === 'pending') return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">Pending</span>;
  if (status === 'rejected') return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">Rejected</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">Unpaid</span>;
};

const REJECT_PRESET_REASONS = [
  'Reference number does not match receipt screenshot',
  'Screenshot is blurry or unreadable',
  'Amount sent is incorrect or incomplete',
  'Duplicate or invalid transaction proof',
  'Payment not reflected in shop merchant account',
];

export default function PaymentQueuePage() {
  const {
    activeTab,
    setActiveTab,
    receipts,
    processingId,
    receiptsLoading,
    jobBalances,
    balancesLoading,
    balanceSearch,
    setBalanceSearch,
    logPaymentJob,
    setLogPaymentJob,
    payAmount,
    setPayAmount,
    payMethod,
    setPayMethod,
    payNotes,
    setPayNotes,
    payReference,
    setPayReference,
    payReceiptPath,
    setPayReceiptPath,
    payReceiptUploading,
    handlePayReceiptUpload,
    paySubmitting,
    catalogOrders,
    catalogLoading,
    handleVerify,
    handleLogPayment,
    filteredBalances,
  } = usePayments();

  // Receipt Filter State: 'pending' (Needs Review), 'approved' (Verified Proofs), vs 'rejected' (History / Needs Resubmission)
  const [receiptFilter, setReceiptFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [deckIndex, setDeckIndex] = useState(0);
  const [receiptViewMode, setReceiptViewMode] = useState<'deck' | 'list'>('deck');

  // Reject Confirmation Modal State
  const [rejectingItem, setRejectingItem] = useState<ReceiptItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState(REJECT_PRESET_REASONS[0]);
  const [rejectionCustomText, setRejectionCustomText] = useState('');

  // Filtered receipts based on sub-tab
  const activeReceipts = useMemo(() => {
    return receipts.filter(r => {
      if (receiptFilter === 'pending') return r.payment_status === 'pending';
      if (receiptFilter === 'approved') return r.payment_status === 'paid' || r.payment_status === 'approved';
      if (receiptFilter === 'rejected') return r.payment_status === 'rejected';
      return true;
    });
  }, [receipts, receiptFilter]);

  const pendingCount = useMemo(() => receipts.filter(r => r.payment_status === 'pending').length, [receipts]);
  const approvedCount = useMemo(() => receipts.filter(r => r.payment_status === 'paid' || r.payment_status === 'approved').length, [receipts]);
  const rejectedCount = useMemo(() => receipts.filter(r => r.payment_status === 'rejected').length, [receipts]);

  // Keep deck index valid when activeReceipts array changes
  useEffect(() => {
    if (deckIndex >= activeReceipts.length && activeReceipts.length > 0) {
      setDeckIndex(activeReceipts.length - 1);
    } else if (activeReceipts.length === 0) {
      setDeckIndex(0);
    }
  }, [activeReceipts.length, deckIndex]);

  const currentDeckReceipt = activeReceipts[deckIndex] || null;

  const handleNextDeck = () => {
    if (deckIndex < activeReceipts.length - 1) {
      setDeckIndex(prev => prev + 1);
    }
  };

  const handlePrevDeck = () => {
    if (deckIndex > 0) {
      setDeckIndex(prev => prev - 1);
    }
  };

  const confirmRejection = async () => {
    if (!rejectingItem) return;
    await handleVerify(rejectingItem, 'rejected');
    setRejectingItem(null);
    setRejectionCustomText('');
  };

  const [balanceTier, setBalanceTier] = useState<'all' | 'unpaid' | 'partial'>('all');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const displayedBalances = useMemo(() => {
    return filteredBalances.filter(job => {
      if (balanceTier === 'all') return true;
      if (balanceTier === 'unpaid') return job.payment_status === 'unpaid';
      if (balanceTier === 'partial') return job.payment_status === 'partial';
      return true;
    });
  }, [filteredBalances, balanceTier]);

  const totalOutstanding = jobBalances.reduce((sum, j) => sum + (j.balance || 0), 0);
  const totalPendingReceipts = receipts
    .filter(r => r.payment_status === 'pending')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const TAB_DEFS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'receipts',       label: 'Digital Receipts', icon: Receipt },
    { id: 'job_balances',   label: 'Job Balances',     icon: CreditCard },
    { id: 'catalog_orders', label: 'Catalog Orders',   icon: ShoppingBag },
  ];

  return (
    <div className="space-y-4">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <PageHeader
        eyebrow="Money In"
        title="Collect Payments"
        description="Verify GCash and bank receipts, collect job balances, and manage catalog order payments."
      />

      {/* ── Perfectly Proportional & Equal-Height 3-Card Stat Band ─────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-stretch">
        {/* Card 1: Total Outstanding */}
        <div className="bg-taupe text-white rounded-xl p-5 shadow-2xs flex flex-col justify-between h-full min-h-[125px] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">Total Outstanding</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <CreditCard size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black tabular-nums tracking-tight">
              ₱{totalOutstanding.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-white/70 mt-0.5">Uncollected across all active orders</p>
          </div>
        </div>

        {/* Card 2: Pending Digital Receipts */}
        <div className="bg-surface border border-line rounded-xl p-5 shadow-2xs flex flex-col justify-between h-full min-h-[125px] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Pending Verification</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center">
              <Receipt size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-ink tabular-nums tracking-tight">
              ₱{totalPendingReceipts.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">{pendingCount} digital proof(s) in queue</p>
          </div>
        </div>

        {/* Card 3: Ready for Pickup Balance */}
        <div className="bg-surface border border-line rounded-xl p-5 shadow-2xs flex flex-col justify-between h-full min-h-[125px] transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Pickup Stage Balances</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-800 flex items-center justify-center">
              <Store size={15} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-ink tabular-nums tracking-tight">
              ₱{jobBalances
                .filter(j => j.status === 'ready_for_pickup' && j.balance > 0)
                .reduce((sum, j) => sum + j.balance, 0)
                .toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-ink-muted mt-0.5">Collect final payment upon handover</p>
          </div>
        </div>
      </div>

      {/* ── Seamless Flat Underline Tabs (Zero Clutter) ─────────────────── */}
      <div className="flex items-center gap-2 border-b border-line px-1">
        {TAB_DEFS.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 pb-3 pt-1 px-3 text-xs font-bold transition-all relative border-b-2 -mb-px ${
                active
                  ? 'border-taupe text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink hover:border-line'
              }`}
            >
              <Icon size={14} className={active ? 'text-taupe' : 'text-ink-faint'} />
              <span>{t.label}</span>
              {t.id === 'receipts' && pendingCount > 0 && (
                <span className="ml-1 w-2 h-2 rounded-full bg-amber-500 shadow-xs" title={`${pendingCount} pending`} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main Unified Content Container ─────────────────────────────── */}
      <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-2xs">
        {/* Inner Toolbar (Pending/Approved/Rejected Sub-filters on the LEFT, View Switcher on the RIGHT) */}
        {activeTab === 'receipts' && (
          <div className="p-2.5 border-b border-line bg-canvas/20 flex items-center justify-between gap-2.5 flex-wrap">
            {/* Left: Pending vs Approved vs Rejected Sub-Filter with Notification Indicator Dot */}
            <div className="h-[38px] flex items-center gap-1 p-1 bg-canvas border border-line rounded-lg">
              <button
                type="button"
                onClick={() => { setReceiptFilter('pending'); setDeckIndex(0); }}
                className={`h-7 px-3 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  receiptFilter === 'pending'
                    ? 'bg-surface text-ink shadow-2xs border border-line/60'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span>Pending</span>
                {pendingCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" title={`${pendingCount} pending`} />
                )}
              </button>

              <button
                type="button"
                onClick={() => { setReceiptFilter('approved'); setDeckIndex(0); }}
                className={`h-7 px-3 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  receiptFilter === 'approved'
                    ? 'bg-surface text-emerald-700 shadow-2xs border border-line/60'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span>Approved</span>
                {approvedCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title={`${approvedCount} approved`} />
                )}
              </button>

              <button
                type="button"
                onClick={() => { setReceiptFilter('rejected'); setDeckIndex(0); }}
                className={`h-7 px-3 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
                  receiptFilter === 'rejected'
                    ? 'bg-surface text-rose-700 shadow-2xs border border-line/60'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <span>Rejected</span>
                {rejectedCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs" title={`${rejectedCount} rejected`} />
                )}
              </button>
            </div>

            {/* Right: View Switcher Pill */}
            <div className="h-[38px] flex items-center gap-[10px] bg-canvas border border-line rounded-lg px-1.5 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setReceiptViewMode('deck')}
                title="Deck View"
                aria-label="Deck View"
                className={`h-7 w-7 flex items-center justify-center rounded-md transition-all ${
                  receiptViewMode === 'deck'
                    ? 'bg-surface text-ink shadow-xs border border-line/60'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Layers size={15} />
              </button>
              <button
                type="button"
                onClick={() => setReceiptViewMode('list')}
                title="List / Table View"
                aria-label="List / Table View"
                className={`h-7 w-7 flex items-center justify-center rounded-md transition-all ${
                  receiptViewMode === 'list'
                    ? 'bg-surface text-ink shadow-xs border border-line/60'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <LayoutList size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 1: Digital Proofs (Deck Review Mode & List Mode) ─────── */}
        {activeTab === 'receipts' && (
          <div>
            {receiptsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-taupe" size={24} />
              </div>
            ) : activeReceipts.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-2">
                {receiptFilter === 'pending' ? (
                  <>
                    <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-2 opacity-90" />
                    <h3 className="font-bold text-base text-ink">No Pending Receipts</h3>
                    <p className="text-xs text-ink-muted max-w-xs mx-auto">All customer GCash and Bank transfer receipts are verified.</p>
                  </>
                ) : receiptFilter === 'approved' ? (
                  <>
                    <CheckCircle2 size={32} className="mx-auto text-emerald-600 mb-2 opacity-70" />
                    <h3 className="font-bold text-base text-ink">No Approved Receipts Yet</h3>
                    <p className="text-xs text-ink-muted max-w-xs mx-auto">Approved digital payment proofs will appear here for audit and records.</p>
                  </>
                ) : (
                  <>
                    <History size={32} className="mx-auto text-ink-faint mb-2 opacity-70" />
                    <h3 className="font-bold text-base text-ink">No Rejected Receipts</h3>
                    <p className="text-xs text-ink-muted max-w-xs mx-auto">Rejected receipts requiring customer resubmission will appear here.</p>
                  </>
                )}
              </div>
            ) : receiptViewMode === 'deck' && currentDeckReceipt ? (
              /* ── DECK / STEPPER REVIEW MODE ── */
              <div className="p-3.5 sm:p-5 max-w-4xl mx-auto space-y-4">
                {/* Header (Title & Status) */}
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">
                      {receiptFilter === 'rejected' ? 'Rejected Proof History' : receiptFilter === 'approved' ? 'Approved Proof Archive' : 'Receipt Review'}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-taupe/10 text-taupe border border-taupe/20">
                      {deckIndex + 1} of {activeReceipts.length}
                    </span>
                  </div>

                  {/* Header Stepper Navigation */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevDeck}
                      disabled={deckIndex === 0}
                      className="h-7 px-3 rounded-md border border-line bg-canvas hover:bg-surface text-ink font-bold text-xs flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs"
                    >
                      <ChevronLeft size={13} /> <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextDeck}
                      disabled={deckIndex === activeReceipts.length - 1}
                      className="h-7 px-3 rounded-md border border-line bg-canvas hover:bg-surface text-ink font-bold text-xs flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs"
                    >
                      <span>Next</span> <ChevronRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Status Warning Banner if Rejected */}
                {currentDeckReceipt.payment_status === 'rejected' && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-semibold">
                    <AlertCircle size={14} className="text-rose-600 shrink-0" />
                    <span>This proof was rejected. Awaiting customer to submit updated proof.</span>
                  </div>
                )}

                {/* Status Banner if Approved */}
                {(currentDeckReceipt.payment_status === 'paid' || currentDeckReceipt.payment_status === 'approved') && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span>Payment verified and approved. Recorded in shop accounting ledger.</span>
                  </div>
                )}

                {/* 2-Column Content Grid: Left details grouped tightly, Right screenshot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  {/* Left Column: Details */}
                  <div className="bg-canvas/30 border border-line rounded-xl p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface border border-line text-taupe inline-block mb-1">
                        {currentDeckReceipt.type === 'catalog_order' ? 'Catalog Order' : 'Appointment Deposit'}
                      </span>
                      <h2 className="text-sm sm:text-base font-bold text-ink">
                        {currentDeckReceipt.itemName}
                      </h2>
                    </div>

                    <div className="space-y-2 text-xs pt-2 border-t border-line/60">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Customer</span>
                        <span className="font-bold text-ink">{currentDeckReceipt.customer_name}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Amount</span>
                        <span className="font-black text-sm text-ink tabular-nums">
                          ₱{Number(currentDeckReceipt.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Method</span>
                        <span>{getMethodBadge(currentDeckReceipt.payment_method)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Reference #</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-ink bg-surface px-2 py-0.5 rounded border border-line">
                            {currentDeckReceipt.payment_reference || 'N/A'}
                          </span>
                          {currentDeckReceipt.payment_reference && (
                            <button
                              type="button"
                              onClick={() => handleCopy(currentDeckReceipt.payment_reference)}
                              className="p-1 text-ink-muted hover:text-taupe rounded"
                              title="Copy Reference Number"
                            >
                              {copiedRef === currentDeckReceipt.payment_reference ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Date Submitted</span>
                        <span className="font-medium text-ink-muted">
                          {new Date(currentDeckReceipt.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Screenshot Proof / Attachment Box */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-ink-muted px-1">
                      <span className="font-semibold text-[11px]">Screenshot Proof</span>
                      {currentDeckReceipt.payment_receipt_path && (
                        <a
                          href={currentDeckReceipt.payment_receipt_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-bold text-taupe hover:underline inline-flex items-center gap-1"
                        >
                          <Eye size={11} /> Open Full Image
                        </a>
                      )}
                    </div>

                    {currentDeckReceipt.payment_receipt_path ? (
                      <div className="rounded-xl border border-line overflow-hidden bg-black/5 relative group h-[280px] sm:h-[320px] flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={currentDeckReceipt.payment_receipt_path}
                          alt="Payment Receipt"
                          className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                          onClick={() => window.open(currentDeckReceipt.payment_receipt_path, '_blank')}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-[180px] sm:h-[200px] rounded-xl border border-dashed border-line bg-canvas/30 flex flex-col items-center justify-center text-center p-4 space-y-1 text-ink-faint">
                        <Receipt size={28} className="opacity-40" />
                        <p className="text-xs font-bold text-ink">No Screenshot Attached</p>
                        <p className="text-[11px] text-ink-muted max-w-[220px]">Verify by checking Reference # {currentDeckReceipt.payment_reference}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Bottom Action Bar ── */}
                <div className="pt-3 border-t border-line">
                  {currentDeckReceipt.payment_status === 'pending' ? (
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => setRejectingItem(currentDeckReceipt)}
                        disabled={processingId !== null}
                        className="w-full h-10 border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50 font-bold px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors shadow-2xs"
                      >
                        <X size={14} />
                        <span>Reject & Request New Proof</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVerify(currentDeckReceipt, 'paid')}
                        disabled={processingId !== null}
                        className="w-full h-10 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors shadow-2xs"
                      >
                        {processingId === currentDeckReceipt.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        <span>Approve & Mark as Paid</span>
                      </button>
                    </div>
                  ) : currentDeckReceipt.payment_status === 'rejected' ? (
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <div className="w-full h-10 flex items-center justify-center text-xs text-rose-700 font-bold px-3 bg-rose-50 border border-rose-200 rounded-xl">
                        Status: Rejected
                      </div>
                      <button
                        type="button"
                        onClick={() => handleVerify(currentDeckReceipt, 'paid')}
                        disabled={processingId !== null}
                        className="w-full h-10 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors shadow-2xs"
                      >
                        {processingId === currentDeckReceipt.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <RotateCcw size={14} />
                        )}
                        <span>Re-Approve as Paid</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-10 flex items-center justify-between text-xs px-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                      <span className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        Verified & Approved
                      </span>
                      <button
                        type="button"
                        onClick={() => setRejectingItem(currentDeckReceipt)}
                        disabled={processingId !== null}
                        className="text-xs font-semibold text-rose-700 hover:underline"
                      >
                        Revoke / Mark as Rejected
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ── TABLE LIST VIEW ──────────── */
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-ink-body">
                  <thead className="bg-canvas/50 text-[10px] font-bold uppercase tracking-wider text-ink-faint border-b border-line">
                    <tr>
                      <th className="px-4 py-2.5">Customer & Item</th>
                      <th className="px-4 py-2.5">Channel & Ref</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                      <th className="px-4 py-2.5 text-center">Status</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {activeReceipts.map((item, idx) => (
                      <tr key={`${item.type}-${item.id}`} className="hover:bg-canvas/40 transition-colors">
                        <td className="px-4 py-3 align-middle">
                          <p className="font-bold text-xs text-ink">{item.customer_name}</p>
                          <p className="text-[11px] text-ink-muted truncate max-w-xs">{item.itemName}</p>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-1.5">
                            {getMethodBadge(item.payment_method)}
                            <span className="font-mono text-xs font-medium text-ink bg-canvas border border-line px-1.5 py-0.5 rounded">
                              {item.payment_reference || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle text-xs text-ink-muted whitespace-nowrap">
                          {new Date(item.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 align-middle text-right font-bold text-sm text-ink tabular-nums whitespace-nowrap">
                          ₱{Number(item.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 align-middle text-center">
                          {getPaymentStatusBadge(item.payment_status)}
                        </td>
                        <td className="px-4 py-3 align-middle text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => { setDeckIndex(idx); setReceiptViewMode('deck'); }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-taupe hover:underline bg-taupe/10 px-2.5 py-1 rounded-md"
                            >
                              <Eye size={12} /> Inspect
                            </button>
                            {item.payment_status === 'pending' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleVerify(item, 'paid')}
                                  disabled={processingId !== null}
                                  className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors disabled:opacity-50"
                                >
                                  {processingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectingItem(item)}
                                  disabled={processingId !== null}
                                  className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-line text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                                >
                                  <X size={12} /> Reject
                                </button>
                              </>
                            ) : item.payment_status === 'rejected' ? (
                              <button
                                type="button"
                                onClick={() => handleVerify(item, 'paid')}
                                disabled={processingId !== null}
                                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors disabled:opacity-50"
                              >
                                {processingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                                <span>Re-Approve</span>
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-emerald-700 px-2.5 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Outstanding Balances ─────────────────────────────── */}
        {activeTab === 'job_balances' && (
          <div>
            {/* Toolbar */}
            <div className="p-3 border-b border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-canvas/10">
              <SearchInput
                value={balanceSearch}
                onChange={setBalanceSearch}
                placeholder="Search order # or customer..."
                className="w-full sm:w-64 shrink-0"
              />

              <div className="flex items-center gap-1.5 shrink-0">
                {(['all', 'unpaid', 'partial'] as const).map(tier => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setBalanceTier(tier)}
                    className={`h-[34px] px-3 rounded-lg text-xs font-semibold border transition-all capitalize ${
                      balanceTier === tier
                        ? 'bg-taupe text-white border-taupe shadow-xs'
                        : 'bg-canvas text-ink border-line hover:bg-sunken'
                    }`}
                  >
                    {tier === 'all' ? 'All' : tier}
                  </button>
                ))}
              </div>
            </div>

            {balancesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-taupe" size={24} />
              </div>
            ) : displayedBalances.length === 0 ? (
              <div className="text-center py-16 px-4">
                <CheckCircle2 size={28} className="mx-auto text-emerald-600 mb-2 opacity-80" />
                <h3 className="font-bold text-sm text-ink">No Balances Found</h3>
                <p className="text-xs text-ink-muted mt-0.5">All active job orders are paid in full.</p>
              </div>
            ) : (
              <div>
                {/* Mobile View for Balances */}
                <div className="block md:hidden divide-y divide-line">
                  {displayedBalances.map(job => {
                    const amountPaid = job.total_amount - job.balance - (job.discount_amount || 0);
                    return (
                      <div key={`mob-job-${job.id}`} className="p-3.5 space-y-2 hover:bg-canvas/30 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link href={`/dashboard/jobs/${job.id}`} className="font-mono text-sm font-bold text-taupe hover:underline">
                              {job.order_number}
                            </Link>
                            <p className="text-xs text-ink font-medium mt-0.5">{job.customer?.name || 'Walk-in Client'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold text-rose-600 tabular-nums">₱{job.balance.toFixed(2)}</p>
                            <span className="text-[10px] text-ink-faint">due</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-ink-muted">
                          <span>Total: ₱{job.total_amount.toFixed(2)}</span>
                          <span className="text-emerald-700 font-semibold">Paid: ₱{amountPaid.toFixed(2)}</span>
                          {getPaymentStatusBadge(job.payment_status)}
                        </div>

                        <button
                          type="button"
                          onClick={() => { setLogPaymentJob(job); setPayAmount(String(job.balance)); }}
                          className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg bg-taupe hover:bg-taupe-hover text-white shadow-2xs transition-colors"
                        >
                          <CreditCard size={13} /> <span>Log Payment</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View for Balances */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm text-ink-body">
                    <thead className="bg-canvas/50 text-[10px] font-bold uppercase tracking-wider text-ink-faint border-b border-line">
                      <tr>
                        <th className="px-4 py-2.5">Order</th>
                        <th className="px-4 py-2.5">Customer</th>
                        <th className="px-4 py-2.5 text-right">Total</th>
                        <th className="px-4 py-2.5 text-right">Paid</th>
                        <th className="px-4 py-2.5 text-right">Balance Due</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {displayedBalances.map(job => {
                        const amountPaid = job.total_amount - job.balance - (job.discount_amount || 0);

                        return (
                          <tr key={job.id} className="hover:bg-canvas/40 transition-colors">
                            <td className="px-4 py-3 align-middle font-mono text-xs font-bold text-taupe">
                              <Link href={`/dashboard/jobs/${job.id}`} className="hover:underline">
                                {job.order_number}
                              </Link>
                            </td>
                            <td className="px-4 py-3 align-middle font-medium text-xs text-ink">
                              {job.customer?.name || <span className="text-ink-faint italic font-normal">Walk-in</span>}
                            </td>
                            <td className="px-4 py-3 align-middle text-right text-xs font-medium text-ink tabular-nums">
                              ₱{job.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 align-middle text-right text-xs font-semibold text-emerald-700 tabular-nums">
                              ₱{amountPaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 align-middle text-right font-bold text-xs text-rose-600 tabular-nums">
                              ₱{job.balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 align-middle text-center">
                              {getPaymentStatusBadge(job.payment_status)}
                            </td>
                            <td className="px-4 py-3 align-middle text-right">
                              <button
                                type="button"
                                onClick={() => { setLogPaymentJob(job); setPayAmount(String(job.balance)); }}
                                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-taupe hover:bg-taupe-hover text-white shadow-2xs transition-colors"
                              >
                                <CreditCard size={12} /> <span>Log Pay</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: Catalog Orders ───────────────────────────────────── */}
        {activeTab === 'catalog_orders' && (
          <div>
            {catalogLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="animate-spin text-taupe" size={24} />
              </div>
            ) : catalogOrders.length === 0 ? (
              <div className="text-center py-16 px-4">
                <h3 className="font-bold text-sm text-ink">No Catalog Orders</h3>
                <p className="text-xs text-ink-muted mt-0.5">Ready-to-wear direct purchases will appear here.</p>
              </div>
            ) : (
              <div>
                {/* Mobile Catalog View */}
                <div className="block md:hidden divide-y divide-line">
                  {catalogOrders.map(ord => (
                    <div key={`mob-ord-${ord.id}`} className="p-3.5 space-y-2 hover:bg-canvas/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm text-ink">{ord.catalog_item?.name || 'Catalog Item'}</p>
                          <p className="text-xs text-ink-muted">{ord.customer?.name || 'Guest'}</p>
                        </div>
                        <p className="text-base font-bold text-ink tabular-nums">₱{Number(ord.total_amount).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          {getMethodBadge(ord.payment_method)}
                          {getPaymentStatusBadge(ord.payment_status)}
                        </div>
                        <Link href={`/dashboard/orders?order=${ord.id}`} className="font-bold text-taupe hover:underline flex items-center gap-0.5">
                          <span>Order #{ord.id}</span> <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Catalog View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-sm text-ink-body">
                    <thead className="bg-canvas/50 text-[10px] font-bold uppercase tracking-wider text-ink-faint border-b border-line">
                      <tr>
                        <th className="px-4 py-2.5">Item</th>
                        <th className="px-4 py-2.5">Customer</th>
                        <th className="px-4 py-2.5 text-right">Amount</th>
                        <th className="px-4 py-2.5">Method</th>
                        <th className="px-4 py-2.5 text-center">Payment</th>
                        <th className="px-4 py-2.5 text-right">Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {catalogOrders.map(ord => (
                        <tr key={ord.id} className="hover:bg-canvas/40 transition-colors">
                          <td className="px-4 py-3 align-middle font-bold text-xs text-ink">
                            {ord.catalog_item?.name || 'Catalog Item'}
                          </td>
                          <td className="px-4 py-3 align-middle text-xs font-medium text-ink">
                            {ord.customer?.name || <span className="text-ink-faint italic">Guest</span>}
                          </td>
                          <td className="px-4 py-3 align-middle text-right font-bold text-xs text-ink tabular-nums">
                            ₱{Number(ord.total_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            {getMethodBadge(ord.payment_method)}
                          </td>
                          <td className="px-4 py-3 align-middle text-center">
                            {getPaymentStatusBadge(ord.payment_status)}
                          </td>
                          <td className="px-4 py-3 align-middle text-right">
                            <Link
                              href={`/dashboard/orders?order=${ord.id}`}
                              className="text-xs font-bold text-taupe hover:underline inline-flex items-center gap-1"
                            >
                              <span>#{ord.id}</span> <ArrowUpRight size={11} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modal 1: Reject Reason Confirmation Dialog ─────────────────── */}
      {rejectingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
          <div className="bg-surface rounded-2xl border border-line w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-line bg-rose-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertCircle size={18} />
                <h3 className="font-bold text-sm">Reject & Request New Proof</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="p-1 text-ink-faint hover:text-ink rounded"
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
                onClick={() => setRejectingItem(null)}
                className="px-3 py-1.5 text-xs font-bold text-ink-muted hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRejection}
                disabled={processingId !== null}
                className="bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              >
                {processingId === rejectingItem.id ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 2: Log Payment Dialog ────────────────────────────────── */}
      {logPaymentJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl border border-line w-full max-w-md shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-line flex items-center justify-between bg-canvas/30">
              <div>
                <h3 className="font-bold text-ink text-sm">Log Payment</h3>
                <p className="text-xs text-ink-muted">{logPaymentJob.order_number} · {logPaymentJob.customer?.name || 'Walk-in'}</p>
              </div>
              <button
                type="button"
                onClick={() => { setLogPaymentJob(null); setPayAmount(''); setPayNotes(''); setPayReference(''); setPayReceiptPath(''); }}
                className="p-1 text-ink-faint hover:text-ink rounded"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-4 space-y-3">
              {/* Balance Bar */}
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-rose-800">Remaining Balance:</span>
                <span className="text-base font-black text-rose-700 tabular-nums">₱{logPaymentJob.balance.toFixed(2)}</span>
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
                    { id: 'bank_transfer', label: 'Bank' },
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

              {/* Reference # for GCash / Bank */}
              {(payMethod === 'gcash' || payMethod === 'bank_transfer') && (
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
                onClick={() => { setLogPaymentJob(null); setPayAmount(''); setPayNotes(''); setPayReference(''); setPayReceiptPath(''); }}
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
      )}
    </div>
  );
}
