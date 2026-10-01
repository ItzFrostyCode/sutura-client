import React from 'react';
import { CreditCard, Banknote, Smartphone } from 'lucide-react';
import { Job, Payment } from '../jobTypes';
import { depositFraction, paymentPolicyLabel } from '../requirements';

export interface JobFinancialsCardProps {
  readonly job: Job;
  readonly saving: boolean;
  readonly isOwnerOrManager: boolean;
  readonly onCharge: (amount: number, method: string, notes: string, reference?: string, receiptPath?: string, cashTendered?: number) => Promise<void>;
  readonly onApplyDiscount: (amount: number, reason: string) => Promise<void>;
  readonly onUpdatePayment: (paymentId: number, fields: { payment_method: string; reference?: string; notes?: string; receipt_path?: string }) => Promise<void>;
  readonly onRejectPayment: (paymentId: number, reason: string) => Promise<void>;
  readonly onVerifyPayment: (paymentId: number) => Promise<void>;
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
  bank_transfer: {
    label: 'Bank transfer',
    icon: <CreditCard size={15} className="text-violet-600" />,
    badgeCls: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  other: {
    label: 'Other',
    icon: <CreditCard size={15} className="text-stone-600" />,
    badgeCls: 'bg-stone-50 text-stone-700 border-stone-200',
  },
  paymaya: {
    label: 'Maya',
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
  requiredDeposit: number;
  depositLabel: string;
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
  const depositShare = depositFraction(job.payment_policy, job.payment_policy_percent);
  const requiredDeposit = totalAmount * depositShare;
  const isDownpaymentMet = totalAmount > 0 && amountPaid + 0.005 >= requiredDeposit;

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
    requiredDeposit,
    depositLabel: paymentPolicyLabel(job.payment_policy, job.payment_policy_percent),
    statusBadge,
  };
}
