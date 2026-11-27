'use client';

import React, { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { usePayments, ReceiptItem } from '@/components/payments/usePayments';
import { REJECT_PRESET_REASONS } from '@/components/payments/paymentHelpers';
import PaymentStatsCards from '@/components/payments/PaymentStatsCards';
import PaymentTabsNav from '@/components/payments/PaymentTabsNav';
import DigitalReceiptsTab from '@/components/payments/tabs/DigitalReceiptsTab';
import JobBalancesTab from '@/components/payments/tabs/JobBalancesTab';
import PaymentMethodsTab from '@/components/payments/PaymentMethodsTab';
import StatementsTab from '@/components/payments/statements/StatementsTab';
import CashTab from '@/components/payments/cash/CashTab';
import RejectReasonModal from '@/components/payments/modals/RejectReasonModal';
import LogPaymentModal from '@/components/payments/modals/LogPaymentModal';

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
    payType,
    setPayType,
    payAccountId,
    setPayAccountId,
    paymentAccounts,
    setPayMethod,
    payNotes,
    setPayNotes,
    payReference,
    setPayReference,
    payReceiptPath,
    setPayReceiptPath,
    payReceiptUploading,
    handlePayReceiptUpload,
    payCashTendered,
    setPayCashTendered,
    payReviewing,
    setPayReviewing,
    paySubmitting,
    handleVerify,
    handleLogPayment,
    filteredBalances,
    filteredPaidJobs,
    paidJobsLoading,
    fetchPaidJobs,
  } = usePayments();

  // Receipt filter (receipts are a paged list; Inspect opens one in a popup)
  const [receiptFilter, setReceiptFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Reject Confirmation Modal State
  const [rejectingItem, setRejectingItem] = useState<ReceiptItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState(REJECT_PRESET_REASONS[0]);
  const [rejectionCustomText, setRejectionCustomText] = useState('');

  // Balance Tier Filter & Copy State
  const [balanceTier, setBalanceTier] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');
  // "Paid" lists orders settled in full; they're only loaded when that filter is opened.
  useEffect(() => { if (balanceTier === 'paid') fetchPaidJobs(); }, [balanceTier, fetchPaidJobs]);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
  };

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

  const displayedBalances = useMemo(() => {
    if (balanceTier === 'paid') return filteredPaidJobs;
    return filteredBalances.filter(job => {
      if (balanceTier === 'all') return true;
      if (balanceTier === 'unpaid') return job.payment_status === 'unpaid';
      if (balanceTier === 'partial') return job.payment_status === 'partial';
      return true;
    });
  }, [filteredBalances, filteredPaidJobs, balanceTier]);

  // Owed = accepted orders. Orders still waiting for the shop's approval are counted
  // separately: they may yet be declined, so that money isn't owed yet.
  const awaitingApproval = jobBalances.filter((j) => j.status === 'pending' && j.balance > 0);
  const pendingApproval = {
    amount: awaitingApproval.reduce((sum, j) => sum + (j.balance || 0), 0),
    count: awaitingApproval.length,
  };
  const totalOutstanding = jobBalances
    .filter((j) => j.status !== 'pending')
    .reduce((sum, j) => sum + (j.balance || 0), 0);
  const totalPendingReceipts = receipts
    .filter(r => r.payment_status === 'pending')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const pickupBalances = jobBalances
    .filter(j => j.status === 'ready_for_pickup' && j.balance > 0)
    .reduce((sum, j) => sum + j.balance, 0);

  const confirmRejection = async () => {
    if (!rejectingItem) return;
    // Job-order payments record why they were rejected (the reason shows on the order).
    const reason = rejectionCustomText.trim() || rejectionReason;
    await handleVerify(rejectingItem, 'rejected', reason);
    setRejectingItem(null);
    setRejectionCustomText('');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Payments"
        description="Verify GCash receipts and collect job order balances."
      />

      <div data-tour="payments-stats">
        <PaymentStatsCards
          totalOutstanding={totalOutstanding}
          pendingApproval={pendingApproval}
          totalPendingReceipts={totalPendingReceipts}
          pendingCount={pendingCount}
          pickupBalances={pickupBalances}
        />
      </div>

      <PaymentTabsNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingCount={pendingCount}
      />

      <div className="bg-surface border border-line rounded-xl overflow-hidden shadow-2xs">
        {activeTab === 'receipts' && (
          <DigitalReceiptsTab
            receiptsLoading={receiptsLoading}
            activeReceipts={activeReceipts}
            receiptFilter={receiptFilter}
            setReceiptFilter={setReceiptFilter}
            pendingCount={pendingCount}
            approvedCount={approvedCount}
            rejectedCount={rejectedCount}
            copiedRef={copiedRef}
            onCopyRef={handleCopy}
            onOpenRejectModal={setRejectingItem}
            onVerify={handleVerify}
            processingId={processingId}
          />
        )}

        {activeTab === 'job_balances' && (
          <JobBalancesTab
            balanceSearch={balanceSearch}
            setBalanceSearch={setBalanceSearch}
            balanceTier={balanceTier}
            setBalanceTier={setBalanceTier}
            balancesLoading={balanceTier === 'paid' ? paidJobsLoading : balancesLoading}
            displayedBalances={displayedBalances}
            onSelectJobToPay={job => {
              setLogPaymentJob(job);
              setPayAmount(String(job.balance));
            }}
          />
        )}

        {activeTab === 'cash' && <CashTab />}

        {activeTab === 'methods' && <PaymentMethodsTab />}

        {activeTab === 'statements' && <StatementsTab />}
      </div>

      <RejectReasonModal
        rejectingItem={rejectingItem}
        onClose={() => setRejectingItem(null)}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        rejectionCustomText={rejectionCustomText}
        setRejectionCustomText={setRejectionCustomText}
        onConfirmRejection={confirmRejection}
        processingId={processingId}
      />

      <LogPaymentModal
        logPaymentJob={logPaymentJob}
        onClose={() => {
          setLogPaymentJob(null);
          setPayAmount('');
          setPayNotes('');
          setPayReference('');
          setPayReceiptPath('');
          setPayCashTendered('');
          setPayReviewing(false);
        }}
        payAmount={payAmount}
        setPayAmount={setPayAmount}
        payMethod={payMethod}
        setPayMethod={setPayMethod}
        payType={payType}
        setPayType={setPayType}
        payAccountId={payAccountId}
        setPayAccountId={setPayAccountId}
        paymentAccounts={paymentAccounts}
        payReference={payReference}
        setPayReference={setPayReference}
        payNotes={payNotes}
        setPayNotes={setPayNotes}
        payReceiptPath={payReceiptPath}
        setPayReceiptPath={setPayReceiptPath}
        payReceiptUploading={payReceiptUploading}
        handlePayReceiptUpload={handlePayReceiptUpload}
        payCashTendered={payCashTendered}
        setPayCashTendered={setPayCashTendered}
        payReviewing={payReviewing}
        setPayReviewing={setPayReviewing}
        handleLogPayment={handleLogPayment}
        paySubmitting={paySubmitting}
      />
    </div>
  );
}
