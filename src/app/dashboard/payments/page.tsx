'use client';

import React, { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { usePayments, ReceiptItem } from '@/components/payments/usePayments';
import { REJECT_PRESET_REASONS } from '@/components/payments/paymentHelpers';
import PaymentStatsCards from '@/components/payments/PaymentStatsCards';
import PaymentTabsNav from '@/components/payments/PaymentTabsNav';
import DigitalReceiptsTab from '@/components/payments/tabs/DigitalReceiptsTab';
import JobBalancesTab from '@/components/payments/tabs/JobBalancesTab';
import CatalogOrdersTab from '@/components/payments/tabs/CatalogOrdersTab';
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
    setPayMethod,
    payNotes,
    setPayNotes,
    payReference,
    setPayReference,
    setPayReceiptPath,
    paySubmitting,
    catalogOrders,
    catalogLoading,
    handleVerify,
    handleLogPayment,
    filteredBalances,
  } = usePayments();

  // Receipt Filter & View States
  const [receiptFilter, setReceiptFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [deckIndex, setDeckIndex] = useState(0);
  const [receiptViewMode, setReceiptViewMode] = useState<'deck' | 'list'>('deck');

  // Reject Confirmation Modal State
  const [rejectingItem, setRejectingItem] = useState<ReceiptItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState(REJECT_PRESET_REASONS[0]);
  const [rejectionCustomText, setRejectionCustomText] = useState('');

  // Balance Tier Filter & Copy State
  const [balanceTier, setBalanceTier] = useState<'all' | 'unpaid' | 'partial'>('all');
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

  useEffect(() => {
    if (deckIndex >= activeReceipts.length && activeReceipts.length > 0) {
      setDeckIndex(activeReceipts.length - 1);
    } else if (activeReceipts.length === 0) {
      setDeckIndex(0);
    }
  }, [activeReceipts.length, deckIndex]);

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
  const pickupBalances = jobBalances
    .filter(j => j.status === 'ready_for_pickup' && j.balance > 0)
    .reduce((sum, j) => sum + j.balance, 0);

  const confirmRejection = async () => {
    if (!rejectingItem) return;
    await handleVerify(rejectingItem, 'rejected');
    setRejectingItem(null);
    setRejectionCustomText('');
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Collect Payments"
        description="Verify GCash and bank receipts, collect job balances, and manage catalog order payments."
      />

      <PaymentStatsCards
        totalOutstanding={totalOutstanding}
        totalPendingReceipts={totalPendingReceipts}
        pendingCount={pendingCount}
        pickupBalances={pickupBalances}
      />

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
            deckIndex={deckIndex}
            setDeckIndex={setDeckIndex}
            receiptViewMode={receiptViewMode}
            setReceiptViewMode={setReceiptViewMode}
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
            balancesLoading={balancesLoading}
            displayedBalances={displayedBalances}
            onSelectJobToPay={job => {
              setLogPaymentJob(job);
              setPayAmount(String(job.balance));
            }}
          />
        )}

        {activeTab === 'catalog_orders' && (
          <CatalogOrdersTab
            catalogLoading={catalogLoading}
            catalogOrders={catalogOrders}
          />
        )}
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
        }}
        payAmount={payAmount}
        setPayAmount={setPayAmount}
        payMethod={payMethod}
        setPayMethod={setPayMethod}
        payReference={payReference}
        setPayReference={setPayReference}
        payNotes={payNotes}
        setPayNotes={setPayNotes}
        handleLogPayment={handleLogPayment}
        paySubmitting={paySubmitting}
      />
    </div>
  );
}
