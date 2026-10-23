'use client';

import { depositFraction } from '@/components/jobs/requirements';
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import JobFinancialsCard from '@/components/jobs/JobFinancialsCard';
import SendCustomerMessageModal from '@/components/jobs/SendCustomerMessageModal';
import { useJobDetail } from '@/components/jobs/useJobDetail';
import JobDetailHeader from '@/components/jobs/detail/JobDetailHeader';
import JobDetailTabsNav, { JobDetailTabKey } from '@/components/jobs/detail/JobDetailTabsNav';
import JobOverviewTab from '@/components/jobs/detail/JobOverviewTab';
import JobProductionTab from '@/components/jobs/detail/JobProductionTab';
import JobProductionAside from '@/components/jobs/detail/JobProductionAside';
import JobPrintWorkTicket from '@/components/jobs/detail/JobPrintWorkTicket';
import OrderReadinessTab from '@/components/jobs/readiness/OrderReadinessTab';
import type { Job as StageJob } from '@/components/jobs/jobHelpers';
import MobileActionBar from '@/components/jobs/detail/MobileActionBar';
import BatchSummaryCard from '@/components/jobs/batches/BatchSummaryCard';
import SplitOrderModal from '@/components/jobs/batches/SplitOrderModal';
import { Split } from 'lucide-react';
import FollowUpOrderPanel from '@/components/jobs/detail/FollowUpOrderPanel';
import FollowUpAppointmentModal from '@/components/appointments/FollowUpAppointmentModal';
import { getLocalDateString, minTimeForDate, getErrorMessage } from '@/components/appointments/appointmentHelpers';
import { useToast } from '@/context/ToastContext';
import { useAuthStore } from '@/store/useAuthStore';

