import React from 'react';
import {
  JobFinancialsCardProps,
  computeFinancials,
} from './financials/financialsTypes';
import { useJobFinancials } from './financials/useJobFinancials';
import { FinancialStatementSummary } from './financials/FinancialStatementSummary';
import { FinancialDiscountForm } from './financials/FinancialDiscountForm';
import { PaymentAuditLedger } from './financials/PaymentAuditLedger';
import { JobCashierDesk } from './financials/JobCashierDesk';
import OrderRulesButton from './detail/OrderRulesButton';

export default function JobFinancialsCard({
  job,
  saving,
  isOwnerOrManager,
  onCharge,
  onApplyDiscount,
  onRemoveDiscount,
  onUpdatePayment,
  onRejectPayment,
  onVerifyPayment,
  onRefresh,
}: JobFinancialsCardProps) {
  const financials = computeFinancials(job);
  const discountAvailable = !(financials.jobIsCompleted || financials.jobIsCancelled || financials.remainingBalance <= 0);
  const {
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
    recorded,
    dismissRecorded,
    verifyingPaymentId,
    handleVerifyPayment,
    discountType,
    setDiscountType,
    discountInput,
    setDiscountInput,
    discountReason,
    setDiscountReason,
    applyingDiscount,
    handleApplyDiscountSubmit,
    editingPaymentId,
    setEditingPaymentId,
    editMethod,
    setEditMethod,
    editReference,
    setEditReference,
    editNotes,
    setEditNotes,
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
  } = useJobFinancials(
    job,
    financials,
    onCharge,
    onApplyDiscount,
    onUpdatePayment,
    onRejectPayment,
    onVerifyPayment
  );

  const canRemoveDiscount = isOwnerOrManager && !financials.jobIsCompleted && !financials.jobIsCancelled && job.status !== 'rejected';

  return (
    <div className="space-y-4">
      {/* Statement (and discount) beside the cashier desk. */}
      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        <div className="space-y-4 lg:col-span-2">
          <FinancialStatementSummary
            job={job}
            financials={financials}
            onRemoveDiscount={onRemoveDiscount}
            canRemoveDiscount={canRemoveDiscount}
            footer={!discountAvailable && onRefresh ? <OrderRulesButton job={job} onChanged={onRefresh} label="Edit payment before work starts" /> : undefined}
          />
          <FinancialDiscountForm
            job={job}
            financials={financials}
            discountType={discountType}
            setDiscountType={setDiscountType}
            discountInput={discountInput}
            setDiscountInput={setDiscountInput}
            discountReason={discountReason}
            setDiscountReason={setDiscountReason}
            applyingDiscount={applyingDiscount}
            onApplyDiscountSubmit={handleApplyDiscountSubmit}
            footer={onRefresh ? <OrderRulesButton job={job} onChanged={onRefresh} label="Edit payment before work starts" /> : undefined}
          />
        </div>

        <JobCashierDesk
          job={job}
          financials={financials}
          saving={saving}
          method={method}
          setMethod={setMethod}
          amount={amount}
          setAmount={setAmount}
          reference={reference}
          setReference={setReference}
          notes={notes}
          setNotes={setNotes}
          receiptUrl={receiptUrl}
          setReceiptUrl={setReceiptUrl}
          uploadingReceipt={uploadingReceipt}
          setUploadingReceipt={setUploadingReceipt}
          charging={charging}
          onChargeSubmit={handleChargeSubmit}
          uploadReceipt={uploadReceipt}
          cashTendered={cashTendered}
          setCashTendered={setCashTendered}
          reviewingCharge={reviewingCharge}
          onConfirmCharge={confirmCharge}
          onCancelChargeReview={cancelChargeReview}
          recorded={recorded}
          onDismissRecorded={dismissRecorded}
        />
      </div>

      <PaymentAuditLedger
        job={job}
        financials={financials}
        isOwnerOrManager={isOwnerOrManager}
        verifyingPaymentId={verifyingPaymentId}
        onVerifyPayment={handleVerifyPayment}
        editingPaymentId={editingPaymentId}
        setEditingPaymentId={setEditingPaymentId}
        editMethod={editMethod}
        setEditMethod={setEditMethod}
        editReference={editReference}
        setEditReference={setEditReference}
        editNotes={editNotes}
        setEditNotes={setEditNotes}
        savingEdit={savingEdit}
        onSaveEdit={handleSaveEdit}
        onStartEditPayment={startEditingPayment}
        menuOpenPaymentId={menuOpenPaymentId}
        setMenuOpenPaymentId={setMenuOpenPaymentId}
        rejectingPaymentId={rejectingPaymentId}
        setRejectingPaymentId={setRejectingPaymentId}
        rejectReason={rejectReason}
        setRejectReason={setRejectReason}
        submittingReject={submittingReject}
        onSubmitReject={handleSubmitReject}
      />
    </div>
  );
}
