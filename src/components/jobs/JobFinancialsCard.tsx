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

export default function JobFinancialsCard({
  job,
  saving,
  onCharge,
  onApplyDiscount,
  onUpdatePayment,
  onRejectPayment,
}: JobFinancialsCardProps) {
  const financials = computeFinancials(job);
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
    onRejectPayment
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Financial Statement & Audit Ledger */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-2xs space-y-5">
            <FinancialStatementSummary job={job} financials={financials} />
            <FinancialDiscountForm
              financials={financials}
              showDiscountForm={showDiscountForm}
              setShowDiscountForm={setShowDiscountForm}
              discountType={discountType}
              setDiscountType={setDiscountType}
              discountInput={discountInput}
              setDiscountInput={setDiscountInput}
              discountReason={discountReason}
              setDiscountReason={setDiscountReason}
              applyingDiscount={applyingDiscount}
              onApplyDiscountSubmit={handleApplyDiscountSubmit}
            />
          </div>

          <PaymentAuditLedger
            job={job}
            financials={financials}
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

        {/* Right Column: Cashier Desk */}
        <div className="lg:col-span-5 space-y-6">
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
          />
        </div>
      </div>
    </div>
  );
}