export default function JobDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const [showSplit, setShowSplit] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const toast = useToast();
  const { user } = useAuthStore();
  // Financials is Owner/Branch-Manager-exclusive under the finalized target
  // (PAYMENT-WORKFLOW.md Part B) — Staff's role narrows to reading balance
  // elsewhere (Overview tab's Financial Breakdown card).
  const userRoleNames = user?.roles?.map(r => r.name) ?? [];
  const isOwnerOrManager = userRoleNames.some(r => ['store_owner', 'branch_manager', 'super_admin'].includes(r));

  // In-page tabs — lazy initialized from the URL hash. Old names (#financials, #overview...) still work.
  const [activeTab, setActiveTab] = useState<JobDetailTabKey>(() => {
    if (typeof window === 'undefined') return 'steps';
    const hash = window.location.hash.replace('#', '');
    if (hash === 'financials' || hash === 'payments') return 'payments';
    if (hash === 'overview' || hash === 'details') return 'details';
    return 'steps';
  });

  const {
    store,
    router,
    job,
    loading,
    saving,
    notes,
    setNotes,
    completionPhotoUrl,
    setCompletionPhotoUrl,
    estimatedReadyAt,
    setEstimatedReadyAt,
    customerMaterialStatus,
    setCustomerMaterialStatus,
    refreshJob,
    handleUpdate,
    handleChargePayment,
    handleVerifyPayment,
    handleApplyDiscount,
    handleRemoveDiscount,
    handleUpdatePayment,
    handleRejectPayment,
    handleUseCurrentMeasurement,
    handleToggleRosterItem,
    handleSaveSpecTable,
    handleSaveCustomizationInstructions,
    handleArchive,
    hasUnsavedChanges,
    dirtyTabs,
    handleResetChanges,
  } = useJobDetail(id);

  useEffect(() => {
    if (activeTab === 'payments' && user && !isOwnerOrManager) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('details');
    }
  }, [activeTab, user, isOwnerOrManager]);

  const handleCreateFollowUp = async (payload: Record<string, unknown>) => {
    if (!store) return;
    setFollowUpSubmitting(true);
    setFollowUpError('');
    try {
      await api.post(`/stores/${store.id}/appointments/follow-up`, payload);
      toast.success('Follow-up visit scheduled — the customer has been notified.');
      setShowFollowUpModal(false);
    } catch (err: unknown) {
      setFollowUpError(getErrorMessage(err, 'Failed to schedule follow-up visit.'));
    } finally {
      setFollowUpSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-ink-faint">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading job order details...
      </div>
    );
  }

  if (!job) {
    return <div className="text-ink-faint">Job Order not found.</div>;
  }

  const jobTotalAmount = Number.parseFloat(String(job.total_amount)) || 0;
  const jobPaidSoFar = jobTotalAmount - (Number.parseFloat(String(job.balance)) || 0);
  const requiredDownpayment = jobTotalAmount * depositFraction(job.payment_policy, job.payment_policy_percent);
  const downpaymentShortfall = Math.max(0, requiredDownpayment - jobPaidSoFar);
  const showDownpaymentGate = job.status !== 'cancelled' && job.status !== 'completed' && downpaymentShortfall > 0;
  // A completed order is read only: every edit control is hidden (print, receipts and photos stay).
  const readOnly = job.status === 'completed';

  return (
    <>
      <div className="print:hidden space-y-4 pb-24 sm:pb-0">
        <JobDetailHeader
          job={job}
          hasUnsavedChanges={hasUnsavedChanges}
          saving={saving}
          onBack={() => router.back()}
          onResetChanges={handleResetChanges}
          onOpenMessageModal={isOwnerOrManager ? () => setShowMessageModal(true) : undefined}
          onOpenFollowUpModal={() => { setFollowUpError(''); setShowFollowUpModal(true); }}
          onPrint={() => window.print()}
          onArchive={handleArchive}
          onUpdate={handleUpdate}
          canArchive={isOwnerOrManager && ['cancelled', 'rejected'].includes(job.status) && (job.payments?.length ?? 0) === 0}
          onCancel={isOwnerOrManager && !['completed', 'cancelled', 'rejected'].includes(job.status) ? () => { setActiveTab('steps'); setCancelOpen(true); } : undefined}
          onFollowUpOrder={isOwnerOrManager && readOnly ? () => { setActiveTab('steps'); setFollowUpOpen(true); } : undefined}
          readOnly={readOnly}
          moreActions={job.can_split ? [{ label: 'Split into batches', icon: <Split size={17} />, onClick: () => setShowSplit(true) }] : undefined}
        />

        {job.batch && <BatchSummaryCard batch={job.batch} currentId={job.id} />}

        <JobDetailTabsNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          dirtyTabs={{ steps: dirtyTabs.production, details: dirtyTabs.overview }}
          showFinancials={isOwnerOrManager}
          paymentsCount={job.payments?.length ?? 0}
        />

        {activeTab === 'steps' && store && followUpOpen && readOnly && (
          <FollowUpOrderPanel storeId={store.id} job={job} onClose={() => setFollowUpOpen(false)} />
        )}

        {activeTab === 'steps' && store && (
          <OrderReadinessTab
            storeId={store.id}
            jobId={job.id}
            job={job as unknown as StageJob}
            currentTotal={jobTotalAmount}
            onChanged={refreshJob}
            onStarted={() => {}}
            onGoToFinancials={isOwnerOrManager ? () => setActiveTab('payments') : undefined}
            onGoToDetails={() => setActiveTab('details')}
            cancelOpen={cancelOpen}
            onCancelClose={() => setCancelOpen(false)}
            work={(rd) => (
              <JobProductionTab
                job={job}
                rd={rd}
                notes={notes}
                setNotes={setNotes}
                completionPhotoUrl={completionPhotoUrl}
                setCompletionPhotoUrl={setCompletionPhotoUrl}
                refreshJob={refreshJob}
                onSave={handleUpdate}
                saving={saving}
                dirty={hasUnsavedChanges}
                readOnly={readOnly}
              />
            )}
            aside={(
              <JobProductionAside
                job={job}
                estimatedReadyAt={estimatedReadyAt}
                setEstimatedReadyAt={setEstimatedReadyAt}
                customerMaterialStatus={customerMaterialStatus}
                setCustomerMaterialStatus={setCustomerMaterialStatus}
                readOnly={readOnly || !isOwnerOrManager}
              />
            )}
          />
        )}

        {activeTab === 'details' && (
          <JobOverviewTab
            job={job}
            notes={notes}
            setNotes={setNotes}
            downpaymentShortfall={downpaymentShortfall}
            onUseCurrentMeasurement={handleUseCurrentMeasurement}
            onToggleRosterItem={handleToggleRosterItem}
            onSaveSpecTable={handleSaveSpecTable}
            onSaveInstructions={handleSaveCustomizationInstructions}
            storeId={store?.id}
            onRefreshJob={refreshJob}
            readOnly={readOnly}
            canEditDetails={isOwnerOrManager}
          />
        )}

        {activeTab === 'payments' && isOwnerOrManager && (
          <div className="space-y-6" id="financials">
            <JobFinancialsCard
              job={job}
              saving={saving}
              isOwnerOrManager={isOwnerOrManager}
              onCharge={handleChargePayment}
              onApplyDiscount={handleApplyDiscount}
              onRemoveDiscount={handleRemoveDiscount}
              onUpdatePayment={handleUpdatePayment}
              onRejectPayment={handleRejectPayment}
              onVerifyPayment={handleVerifyPayment}
              onRefresh={refreshJob}
            />
          </div>
        )}

        {store && (
          <SendCustomerMessageModal
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            storeId={store.id}
            jobId={job.id}
            orderNumber={job.order_number}
            storeName={store.name || 'SUTURA'}
            customerName={job.customer?.name || 'Customer'}
            customerEmail={job.customer?.email}
          />
        )}

        {store && !readOnly && <MobileActionBar storeId={store.id} job={job as unknown as StageJob} dirty={hasUnsavedChanges} saving={saving} onSave={handleUpdate} onMoved={refreshJob} />}

        {showSplit && <SplitOrderModal job={job} isOpen onClose={() => setShowSplit(false)} onDone={refreshJob} />}

        <FollowUpAppointmentModal
          isOpen={showFollowUpModal}
          onClose={() => { setShowFollowUpModal(false); setFollowUpError(''); }}
          todayStr={getLocalDateString(new Date())}
          minTimeFor={(dateStr) => minTimeForDate(dateStr, getLocalDateString(new Date()))}
          presetJobOrderId={job.id}
          presetCustomerId={job.customer?.id}
          presetCustomerName={job.customer?.name}
          onSubmit={handleCreateFollowUp}
          isSubmitting={followUpSubmitting}
          error={followUpError}
        />
      </div>

      <JobPrintWorkTicket job={job} store={store} />
    </>
  );
}
