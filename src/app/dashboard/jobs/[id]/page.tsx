'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import JobFulfillmentCard from '@/components/jobs/JobFulfillmentCard';
import JobStaffAssignmentCard from '@/components/jobs/JobStaffAssignmentCard';
import JobFinancialsCard from '@/components/jobs/JobFinancialsCard';
import SendCustomerMessageModal from '@/components/jobs/SendCustomerMessageModal';
import { useJobDetail } from '@/components/jobs/useJobDetail';
import JobDetailHeader from '@/components/jobs/detail/JobDetailHeader';
import JobDetailTabsNav, { JobDetailTabKey } from '@/components/jobs/detail/JobDetailTabsNav';
import JobOverviewTab from '@/components/jobs/detail/JobOverviewTab';
import JobProductionTab from '@/components/jobs/detail/JobProductionTab';
import JobPrintWorkTicket from '@/components/jobs/detail/JobPrintWorkTicket';
import JobDeleteModal from '@/components/jobs/detail/JobDeleteModal';
import FollowUpAppointmentModal from '@/components/appointments/FollowUpAppointmentModal';
import { BranchData, getLocalDateString, minTimeForDate, getErrorMessage } from '@/components/appointments/appointmentHelpers';
import { useToast } from '@/context/ToastContext';
import { useAuthStore } from '@/store/useAuthStore';

