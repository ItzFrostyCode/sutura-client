import React from 'react';
import { Smartphone, CreditCard, Banknote } from 'lucide-react';

export const getMethodBadge = (method: string) => {
  const m = method.toLowerCase();
  if (m === 'gcash') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
        <Smartphone size={11} /> GCash
      </span>
    );
  }
  if (m === 'paymaya' || m === 'maya') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">
        <CreditCard size={11} /> PayMaya
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

export const getPaymentStatusBadge = (status: string) => {
  if (status === 'paid') return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">Paid</span>;
  if (status === 'partial') return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">Partial</span>;
  if (status === 'pending') return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200">Pending</span>;
  if (status === 'rejected') return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">Rejected</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">Unpaid</span>;
};

export const REJECT_PRESET_REASONS = [
  'Reference number does not match receipt screenshot',
  'Screenshot is blurry or unreadable',
  'Amount sent is incorrect or incomplete',
  'Duplicate or invalid transaction proof',
  'Payment not reflected in store merchant account',
];
