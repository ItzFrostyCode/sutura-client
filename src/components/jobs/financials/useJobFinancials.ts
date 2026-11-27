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
  onRejectPayment: JobFinancialsCardProps['onRejectPayment'],
  onVerifyPayment: JobFinancialsCardProps['onVerifyPayment']
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
  // Cash only — the amount physically handed over, so change can be
  // computed instead of the cashier doing mental math at the counter.
  const [cashTendered, setCashTendered] = useState('');
  // A charge is a two-step process: fill in the details, review a summary
  // (amount/change/method, and for gcash/paymaya a note that it lands as
  // Pending Verification, not applied yet), then confirm. Nothing is sent
  // to the server until the review step is confirmed.
  const [reviewingCharge, setReviewingCharge] = useState(false);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<number | null>(null);

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

  // Step 1: validate and move to the review screen — no request sent yet.
  const handleChargeSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) return;
    if (method === 'cash' && (!cashTendered || Number.parseFloat(cashTendered) < amt)) return;
    if (method !== 'cash' && !receiptUrl) return;
    setReviewingCharge(true);
  };

  // Step 2: the actual submit, only reachable from the review screen.
  const confirmCharge = async () => {
    const amt = Number.parseFloat(amount);
    if (!amt || amt <= 0) return;
    setCharging(true);
    try {
      const tendered = method === 'cash' ? Number.parseFloat(cashTendered) : undefined;
      await onCharge(amt, method, notes, reference || undefined, receiptUrl || undefined, tendered);
      setAmount('');
      setReference('');
      setNotes('');
      setReceiptUrl('');
      setCashTendered('');
      setReviewingCharge(false);
    } finally {
      setCharging(false);
    }
  };

  const cancelChargeReview = () => setReviewingCharge(false);

  const handleVerifyPayment = async (paymentId: number) => {
    setVerifyingPaymentId(paymentId);
    try {
      await onVerifyPayment(paymentId);
    } finally {
      setVerifyingPaymentId(null);
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
    cashTendered,
    setCashTendered,
    reviewingCharge,
    confirmCharge,
    cancelChargeReview,
    verifyingPaymentId,
    handleVerifyPayment,

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