export default function JobDetailPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpBranches, setFollowUpBranches] = useState<BranchData[]>([]);
  const [followUpSubmitting, setFollowUpSubmitting] = useState(false);
  const [followUpError, setFollowUpError] = useState('');
  const toast = useToast();
  const { user } = useAuthStore();
  // Financials is Owner/Branch-Manager-exclusive under the finalized target
  // (PAYMENT-WORKFLOW.md Part B) — Staff's role narrows to reading balance
  // elsewhere (Overview tab's Financial Breakdown card).
  const userRoleNames = user?.roles?.map(r => r.name) ?? [];
  const isOwnerOrManager = userRoleNames.some(r => ['store_owner', 'branch_manager', 'super_admin'].includes(r));

  // In-page tabs — lazy initialized from URL hash (e.g. #financials from dashboard quick actions)
  const [activeTab, setActiveTab] = useState<JobDetailTabKey>(() => {
    if (typeof window === 'undefined') return 'overview';
    const validTabs = ['overview', 'production', 'staff', 'fulfillment', 'financials'] as const;
    const hash = window.location.hash.replace('#', '');
    if ((validTabs as readonly string[]).includes(hash)) {
      return hash as JobDetailTabKey;
    }
    return 'overview';
  });

  const {
    store,
    router,
    job,
    loading,
    saving,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    status,
    setStatus,
    notes,
    setNotes,
    completionPhotoUrl,
    setCompletionPhotoUrl,
    estimatedReadyAt,
    setEstimatedReadyAt,
    customerMaterialStatus,
    setCustomerMaterialStatus,
    setCancellationReason,
    setHoldReason,
    refreshJob,
    isOutsourced,
    setIsOutsourced,
    partnerStoreName,
    setPartnerStoreName,
    outsourcingCost,
    setOutsourcingCost,
    allStaff,
    staffAssignments,
    setStaffAssignments,
    staffCompletions,
    savingStaff,
    handleUpdate,
    handleUpdateStaff,
    handleChargePayment,
    handleApplyDiscount,
    handleUpdatePayment,
    handleRejectPayment,
    handleUseCurrentMeasurement,
    handleToggleRosterItem,
    handleDelete,
    hasUnsavedChanges,
    dirtyTabs,
    handleResetChanges,
  } = useJobDetail(id);

  useEffect(() => {
    if (activeTab === 'financials' && user && !isOwnerOrManager) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('overview');
    }
  }, [activeTab, user, isOwnerOrManager]);

  useEffect(() => {
    if (!store?.id) return;
    api.get(`/stores/${store.id}/branches`)
      .then(r => setFollowUpBranches(Array.isArray(r.data?.data) ? r.data.data : []))
      .catch(() => {});
  }, [store?.id]);

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
  const requiredDownpayment = jobTotalAmount * 0.5;
  const downpaymentShortfall = Math.max(0, requiredDownpayment - jobPaidSoFar);
  const showDownpaymentGate = job.status !== 'cancelled' && job.status !== 'completed' && downpaymentShortfall > 0;

  return (
    <>
      <div className="print:hidden space-y-4">
        <JobDetailHeader
          job={job}
          hasUnsavedChanges={hasUnsavedChanges}
          saving={saving}
          onBack={() => router.back()}
          onResetChanges={handleResetChanges}
          onOpenMessageModal={() => setShowMessageModal(true)}
          onOpenFollowUpModal={() => { setFollowUpError(''); setShowFollowUpModal(true); }}
          onPrint={() => window.print()}
          onOpenDeleteModal={() => setIsDeleteModalOpen(true)}
          onUpdate={handleUpdate}
        />

        <JobDetailTabsNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          dirtyTabs={dirtyTabs}
          showFinancials={isOwnerOrManager}
        />

        {activeTab === 'overview' && (
          <JobOverviewTab
            job={job}
            notes={notes}
            setNotes={setNotes}
            jobPaidSoFar={jobPaidSoFar}
            requiredDownpayment={requiredDownpayment}
            downpaymentShortfall={downpaymentShortfall}
            showDownpaymentGate={showDownpaymentGate}
            onUseCurrentMeasurement={handleUseCurrentMeasurement}
            onToggleRosterItem={handleToggleRosterItem}
            onGoToFinancials={() => setActiveTab('financials')}
            onGoToProduction={() => setActiveTab('production')}
            isOwnerOrManager={isOwnerOrManager}
          />
        )}

        {activeTab === 'production' && (
          <JobProductionTab
            job={job}
            status={status}
            setStatus={setStatus}
            notes={notes}
            setNotes={setNotes}
            completionPhotoUrl={completionPhotoUrl}
            setCompletionPhotoUrl={setCompletionPhotoUrl}
            estimatedReadyAt={estimatedReadyAt}
            setEstimatedReadyAt={setEstimatedReadyAt}
            customerMaterialStatus={customerMaterialStatus}
            setCustomerMaterialStatus={setCustomerMaterialStatus}
            setCancellationReason={setCancellationReason}
            setHoldReason={setHoldReason}
            refreshJob={refreshJob}
            isOutsourced={isOutsourced}
            setIsOutsourced={setIsOutsourced}
            partnerStoreName={partnerStoreName}
            setPartnerStoreName={setPartnerStoreName}
            outsourcingCost={outsourcingCost}
            setOutsourcingCost={setOutsourcingCost}
            store={store}
          />
        )}

        {activeTab === 'staff' && (
          <div className="space-y-6">
            <JobStaffAssignmentCard
              allStaff={allStaff}
              staffAssignments={staffAssignments}
              setStaffAssignments={setStaffAssignments}
              staffCompletions={staffCompletions}
              handleUpdateStaff={handleUpdateStaff}
              savingStaff={savingStaff}
            />
          </div>
        )}

        {activeTab === 'fulfillment' && (
          <div className="space-y-6">
            <JobFulfillmentCard
              isOutsourced={job.is_outsourced}
              partnerStoreName={job.partner_store_name}
              outsourcingCost={job.outsourcing_cost}
            />
          </div>
        )}

        {activeTab === 'financials' && isOwnerOrManager && (
          <div className="space-y-6" id="financials">
            <JobFinancialsCard
              job={job}
              saving={saving}
              onCharge={handleChargePayment}
              onApplyDiscount={handleApplyDiscount}
              onUpdatePayment={handleUpdatePayment}
              onRejectPayment={handleRejectPayment}
            />
          </div>
        )}

        <JobDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />

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

        <FollowUpAppointmentModal
          isOpen={showFollowUpModal}
          onClose={() => { setShowFollowUpModal(false); setFollowUpError(''); }}
          branches={followUpBranches}
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
