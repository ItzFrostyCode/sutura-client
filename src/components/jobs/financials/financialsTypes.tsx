import React from 'react';
import { CreditCard, Banknote, Smartphone } from 'lucide-react';
import { Job, Payment } from '../jobTypes';

export interface JobFinancialsCardProps {
  readonly job: Job;
  readonly saving: boolean;
  readonly onCharge: (amount: number, method: string, notes: string, reference?: string, receiptPath?: string) => Promise<void>;
  readonly onApplyDiscount: (amount: number, reason: string) => Promise<void>;
  readonly onUpdatePayment: (paymentId: number, fields: { payment_method: string; reference?: string; notes?: string; receipt_path?: string }) => Promise<void>;
  readonly onRejectPayment: (paymentId: number, reason: string) => Promise<void>;
}

export const METHOD_CONFIG: Record<string, { label: string; icon: React.ReactNode; badgeCls: string }> = {
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
  paymaya: {
    label: 'PayMaya',
    icon: <CreditCard size={15} className="text-teal-600" />,
    badgeCls: 'bg-teal-50 text-teal-700 border-teal-200',
  },
};

export interface ComputedFinancials {
  totalAmount: number;
  remainingBalance: number;
  discountApplied: number;
  amountPaid: number;
  jobIsCompleted: boolean;
  jobIsCancelled: boolean;
  percentCollected: number;
  isDownpaymentMet: boolean;
  statusBadge: { label: string; cls: string };
}

export function computeFinancials(job: Job): ComputedFinancials {
  const totalAmount = Number.parseFloat(String(job.total_amount)) || 0;
  const remainingBalance = Math.max(0, Number.parseFloat(String(job.balance)) || 0);
  const discountApplied = Number.parseFloat(String(job.discount_amount ?? 0)) || 0;
  const amountPaid = Math.max(0, totalAmount - remainingBalance - discountApplied);
  const jobIsCompleted = job.status === 'completed';
  const jobIsCancelled = job.status === 'cancelled';
  const percentCollected = totalAmount > 0 ? Math.min(100, Math.round(((amountPaid + discountApplied) / totalAmount) * 100)) : 0;
  const isDownpaymentMet = totalAmount > 0 && amountPaid >= totalAmount * 0.5;

  const paymentStatus = job.payment_status;
  const statusBadgeMap: Record<string, { label: string; cls: string }> = {
    paid: { label: 'Fully Settled', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    partial: { label: 'Partial Deposit', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    unpaid: { label: 'Unpaid Order', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
    pending: { label: 'Pending Verification', cls: 'bg-sunken text-ink-muted border-line' },
  };

  const statusBadge = statusBadgeMap[paymentStatus] ?? { label: paymentStatus, cls: 'bg-sunken text-ink-muted border-line' };

  return {
    totalAmount,
    remainingBalance,
    discountApplied,
    amountPaid,
    jobIsCompleted,
    jobIsCancelled,
    percentCollected,
    isDownpaymentMet,
    statusBadge,
  };
}
