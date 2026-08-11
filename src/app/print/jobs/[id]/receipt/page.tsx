'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { usePrintAuthGuard } from '@/hooks/usePrintAuthGuard';

interface Payment {
  id: number;
  amount: string | number;
  payment_method: string;
  reference?: string | null;
  created_at: string;
  notes?: string;
  recorded_by?: { name: string; id: number };
  rejected_at?: string | null;
  rejected_reason?: string | null;
}

interface Job {
  id: number;
  order_number?: string;
  total_amount: string | number;
  balance?: string | number;
  discount_amount?: string | number | null;
  customer?: { id: number; name: string; phone?: string; email?: string };
  service?: { name: string };
  payments?: Payment[];
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  bank_transfer: 'Bank Transfer',
};

export default function PaymentReceiptPage() {
  usePrintAuthGuard();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment');
  const { shop } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop?.id || !id) return;
    api.get(`/shops/${shop.id}/jobs/${id}`)
      .then(res => { setJob(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shop?.id, id]);

  useEffect(() => {
    if (!loading && job) {
      setTimeout(() => window.print(), 400);
    }
  }, [loading, job]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">Preparing receipt...</p>
      </div>
    );
  }
  if (!job) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Job not found.</p>
      </div>
    );
  }

  const total = Number.parseFloat(String(job.total_amount || 0));
  const payments = [...(job.payments || [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  // A rejected payment (JobOrderController@rejectPayment) never actually
  // reduced the balance — the backend already reversed it — so it must
  // never count toward totals/running balances here either. Previously it
  // did: "Total Paid" included rejected amounts while "Balance Due" used
  // the correct job.balance, so the two figures on the same printed receipt
  // silently didn't add up to Total Amount.
  const acceptedPayments = payments.filter(p => !p.rejected_at);

  // A single transaction's own receipt shows the running balance immediately
  // after IT was applied, not the job's current balance — those diverge the
  // moment a later payment gets logged, which is the whole point of being
  // able to re-print any past receipt on demand.
  const singlePayment = paymentId ? payments.find(p => String(p.id) === paymentId) : null;
  let runningPaidAtSingle = 0;
  if (singlePayment && !singlePayment.rejected_at) {
    for (const p of acceptedPayments) {
      runningPaidAtSingle += Number.parseFloat(String(p.amount));
      if (p.id === singlePayment.id) break;
    }
  }

  const totalPaidOverall = acceptedPayments.reduce((sum, p) => sum + Number.parseFloat(String(p.amount)), 0);
  const discount = Number.parseFloat(String(job.discount_amount || 0));
  // job.balance is backend-authoritative and already nets out both the
  // discount and any rejected payments — falls back to a locally-derived
  // figure (also discount-aware now) only if balance is ever missing.
  const currentBalance = Number.parseFloat(String(job.balance ?? (total - discount - totalPaidOverall)));

  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const money = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  // Only worth printing when there's actually a remaining balance to collect
  // and the owner has actually filled in at least one collection method —
  // an empty "Send Payment To" box would just be confusing on a fully-paid
  // receipt or a shop that hasn't configured this yet.
  const remainingAfterThis = singlePayment ? Math.max(0, total - discount - runningPaidAtSingle) : currentBalance;
  const hasPaymentDetails = !!(shop?.gcash_number || shop?.bank_account_number);
  const showPaymentDetails = hasPaymentDetails && remainingAfterThis > 0;

  return (
    <>
      {/* Intentionally no fill colors anywhere on this page — a receipt
          gets printed on every payment, routinely on a shop's everyday
          inkjet, so it's built for black ink only: sharp corners, borders
          instead of background fills, bold/underline/strikethrough for
          emphasis instead of color. */}
      <style>{`
        @page { size: A4; margin: 18mm 16mm; }
        @media print {
          .no-print { display: none !important; }
        }
        body { font-family: 'Arial', sans-serif; background: #fff; }
      `}</style>

      <div className="no-print fixed top-4 left-4 z-50 flex gap-3">
        <button onClick={() => window.history.back()} className="bg-white border border-gray-300 shadow text-sm px-4 py-2 hover:bg-gray-50">← Back</button>
        <button onClick={() => window.print()} className="bg-black text-white text-sm px-4 py-2 hover:bg-gray-800">Print</button>
      </div>

      {/*
        globals.css's @media print rule hides `body *` by default and only
        un-hides #receipt-print-area (a pattern shared with OrderReceiptModal) —
        without this id, this whole standalone page prints/PDFs as a blank sheet.
      */}
      <div id="receipt-print-area" className="max-w-[780px] mx-auto p-8 text-black text-sm leading-relaxed">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-black">{shop?.name ?? 'SUTURA'}</h1>
            <p className="text-xs text-gray-600 mt-0.5">
              {singlePayment ? 'Official Receipt' : 'Payment Statement'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-black">{job.order_number ?? `#${job.id}`}</p>
            {singlePayment && (
              <p className="text-xs text-gray-600 mt-1">Receipt for payment #{singlePayment.id}</p>
            )}
          </div>
        </div>

        {/* Client / Order info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Billed To</p>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="text-gray-600 pr-3 pb-1 font-medium w-28">Name</td><td className="font-bold pb-1">{job.customer?.name ?? '—'}</td></tr>
                <tr><td className="text-gray-600 pr-3 pb-1 font-medium">Phone</td><td className="pb-1">{job.customer?.phone ?? '—'}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Order Details</p>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="text-gray-600 pr-3 pb-1 font-medium w-28">Service</td><td className="font-bold pb-1">{job.service?.name ?? '—'}</td></tr>
                <tr><td className="text-gray-600 pr-3 pb-1 font-medium">Total Amount</td><td className="pb-1">{money(total)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {singlePayment ? (
          <>
            {/* Single Transaction Receipt */}
            <div className="border-t-2 border-b-2 border-black py-4 mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3">
                {singlePayment.rejected_at ? 'Payment Rejected — Not Accepted' : 'Amount Received'}
              </p>
              <p className={`text-3xl font-black mb-3 ${singlePayment.rejected_at ? 'line-through' : ''}`}>{money(Number.parseFloat(String(singlePayment.amount)))}</p>
              {singlePayment.rejected_at && (
                <p className="text-sm font-bold mb-3">
                  This payment was rejected on {fmtDateTime(singlePayment.rejected_at)}{singlePayment.rejected_reason ? ` — ${singlePayment.rejected_reason}` : ''}. It is not counted toward the account balance.
                </p>
              )}
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="text-gray-600 pr-3 pb-1 font-medium w-32">Date &amp; Time</td><td className="font-medium pb-1">{fmtDateTime(singlePayment.created_at)}</td></tr>
                  <tr><td className="text-gray-600 pr-3 pb-1 font-medium">Method</td><td className="pb-1">{METHOD_LABELS[singlePayment.payment_method] ?? singlePayment.payment_method}</td></tr>
                  {singlePayment.reference && (
                    <tr><td className="text-gray-600 pr-3 pb-1 font-medium">Reference #</td><td className="pb-1 font-mono">{singlePayment.reference}</td></tr>
                  )}
                  {singlePayment.recorded_by && (
                    <tr><td className="text-gray-600 pr-3 font-medium">Received By</td><td>{singlePayment.recorded_by.name}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t-2 border-black pt-4">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Account Status After This Payment</p>
              <div className="flex justify-end">
                <table className="text-sm">
                  <tbody>
                    <tr><td className="text-gray-600 pr-12 pb-1">Total Amount</td><td className="font-bold text-right pb-1">{money(total)}</td></tr>
                    {discount > 0 && (
                      <tr><td className="text-gray-600 pr-12 pb-1">Discount Applied</td><td className="font-bold text-right pb-1">−{money(discount)}</td></tr>
                    )}
                    <tr><td className="text-gray-600 pr-12 pb-1">Paid to Date (as of this receipt)</td><td className="font-bold text-right pb-1">{money(runningPaidAtSingle)}</td></tr>
                    <tr className="border-t border-gray-400">
                      <td className="text-black font-bold pr-12 pt-1">Balance Remaining</td>
                      <td className="text-lg font-black text-right pt-1 underline">
                        {money(Math.max(0, total - discount - runningPaidAtSingle))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Full Payment Statement */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3">Payment History ({payments.length})</p>
              {payments.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No payments recorded yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left px-3 py-2 font-bold text-black border-b-2 border-black">Date &amp; Time</th>
                      <th className="text-left px-3 py-2 font-bold text-black border-b-2 border-black">Method</th>
                      <th className="text-left px-3 py-2 font-bold text-black border-b-2 border-black">Reference</th>
                      <th className="text-right px-3 py-2 font-bold text-black border-b-2 border-black">Amount</th>
                      <th className="text-right px-3 py-2 font-bold text-black border-b-2 border-black">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let running = 0;
                      return payments.map((p, i) => {
                        const isRejected = !!p.rejected_at;
                        // Rejected payments never reduce the running balance —
                        // they're shown for the paper trail (matches the
                        // dashboard's own strikethrough convention) but must
                        // not shift the "Running Balance" column.
                        if (!isRejected) running += Number.parseFloat(String(p.amount));
                        return (
                          <tr key={p.id} className="border-b border-gray-200">
                            <td className={`px-3 py-1.5 ${isRejected ? 'text-gray-500' : ''}`}>{fmtDateTime(p.created_at)}</td>
                            <td className={`px-3 py-1.5 ${isRejected ? 'text-gray-500' : ''}`}>{METHOD_LABELS[p.payment_method] ?? p.payment_method}</td>
                            <td className={`px-3 py-1.5 font-mono ${isRejected ? 'text-gray-500' : ''}`}>{p.reference || '—'}</td>
                            <td className={`px-3 py-1.5 text-right font-bold ${isRejected ? 'text-gray-500 line-through' : ''}`}>
                              {money(Number.parseFloat(String(p.amount)))}
                              {isRejected && <span className="block text-[8px] font-normal uppercase tracking-wide no-underline">Rejected — not counted</span>}
                            </td>
                            <td className="px-3 py-1.5 text-right">{isRejected ? '—' : money(Math.max(0, total - running))}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t-2 border-black pt-4">
              <div className="flex justify-end">
                <table className="text-sm">
                  <tbody>
                    <tr><td className="text-gray-600 pr-12 pb-1">Total Amount</td><td className="font-bold text-right pb-1">{money(total)}</td></tr>
                    {discount > 0 && (
                      <tr><td className="text-gray-600 pr-12 pb-1">Discount Applied</td><td className="font-bold text-right pb-1">−{money(discount)}</td></tr>
                    )}
                    <tr><td className="text-gray-600 pr-12 pb-1">Total Paid</td><td className="font-bold text-right pb-1">{money(totalPaidOverall)}</td></tr>
                    <tr className="border-t border-gray-400">
                      <td className="text-black font-bold pr-12 pt-1">Balance Due</td>
                      <td className="text-lg font-black text-right pt-1 underline">
                        {money(currentBalance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {showPaymentDetails && (
          <div className="border-t-2 border-black pt-4 mt-6">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3">Send Payment To</p>
            <table className="w-full text-sm">
              <tbody>
                {shop?.gcash_number && (
                  <tr>
                    <td className="text-gray-600 pr-3 pb-1 font-medium w-32">GCash</td>
                    <td className="pb-1 font-bold">
                      {shop.gcash_number}{shop.gcash_account_name ? ` — ${shop.gcash_account_name}` : ''}
                    </td>
                  </tr>
                )}
                {shop?.bank_account_number && (
                  <tr>
                    <td className="text-gray-600 pr-3 pb-1 font-medium">Bank Transfer</td>
                    <td className="pb-1 font-bold">
                      {shop.bank_name ? `${shop.bank_name} — ` : ''}{shop.bank_account_number}{shop.bank_account_name ? ` — ${shop.bank_account_name}` : ''}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-center text-[9px] text-gray-400 mt-8">
          Printed by SUTURA Shop Management System · {new Date().toLocaleString('en-PH')}
        </p>
      </div>
    </>
  );
}
