'use client';

import React from 'react';
import { Eye, Check, X, RotateCcw, Loader2 } from 'lucide-react';
import { ReceiptItem } from '../usePayments';
import { getMethodBadge, getPaymentStatusBadge } from '../paymentHelpers';

interface TableReceiptListProps {
  receipts: ReceiptItem[];
  onInspect: (index: number) => void;
  onVerify: (receipt: ReceiptItem, status: 'paid' | 'rejected') => void;
  onOpenRejectModal: (receipt: ReceiptItem) => void;
  processingId: number | null;
}

export default function TableReceiptList({
  receipts,
  onInspect,
  onVerify,
  onOpenRejectModal,
  processingId,
}: TableReceiptListProps) {
  return (
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
          {receipts.map((item, idx) => (
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
                    onClick={() => onInspect(idx)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-taupe hover:underline bg-taupe/10 px-2.5 py-1 rounded-md"
                  >
                    <Eye size={12} /> Inspect
                  </button>
                  {item.payment_status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onVerify(item, 'paid')}
                        disabled={processingId !== null}
                        className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors disabled:opacity-50"
                      >
                        {processingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenRejectModal(item)}
                        disabled={processingId !== null}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-line text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        <X size={12} /> Reject
                      </button>
                    </>
                  ) : item.payment_status === 'rejected' ? (
                    <button
                      type="button"
                      onClick={() => onVerify(item, 'paid')}
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
  );
}
