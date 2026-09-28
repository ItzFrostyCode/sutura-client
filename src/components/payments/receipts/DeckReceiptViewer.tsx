'use client';

import React from 'react';
import {
  Check, X, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2,
  Copy, CheckCheck, Eye, Receipt, RotateCcw, Loader2
} from 'lucide-react';
import { ReceiptItem } from '../usePayments';
import { getMethodBadge } from '../paymentHelpers';

interface DeckReceiptViewerProps {
  receipt: ReceiptItem;
  receiptFilter: 'pending' | 'approved' | 'rejected';
  deckIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
  onCopyRef: (ref: string) => void;
  copiedRef: string | null;
  onOpenRejectModal: (receipt: ReceiptItem) => void;
  onVerify: (receipt: ReceiptItem, status: 'paid' | 'rejected') => void;
  processingId: number | null;
}

export default function DeckReceiptViewer({
  receipt,
  receiptFilter,
  deckIndex,
  totalCount,
  onPrev,
  onNext,
  onCopyRef,
  copiedRef,
  onOpenRejectModal,
  onVerify,
  processingId,
}: DeckReceiptViewerProps) {
  return (
    <div className="p-3.5 sm:p-5 max-w-4xl mx-auto space-y-4">
      {/* Header (Title & Status) */}
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-faint truncate">
            {receiptFilter === 'rejected' ? 'Rejected Proof History' : receiptFilter === 'approved' ? 'Approved Proof Archive' : 'Receipt Review'}
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-taupe/10 text-taupe border border-taupe/20 shrink-0">
            {deckIndex + 1} of {totalCount}
          </span>
        </div>

        {/* Stepper Navigation */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onPrev}
            disabled={deckIndex === 0}
            className="h-7 px-3 rounded-md border border-line bg-canvas hover:bg-surface text-ink font-bold text-xs flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs"
          >
            <ChevronLeft size={13} /> <span>Back</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={deckIndex === totalCount - 1}
            className="h-7 px-3 rounded-md border border-line bg-canvas hover:bg-surface text-ink font-bold text-xs flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xs"
          >
            <span>Next</span> <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Status Warning Banner */}
      {receipt.payment_status === 'rejected' && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 font-semibold">
          <AlertCircle size={14} className="text-rose-600 shrink-0" />
          <span>This proof was rejected. Awaiting customer to submit updated proof.</span>
        </div>
      )}

      {(receipt.payment_status === 'paid' || receipt.payment_status === 'approved') && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
          <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
          <span>Payment verified and approved. Recorded in store accounting ledger.</span>
        </div>
      )}

      {/* 2-Column Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        {/* Left Column: Details */}
        <div className="bg-canvas/30 border border-line rounded-xl p-4 space-y-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface border border-line text-taupe inline-block mb-1">
              {receipt.type === 'catalog_order' ? 'Catalog Order' : 'Appointment Deposit'}
            </span>
            <h2 className="text-sm sm:text-base font-bold text-ink">{receipt.itemName}</h2>
          </div>

          <div className="space-y-2 text-xs pt-2 border-t border-line/60">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Customer</span>
              <span className="font-bold text-ink">{receipt.customer_name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Amount</span>
              <span className="font-black text-sm text-ink tabular-nums">
                ₱{Number(receipt.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Method</span>
              <span>{getMethodBadge(receipt.payment_method)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Reference #</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs text-ink bg-surface px-2 py-0.5 rounded border border-line">
                  {receipt.payment_reference || 'N/A'}
                </span>
                {receipt.payment_reference && (
                  <button
                    type="button"
                    onClick={() => onCopyRef(receipt.payment_reference)}
                    className="p-1 text-ink-muted hover:text-taupe rounded"
                    title="Copy Reference Number"
                  >
                    {copiedRef === receipt.payment_reference ? <CheckCheck size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Date Submitted</span>
              <span className="font-medium text-ink-muted">
                {new Date(receipt.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Screenshot Proof */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-ink-muted px-1">
            <span className="font-semibold text-[11px]">Screenshot Proof</span>
            {receipt.payment_receipt_path && (
              <a
                href={receipt.payment_receipt_path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-taupe hover:underline inline-flex items-center gap-1"
              >
                <Eye size={11} /> Open Full Image
              </a>
            )}
          </div>

          {receipt.payment_receipt_path ? (
            <div className="rounded-xl border border-line overflow-hidden bg-black/5 relative group h-[280px] sm:h-[320px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receipt.payment_receipt_path}
                alt="Payment Receipt"
                className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => window.open(receipt.payment_receipt_path, '_blank')}
              />
            </div>
          ) : (
            <div className="w-full h-[180px] sm:h-[200px] rounded-xl border border-dashed border-line bg-canvas/30 flex flex-col items-center justify-center text-center p-4 space-y-1 text-ink-faint">
              <Receipt size={28} className="opacity-40" />
              <p className="text-xs font-bold text-ink">No Screenshot Attached</p>
              <p className="text-[11px] text-ink-muted max-w-[220px]">Verify by checking Reference # {receipt.payment_reference}</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="pt-3 border-t border-line">
        {receipt.payment_status === 'pending' ? (
          <div className="grid grid-cols-2 gap-3 w-full">
            {/* min-h-10 (not a fixed h-10) plus a shorter mobile-only label
                — at real phone widths these two columns are only ~140px
                each, and the full "Reject & Request New Proof"/"Approve &
                Mark as Paid" labels were wrapping to two lines inside a
                fixed-height button, spilling outside it. */}
            <button
              type="button"
              onClick={() => onOpenRejectModal(receipt)}
              disabled={processingId !== null}
              className="w-full min-h-10 border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50 font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors shadow-2xs"
            >
              <X size={14} className="shrink-0" />
              <span className="sm:hidden">Reject</span>
              <span className="hidden sm:inline">Reject & Request New Proof</span>
            </button>
            <button
              type="button"
              onClick={() => onVerify(receipt, 'paid')}
              disabled={processingId !== null}
              className="w-full min-h-10 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors shadow-2xs"
            >
              {processingId === receipt.id ? (
                <Loader2 size={14} className="animate-spin shrink-0" />
              ) : (
                <Check size={14} className="shrink-0" />
              )}
              <span className="sm:hidden">Approve</span>
              <span className="hidden sm:inline">Approve & Mark as Paid</span>
            </button>
          </div>
        ) : receipt.payment_status === 'rejected' ? (
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="w-full min-h-10 flex items-center justify-center text-xs text-rose-700 font-bold px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-center">
              Status: Rejected
            </div>
            <button
              type="button"
              onClick={() => onVerify(receipt, 'paid')}
              disabled={processingId !== null}
              className="w-full min-h-10 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors shadow-2xs text-center"
            >
              {processingId === receipt.id ? (
                <Loader2 size={14} className="animate-spin shrink-0" />
              ) : (
                <RotateCcw size={14} className="shrink-0" />
              )}
              <span>Re-Approve as Paid</span>
            </button>
          </div>
        ) : (
          <div className="w-full min-h-10 flex items-center justify-between gap-2 flex-wrap text-xs px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
            <span className="font-bold flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              Verified & Approved
            </span>
            <button
              type="button"
              onClick={() => onOpenRejectModal(receipt)}
              disabled={processingId !== null}
              className="text-xs font-semibold text-rose-700 hover:underline"
            >
              Revoke / Mark as Rejected
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
