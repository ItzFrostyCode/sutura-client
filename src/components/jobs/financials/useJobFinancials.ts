import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { Payment } from '../jobTypes';
import { JobFinancialsCardProps, ComputedFinancials } from './financialsTypes';

export function useJobFinancials(
  job: JobFinancialsCardProps['job'],
  financials: ComputedFinancials,
  onCharge: JobFinancialsCardProps['onCharge'],
  onApplyDiscount: JobFinancialsCardProps['onApplyDiscount'],
  onUpdatePayment: JobFinancialsCardProps['onUpdatePayment'],
  onRejectPayment: JobFinancialsCardProps['onRejectPayment']
) {
  const { store } = useAuthStore();
  const { remainingBalance, totalAmount } = financials;

  // Cashier State
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [charging, setCharging] = useState(false);

  // Discount State
  const [showDiscountForm, setShowDiscountForm] = useState(false);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
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
    if (!file || !store) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/stores/${store.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onDone(res.data?.data?.url || res.data?.url || '');
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to upload receipt image.'));
    } finally {
      setUploading(false);
    }
  };

  const handleApplyDiscountSubmit = async () => {
    const rawVal = Number.parseFloat(discountInput);
    if (!rawVal || rawVal <= 0) return;
    const computedAmt = discountType === 'percent'
      ? Math.min(remainingBalance, Math.round(((totalAmount * rawVal) / 100) * 100) / 100)
      : Math.min(remainingBalance, rawVal);
    if (computedAmt <= 0) return;

    setApplyingDiscount(true);
    try {
      await onApplyDiscount(computedAmt, discountReason.trim() || 'Courtesy / Suki Discount');
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

  const handleChargeSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
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

  return {
    // Cashier
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
    handleChargeSubmit,
    uploadReceipt,

    // Discount
    showDiscountForm,
    setShowDiscountForm,
    discountType,
    setDiscountType,
    discountInput,
    setDiscountInput,
    discountReason,
    setDiscountReason,
    applyingDiscount,
    handleApplyDiscountSubmit,

    // Edit/Reject
    editingPaymentId,
    setEditingPaymentId,
    editMethod,
    setEditMethod,
    editReference,
    setEditReference,
    editNotes,
    setEditNotes,
    editReceiptUrl,
    setEditReceiptUrl,
    savingEdit,
    handleSaveEdit,
    startEditingPayment,
    menuOpenPaymentId,
    setMenuOpenPaymentId,
    rejectingPaymentId,
    setRejectingPaymentId,
    rejectReason,
    setRejectReason,
    submittingReject,
    handleSubmitReject,
  };
}
